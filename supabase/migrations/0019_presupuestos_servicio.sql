-- Presupuestos de servicio: cotización previa (lista de procesos estimados
-- con su costo según la tarifa vigente) que, al aprobarse, se convierte
-- automáticamente en una orden de servicio real.

create table public.presupuestos_servicio (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id),
  etapa_entrada text not null check (etapa_entrada in ('cereza', 'pergamino', 'verde', 'tostado')),
  cantidad_kg numeric,
  cantidad_cajuelas numeric,
  proceso_beneficiado_id uuid references public.procesos_beneficiado(id),
  estado text not null default 'borrador' check (estado in ('borrador', 'aprobado', 'rechazado')),
  orden_servicio_id uuid references public.ordenes_servicio(id),
  notas text,
  creado_por uuid references public.usuarios(id) default auth.uid(),
  creado_en timestamptz not null default now()
);

create table public.presupuesto_items (
  id uuid primary key default gen_random_uuid(),
  presupuesto_id uuid not null references public.presupuestos_servicio(id),
  tipo_proceso text not null check (tipo_proceso in ('pelado', 'clasificacion', 'tueste', 'molido', 'beneficiado')),
  kg_estimado numeric not null check (kg_estimado > 0),
  tarifa_kg numeric not null,
  costo_estimado numeric generated always as (round(kg_estimado * tarifa_kg, 2)) stored,
  creado_en timestamptz not null default now()
);

alter table public.presupuestos_servicio enable row level security;
alter table public.presupuesto_items enable row level security;

create policy "lectura autenticados" on public.presupuestos_servicio for select
  using (auth.role() = 'authenticated');
create policy "escritura admin y vendedor" on public.presupuestos_servicio for insert
  with check ((auth.jwt() ->> 'user_role') in ('admin', 'vendedor'));
create policy "actualizacion admin y vendedor" on public.presupuestos_servicio for update
  using ((auth.jwt() ->> 'user_role') in ('admin', 'vendedor'));
create policy "eliminar solo admin" on public.presupuestos_servicio for delete
  using ((auth.jwt() ->> 'user_role') = 'admin');

create policy "lectura autenticados" on public.presupuesto_items for select
  using (auth.role() = 'authenticated');
create policy "escritura admin y vendedor" on public.presupuesto_items for insert
  with check ((auth.jwt() ->> 'user_role') in ('admin', 'vendedor'));
create policy "eliminar admin y vendedor" on public.presupuesto_items for delete
  using ((auth.jwt() ->> 'user_role') in ('admin', 'vendedor'));

create trigger trg_audit_presupuestos_servicio after insert or update or delete on public.presupuestos_servicio
  for each row execute function public.fn_audit_trigger();
create trigger trg_audit_presupuesto_items after insert or update or delete on public.presupuesto_items
  for each row execute function public.fn_audit_trigger();

create or replace function public.registrar_presupuesto_servicio(
  p_cliente_id uuid,
  p_etapa_entrada text,
  p_cantidad_kg numeric,
  p_cantidad_cajuelas numeric,
  p_proceso_beneficiado_id uuid,
  p_notas text
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_presupuesto_id uuid;
begin
  if p_etapa_entrada = 'cereza' then
    if p_cantidad_cajuelas is null or p_cantidad_cajuelas <= 0 then
      raise exception 'Indica cuántas cajuelas estima el cliente';
    end if;
    if p_proceso_beneficiado_id is null then
      raise exception 'Selecciona un proceso de beneficiado';
    end if;
  else
    if p_cantidad_kg is null or p_cantidad_kg <= 0 then
      raise exception 'La cantidad debe ser mayor a 0';
    end if;
  end if;

  insert into public.presupuestos_servicio
    (cliente_id, etapa_entrada, cantidad_kg, cantidad_cajuelas, proceso_beneficiado_id, notas)
  values (
    p_cliente_id, p_etapa_entrada,
    case when p_etapa_entrada = 'cereza' then null else p_cantidad_kg end,
    case when p_etapa_entrada = 'cereza' then p_cantidad_cajuelas else null end,
    case when p_etapa_entrada = 'cereza' then p_proceso_beneficiado_id else null end,
    p_notas
  )
  returning id into v_presupuesto_id;

  return v_presupuesto_id;
end;
$$;

create or replace function public.agregar_item_presupuesto(
  p_presupuesto_id uuid,
  p_tipo_proceso text,
  p_kg_estimado numeric
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_tarifa numeric;
  v_item_id uuid;
begin
  if p_kg_estimado is null or p_kg_estimado <= 0 then
    raise exception 'La cantidad estimada debe ser mayor a 0';
  end if;

  select tarifa_kg into v_tarifa from public.tarifas_servicio where tipo_servicio = p_tipo_proceso;

  insert into public.presupuesto_items (presupuesto_id, tipo_proceso, kg_estimado, tarifa_kg)
  values (p_presupuesto_id, p_tipo_proceso, p_kg_estimado, coalesce(v_tarifa, 0))
  returning id into v_item_id;

  return v_item_id;
end;
$$;

-- Reutiliza `registrar_orden_servicio` (misma validación cajuelas/kg) para
-- no duplicar esa lógica al convertir el presupuesto en una orden real.
create or replace function public.aprobar_presupuesto_servicio(p_presupuesto_id uuid)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_presupuesto public.presupuestos_servicio%rowtype;
  v_cantidad_items int;
  v_orden_id uuid;
begin
  select * into v_presupuesto from public.presupuestos_servicio where id = p_presupuesto_id;
  if not found then
    raise exception 'Presupuesto no encontrado';
  end if;
  if v_presupuesto.estado <> 'borrador' then
    raise exception 'Este presupuesto ya fue % ', v_presupuesto.estado;
  end if;

  select count(*) into v_cantidad_items from public.presupuesto_items where presupuesto_id = p_presupuesto_id;
  if v_cantidad_items = 0 then
    raise exception 'Agrega al menos un proceso estimado antes de aprobar';
  end if;

  select public.registrar_orden_servicio(
    v_presupuesto.cliente_id,
    v_presupuesto.etapa_entrada,
    v_presupuesto.cantidad_kg,
    v_presupuesto.cantidad_cajuelas,
    v_presupuesto.proceso_beneficiado_id,
    current_date,
    v_presupuesto.notas
  ) into v_orden_id;

  update public.presupuestos_servicio
    set estado = 'aprobado', orden_servicio_id = v_orden_id
    where id = p_presupuesto_id;

  return v_orden_id;
end;
$$;
