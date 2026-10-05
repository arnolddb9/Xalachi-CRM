-- Gastos operativos (electricidad, agua, gas, etc.): no son compras de
-- inventario, pero sí salidas de caja reales que deben sumarse al total de
-- gastos del reporte de caja (M7). Mismo patrón de RLS que `compras`:
-- lectura abierta a cualquier autenticado, escritura solo admin.

create table public.categorias_gasto (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

alter table public.categorias_gasto enable row level security;

create policy "lectura autenticados" on public.categorias_gasto for select
  using (auth.role() = 'authenticated');
create policy "escritura solo admin" on public.categorias_gasto for insert
  with check ((auth.jwt() ->> 'user_role') = 'admin');
create policy "actualizacion solo admin" on public.categorias_gasto for update
  using ((auth.jwt() ->> 'user_role') = 'admin');
create policy "eliminar solo admin" on public.categorias_gasto for delete
  using ((auth.jwt() ->> 'user_role') = 'admin');

create trigger trg_audit_categorias_gasto after insert or update or delete on public.categorias_gasto
  for each row execute function public.fn_audit_trigger();

insert into public.categorias_gasto (nombre) values
  ('Electricidad'), ('Agua'), ('Gas'), ('Alquiler'), ('Otros');

create table public.gastos_operativos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.categorias_gasto(id),
  descripcion text,
  monto numeric not null check (monto > 0),
  fecha date not null default current_date,
  numero_factura text,
  creado_por uuid references public.usuarios(id) default auth.uid(),
  creado_en timestamptz not null default now()
);

alter table public.gastos_operativos enable row level security;

create policy "lectura autenticados" on public.gastos_operativos for select
  using (auth.role() = 'authenticated');
create policy "escritura solo admin" on public.gastos_operativos for insert
  with check ((auth.jwt() ->> 'user_role') = 'admin');
create policy "actualizacion solo admin" on public.gastos_operativos for update
  using ((auth.jwt() ->> 'user_role') = 'admin');
create policy "eliminar solo admin" on public.gastos_operativos for delete
  using ((auth.jwt() ->> 'user_role') = 'admin');

create trigger trg_audit_gastos_operativos after insert or update or delete on public.gastos_operativos
  for each row execute function public.fn_audit_trigger();
