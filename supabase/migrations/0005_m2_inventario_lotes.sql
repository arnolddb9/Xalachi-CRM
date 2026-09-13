-- M2: Inventario y Lotes
-- Modelo multietapa (cereza -> pergamino -> verde) con trazabilidad vía ordenes_proceso.
-- Tueste/molido (M4) se agregan después ampliando los valores permitidos en la app,
-- sin migración (etapa/tipo_proceso son text, no enums de Postgres).

create table public.lotes (
  id uuid primary key default gen_random_uuid(),
  variedad_id uuid not null references public.variedades(id),
  proveedor_id uuid references public.proveedores(id),
  etapa text not null check (etapa in ('cereza', 'pergamino', 'verde')),
  peso_actual_kg numeric not null check (peso_actual_kg >= 0),
  fecha_cosecha date,
  creado_en timestamptz not null default now()
);

create table public.ordenes_proceso (
  id uuid primary key default gen_random_uuid(),
  lote_origen_id uuid not null references public.lotes(id),
  lote_destino_id uuid not null references public.lotes(id),
  tipo_proceso text not null,
  proceso_beneficiado_id uuid references public.procesos_beneficiado(id),
  merma_pct numeric not null check (merma_pct >= 0 and merma_pct <= 100),
  usuario_id uuid references public.usuarios(id),
  creado_en timestamptz not null default now()
);

alter table public.lotes enable row level security;
alter table public.ordenes_proceso enable row level security;

create policy "lectura autenticados" on public.lotes for select using (auth.role() = 'authenticated');
create policy "lectura autenticados" on public.ordenes_proceso for select using (auth.role() = 'authenticated');

create policy "escritura admin y operador" on public.lotes for insert
  with check ((auth.jwt() ->> 'user_role') in ('admin', 'operador'));
create policy "actualizacion admin y operador" on public.lotes for update
  using ((auth.jwt() ->> 'user_role') in ('admin', 'operador'));

create policy "escritura admin y operador" on public.ordenes_proceso for insert
  with check ((auth.jwt() ->> 'user_role') in ('admin', 'operador'));

create trigger trg_audit_lotes after insert or update or delete on public.lotes
  for each row execute function public.fn_audit_trigger();
create trigger trg_audit_ordenes_proceso after insert or update or delete on public.ordenes_proceso
  for each row execute function public.fn_audit_trigger();

-- =========================================================
-- Transformación de etapa: una sola transacción, evita que
-- el cliente deje el estado a medias si algo falla a mitad de camino.
-- security invoker: corre con los permisos (y RLS) de quien la llama.
-- =========================================================
create or replace function public.aplicar_proceso_lote(
  p_lote_origen_id uuid,
  p_tipo_proceso text,
  p_proceso_beneficiado_id uuid,
  p_merma_pct numeric
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_origen public.lotes%rowtype;
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

  if v_origen.etapa = 'cereza' and p_tipo_proceso = 'beneficiado' then
    v_etapa_destino := 'pergamino';
  elsif v_origen.etapa = 'pergamino' and p_tipo_proceso = 'trillado' then
    v_etapa_destino := 'verde';
  else
    raise exception 'Transición no válida: % con proceso %', v_origen.etapa, p_tipo_proceso;
  end if;

  if p_merma_pct < 0 or p_merma_pct > 100 then
    raise exception 'La merma debe estar entre 0 y 100';
  end if;

  v_peso_destino := v_origen.peso_actual_kg * (1 - p_merma_pct / 100.0);

  insert into public.lotes (variedad_id, proveedor_id, etapa, peso_actual_kg, fecha_cosecha)
  values (v_origen.variedad_id, v_origen.proveedor_id, v_etapa_destino, v_peso_destino, v_origen.fecha_cosecha)
  returning id into v_lote_destino_id;

  update public.lotes set peso_actual_kg = 0 where id = p_lote_origen_id;

  insert into public.ordenes_proceso
    (lote_origen_id, lote_destino_id, tipo_proceso, proceso_beneficiado_id, merma_pct, usuario_id)
  values
    (p_lote_origen_id, v_lote_destino_id, p_tipo_proceso, p_proceso_beneficiado_id, p_merma_pct, auth.uid());

  return v_lote_destino_id;
end;
$$;

revoke execute on function public.aplicar_proceso_lote from public;
grant execute on function public.aplicar_proceso_lote to authenticated;
