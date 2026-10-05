-- Índices de rendimiento. Puramente aditivo: no cambia ningún comportamiento
-- observable, solo el plan de ejecución de Postgres. Generado a partir del
-- Performance Advisor de Supabase (45 foreign keys sin índice) más un
-- relevamiento manual de las columnas que la app realmente filtra/ordena
-- (grep de .eq/.gte/.lte/.gt/.order/.in en src/app y src/features).

-- 1) Un índice por cada foreign key sin cobertura que reportó el advisor.
create index if not exists idx_compras_articulo_id on public.compras(articulo_id);
create index if not exists idx_compras_creado_por on public.compras(creado_por);
create index if not exists idx_compras_lote_id on public.compras(lote_id);
create index if not exists idx_compras_proveedor_id on public.compras(proveedor_id);
create index if not exists idx_empacados_articulo_id on public.empacados(articulo_id);
create index if not exists idx_empacados_insumo_articulo_id on public.empacados(insumo_articulo_id);
create index if not exists idx_empacados_lote_origen_id on public.empacados(lote_origen_id);
create index if not exists idx_empacados_presentacion_id on public.empacados(presentacion_id);
create index if not exists idx_empacados_usuario_id on public.empacados(usuario_id);
create index if not exists idx_gastos_operativos_categoria_id on public.gastos_operativos(categoria_id);
create index if not exists idx_gastos_operativos_creado_por on public.gastos_operativos(creado_por);
create index if not exists idx_lotes_finca_id on public.lotes(finca_id);
create index if not exists idx_lotes_perfil_tueste_id on public.lotes(perfil_tueste_id);
create index if not exists idx_lotes_proceso_beneficiado_id on public.lotes(proceso_beneficiado_id);
create index if not exists idx_lotes_proveedor_id on public.lotes(proveedor_id);
create index if not exists idx_lotes_servicio_orden_servicio_id on public.lotes_servicio(orden_servicio_id);
create index if not exists idx_lotes_servicio_perfil_tueste_id on public.lotes_servicio(perfil_tueste_id);
create index if not exists idx_lotes_servicio_proceso_beneficiado_id on public.lotes_servicio(proceso_beneficiado_id);
create index if not exists idx_lotes_variedad_id on public.lotes(variedad_id);
create index if not exists idx_ordenes_proceso_lote_destino_id on public.ordenes_proceso(lote_destino_id);
create index if not exists idx_ordenes_proceso_lote_origen_id on public.ordenes_proceso(lote_origen_id);
create index if not exists idx_ordenes_proceso_proceso_beneficiado_id on public.ordenes_proceso(proceso_beneficiado_id);
create index if not exists idx_ordenes_proceso_usuario_id on public.ordenes_proceso(usuario_id);
create index if not exists idx_ordenes_servicio_cliente_id on public.ordenes_servicio(cliente_id);
create index if not exists idx_ordenes_servicio_creado_por on public.ordenes_servicio(creado_por);
create index if not exists idx_pasos_servicio_lote_servicio_destino_id on public.pasos_servicio(lote_servicio_destino_id);
create index if not exists idx_pasos_servicio_lote_servicio_origen_id on public.pasos_servicio(lote_servicio_origen_id);
create index if not exists idx_pasos_servicio_usuario_id on public.pasos_servicio(usuario_id);
create index if not exists idx_pedido_items_articulo_id on public.pedido_items(articulo_id);
create index if not exists idx_pedido_items_lote_id on public.pedido_items(lote_id);
create index if not exists idx_pedido_items_pedido_id on public.pedido_items(pedido_id);
create index if not exists idx_pedidos_cliente_id on public.pedidos(cliente_id);
create index if not exists idx_pedidos_creado_por on public.pedidos(creado_por);
create index if not exists idx_pedidos_venta_id on public.pedidos(venta_id);
create index if not exists idx_presupuesto_items_presupuesto_id on public.presupuesto_items(presupuesto_id);
create index if not exists idx_presupuestos_servicio_cliente_id on public.presupuestos_servicio(cliente_id);
create index if not exists idx_presupuestos_servicio_creado_por on public.presupuestos_servicio(creado_por);
create index if not exists idx_presupuestos_servicio_orden_servicio_id on public.presupuestos_servicio(orden_servicio_id);
create index if not exists idx_presupuestos_servicio_proceso_beneficiado_id on public.presupuestos_servicio(proceso_beneficiado_id);
create index if not exists idx_venta_items_articulo_id on public.venta_items(articulo_id);
create index if not exists idx_venta_items_lote_id on public.venta_items(lote_id);
create index if not exists idx_venta_items_venta_id on public.venta_items(venta_id);
create index if not exists idx_ventas_cliente_id on public.ventas(cliente_id);
create index if not exists idx_ventas_creado_por on public.ventas(creado_por);
create index if not exists idx_ventas_pedido_id on public.ventas(pedido_id);

-- 2) Catálogos simples: toda página de catálogo hace
--    .eq("activo", true).order("nombre") (ver src/app/(app)/catalogos/*/page.tsx
--    y los selects de opciones en inventario/compras/servicios/presupuestos/pedidos).
--    Un índice parcial cubre filtro + orden en una sola pasada.
create index if not exists idx_variedades_nombre_activo on public.variedades(nombre) where activo;
create index if not exists idx_procesos_beneficiado_nombre_activo on public.procesos_beneficiado(nombre) where activo;
create index if not exists idx_perfiles_tueste_nombre_activo on public.perfiles_tueste(nombre) where activo;
create index if not exists idx_presentaciones_nombre_activo on public.presentaciones(nombre) where activo;
create index if not exists idx_proveedores_nombre_activo on public.proveedores(nombre) where activo;
create index if not exists idx_clientes_nombre_activo on public.clientes(nombre) where activo;
create index if not exists idx_fincas_nombre_activo on public.fincas(nombre) where activo;
create index if not exists idx_articulos_nombre_activo on public.articulos(nombre) where activo;
create index if not exists idx_categorias_gasto_nombre_activo on public.categorias_gasto(nombre) where activo;

-- 3) lotes: Inventario siempre filtra peso_actual_kg > 0 y ordena por
--    creado_en desc; etapa es un filtro opcional adicional.
create index if not exists idx_lotes_creado_en_con_peso on public.lotes(creado_en desc) where peso_actual_kg > 0;
create index if not exists idx_lotes_etapa on public.lotes(etapa);

-- 4) Reportes filtra ventas por estado_pago, con y sin rango de fecha.
create index if not exists idx_ventas_estado_pago_creado_en on public.ventas(estado_pago, creado_en);

-- 5) Reportes filtra por rango de fecha; las páginas propias ordenan por ella.
create index if not exists idx_compras_fecha_compra on public.compras(fecha_compra);
create index if not exists idx_gastos_operativos_fecha on public.gastos_operativos(fecha);
