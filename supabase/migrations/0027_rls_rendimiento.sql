-- Rendimiento de RLS. Dos arreglos del Performance Advisor de Supabase,
-- ninguno cambia el acceso real de ningún rol — solo cuándo se evalúa:
--
-- 1) auth_rls_initplan (93 hallazgos): toda política que llama a
--    auth.jwt()/auth.role()/auth.uid() directamente la reevalúa por cada
--    fila. Envolviendo la llamada en `(select ...)` Postgres la resuelve
--    una sola vez por consulta (InitPlan) en vez de una vez por fila.
--    https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- 2) multiple_permissive_policies (6 hallazgos, todos en `usuarios`): había
--    dos políticas SELECT permisivas solapadas ("admin ve y gestiona todos
--    los usuarios" FOR ALL + "un usuario ve su propio registro" FOR
--    SELECT), así que Postgres evaluaba las dos en cada lectura.

-- --- usuarios: fusiona las dos políticas SELECT solapadas en una sola ---
-- No existe "alter policy ... for insert, update, delete" en Postgres para
-- angostar el `for` de una política ya creada (ALTER POLICY no permite
-- cambiar su `for`): se recrea con el mismo contenido, ahora separada por
-- comando y sin SELECT (que pasa a la política fusionada de abajo).
drop policy "admin ve y gestiona todos los usuarios" on public.usuarios;
create policy "admin ve y gestiona todos los usuarios" on public.usuarios
  for insert
  with check ((select auth.jwt()) ->> 'user_role' = 'admin');
create policy "admin puede actualizar usuarios" on public.usuarios
  for update
  using ((select auth.jwt()) ->> 'user_role' = 'admin');
create policy "admin puede eliminar usuarios" on public.usuarios
  for delete
  using ((select auth.jwt()) ->> 'user_role' = 'admin');

drop policy "un usuario ve su propio registro" on public.usuarios;
create policy "lectura propia o admin" on public.usuarios
  for select
  using (
    (select auth.jwt()) ->> 'user_role' = 'admin'
    or id = (select auth.uid())
  );

-- --- resto de tablas: mismo contenido, solo se envuelve la llamada auth.* ---
alter policy "actualizacion admin y operador" on public.articulos using ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'operador'::text])));
alter policy "eliminar solo admin" on public.articulos using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "escritura admin y operador" on public.articulos with check ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'operador'::text])));
alter policy "lectura autenticados" on public.articulos using (((select auth.role()) = 'authenticated'::text));
alter policy "admin puede leer auditoria" on public.audit_log using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "actualizacion solo admin" on public.categorias_gasto using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "eliminar solo admin" on public.categorias_gasto using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "escritura solo admin" on public.categorias_gasto with check ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "lectura autenticados" on public.categorias_gasto using (((select auth.role()) = 'authenticated'::text));
alter policy "actualizacion admin y vendedor" on public.clientes using ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'vendedor'::text])));
alter policy "eliminar solo admin" on public.clientes using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "escritura admin y vendedor" on public.clientes with check ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'vendedor'::text])));
alter policy "lectura autenticados" on public.clientes using (((select auth.role()) = 'authenticated'::text));
alter policy "actualizacion solo admin" on public.compras using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "eliminar solo admin" on public.compras using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "escritura solo admin" on public.compras with check ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "lectura autenticados" on public.compras using (((select auth.role()) = 'authenticated'::text));
alter policy "actualizacion solo admin" on public.configuracion using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "lectura autenticados" on public.configuracion using (((select auth.role()) = 'authenticated'::text));
alter policy "eliminar solo admin" on public.empacados using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "escritura admin y operador" on public.empacados with check ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'operador'::text])));
alter policy "lectura autenticados" on public.empacados using (((select auth.role()) = 'authenticated'::text));
alter policy "actualizacion admin y operador" on public.fincas using ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'operador'::text])));
alter policy "eliminar solo admin" on public.fincas using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "escritura admin y operador" on public.fincas with check ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'operador'::text])));
alter policy "lectura autenticados" on public.fincas using (((select auth.role()) = 'authenticated'::text));
alter policy "actualizacion solo admin" on public.gastos_operativos using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "eliminar solo admin" on public.gastos_operativos using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "escritura solo admin" on public.gastos_operativos with check ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "lectura autenticados" on public.gastos_operativos using (((select auth.role()) = 'authenticated'::text));
alter policy "actualizacion admin y operador" on public.lotes using ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'operador'::text])));
alter policy "eliminar solo admin" on public.lotes using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "escritura admin y operador" on public.lotes with check ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'operador'::text])));
alter policy "lectura autenticados" on public.lotes using (((select auth.role()) = 'authenticated'::text));
alter policy "actualizacion admin y vendedor" on public.lotes_servicio using ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'vendedor'::text])));
alter policy "escritura admin y vendedor" on public.lotes_servicio with check ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'vendedor'::text])));
alter policy "lectura autenticados" on public.lotes_servicio using (((select auth.role()) = 'authenticated'::text));
alter policy "escritura admin y operador" on public.ordenes_proceso with check ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'operador'::text])));
alter policy "lectura autenticados" on public.ordenes_proceso using (((select auth.role()) = 'authenticated'::text));
alter policy "actualizacion admin y vendedor" on public.ordenes_servicio using ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'vendedor'::text])));
alter policy "eliminar solo admin" on public.ordenes_servicio using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "escritura admin y vendedor" on public.ordenes_servicio with check ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'vendedor'::text])));
alter policy "lectura autenticados" on public.ordenes_servicio using (((select auth.role()) = 'authenticated'::text));
alter policy "actualizacion admin y operador" on public.pasos_beneficiado using ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'operador'::text])));
alter policy "eliminar admin y operador" on public.pasos_beneficiado using ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'operador'::text])));
alter policy "escritura admin y operador" on public.pasos_beneficiado with check ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'operador'::text])));
alter policy "lectura autenticados" on public.pasos_beneficiado using (((select auth.role()) = 'authenticated'::text));
alter policy "escritura admin y vendedor" on public.pasos_servicio with check ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'vendedor'::text])));
alter policy "lectura autenticados" on public.pasos_servicio using (((select auth.role()) = 'authenticated'::text));
alter policy "eliminar admin y vendedor" on public.pedido_items using ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'vendedor'::text])));
alter policy "escritura admin y vendedor" on public.pedido_items with check ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'vendedor'::text])));
alter policy "lectura autenticados" on public.pedido_items using (((select auth.role()) = 'authenticated'::text));
alter policy "actualizacion admin y vendedor" on public.pedidos using ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'vendedor'::text])));
alter policy "eliminar solo admin" on public.pedidos using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "escritura admin y vendedor" on public.pedidos with check ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'vendedor'::text])));
alter policy "lectura autenticados" on public.pedidos using (((select auth.role()) = 'authenticated'::text));
alter policy "actualizacion admin y operador" on public.perfiles_tueste using ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'operador'::text])));
alter policy "eliminar solo admin" on public.perfiles_tueste using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "escritura admin y operador" on public.perfiles_tueste with check ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'operador'::text])));
alter policy "lectura autenticados" on public.perfiles_tueste using (((select auth.role()) = 'authenticated'::text));
alter policy "actualizacion admin y operador" on public.presentaciones using ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'operador'::text])));
alter policy "eliminar solo admin" on public.presentaciones using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "escritura admin y operador" on public.presentaciones with check ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'operador'::text])));
alter policy "lectura autenticados" on public.presentaciones using (((select auth.role()) = 'authenticated'::text));
alter policy "eliminar admin y vendedor" on public.presupuesto_items using ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'vendedor'::text])));
alter policy "escritura admin y vendedor" on public.presupuesto_items with check ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'vendedor'::text])));
alter policy "lectura autenticados" on public.presupuesto_items using (((select auth.role()) = 'authenticated'::text));
alter policy "actualizacion admin y vendedor" on public.presupuestos_servicio using ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'vendedor'::text])));
alter policy "eliminar solo admin" on public.presupuestos_servicio using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "escritura admin y vendedor" on public.presupuestos_servicio with check ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'vendedor'::text])));
alter policy "lectura autenticados" on public.presupuestos_servicio using (((select auth.role()) = 'authenticated'::text));
alter policy "actualizacion admin y operador" on public.procesos_beneficiado using ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'operador'::text])));
alter policy "eliminar solo admin" on public.procesos_beneficiado using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "escritura admin y operador" on public.procesos_beneficiado with check ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'operador'::text])));
alter policy "lectura autenticados" on public.procesos_beneficiado using (((select auth.role()) = 'authenticated'::text));
alter policy "actualizacion solo admin" on public.proveedores using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "eliminar solo admin" on public.proveedores using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "escritura solo admin" on public.proveedores with check ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "lectura autenticados" on public.proveedores using (((select auth.role()) = 'authenticated'::text));
alter policy "actualizacion solo admin" on public.tarifas_servicio using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "lectura autenticados" on public.tarifas_servicio using (((select auth.role()) = 'authenticated'::text));
alter policy "actualizacion admin y operador" on public.variedades using ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'operador'::text])));
alter policy "eliminar solo admin" on public.variedades using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "escritura admin y operador" on public.variedades with check ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'operador'::text])));
alter policy "lectura autenticados" on public.variedades using (((select auth.role()) = 'authenticated'::text));
alter policy "escritura admin y vendedor" on public.venta_items with check ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'vendedor'::text])));
alter policy "lectura autenticados" on public.venta_items using (((select auth.role()) = 'authenticated'::text));
alter policy "actualizacion admin y vendedor" on public.ventas using ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'vendedor'::text])));
alter policy "eliminar solo admin" on public.ventas using ((((select auth.jwt()) ->> 'user_role'::text) = 'admin'::text));
alter policy "escritura admin y vendedor" on public.ventas with check ((((select auth.jwt()) ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'vendedor'::text])));
alter policy "lectura autenticados" on public.ventas using (((select auth.role()) = 'authenticated'::text));
