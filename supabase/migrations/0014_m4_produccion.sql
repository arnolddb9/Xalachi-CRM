-- M4: tueste (verde -> tostado), molido (tostado -> molido, opcional) y
-- empacado (tostado/molido -> unidades de producto terminado, con descuento
-- opcional de un insumo de empaque). El trillado ya se cubrió en M2.

alter table public.lotes add column perfil_tueste_id uuid references public.perfiles_tueste(id);

create table public.empacados (
  id uuid primary key default gen_random_uuid(),
  lote_origen_id uuid not null references public.lotes(id),
  articulo_id uuid not null references public.articulos(id),
  presentacion_id uuid not null references public.presentaciones(id),
  unidades numeric not null check (unidades > 0),
  peso_kg numeric not null check (peso_kg > 0),
  insumo_articulo_id uuid references public.articulos(id),
  usuario_id uuid references public.usuarios(id) default auth.uid(),
  creado_en timestamptz not null default now()
);

alter table public.empacados enable row level security;

create policy "lectura autenticados" on public.empacados for select
  using (auth.role() = 'authenticated');
create policy "escritura admin y operador" on public.empacados for insert
  with check ((auth.jwt() ->> 'user_role') in ('admin', 'operador'));
create policy "eliminar solo admin" on public.empacados for delete
  using ((auth.jwt() ->> 'user_role') = 'admin');

create trigger trg_audit_empacados after insert or update or delete on public.empacados
  for each row execute function public.fn_audit_trigger();

create or replace function public.aplicar_tueste(
  p_lote_origen_id uuid,
  p_perfil_tueste_id uuid,
  p_merma_pct numeric
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_origen public.lotes%rowtype;
  v_peso_destino numeric;
  v_lote_destino_id uuid;
begin
  select * into v_origen from public.lotes where id = p_lote_origen_id;
  if not found then
    raise exception 'Lote de origen no encontrado';
  end if;
  if v_origen.peso_actual_kg <= 0 then
    raise exception 'El lote de origen ya está consumido (sin peso disponible)';
  end if;
  if v_origen.etapa <> 'verde' then
    raise exception 'Solo se puede tostar un lote en verde (etapa actual: %)', v_origen.etapa;
  end if;
  if p_perfil_tueste_id is null then
    raise exception 'Selecciona un perfil de tueste';
  end if;
  if p_merma_pct < 0 or p_merma_pct > 100 then
    raise exception 'La merma debe estar entre 0 y 100';
  end if;

  v_peso_destino := round(v_origen.peso_actual_kg * (1 - p_merma_pct / 100.0), 2);

  insert into public.lotes (nombre, variedad_id, proveedor_id, finca_id, numero_cama_secado, etapa, peso_actual_kg, peso_inicial_kg, fecha_cosecha, proceso_beneficiado_id, calidad, perfil_tueste_id)
  values (v_origen.nombre, v_origen.variedad_id, v_origen.proveedor_id, v_origen.finca_id, v_origen.numero_cama_secado, 'tostado', v_peso_destino, v_peso_destino, v_origen.fecha_cosecha, v_origen.proceso_beneficiado_id, v_origen.calidad, p_perfil_tueste_id)
  returning id into v_lote_destino_id;

  update public.lotes set peso_actual_kg = 0 where id = p_lote_origen_id;

  insert into public.ordenes_proceso
    (lote_origen_id, lote_destino_id, tipo_proceso, merma_pct, usuario_id)
  values
    (p_lote_origen_id, v_lote_destino_id, 'tueste', p_merma_pct, auth.uid());

  return v_lote_destino_id;
end;
$$;

create or replace function public.aplicar_molido(
  p_lote_origen_id uuid,
  p_merma_pct numeric
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_origen public.lotes%rowtype;
  v_peso_destino numeric;
  v_lote_destino_id uuid;
begin
  select * into v_origen from public.lotes where id = p_lote_origen_id;
  if not found then
    raise exception 'Lote de origen no encontrado';
  end if;
  if v_origen.peso_actual_kg <= 0 then
    raise exception 'El lote de origen ya está consumido (sin peso disponible)';
  end if;
  if v_origen.etapa <> 'tostado' then
    raise exception 'Solo se puede moler un lote tostado (etapa actual: %)', v_origen.etapa;
  end if;
  if p_merma_pct < 0 or p_merma_pct > 100 then
    raise exception 'La merma debe estar entre 0 y 100';
  end if;

  v_peso_destino := round(v_origen.peso_actual_kg * (1 - p_merma_pct / 100.0), 2);

  insert into public.lotes (nombre, variedad_id, proveedor_id, finca_id, numero_cama_secado, etapa, peso_actual_kg, peso_inicial_kg, fecha_cosecha, proceso_beneficiado_id, calidad, perfil_tueste_id)
  values (v_origen.nombre, v_origen.variedad_id, v_origen.proveedor_id, v_origen.finca_id, v_origen.numero_cama_secado, 'molido', v_peso_destino, v_peso_destino, v_origen.fecha_cosecha, v_origen.proceso_beneficiado_id, v_origen.calidad, v_origen.perfil_tueste_id)
  returning id into v_lote_destino_id;

  update public.lotes set peso_actual_kg = 0 where id = p_lote_origen_id;

  insert into public.ordenes_proceso
    (lote_origen_id, lote_destino_id, tipo_proceso, merma_pct, usuario_id)
  values
    (p_lote_origen_id, v_lote_destino_id, 'molido', p_merma_pct, auth.uid());

  return v_lote_destino_id;
end;
$$;

-- Empacado parcial: a diferencia de las demás transformaciones, no consume
-- el lote de origen por completo — solo el peso necesario para las unidades
-- empacadas. No crea un lote destino: genera existencias de un artículo
-- (producto_terminado) y, si aplica, descuenta un insumo de empaque.
create or replace function public.empacar_lote(
  p_lote_origen_id uuid,
  p_articulo_id uuid,
  p_presentacion_id uuid,
  p_unidades numeric,
  p_insumo_articulo_id uuid
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
  v_tipo_insumo text;
  v_stock_insumo numeric;
  v_empacado_id uuid;
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

  if p_insumo_articulo_id is not null then
    select tipo, stock_actual into v_tipo_insumo, v_stock_insumo from public.articulos where id = p_insumo_articulo_id;
    if v_tipo_insumo is distinct from 'insumo' then
      raise exception 'El artículo de empaque seleccionado no es un insumo';
    end if;
    if v_stock_insumo < p_unidades then
      raise exception 'No hay suficiente existencia del insumo de empaque';
    end if;
  end if;

  update public.lotes set peso_actual_kg = peso_actual_kg - v_peso_kg where id = p_lote_origen_id;
  update public.articulos set stock_actual = stock_actual + p_unidades where id = p_articulo_id;
  if p_insumo_articulo_id is not null then
    update public.articulos set stock_actual = stock_actual - p_unidades where id = p_insumo_articulo_id;
  end if;

  insert into public.empacados
    (lote_origen_id, articulo_id, presentacion_id, unidades, peso_kg, insumo_articulo_id)
  values
    (p_lote_origen_id, p_articulo_id, p_presentacion_id, p_unidades, v_peso_kg, p_insumo_articulo_id)
  returning id into v_empacado_id;

  return v_empacado_id;
end;
$$;

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
  if v_empacado.insumo_articulo_id is not null then
    update public.articulos set stock_actual = stock_actual + v_empacado.unidades where id = v_empacado.insumo_articulo_id;
  end if;

  delete from public.empacados where id = p_empacado_id;
end;
$$;
