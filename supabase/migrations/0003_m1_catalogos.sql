-- M1: Catálogos
-- variedades, procesos_beneficiado, perfiles_tueste, presentaciones (simples)
-- proveedores, clientes (ricos)
--
-- Lectura: cualquier usuario autenticado.
-- Escritura: por bucket de rol (ver documento de diseño §8).
-- Sin política de DELETE: "eliminar" es un UPDATE que pone activo = false
-- (soft-delete, evita romper referencias futuras de lotes/compras/ventas).

-- =========================================================
-- Catálogos simples
-- =========================================================
create table public.variedades (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table public.procesos_beneficiado (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table public.perfiles_tueste (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  nivel text not null check (nivel in ('claro', 'medio', 'oscuro')),
  descripcion text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table public.presentaciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  peso_gramos numeric,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- =========================================================
-- Catálogos ricos
-- =========================================================
create table public.proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  email text,
  direccion text,
  notas text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null default 'menudeo' check (tipo in ('menudeo', 'mayoreo')),
  telefono text,
  email text,
  direccion text,
  notas text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- =========================================================
-- RLS
-- =========================================================
alter table public.variedades enable row level security;
alter table public.procesos_beneficiado enable row level security;
alter table public.perfiles_tueste enable row level security;
alter table public.presentaciones enable row level security;
alter table public.proveedores enable row level security;
alter table public.clientes enable row level security;

-- Lectura abierta a cualquier usuario autenticado, en las 6 tablas
create policy "lectura autenticados" on public.variedades for select using (auth.role() = 'authenticated');
create policy "lectura autenticados" on public.procesos_beneficiado for select using (auth.role() = 'authenticated');
create policy "lectura autenticados" on public.perfiles_tueste for select using (auth.role() = 'authenticated');
create policy "lectura autenticados" on public.presentaciones for select using (auth.role() = 'authenticated');
create policy "lectura autenticados" on public.proveedores for select using (auth.role() = 'authenticated');
create policy "lectura autenticados" on public.clientes for select using (auth.role() = 'authenticated');

-- Escritura: admin + operador (catálogos de producción)
create policy "escritura admin y operador" on public.variedades for insert
  with check ((auth.jwt() ->> 'user_role') in ('admin', 'operador'));
create policy "actualizacion admin y operador" on public.variedades for update
  using ((auth.jwt() ->> 'user_role') in ('admin', 'operador'));

create policy "escritura admin y operador" on public.procesos_beneficiado for insert
  with check ((auth.jwt() ->> 'user_role') in ('admin', 'operador'));
create policy "actualizacion admin y operador" on public.procesos_beneficiado for update
  using ((auth.jwt() ->> 'user_role') in ('admin', 'operador'));

create policy "escritura admin y operador" on public.perfiles_tueste for insert
  with check ((auth.jwt() ->> 'user_role') in ('admin', 'operador'));
create policy "actualizacion admin y operador" on public.perfiles_tueste for update
  using ((auth.jwt() ->> 'user_role') in ('admin', 'operador'));

create policy "escritura admin y operador" on public.presentaciones for insert
  with check ((auth.jwt() ->> 'user_role') in ('admin', 'operador'));
create policy "actualizacion admin y operador" on public.presentaciones for update
  using ((auth.jwt() ->> 'user_role') in ('admin', 'operador'));

-- Escritura: solo admin (bucket Compras/Finanzas)
create policy "escritura solo admin" on public.proveedores for insert
  with check ((auth.jwt() ->> 'user_role') = 'admin');
create policy "actualizacion solo admin" on public.proveedores for update
  using ((auth.jwt() ->> 'user_role') = 'admin');

-- Escritura: admin + vendedor (bucket Ventas/Clientes)
create policy "escritura admin y vendedor" on public.clientes for insert
  with check ((auth.jwt() ->> 'user_role') in ('admin', 'vendedor'));
create policy "actualizacion admin y vendedor" on public.clientes for update
  using ((auth.jwt() ->> 'user_role') in ('admin', 'vendedor'));

-- =========================================================
-- Auditoría (reusa fn_audit_trigger, creada en M0)
-- =========================================================
create trigger trg_audit_variedades after insert or update or delete on public.variedades
  for each row execute function public.fn_audit_trigger();
create trigger trg_audit_procesos_beneficiado after insert or update or delete on public.procesos_beneficiado
  for each row execute function public.fn_audit_trigger();
create trigger trg_audit_perfiles_tueste after insert or update or delete on public.perfiles_tueste
  for each row execute function public.fn_audit_trigger();
create trigger trg_audit_presentaciones after insert or update or delete on public.presentaciones
  for each row execute function public.fn_audit_trigger();
create trigger trg_audit_proveedores after insert or update or delete on public.proveedores
  for each row execute function public.fn_audit_trigger();
create trigger trg_audit_clientes after insert or update or delete on public.clientes
  for each row execute function public.fn_audit_trigger();
