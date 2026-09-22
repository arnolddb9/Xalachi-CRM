-- Servicios: café que llega en cereza. Se mide en cajuelas (igual que un
-- lote propio) y se elige un proceso de beneficiado configurable (mismo
-- catálogo de procesos_beneficiado/pasos_beneficiado que usa Inventario),
-- avanzando paso a paso hasta donde el cliente indique.

alter table public.lotes_servicio add column cantidad_cajuelas numeric;
alter table public.lotes_servicio add column proceso_beneficiado_id uuid references public.procesos_beneficiado(id);

alter table public.tarifas_servicio drop constraint tarifas_servicio_tipo_servicio_check;
alter table public.tarifas_servicio add constraint tarifas_servicio_tipo_servicio_check
  check (tipo_servicio in ('pelado', 'clasificacion', 'tueste', 'molido', 'beneficiado'));
insert into public.tarifas_servicio (tipo_servicio) values ('beneficiado');

alter table public.pasos_servicio drop constraint pasos_servicio_tipo_proceso_check;
alter table public.pasos_servicio add constraint pasos_servicio_tipo_proceso_check
  check (tipo_proceso in ('pelado', 'clasificacion', 'tueste', 'molido', 'beneficiado'));

drop function if exists public.registrar_orden_servicio(uuid, text, numeric, date, text);

create or replace function public.registrar_orden_servicio(
  p_cliente_id uuid,
  p_etapa_entrada text,
  p_cantidad_kg numeric,
  p_cantidad_cajuelas numeric,
  p_proceso_beneficiado_id uuid,
  p_fecha_recepcion date,
  p_notas text
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_orden_id uuid;
  v_lote_id uuid;
  v_peso numeric;
  v_factor numeric;
begin
  if p_etapa_entrada = 'cereza' then
    if p_cantidad_cajuelas is null or p_cantidad_cajuelas <= 0 then
      raise exception 'Indica cuántas cajuelas se recibieron';
    end if;
    if p_proceso_beneficiado_id is null then
      raise exception 'Selecciona un proceso de beneficiado';
    end if;
    select factor_kg_por_cajuela into v_factor from public.configuracion where id = 1;
    v_peso := round(p_cantidad_cajuelas * v_factor, 2);
  else
    if p_cantidad_kg is null or p_cantidad_kg <= 0 then
      raise exception 'La cantidad debe ser mayor a 0';
    end if;
    v_peso := p_cantidad_kg;
  end if;

  insert into public.ordenes_servicio (cliente_id, etapa_entrada, cantidad_kg, fecha_recepcion, notas)
  values (p_cliente_id, p_etapa_entrada, v_peso, coalesce(p_fecha_recepcion, current_date), p_notas)
  returning id into v_orden_id;

  insert into public.lotes_servicio
    (orden_servicio_id, etapa, peso_actual_kg, peso_inicial_kg, cantidad_cajuelas, proceso_beneficiado_id)
  values (
    v_orden_id, p_etapa_entrada, v_peso, v_peso,
    case when p_etapa_entrada = 'cereza' then p_cantidad_cajuelas else null end,
    case when p_etapa_entrada = 'cereza' then p_proceso_beneficiado_id else null end
  )
  returning id into v_lote_id;

  return v_orden_id;
end;
$$;

-- Calcada de `iniciar_o_avanzar_beneficiado` (lotes propios) pero parcial y
-- sobre las tablas de servicio, cobrando la tarifa de beneficiado.
create or replace function public.aplicar_beneficiado_servicio(
  p_lote_servicio_origen_id uuid,
  p_kg_a_procesar numeric,
  p_merma_pct numeric
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_origen public.lotes_servicio%rowtype;
  v_proceso_id uuid;
  v_orden_actual int;
  v_etapa_destino text;
  v_tarifa numeric;
  v_peso_destino numeric;
  v_lote_destino_id uuid;
begin
  select * into v_origen from public.lotes_servicio where id = p_lote_servicio_origen_id;
  if not found then
    raise exception 'Lote de servicio no encontrado';
  end if;
  if p_merma_pct < 0 or p_merma_pct > 100 then
    raise exception 'La merma debe estar entre 0 y 100';
  end if;
  if p_kg_a_procesar is null or p_kg_a_procesar <= 0 then
    raise exception 'Indica cuántos kg deseas avanzar';
  end if;
  if p_kg_a_procesar > v_origen.peso_actual_kg then
    raise exception 'No hay suficiente peso disponible (% kg) para procesar % kg', v_origen.peso_actual_kg, p_kg_a_procesar;
  end if;

  if v_origen.etapa = 'cereza' then
    if v_origen.proceso_beneficiado_id is null then
      raise exception 'Este lote no tiene un proceso de beneficiado asignado';
    end if;
    v_proceso_id := v_origen.proceso_beneficiado_id;
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

  select tarifa_kg into v_tarifa from public.tarifas_servicio where tipo_servicio = 'beneficiado';
  v_peso_destino := round(p_kg_a_procesar * (1 - p_merma_pct / 100.0), 2);

  insert into public.lotes_servicio (orden_servicio_id, etapa, peso_actual_kg, peso_inicial_kg, proceso_beneficiado_id)
  values (v_origen.orden_servicio_id, v_etapa_destino, v_peso_destino, v_peso_destino, v_proceso_id)
  returning id into v_lote_destino_id;

  update public.lotes_servicio set peso_actual_kg = peso_actual_kg - p_kg_a_procesar where id = p_lote_servicio_origen_id;

  insert into public.pasos_servicio
    (lote_servicio_origen_id, lote_servicio_destino_id, tipo_proceso, peso_procesado_kg, merma_pct, tarifa_kg)
  values
    (p_lote_servicio_origen_id, v_lote_destino_id, 'beneficiado', p_kg_a_procesar, p_merma_pct, coalesce(v_tarifa, 0));

  update public.ordenes_servicio set estado = 'en_proceso' where id = v_origen.orden_servicio_id and estado = 'pendiente';

  return v_lote_destino_id;
end;
$$;
