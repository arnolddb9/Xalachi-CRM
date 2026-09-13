-- Nombre opcional para identificar un lote (ej. "Finca El Mirador - lote 3").
-- Se conserva a través de las transformaciones (igual que variedad/proveedor),
-- para que el historial siga mostrando el mismo nombre en cada etapa.
alter table public.lotes add column nombre text;

create or replace function public.iniciar_o_avanzar_beneficiado(
  p_lote_origen_id uuid,
  p_proceso_beneficiado_id uuid,
  p_merma_pct numeric
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_origen public.lotes%rowtype;
  v_proceso_id uuid;
  v_orden_actual int;
  v_etapa_destino text;
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

  if v_origen.etapa = 'cereza' then
    v_proceso_id := p_proceso_beneficiado_id;
    if v_proceso_id is null then
      raise exception 'Selecciona un proceso de beneficiado';
    end if;
    v_orden_actual := null;
  elsif v_origen.proceso_beneficiado_id is not null then
    v_proceso_id := v_origen.proceso_beneficiado_id;
    select orden into v_orden_actual
      from public.pasos_beneficiado
      where proceso_beneficiado_id = v_proceso_id and nombre = v_origen.etapa;
    if not found then
      raise exception 'El lote no está en un paso de beneficiado válido';
    end if;
  else
    raise exception 'Transición no válida para la etapa actual: %', v_origen.etapa;
  end if;

  select nombre into v_etapa_destino
    from public.pasos_beneficiado
    where proceso_beneficiado_id = v_proceso_id
      and (v_orden_actual is null or orden > v_orden_actual)
    order by orden
    limit 1;

  if v_etapa_destino is null then
    v_etapa_destino := 'pergamino';
  end if;

  if p_merma_pct < 0 or p_merma_pct > 100 then
    raise exception 'La merma debe estar entre 0 y 100';
  end if;

  v_peso_destino := round(v_origen.peso_actual_kg * (1 - p_merma_pct / 100.0), 2);

  insert into public.lotes (nombre, variedad_id, proveedor_id, etapa, peso_actual_kg, peso_inicial_kg, fecha_cosecha, proceso_beneficiado_id)
  values (v_origen.nombre, v_origen.variedad_id, v_origen.proveedor_id, v_etapa_destino, v_peso_destino, v_peso_destino, v_origen.fecha_cosecha, v_proceso_id)
  returning id into v_lote_destino_id;

  update public.lotes set peso_actual_kg = 0 where id = p_lote_origen_id;

  insert into public.ordenes_proceso
    (lote_origen_id, lote_destino_id, tipo_proceso, proceso_beneficiado_id, merma_pct, usuario_id)
  values
    (p_lote_origen_id, v_lote_destino_id, 'beneficiado', v_proceso_id, p_merma_pct, auth.uid());

  return v_lote_destino_id;
end;
$$;

create or replace function public.aplicar_trillado(
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
  if v_origen.etapa <> 'pergamino' then
    raise exception 'Solo se puede trillar un lote en pergamino (etapa actual: %)', v_origen.etapa;
  end if;
  if p_merma_pct < 0 or p_merma_pct > 100 then
    raise exception 'La merma debe estar entre 0 y 100';
  end if;

  v_peso_destino := round(v_origen.peso_actual_kg * (1 - p_merma_pct / 100.0), 2);

  insert into public.lotes (nombre, variedad_id, proveedor_id, etapa, peso_actual_kg, peso_inicial_kg, fecha_cosecha, proceso_beneficiado_id)
  values (v_origen.nombre, v_origen.variedad_id, v_origen.proveedor_id, 'verde', v_peso_destino, v_peso_destino, v_origen.fecha_cosecha, v_origen.proceso_beneficiado_id)
  returning id into v_lote_destino_id;

  update public.lotes set peso_actual_kg = 0 where id = p_lote_origen_id;

  insert into public.ordenes_proceso
    (lote_origen_id, lote_destino_id, tipo_proceso, merma_pct, usuario_id)
  values
    (p_lote_origen_id, v_lote_destino_id, 'trillado', p_merma_pct, auth.uid());

  return v_lote_destino_id;
end;
$$;

create or replace function public.clasificar_calidad_lote(
  p_lote_origen_id uuid,
  p_primera_kg numeric,
  p_segunda_kg numeric,
  p_tercera_kg numeric,
  p_rechazo_kg numeric
)
returns void
language plpgsql
security invoker
as $$
declare
  v_origen public.lotes%rowtype;
  v_suma numeric;
  v_item record;
begin
  select * into v_origen from public.lotes where id = p_lote_origen_id;
  if not found then
    raise exception 'Lote de origen no encontrado';
  end if;
  if v_origen.etapa <> 'verde' then
    raise exception 'Solo se puede clasificar un lote en verde (etapa actual: %)', v_origen.etapa;
  end if;
  if v_origen.peso_actual_kg <= 0 then
    raise exception 'El lote de origen ya está consumido (sin peso disponible)';
  end if;

  v_suma := coalesce(p_primera_kg, 0) + coalesce(p_segunda_kg, 0) + coalesce(p_tercera_kg, 0) + coalesce(p_rechazo_kg, 0);
  if v_suma <= 0 then
    raise exception 'Indica al menos un peso mayor a 0 en alguna calidad';
  end if;
  if v_suma > v_origen.peso_actual_kg then
    raise exception 'La suma de calidades (% kg) excede el peso disponible (% kg)', v_suma, v_origen.peso_actual_kg;
  end if;

  for v_item in
    select * from (values
      ('primera', p_primera_kg),
      ('segunda', p_segunda_kg),
      ('tercera', p_tercera_kg),
      ('rechazo', p_rechazo_kg)
    ) as t(calidad, peso_kg)
  loop
    if v_item.peso_kg is not null and v_item.peso_kg > 0 then
      declare
        v_lote_destino_id uuid;
      begin
        insert into public.lotes (nombre, variedad_id, proveedor_id, etapa, peso_actual_kg, peso_inicial_kg, fecha_cosecha, proceso_beneficiado_id, calidad)
        values (v_origen.nombre, v_origen.variedad_id, v_origen.proveedor_id, 'verde', v_item.peso_kg, v_item.peso_kg, v_origen.fecha_cosecha, v_origen.proceso_beneficiado_id, v_item.calidad)
        returning id into v_lote_destino_id;

        insert into public.ordenes_proceso
          (lote_origen_id, lote_destino_id, tipo_proceso, merma_pct, usuario_id)
        values
          (p_lote_origen_id, v_lote_destino_id, 'clasificacion_calidad', 0, auth.uid());
      end;
    end if;
  end loop;

  update public.lotes set peso_actual_kg = 0 where id = p_lote_origen_id;
end;
$$;
