-- Tueste y molido pasan a ser parciales (como el empacado): se indica
-- cuántos kg se procesan, y el resto se queda disponible en la etapa
-- de origen para procesarlo después. Antes consumían el lote completo.

drop function if exists public.aplicar_tueste(uuid, uuid, numeric);
drop function if exists public.aplicar_molido(uuid, numeric);

create or replace function public.aplicar_tueste(
  p_lote_origen_id uuid,
  p_perfil_tueste_id uuid,
  p_kg_a_procesar numeric,
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
  if v_origen.etapa <> 'verde' then
    raise exception 'Solo se puede tostar un lote en verde (etapa actual: %)', v_origen.etapa;
  end if;
  if p_perfil_tueste_id is null then
    raise exception 'Selecciona un perfil de tueste';
  end if;
  if p_merma_pct < 0 or p_merma_pct > 100 then
    raise exception 'La merma debe estar entre 0 y 100';
  end if;
  if p_kg_a_procesar is null or p_kg_a_procesar <= 0 then
    raise exception 'Indica cuántos kg deseas tostar';
  end if;
  if p_kg_a_procesar > v_origen.peso_actual_kg then
    raise exception 'No hay suficiente peso disponible en el lote (% kg) para tostar % kg', v_origen.peso_actual_kg, p_kg_a_procesar;
  end if;

  v_peso_destino := round(p_kg_a_procesar * (1 - p_merma_pct / 100.0), 2);

  insert into public.lotes (nombre, variedad_id, proveedor_id, finca_id, numero_cama_secado, etapa, peso_actual_kg, peso_inicial_kg, fecha_cosecha, proceso_beneficiado_id, calidad, perfil_tueste_id)
  values (v_origen.nombre, v_origen.variedad_id, v_origen.proveedor_id, v_origen.finca_id, v_origen.numero_cama_secado, 'tostado', v_peso_destino, v_peso_destino, v_origen.fecha_cosecha, v_origen.proceso_beneficiado_id, v_origen.calidad, p_perfil_tueste_id)
  returning id into v_lote_destino_id;

  update public.lotes set peso_actual_kg = peso_actual_kg - p_kg_a_procesar where id = p_lote_origen_id;

  insert into public.ordenes_proceso
    (lote_origen_id, lote_destino_id, tipo_proceso, merma_pct, usuario_id)
  values
    (p_lote_origen_id, v_lote_destino_id, 'tueste', p_merma_pct, auth.uid());

  return v_lote_destino_id;
end;
$$;

create or replace function public.aplicar_molido(
  p_lote_origen_id uuid,
  p_kg_a_procesar numeric,
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
  if v_origen.etapa <> 'tostado' then
    raise exception 'Solo se puede moler un lote tostado (etapa actual: %)', v_origen.etapa;
  end if;
  if p_merma_pct < 0 or p_merma_pct > 100 then
    raise exception 'La merma debe estar entre 0 y 100';
  end if;
  if p_kg_a_procesar is null or p_kg_a_procesar <= 0 then
    raise exception 'Indica cuántos kg deseas moler';
  end if;
  if p_kg_a_procesar > v_origen.peso_actual_kg then
    raise exception 'No hay suficiente peso disponible en el lote (% kg) para moler % kg', v_origen.peso_actual_kg, p_kg_a_procesar;
  end if;

  v_peso_destino := round(p_kg_a_procesar * (1 - p_merma_pct / 100.0), 2);

  insert into public.lotes (nombre, variedad_id, proveedor_id, finca_id, numero_cama_secado, etapa, peso_actual_kg, peso_inicial_kg, fecha_cosecha, proceso_beneficiado_id, calidad, perfil_tueste_id)
  values (v_origen.nombre, v_origen.variedad_id, v_origen.proveedor_id, v_origen.finca_id, v_origen.numero_cama_secado, 'molido', v_peso_destino, v_peso_destino, v_origen.fecha_cosecha, v_origen.proceso_beneficiado_id, v_origen.calidad, v_origen.perfil_tueste_id)
  returning id into v_lote_destino_id;

  update public.lotes set peso_actual_kg = peso_actual_kg - p_kg_a_procesar where id = p_lote_origen_id;

  insert into public.ordenes_proceso
    (lote_origen_id, lote_destino_id, tipo_proceso, merma_pct, usuario_id)
  values
    (p_lote_origen_id, v_lote_destino_id, 'molido', p_merma_pct, auth.uid());

  return v_lote_destino_id;
end;
$$;
