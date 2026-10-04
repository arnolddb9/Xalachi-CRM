-- A `articulos` le faltaba la politica DELETE que tienen el resto de los
-- catalogos gestionables (variedades, fincas, proveedores, etc.). Sin ella,
-- RLS bloquea el delete en silencio (0 filas afectadas, sin error) y el
-- boton "Eliminar" de Catalogos -> Insumos y productos no funciona ni
-- para admin.
create policy "eliminar solo admin" on public.articulos for delete
  using ((auth.jwt() ->> 'user_role') = 'admin');
