-- Corrección de M3: no toda compra genera un lote de café. Se agregan
-- insumos y productos terminados (reventa) como un tipo de artículo con
-- existencias simples (contador que sube/baja), distinto del modelo rico
-- de trazabilidad multietapa de `lotes`.

create table public.articulos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('insumo', 'producto_terminado')),
  nombre text not null,
  unidad_medida text not null default 'unidad',
  stock_actual numeric not null default 0,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

alter table public.articulos enable row level security;

create policy "lectura autenticados" on public.articulos for select
  using (auth.role() = 'authenticated');
create policy "escritura admin y operador" on public.articulos for insert
  with check ((auth.jwt() ->> 'user_role') in ('admin', 'operador'));
create policy "actualizacion admin y operador" on public.articulos for update
  using ((auth.jwt() ->> 'user_role') in ('admin', 'operador'));

create trigger trg_audit_articulos after insert or update or delete on public.articulos
  for each row execute function public.fn_audit_trigger();

-- =========================================================
-- compras: admite lote | insumo | producto_terminado
-- =========================================================
alter table public.compras add column tipo_compra text not null default 'lote'
  check (tipo_compra in ('lote', 'insumo', 'producto_terminado'));
alter table public.compras alter column lote_id drop not null;
alter table public.compras add column articulo_id uuid references public.articulos(id);
alter table public.compras add column cantidad numeric;
alter table public.compras add constraint compras_consistencia_tipo check (
  (tipo_compra = 'lote' and lote_id is not null and articulo_id is null)
  or
  (tipo_compra in ('insumo', 'producto_terminado') and articulo_id is not null and lote_id is null and cantidad > 0)
);

-- Renombre de `registrar_compra` (mismos parámetros y cuerpo) para dejar
-- claro que es la variante de compra que genera un lote.
alter function public.registrar_compra(
  uuid, uuid, text, numeric, numeric, date, uuid, text, text, date, numeric, text, text
) rename to registrar_compra_lote;

create or replace function public.registrar_compra_articulo(
  p_proveedor_id uuid,
  p_articulo_id uuid,
  p_cantidad numeric,
  p_fecha_compra date,
  p_costo_total numeric,
  p_numero_factura text,
  p_notas text
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_tipo text;
  v_compra_id uuid;
begin
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor a 0.';
  end if;

  select tipo into v_tipo from public.articulos where id = p_articulo_id;
  if not found then
    raise exception 'Artículo no encontrado';
  end if;

  insert into public.compras
    (proveedor_id, articulo_id, tipo_compra, cantidad, fecha_compra, costo_total, numero_factura, notas)
  values
    (p_proveedor_id, p_articulo_id, v_tipo, p_cantidad, coalesce(p_fecha_compra, current_date), p_costo_total, p_numero_factura, p_notas)
  returning id into v_compra_id;

  update public.articulos set stock_actual = stock_actual + p_cantidad where id = p_articulo_id;

  return v_compra_id;
end;
$$;

-- Reemplaza el `.delete()` directo desde la app: si la compra es de un
-- artículo, primero revierte el stock que había sumado.
create or replace function public.eliminar_compra(p_compra_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_compra public.compras%rowtype;
  v_stock_nuevo numeric;
begin
  select * into v_compra from public.compras where id = p_compra_id;
  if not found then
    raise exception 'Compra no encontrada';
  end if;

  if v_compra.tipo_compra in ('insumo', 'producto_terminado') then
    select stock_actual - v_compra.cantidad into v_stock_nuevo
      from public.articulos where id = v_compra.articulo_id;
    if v_stock_nuevo < 0 then
      raise exception 'No se puede eliminar: el artículo ya no tiene suficiente existencia para revertir esta compra.';
    end if;
    update public.articulos set stock_actual = v_stock_nuevo where id = v_compra.articulo_id;
  end if;

  delete from public.compras where id = p_compra_id;
end;
$$;

-- Corrección manual de existencias (mismo espíritu que el ajuste del
-- factor de cajuela en Inventario) — solo admin vía RLS de `articulos`.
create or replace function public.ajustar_stock_articulo(p_articulo_id uuid, p_stock_nuevo numeric)
returns void
language plpgsql
security invoker
as $$
begin
  if p_stock_nuevo < 0 then
    raise exception 'El stock no puede ser negativo.';
  end if;
  update public.articulos set stock_actual = p_stock_nuevo where id = p_articulo_id;
end;
$$;
