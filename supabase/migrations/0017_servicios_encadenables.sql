-- Corrección de M5: un servicio a terceros se encadena en varios pasos
-- (pelado, clasificación, tueste, molido), cada uno cobrado por separado,
-- igual que el modelo de transformación parcial de M2-M4 pero para el café
-- del cliente — sin tocar `lotes`/`articulos` del negocio.

drop table public.ordenes_servicio cascade;

create table public.tarifas_servicio (
  id uuid primary key default gen_random_uuid(),
  tipo_servicio text not null unique check (tipo_servicio in ('pelado', 'clasificacion', 'tueste', 'molido')),
  tarifa_kg numeric not null default 0 check (tarifa_kg >= 0),
  creado_en timestamptz not null default now()
);
insert into public.tarifas_servicio (tipo_servicio) values ('pelado'), ('clasificacion'), ('tueste'), ('molido');

alter table public.tarifas_servicio enable row level security;
create policy "lectura autenticados" on public.tarifas_servicio for select
  using (auth.role() = 'authenticated');
create policy "actualizacion solo admin" on public.tarifas_servicio for update
  using ((auth.jwt() ->> 'user_role') = 'admin');
create trigger trg_audit_tarifas_servicio after insert or update or delete on public.tarifas_servicio
  for each row execute function public.fn_audit_trigger();

create table public.ordenes_servicio (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id),
  etapa_entrada text not null check (etapa_entrada in ('cereza', 'pergamino', 'verde', 'tostado')),
  cantidad_kg numeric not null check (cantidad_kg > 0),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_proceso', 'entregado')),
  fecha_recepcion date not null default current_date,
  fecha_entrega date,
  notas text,
  creado_por uuid references public.usuarios(id) default auth.uid(),
  creado_en timestamptz not null default now()
);

create table public.lotes_servicio (
  id uuid primary key default gen_random_uuid(),
  orden_servicio_id uuid not null references public.ordenes_servicio(id),
  etapa text not null,
  peso_actual_kg numeric not null check (peso_actual_kg >= 0),
  peso_inicial_kg numeric not null,
  calidad text check (calidad in ('primera', 'segunda', 'tercera', 'rechazo')),
  perfil_tueste_id uuid references public.perfiles_tueste(id),
  creado_en timestamptz not null default now()
);

create table public.pasos_servicio (
  id uuid primary key default gen_random_uuid(),
  lote_servicio_origen_id uuid not null references public.lotes_servicio(id),
  lote_servicio_destino_id uuid not null references public.lotes_servicio(id),
  tipo_proceso text not null check (tipo_proceso in ('pelado', 'clasificacion', 'tueste', 'molido')),
  peso_procesado_kg numeric not null check (peso_procesado_kg > 0),
  merma_pct numeric not null check (merma_pct >= 0 and merma_pct <= 100),
  tarifa_kg numeric not null,
  costo_total numeric generated always as (round(peso_procesado_kg * tarifa_kg, 2)) stored,
  usuario_id uuid references public.usuarios(id) default auth.uid(),
  creado_en timestamptz not null default now()
);

alter table public.ordenes_servicio enable row level security;
alter table public.lotes_servicio enable row level security;
alter table public.pasos_servicio enable row level security;

create policy "lectura autenticados" on public.ordenes_servicio for select
  using (auth.role() = 'authenticated');
create policy "escritura admin y vendedor" on public.ordenes_servicio for insert
  with check ((auth.jwt() ->> 'user_role') in ('admin', 'vendedor'));
create policy "actualizacion admin y vendedor" on public.ordenes_servicio for update
  using ((auth.jwt() ->> 'user_role') in ('admin', 'vendedor'));
create policy "eliminar solo admin" on public.ordenes_servicio for delete
  using ((auth.jwt() ->> 'user_role') = 'admin');

create policy "lectura autenticados" on public.lotes_servicio for select
  using (auth.role() = 'authenticated');
create policy "escritura admin y vendedor" on public.lotes_servicio for insert
  with check ((auth.jwt() ->> 'user_role') in ('admin', 'vendedor'));
create policy "actualizacion admin y vendedor" on public.lotes_servicio for update
  using ((auth.jwt() ->> 'user_role') in ('admin', 'vendedor'));

create policy "lectura autenticados" on public.pasos_servicio for select
  using (auth.role() = 'authenticated');
create policy "escritura admin y vendedor" on public.pasos_servicio for insert
  with check ((auth.jwt() ->> 'user_role') in ('admin', 'vendedor'));

create trigger trg_audit_ordenes_servicio after insert or update or delete on public.ordenes_servicio
  for each row execute function public.fn_audit_trigger();
create trigger trg_audit_lotes_servicio after insert or update or delete on public.lotes_servicio
  for each row execute function public.fn_audit_trigger();
create trigger trg_audit_pasos_servicio after insert or update or delete on public.pasos_servicio
  for each row execute function public.fn_audit_trigger();

create or replace function public.registrar_orden_servicio(
  p_cliente_id uuid,
  p_etapa_entrada text,
  p_cantidad_kg numeric,
  p_fecha_recepcion date,
  p_notas text
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_orden_id uuid;
begin
  if p_cantidad_kg is null or p_cantidad_kg <= 0 then
    raise exception 'La cantidad debe ser mayor a 0';
  end if;

  insert into public.ordenes_servicio (cliente_id, etapa_entrada, cantidad_kg, fecha_recepcion, notas)
  values (p_cliente_id, p_etapa_entrada, p_cantidad_kg, coalesce(p_fecha_recepcion, current_date), p_notas)
  returning id into v_orden_id;

  insert into public.lotes_servicio (orden_servicio_id, etapa, peso_actual_kg, peso_inicial_kg)
  values (v_orden_id, p_etapa_entrada, p_cantidad_kg, p_cantidad_kg);

  return v_orden_id;
end;
$$;

create or replace function public.aplicar_pelado_servicio(
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
  v_tarifa numeric;
  v_peso_destino numeric;
  v_lote_destino_id uuid;
begin
  select * into v_origen from public.lotes_servicio where id = p_lote_servicio_origen_id;
  if not found then
    raise exception 'Lote de servicio no encontrado';
  end if;
  if v_origen.etapa <> 'pergamino' then
    raise exception 'Solo se puede pelar un lote en pergamino (etapa actual: %)', v_origen.etapa;
  end if;
  if p_merma_pct < 0 or p_merma_pct > 100 then
    raise exception 'La merma debe estar entre 0 y 100';
  end if;
  if p_kg_a_procesar is null or p_kg_a_procesar <= 0 then
    raise exception 'Indica cuántos kg deseas pelar';
  end if;
  if p_kg_a_procesar > v_origen.peso_actual_kg then
    raise exception 'No hay suficiente peso disponible (% kg) para pelar % kg', v_origen.peso_actual_kg, p_kg_a_procesar;
  end if;

  select tarifa_kg into v_tarifa from public.tarifas_servicio where tipo_servicio = 'pelado';
  v_peso_destino := round(p_kg_a_procesar * (1 - p_merma_pct / 100.0), 2);

  insert into public.lotes_servicio (orden_servicio_id, etapa, peso_actual_kg, peso_inicial_kg)
  values (v_origen.orden_servicio_id, 'verde', v_peso_destino, v_peso_destino)
  returning id into v_lote_destino_id;

  update public.lotes_servicio set peso_actual_kg = peso_actual_kg - p_kg_a_procesar where id = p_lote_servicio_origen_id;

  insert into public.pasos_servicio
    (lote_servicio_origen_id, lote_servicio_destino_id, tipo_proceso, peso_procesado_kg, merma_pct, tarifa_kg)
  values
    (p_lote_servicio_origen_id, v_lote_destino_id, 'pelado', p_kg_a_procesar, p_merma_pct, coalesce(v_tarifa, 0));

  update public.ordenes_servicio set estado = 'en_proceso' where id = v_origen.orden_servicio_id and estado = 'pendiente';

  return v_lote_destino_id;
end;
$$;

create or replace function public.aplicar_tueste_servicio(
  p_lote_servicio_origen_id uuid,
  p_perfil_tueste_id uuid,
  p_kg_a_procesar numeric,
  p_merma_pct numeric
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_origen public.lotes_servicio%rowtype;
  v_tarifa numeric;
  v_peso_destino numeric;
  v_lote_destino_id uuid;
begin
  select * into v_origen from public.lotes_servicio where id = p_lote_servicio_origen_id;
  if not found then
    raise exception 'Lote de servicio no encontrado';
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
    raise exception 'No hay suficiente peso disponible (% kg) para tostar % kg', v_origen.peso_actual_kg, p_kg_a_procesar;
  end if;

  select tarifa_kg into v_tarifa from public.tarifas_servicio where tipo_servicio = 'tueste';
  v_peso_destino := round(p_kg_a_procesar * (1 - p_merma_pct / 100.0), 2);

  insert into public.lotes_servicio (orden_servicio_id, etapa, peso_actual_kg, peso_inicial_kg, calidad, perfil_tueste_id)
  values (v_origen.orden_servicio_id, 'tostado', v_peso_destino, v_peso_destino, v_origen.calidad, p_perfil_tueste_id)
  returning id into v_lote_destino_id;

  update public.lotes_servicio set peso_actual_kg = peso_actual_kg - p_kg_a_procesar where id = p_lote_servicio_origen_id;

  insert into public.pasos_servicio
    (lote_servicio_origen_id, lote_servicio_destino_id, tipo_proceso, peso_procesado_kg, merma_pct, tarifa_kg)
  values
    (p_lote_servicio_origen_id, v_lote_destino_id, 'tueste', p_kg_a_procesar, p_merma_pct, coalesce(v_tarifa, 0));

  update public.ordenes_servicio set estado = 'en_proceso' where id = v_origen.orden_servicio_id and estado = 'pendiente';

  return v_lote_destino_id;
end;
$$;

create or replace function public.aplicar_molido_servicio(
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
  v_tarifa numeric;
  v_peso_destino numeric;
  v_lote_destino_id uuid;
begin
  select * into v_origen from public.lotes_servicio where id = p_lote_servicio_origen_id;
  if not found then
    raise exception 'Lote de servicio no encontrado';
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
    raise exception 'No hay suficiente peso disponible (% kg) para moler % kg', v_origen.peso_actual_kg, p_kg_a_procesar;
  end if;

  select tarifa_kg into v_tarifa from public.tarifas_servicio where tipo_servicio = 'molido';
  v_peso_destino := round(p_kg_a_procesar * (1 - p_merma_pct / 100.0), 2);

  insert into public.lotes_servicio (orden_servicio_id, etapa, peso_actual_kg, peso_inicial_kg, calidad, perfil_tueste_id)
  values (v_origen.orden_servicio_id, 'molido', v_peso_destino, v_peso_destino, v_origen.calidad, v_origen.perfil_tueste_id)
  returning id into v_lote_destino_id;

  update public.lotes_servicio set peso_actual_kg = peso_actual_kg - p_kg_a_procesar where id = p_lote_servicio_origen_id;

  insert into public.pasos_servicio
    (lote_servicio_origen_id, lote_servicio_destino_id, tipo_proceso, peso_procesado_kg, merma_pct, tarifa_kg)
  values
    (p_lote_servicio_origen_id, v_lote_destino_id, 'molido', p_kg_a_procesar, p_merma_pct, coalesce(v_tarifa, 0));

  update public.ordenes_servicio set estado = 'en_proceso' where id = v_origen.orden_servicio_id and estado = 'pendiente';

  return v_lote_destino_id;
end;
$$;

-- Clasificación por calidad: a diferencia de `clasificar_calidad_lote`
-- (interno, siempre deja el origen en 0), aquí sí es parcial — solo se
-- resta del origen la suma efectivamente clasificada.
create or replace function public.aplicar_clasificacion_servicio(
  p_lote_servicio_origen_id uuid,
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
  v_origen public.lotes_servicio%rowtype;
  v_tarifa numeric;
  v_suma numeric;
  v_item record;
  v_lote_destino_id uuid;
begin
  select * into v_origen from public.lotes_servicio where id = p_lote_servicio_origen_id;
  if not found then
    raise exception 'Lote de servicio no encontrado';
  end if;
  if v_origen.etapa <> 'verde' then
    raise exception 'Solo se puede clasificar un lote en verde (etapa actual: %)', v_origen.etapa;
  end if;

  v_suma := coalesce(p_primera_kg, 0) + coalesce(p_segunda_kg, 0) + coalesce(p_tercera_kg, 0) + coalesce(p_rechazo_kg, 0);
  if v_suma <= 0 then
    raise exception 'Indica al menos un peso mayor a 0 en alguna calidad';
  end if;
  if v_suma > v_origen.peso_actual_kg then
    raise exception 'La suma de calidades (% kg) excede el peso disponible (% kg)', v_suma, v_origen.peso_actual_kg;
  end if;

  select tarifa_kg into v_tarifa from public.tarifas_servicio where tipo_servicio = 'clasificacion';

  for v_item in
    select * from (values
      ('primera', p_primera_kg),
      ('segunda', p_segunda_kg),
      ('tercera', p_tercera_kg),
      ('rechazo', p_rechazo_kg)
    ) as t(calidad, peso_kg)
  loop
    if v_item.peso_kg is not null and v_item.peso_kg > 0 then
      insert into public.lotes_servicio (orden_servicio_id, etapa, peso_actual_kg, peso_inicial_kg, calidad)
      values (v_origen.orden_servicio_id, 'verde', v_item.peso_kg, v_item.peso_kg, v_item.calidad)
      returning id into v_lote_destino_id;

      insert into public.pasos_servicio
        (lote_servicio_origen_id, lote_servicio_destino_id, tipo_proceso, peso_procesado_kg, merma_pct, tarifa_kg)
      values
        (p_lote_servicio_origen_id, v_lote_destino_id, 'clasificacion', v_item.peso_kg, 0, coalesce(v_tarifa, 0));
    end if;
  end loop;

  update public.lotes_servicio set peso_actual_kg = peso_actual_kg - v_suma where id = p_lote_servicio_origen_id;

  update public.ordenes_servicio set estado = 'en_proceso' where id = v_origen.orden_servicio_id and estado = 'pendiente';
end;
$$;
