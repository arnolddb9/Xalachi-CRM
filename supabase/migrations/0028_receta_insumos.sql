-- Receta de insumos por producto terminado (bill of materials): cada
-- producto_terminado puede requerir varios insumos distintos (bolsa,
-- etiqueta, sticker, etc.), cada uno con una cantidad fija por unidad
-- empacada. Reemplaza el campo único "insumo de empaque" opcional que
-- tenía empacar_lote — ahora el insumo (o los insumos) se deducen
-- automáticamente de la receta configurada en el catálogo del producto,
-- en vez de que el usuario los elija a mano en cada tanda de empacado.

-- =========================================================
-- Catálogo: receta (BOM) por producto terminado
-- =========================================================
create table public.articulo_insumos (
  id uuid primary key default gen_random_uuid(),
  articulo_id uuid not null references public.articulos(id) on delete cascade,
  insumo_articulo_id uuid not null references public.articulos(id),
  cantidad_por_unidad numeric not null check (cantidad_por_unidad > 0),
  creado_en timestamptz not null default now(),
  check (articulo_id <> insumo_articulo_id),
  unique (articulo_id, insumo_articulo_id)
);

alter table public.articulo_insumos enable row level security;

create policy "lectura autenticados" on public.articulo_insumos for select
  using ((select auth.role()) = 'authenticated');
create policy "escritura admin y operador" on public.articulo_insumos for insert
  with check (((select auth.jwt()) ->> 'user_role') in ('admin', 'operador'));
create policy "actualizacion admin y operador" on public.articulo_insumos for update
  using (((select auth.jwt()) ->> 'user_role') in ('admin', 'operador'));
create policy "eliminar admin y operador" on public.articulo_insumos for delete
  using (((select auth.jwt()) ->> 'user_role') in ('admin', 'operador'));

create trigger trg_audit_articulo_insumos after insert or update or delete on public.articulo_insumos
  for each row execute function public.fn_audit_trigger();

-- =========================================================
-- Historial: qué insumos (y cuánto de cada uno) se descontaron en cada
-- empacado real — reemplaza la columna única empacados.insumo_articulo_id,
-- necesaria para poder revertir todos los insumos al eliminar un empacado.
-- =========================================================
create table public.empacado_insumos (
  id uuid primary key default gen_random_uuid(),
  empacado_id uuid not null references public.empacados(id) on delete cascade,
  insumo_articulo_id uuid not null references public.articulos(id),
  cantidad numeric not null check (cantidad > 0)
);

alter table public.empacado_insumos enable row level security;

create policy "lectura autenticados" on public.empacado_insumos for select
  using ((select auth.role()) = 'authenticated');
create policy "escritura admin y operador" on public.empacado_insumos for insert
  with check (((select auth.jwt()) ->> 'user_role') in ('admin', 'operador'));
create policy "eliminar solo admin" on public.empacado_insumos for delete
  using (((select auth.jwt()) ->> 'user_role') = 'admin');

create trigger trg_audit_empacado_insumos after insert or update or delete on public.empacado_insumos
  for each row execute function public.fn_audit_trigger();

-- Migra el insumo único que ya tuviera cada empacado histórico (1 unidad de
-- insumo por unidad empacada, que era el comportamiento anterior) antes de
-- quitar la columna.
insert into public.empacado_insumos (empacado_id, insumo_articulo_id, cantidad)
select id, insumo_articulo_id, unidades from public.empacados where insumo_articulo_id is not null;

alter table public.empacados drop column insumo_articulo_id;

-- =========================================================
-- empacar_lote: ahora consume automáticamente todos los insumos de la
-- receta configurada para el producto (si no tiene receta, no descuenta
-- ningún insumo, igual que antes cuando se dejaba "sin insumo").
-- =========================================================
drop function if exists public.empacar_lote(uuid, uuid, uuid, numeric, uuid);

create or replace function public.empacar_lote(
  p_lote_origen_id uuid,
  p_articulo_id uuid,
  p_presentacion_id uuid,
  p_unidades numeric
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_origen public.lotes%rowtype;
  v_peso_gramos numeric;
  v_peso_kg numeric;
  v_tipo_articulo text;
  v_empacado_id uuid;
  v_receta record;
begin
  if p_unidades is null or p_unidades <= 0 then
    raise exception 'Las unidades deben ser mayores a 0';
  end if;

  select * into v_origen from public.lotes where id = p_lote_origen_id;
  if not found then
    raise exception 'Lote de origen no encontrado';
  end if;
  if v_origen.etapa not in ('tostado', 'molido') then
    raise exception 'Solo se puede empacar un lote tostado o molido (etapa actual: %)', v_origen.etapa;
  end if;

  select peso_gramos into v_peso_gramos from public.presentaciones where id = p_presentacion_id;
  if v_peso_gramos is null or v_peso_gramos <= 0 then
    raise exception 'La presentación seleccionada no tiene un peso configurado';
  end if;

  v_peso_kg := round(p_unidades * v_peso_gramos / 1000.0, 2);
  if v_peso_kg > v_origen.peso_actual_kg then
    raise exception 'No hay suficiente peso disponible en el lote (% kg) para % unidades (% kg)', v_origen.peso_actual_kg, p_unidades, v_peso_kg;
  end if;

  select tipo into v_tipo_articulo from public.articulos where id = p_articulo_id;
  if v_tipo_articulo is distinct from 'producto_terminado' then
    raise exception 'El artículo seleccionado no es un producto terminado';
  end if;

  -- Primera pasada: valida que haya existencia suficiente de TODOS los
  -- insumos de la receta antes de descontar nada (todo o nada).
  for v_receta in
    select ai.insumo_articulo_id, ai.cantidad_por_unidad * p_unidades as cantidad_necesaria,
           a.nombre, a.stock_actual
    from public.articulo_insumos ai
    join public.articulos a on a.id = ai.insumo_articulo_id
    where ai.articulo_id = p_articulo_id
  loop
    if v_receta.stock_actual < v_receta.cantidad_necesaria then
      raise exception 'No hay suficiente existencia del insumo "%" (disponible: %, necesario: %)', v_receta.nombre, v_receta.stock_actual, v_receta.cantidad_necesaria;
    end if;
  end loop;

  update public.lotes set peso_actual_kg = peso_actual_kg - v_peso_kg where id = p_lote_origen_id;
  update public.articulos set stock_actual = stock_actual + p_unidades where id = p_articulo_id;

  insert into public.empacados (lote_origen_id, articulo_id, presentacion_id, unidades, peso_kg)
  values (p_lote_origen_id, p_articulo_id, p_presentacion_id, p_unidades, v_peso_kg)
  returning id into v_empacado_id;

  for v_receta in
    select ai.insumo_articulo_id, ai.cantidad_por_unidad * p_unidades as cantidad_necesaria
    from public.articulo_insumos ai
    where ai.articulo_id = p_articulo_id
  loop
    update public.articulos set stock_actual = stock_actual - v_receta.cantidad_necesaria where id = v_receta.insumo_articulo_id;
    insert into public.empacado_insumos (empacado_id, insumo_articulo_id, cantidad)
    values (v_empacado_id, v_receta.insumo_articulo_id, v_receta.cantidad_necesaria);
  end loop;

  return v_empacado_id;
end;
$$;

-- =========================================================
-- eliminar_empacado: revierte el peso del lote, el stock del producto y
-- TODOS los insumos consumidos (no solo uno).
-- =========================================================
create or replace function public.eliminar_empacado(p_empacado_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_empacado public.empacados%rowtype;
  v_stock_producto numeric;
begin
  select * into v_empacado from public.empacados where id = p_empacado_id;
  if not found then
    raise exception 'Empacado no encontrado';
  end if;

  select stock_actual into v_stock_producto from public.articulos where id = v_empacado.articulo_id;
  if v_stock_producto < v_empacado.unidades then
    raise exception 'No se puede eliminar: el producto terminado ya no tiene suficiente existencia para revertir este empacado.';
  end if;

  update public.lotes set peso_actual_kg = peso_actual_kg + v_empacado.peso_kg where id = v_empacado.lote_origen_id;
  update public.articulos set stock_actual = stock_actual - v_empacado.unidades where id = v_empacado.articulo_id;

  update public.articulos a set stock_actual = stock_actual + ei.cantidad
    from public.empacado_insumos ei
    where ei.empacado_id = p_empacado_id and ei.insumo_articulo_id = a.id;

  delete from public.empacados where id = p_empacado_id;
end;
$$;
