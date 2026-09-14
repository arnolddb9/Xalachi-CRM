create table public.compras (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references public.proveedores(id),
  lote_id uuid not null references public.lotes(id),
  fecha_compra date not null default current_date,
  costo_total numeric,
  numero_factura text,
  notas text,
  creado_por uuid references public.usuarios(id) default auth.uid(),
  creado_en timestamptz not null default now()
);

alter table public.compras enable row level security;

create policy "lectura autenticados" on public.compras for select
  using (auth.role() = 'authenticated');
create policy "escritura solo admin" on public.compras for insert
  with check ((auth.jwt() ->> 'user_role') = 'admin');
create policy "actualizacion solo admin" on public.compras for update
  using ((auth.jwt() ->> 'user_role') = 'admin');
create policy "eliminar solo admin" on public.compras for delete
  using ((auth.jwt() ->> 'user_role') = 'admin');

create trigger trg_audit_compras after insert or update or delete on public.compras
  for each row execute function public.fn_audit_trigger();

-- Crea el lote y la compra en una sola transacción (evita un lote huérfano
-- si la inserción de la compra fallara); reusa el mismo cálculo de peso
-- desde cajuelas que la app usa en registrarLote (factor_kg_por_cajuela).
create or replace function public.registrar_compra(
  p_proveedor_id uuid,
  p_variedad_id uuid,
  p_etapa text,
  p_cantidad_cajuelas numeric,
  p_peso_actual_kg numeric,
  p_fecha_cosecha date,
  p_finca_id uuid,
  p_numero_cama_secado text,
  p_nombre text,
  p_fecha_compra date,
  p_costo_total numeric,
  p_numero_factura text,
  p_notas text
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_factor numeric;
  v_peso numeric;
  v_cajuelas numeric;
  v_lote_id uuid;
  v_compra_id uuid;
begin
  if p_etapa = 'cereza' then
    if p_cantidad_cajuelas is null or p_cantidad_cajuelas <= 0 then
      raise exception 'Indica cuántas cajuelas se recibieron.';
    end if;
    select factor_kg_por_cajuela into v_factor from public.configuracion where id = 1;
    v_peso := round(p_cantidad_cajuelas * v_factor, 2);
    v_cajuelas := p_cantidad_cajuelas;
  else
    if p_peso_actual_kg is null or p_peso_actual_kg <= 0 then
      raise exception 'El peso debe ser mayor a 0.';
    end if;
    v_peso := p_peso_actual_kg;
    v_cajuelas := null;
  end if;

  insert into public.lotes
    (nombre, variedad_id, proveedor_id, finca_id, numero_cama_secado, etapa, peso_actual_kg, peso_inicial_kg, cantidad_cajuelas, fecha_cosecha)
  values
    (p_nombre, p_variedad_id, p_proveedor_id, p_finca_id, p_numero_cama_secado, p_etapa, v_peso, v_peso, v_cajuelas, p_fecha_cosecha)
  returning id into v_lote_id;

  insert into public.compras
    (proveedor_id, lote_id, fecha_compra, costo_total, numero_factura, notas)
  values
    (p_proveedor_id, v_lote_id, coalesce(p_fecha_compra, current_date), p_costo_total, p_numero_factura, p_notas)
  returning id into v_compra_id;

  return v_compra_id;
end;
$$;
