-- M5: servicios a terceros. El cliente trae su propio café (cereza,
-- pergamino, verde o ya tostado) y se le aplica un proceso cobrando una
-- tarifa por kg — no genera lote ni toca inventario propio.

create table public.ordenes_servicio (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id),
  tipo_servicio text not null check (tipo_servicio in ('tostado', 'pelado', 'molido', 'procesado')),
  etapa_entrada text not null check (etapa_entrada in ('cereza', 'pergamino', 'verde', 'tostado')),
  cantidad_kg numeric not null check (cantidad_kg > 0),
  cantidad_entregada_kg numeric check (
    cantidad_entregada_kg is null or (cantidad_entregada_kg > 0 and cantidad_entregada_kg <= cantidad_kg)
  ),
  perfil_tueste_id uuid references public.perfiles_tueste(id),
  tarifa_kg numeric not null check (tarifa_kg >= 0),
  costo_total numeric generated always as (round(cantidad_kg * tarifa_kg, 2)) stored,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'procesado', 'entregado')),
  fecha_recepcion date not null default current_date,
  fecha_entrega date,
  notas text,
  creado_por uuid references public.usuarios(id) default auth.uid(),
  creado_en timestamptz not null default now()
);

alter table public.ordenes_servicio enable row level security;

create policy "lectura autenticados" on public.ordenes_servicio for select
  using (auth.role() = 'authenticated');
create policy "escritura admin y vendedor" on public.ordenes_servicio for insert
  with check ((auth.jwt() ->> 'user_role') in ('admin', 'vendedor'));
create policy "actualizacion admin y vendedor" on public.ordenes_servicio for update
  using ((auth.jwt() ->> 'user_role') in ('admin', 'vendedor'));
create policy "eliminar solo admin" on public.ordenes_servicio for delete
  using ((auth.jwt() ->> 'user_role') = 'admin');

create trigger trg_audit_ordenes_servicio after insert or update or delete on public.ordenes_servicio
  for each row execute function public.fn_audit_trigger();
