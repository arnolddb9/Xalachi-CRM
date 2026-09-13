-- Registra cuántas cajuelas se recibieron (solo aplica en etapa 'cereza',
-- que es como se mide la fruta al llegar) además del peso ya calculado.
alter table public.lotes add column cantidad_cajuelas numeric check (cantidad_cajuelas > 0);

-- Configuración del sistema: patrón singleton (una sola fila, id fijo).
-- Por ahora solo el factor de conversión kg/cajuela, ajustable por admin.
create table public.configuracion (
  id int primary key default 1 check (id = 1),
  factor_kg_por_cajuela numeric not null default 13.6 check (factor_kg_por_cajuela > 0),
  actualizado_en timestamptz not null default now()
);

insert into public.configuracion (id) values (1);

alter table public.configuracion enable row level security;

create policy "lectura autenticados" on public.configuracion for select
  using (auth.role() = 'authenticated');

create policy "actualizacion solo admin" on public.configuracion for update
  using ((auth.jwt() ->> 'user_role') = 'admin');

create trigger trg_audit_configuracion after update on public.configuracion
  for each row execute function public.fn_audit_trigger();

-- Nota: la edición de lotes (variedad, proveedor, peso, cajuelas, fecha de
-- cosecha) ya queda cubierta por la política "actualizacion admin y operador"
-- creada en 0005_m2_inventario_lotes.sql — no requiere cambios de RLS aquí.
