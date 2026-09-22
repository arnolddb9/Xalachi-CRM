-- M6: Pedidos y ventas. Un pedido es una lista de ítems que el cliente
-- quiere (producto terminado empacado, por unidades, o café a granel
-- directo de un lote propio, por kg); no toca inventario. Al confirmarlo
-- se convierte automáticamente en una venta real (mismo patrón que
-- Presupuesto -> Orden de servicio), que sí descuenta stock/peso.

alter table public.articulos add column precio_venta numeric not null default 0;

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id),
  estado text not null default 'borrador' check (estado in ('borrador', 'confirmado', 'cancelado')),
  venta_id uuid,
  notas text,
  creado_por uuid references public.usuarios(id) default auth.uid(),
  creado_en timestamptz not null default now()
);

create table public.pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id),
  tipo_item text not null check (tipo_item in ('producto', 'granel')),
  articulo_id uuid references public.articulos(id),
  lote_id uuid references public.lotes(id),
  cantidad numeric not null check (cantidad > 0),
  precio_lista numeric,
  precio_unitario numeric not null check (precio_unitario >= 0),
  motivo_cambio_precio text,
  subtotal numeric generated always as (round(cantidad * precio_unitario, 2)) stored,
  creado_en timestamptz not null default now(),
  constraint pedido_items_referencia_check check (
    (tipo_item = 'producto' and articulo_id is not null and lote_id is null) or
    (tipo_item = 'granel' and lote_id is not null and articulo_id is null)
  )
);

create table public.ventas (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid references public.pedidos(id),
  cliente_id uuid not null references public.clientes(id),
  estado_pago text not null default 'pendiente' check (estado_pago in ('pendiente', 'pagado')),
  notas text,
  creado_por uuid references public.usuarios(id) default auth.uid(),
  creado_en timestamptz not null default now()
);

alter table public.pedidos add constraint pedidos_venta_id_fkey foreign key (venta_id) references public.ventas(id);

create table public.venta_items (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas(id),
  tipo_item text not null check (tipo_item in ('producto', 'granel')),
  articulo_id uuid references public.articulos(id),
  lote_id uuid references public.lotes(id),
  cantidad numeric not null check (cantidad > 0),
  precio_unitario numeric not null check (precio_unitario >= 0),
  subtotal numeric generated always as (round(cantidad * precio_unitario, 2)) stored,
  creado_en timestamptz not null default now()
);

alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;
alter table public.ventas enable row level security;
alter table public.venta_items enable row level security;

create policy "lectura autenticados" on public.pedidos for select
  using (auth.role() = 'authenticated');
create policy "escritura admin y vendedor" on public.pedidos for insert
  with check ((auth.jwt() ->> 'user_role') in ('admin', 'vendedor'));
create policy "actualizacion admin y vendedor" on public.pedidos for update
  using ((auth.jwt() ->> 'user_role') in ('admin', 'vendedor'));
create policy "eliminar solo admin" on public.pedidos for delete
  using ((auth.jwt() ->> 'user_role') = 'admin');

create policy "lectura autenticados" on public.pedido_items for select
  using (auth.role() = 'authenticated');
create policy "escritura admin y vendedor" on public.pedido_items for insert
  with check ((auth.jwt() ->> 'user_role') in ('admin', 'vendedor'));
create policy "eliminar admin y vendedor" on public.pedido_items for delete
  using ((auth.jwt() ->> 'user_role') in ('admin', 'vendedor'));

create policy "lectura autenticados" on public.ventas for select
  using (auth.role() = 'authenticated');
create policy "escritura admin y vendedor" on public.ventas for insert
  with check ((auth.jwt() ->> 'user_role') in ('admin', 'vendedor'));
create policy "actualizacion admin y vendedor" on public.ventas for update
  using ((auth.jwt() ->> 'user_role') in ('admin', 'vendedor'));
create policy "eliminar solo admin" on public.ventas for delete
  using ((auth.jwt() ->> 'user_role') = 'admin');

create policy "lectura autenticados" on public.venta_items for select
  using (auth.role() = 'authenticated');
create policy "escritura admin y vendedor" on public.venta_items for insert
  with check ((auth.jwt() ->> 'user_role') in ('admin', 'vendedor'));

create trigger trg_audit_pedidos after insert or update or delete on public.pedidos
  for each row execute function public.fn_audit_trigger();
create trigger trg_audit_pedido_items after insert or update or delete on public.pedido_items
  for each row execute function public.fn_audit_trigger();
create trigger trg_audit_ventas after insert or update or delete on public.ventas
  for each row execute function public.fn_audit_trigger();
create trigger trg_audit_venta_items after insert or update or delete on public.venta_items
  for each row execute function public.fn_audit_trigger();

create or replace function public.registrar_pedido(p_cliente_id uuid, p_notas text)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_pedido_id uuid;
begin
  insert into public.pedidos (cliente_id, notas)
  values (p_cliente_id, p_notas)
  returning id into v_pedido_id;

  return v_pedido_id;
end;
$$;

create or replace function public.agregar_item_pedido_producto(
  p_pedido_id uuid,
  p_articulo_id uuid,
  p_cantidad numeric,
  p_precio_unitario numeric,
  p_motivo text
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_precio_lista numeric;
  v_precio_final numeric;
  v_item_id uuid;
begin
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor a 0';
  end if;

  select precio_venta into v_precio_lista from public.articulos where id = p_articulo_id;
  if not found then
    raise exception 'Artículo no encontrado';
  end if;

  v_precio_final := coalesce(p_precio_unitario, v_precio_lista);

  if v_precio_final <> v_precio_lista and (p_motivo is null or btrim(p_motivo) = '') then
    raise exception 'Indica el motivo del cambio de precio';
  end if;

  insert into public.pedido_items
    (pedido_id, tipo_item, articulo_id, cantidad, precio_lista, precio_unitario, motivo_cambio_precio)
  values (
    p_pedido_id, 'producto', p_articulo_id, p_cantidad, v_precio_lista, v_precio_final,
    case when v_precio_final <> v_precio_lista then p_motivo else null end
  )
  returning id into v_item_id;

  return v_item_id;
end;
$$;

create or replace function public.agregar_item_pedido_granel(
  p_pedido_id uuid,
  p_lote_id uuid,
  p_cantidad_kg numeric,
  p_precio_unitario numeric
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_item_id uuid;
begin
  if p_cantidad_kg is null or p_cantidad_kg <= 0 then
    raise exception 'La cantidad debe ser mayor a 0';
  end if;
  if p_precio_unitario is null or p_precio_unitario <= 0 then
    raise exception 'Indica el precio por kg';
  end if;
  if not exists (select 1 from public.lotes where id = p_lote_id) then
    raise exception 'Lote no encontrado';
  end if;

  insert into public.pedido_items
    (pedido_id, tipo_item, lote_id, cantidad, precio_unitario)
  values (p_pedido_id, 'granel', p_lote_id, p_cantidad_kg, p_precio_unitario)
  returning id into v_item_id;

  return v_item_id;
end;
$$;

-- Convierte un pedido en una venta real: valida disponibilidad y descuenta
-- inventario (stock del artículo o peso del lote) en este momento, no
-- antes — un pedido en borrador nunca toca inventario.
--
-- `security definer`: un vendedor puede confirmar un pedido, pero no tiene
-- permiso de escritura directa sobre `articulos`/`lotes` (reservado a
-- admin+operador) — se valida el rol manualmente aquí en vez de ampliar
-- esa RLS, para no abrir edición directa de esas tablas a vendedores.
create or replace function public.confirmar_pedido(p_pedido_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido public.pedidos%rowtype;
  v_item record;
  v_venta_id uuid;
  v_stock_actual numeric;
begin
  if (auth.jwt() ->> 'user_role') not in ('admin', 'vendedor') then
    raise exception 'No autorizado';
  end if;

  select * into v_pedido from public.pedidos where id = p_pedido_id;
  if not found then
    raise exception 'Pedido no encontrado';
  end if;
  if v_pedido.estado <> 'borrador' then
    raise exception 'Este pedido ya fue %', v_pedido.estado;
  end if;

  if not exists (select 1 from public.pedido_items where pedido_id = p_pedido_id) then
    raise exception 'Agrega al menos un producto antes de confirmar';
  end if;

  insert into public.ventas (pedido_id, cliente_id)
  values (p_pedido_id, v_pedido.cliente_id)
  returning id into v_venta_id;

  for v_item in select * from public.pedido_items where pedido_id = p_pedido_id loop
    if v_item.tipo_item = 'producto' then
      select stock_actual into v_stock_actual from public.articulos where id = v_item.articulo_id;
      if v_stock_actual is null or v_stock_actual < v_item.cantidad then
        raise exception 'No hay suficiente existencia para uno de los productos del pedido';
      end if;
      update public.articulos set stock_actual = stock_actual - v_item.cantidad where id = v_item.articulo_id;
    else
      select peso_actual_kg into v_stock_actual from public.lotes where id = v_item.lote_id;
      if v_stock_actual is null or v_stock_actual < v_item.cantidad then
        raise exception 'No hay suficiente peso disponible en uno de los lotes del pedido';
      end if;
      update public.lotes set peso_actual_kg = peso_actual_kg - v_item.cantidad where id = v_item.lote_id;
    end if;

    insert into public.venta_items (venta_id, tipo_item, articulo_id, lote_id, cantidad, precio_unitario)
    values (v_venta_id, v_item.tipo_item, v_item.articulo_id, v_item.lote_id, v_item.cantidad, v_item.precio_unitario);
  end loop;

  update public.pedidos set estado = 'confirmado', venta_id = v_venta_id where id = p_pedido_id;

  return v_venta_id;
end;
$$;

-- Revierte el stock/peso descontado por cada ítem antes de borrar la
-- venta — calcada de `eliminar_compra`. `security definer` por la misma
-- razón que `confirmar_pedido`; aquí el rol se restringe a admin (mismo
-- bucket que el resto de "eliminar" reales del sistema).
create or replace function public.eliminar_venta(p_venta_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
begin
  if (auth.jwt() ->> 'user_role') <> 'admin' then
    raise exception 'No autorizado';
  end if;
  if not exists (select 1 from public.ventas where id = p_venta_id) then
    raise exception 'Venta no encontrada';
  end if;

  for v_item in select * from public.venta_items where venta_id = p_venta_id loop
    if v_item.tipo_item = 'producto' then
      update public.articulos set stock_actual = stock_actual + v_item.cantidad where id = v_item.articulo_id;
    else
      update public.lotes set peso_actual_kg = peso_actual_kg + v_item.cantidad where id = v_item.lote_id;
    end if;
  end loop;

  update public.pedidos set venta_id = null, estado = 'cancelado' where venta_id = p_venta_id;
  delete from public.venta_items where venta_id = p_venta_id;
  delete from public.ventas where id = p_venta_id;
end;
$$;
