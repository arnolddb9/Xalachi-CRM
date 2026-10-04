-- `eliminar_compra` solo revertia stock para tipo_compra 'insumo' /
-- 'producto_terminado'; para tipo_compra 'lote' borraba la fila de
-- `compras` pero nunca el lote que `registrar_compra_lote` habia generado,
-- dejandolo huerfano en inventario. Se agrega el borrado del lote,
-- respetando las mismas FK que ya protegen a `eliminarLote` (si el lote
-- ya fue transformado o referenciado en otro proceso, Postgres rechaza
-- el borrado y la transaccion completa se revierte).
create or replace function public.eliminar_compra(p_compra_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_compra public.compras%rowtype;
  v_stock_nuevo numeric;
begin
  select * into v_compra from public.compras where id = p_compra_id;
  if not found then
    raise exception 'Compra no encontrada';
  end if;

  if v_compra.tipo_compra in ('insumo', 'producto_terminado') then
    select stock_actual - v_compra.cantidad into v_stock_nuevo
      from public.articulos where id = v_compra.articulo_id;
    if v_stock_nuevo < 0 then
      raise exception 'No se puede eliminar: el artículo ya no tiene suficiente existencia para revertir esta compra.';
    end if;
    update public.articulos set stock_actual = v_stock_nuevo where id = v_compra.articulo_id;
  end if;

  delete from public.compras where id = p_compra_id;

  if v_compra.tipo_compra = 'lote' then
    delete from public.lotes where id = v_compra.lote_id;
  end if;
end;
$$;
