-- Permite borrado real (no solo desactivar) de los catálogos de M1,
-- restringido a admin. El soft-delete (activo=false) sigue disponible
-- para todos los roles con permiso de escritura; esto es adicional,
-- para limpieza de errores/datos de prueba.

create policy "eliminar solo admin" on public.variedades for delete
  using ((auth.jwt() ->> 'user_role') = 'admin');

create policy "eliminar solo admin" on public.procesos_beneficiado for delete
  using ((auth.jwt() ->> 'user_role') = 'admin');

create policy "eliminar solo admin" on public.perfiles_tueste for delete
  using ((auth.jwt() ->> 'user_role') = 'admin');

create policy "eliminar solo admin" on public.presentaciones for delete
  using ((auth.jwt() ->> 'user_role') = 'admin');

create policy "eliminar solo admin" on public.proveedores for delete
  using ((auth.jwt() ->> 'user_role') = 'admin');

create policy "eliminar solo admin" on public.clientes for delete
  using ((auth.jwt() ->> 'user_role') = 'admin');
