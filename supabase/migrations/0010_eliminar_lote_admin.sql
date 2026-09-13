-- Borrado real de lotes, restringido a admin. Si el lote ya fue transformado
-- o es resultado de una transformación (referenciado en ordenes_proceso como
-- origen o destino), Postgres rechaza el borrado por la FK (comportamiento
-- por defecto, sin ON DELETE CASCADE) — protege la trazabilidad.
create policy "eliminar solo admin" on public.lotes for delete
  using ((auth.jwt() ->> 'user_role') = 'admin');
