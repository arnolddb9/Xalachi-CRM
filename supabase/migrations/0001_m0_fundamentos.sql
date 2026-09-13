-- M0: Fundamentos
-- Usuarios/roles, claim de rol en el JWT, tabla de auditoría con retención.

-- =========================================================
-- 1. Usuarios y roles
-- =========================================================
create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  role text not null check (role in ('admin', 'operador', 'vendedor')),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

alter table public.usuarios enable row level security;

create policy "un usuario ve su propio registro"
  on public.usuarios for select
  using (id = auth.uid());

create policy "admin ve y gestiona todos los usuarios"
  on public.usuarios for all
  using ((auth.jwt() ->> 'user_role') = 'admin');

-- =========================================================
-- 2. Auth Hook: inyecta el rol como claim en el JWT
--    (además de crear esta función, hay que activarla en
--    Dashboard > Authentication > Hooks > Custom Access Token)
-- =========================================================
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_role text;
begin
  select role into user_role
  from public.usuarios
  where id = (event->>'user_id')::uuid;

  claims := event->'claims';

  if user_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  else
    claims := jsonb_set(claims, '{user_role}', '"sin_rol"');
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- =========================================================
-- 3. Tabla de auditoría (append-only, con retención configurable)
-- =========================================================
create table public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text not null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid default auth.uid(),
  changed_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create policy "admin puede leer auditoria"
  on public.audit_log for select
  using ((auth.jwt() ->> 'user_role') = 'admin');

-- inmutable de cara a la app: sin GRANT de update/delete para los roles de API
revoke update, delete on public.audit_log from anon, authenticated;

create or replace function public.fn_audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'DELETE') then
    insert into public.audit_log (table_name, record_id, operation, old_data)
    values (tg_table_name, old.id::text, tg_op, to_jsonb(old));
    return old;
  elsif (tg_op = 'UPDATE') then
    insert into public.audit_log (table_name, record_id, operation, old_data, new_data)
    values (tg_table_name, new.id::text, tg_op, to_jsonb(old), to_jsonb(new));
    return new;
  else
    insert into public.audit_log (table_name, record_id, operation, new_data)
    values (tg_table_name, new.id::text, tg_op, to_jsonb(new));
    return new;
  end if;
end;
$$;

-- Retención configurable (pg_cron viene habilitado por defecto en Supabase)
create extension if not exists pg_cron with schema extensions;

create or replace function public.fn_purge_audit_log(retencion_dias int default 15)
returns void
language sql
security definer
as $$
  delete from public.audit_log
  where changed_at < now() - (retencion_dias || ' days')::interval;
$$;

select cron.schedule(
  'purge-audit-log',
  '0 3 * * *',
  $$select public.fn_purge_audit_log(15)$$
);
