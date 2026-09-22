-- Al aplicar el beneficiado de un servicio paso a paso (cereza -> ... ->
-- pergamino), la tarifa se cobraba en cada paso intermedio, multiplicando
-- el costo total del beneficiado por la cantidad de pasos configurados en
-- el proceso. El presupuesto ya cotiza el beneficiado como una sola línea
-- (un solo costo para todo el proceso), así que la orden real debe cobrarlo
-- igual: solo el paso que llega al destino final ('pergamino') carga la
-- tarifa; los pasos intermedios quedan en 0.
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
  v_costo_tarifa numeric;
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
  v_costo_tarifa := case when v_etapa_destino = 'pergamino' then coalesce(v_tarifa, 0) else 0 end;
  v_peso_destino := round(p_kg_a_procesar * (1 - p_merma_pct / 100.0), 2);

  insert into public.lotes_servicio (orden_servicio_id, etapa, peso_actual_kg, peso_inicial_kg, proceso_beneficiado_id)
  values (v_origen.orden_servicio_id, v_etapa_destino, v_peso_destino, v_peso_destino, v_proceso_id)
  returning id into v_lote_destino_id;

  update public.lotes_servicio set peso_actual_kg = peso_actual_kg - p_kg_a_procesar where id = p_lote_servicio_origen_id;

  insert into public.pasos_servicio
    (lote_servicio_origen_id, lote_servicio_destino_id, tipo_proceso, peso_procesado_kg, merma_pct, tarifa_kg)
  values
    (p_lote_servicio_origen_id, v_lote_destino_id, 'beneficiado', p_kg_a_procesar, p_merma_pct, v_costo_tarifa);

  update public.ordenes_servicio set estado = 'en_proceso' where id = v_origen.orden_servicio_id and estado = 'pendiente';

  return v_lote_destino_id;
end;
$$;
