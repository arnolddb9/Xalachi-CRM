-- Permisos que le faltaban a supabase_auth_admin para poder ejecutar
-- custom_access_token_hook (necesita leer public.usuarios, y la RLS
-- de esa tabla no lo dejaba pasar).

grant usage on schema public to supabase_auth_admin;
grant select on table public.usuarios to supabase_auth_admin;

create policy "auth admin puede leer usuarios para el hook"
  on public.usuarios for select
  to supabase_auth_admin
  using (true);
