import { createClient } from "@/lib/supabase/server";
import { ReportesMd3Cargador } from "@/features/reportes/reportes-md3-cargador";

function primerDiaDelMes(): string {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";
  const desde = uno(params.desde) || primerDiaDelMes();
  const hasta = uno(params.hasta) || hoyISO();

  const supabase = await createClient();

  const [
    { data: ventasPagadas },
    { data: ventasPendientes },
    { data: pasosServicio },
    { data: compras },
    { data: gastosOperativos },
  ] = await Promise.all([
    supabase
      .from("ventas")
      .select("id, venta_items(subtotal)")
      .eq("estado_pago", "pagado")
      .gte("creado_en", `${desde}T00:00:00`)
      .lte("creado_en", `${hasta}T23:59:59`),
    supabase.from("ventas").select("id, venta_items(subtotal)").eq("estado_pago", "pendiente"),
    supabase
      .from("pasos_servicio")
      .select(
        "id, costo_total, creado_en, lote_origen:lotes_servicio!pasos_servicio_lote_servicio_origen_id_fkey(orden_servicio_id, orden:ordenes_servicio(estado_pago))",
      ),
    supabase
      .from("compras")
      .select("id, tipo_compra, costo_total, fecha_compra")
      .gte("fecha_compra", desde)
      .lte("fecha_compra", hasta),
    supabase
      .from("gastos_operativos")
      .select("id, monto, fecha, categoria:categorias_gasto(nombre)")
      .gte("fecha", desde)
      .lte("fecha", hasta),
  ]);

  const sumarVenta = (v: { venta_items: { subtotal: number | null }[] | null }) =>
    (v.venta_items ?? []).reduce((acc, item) => acc + Number(item.subtotal ?? 0), 0);

  const totalVentasPagadas = (ventasPagadas ?? []).reduce((acc, v) => acc + sumarVenta(v), 0);
  const ventasPendientesLista = ventasPendientes ?? [];
  const montoVentasPendientes = ventasPendientesLista.reduce((acc, v) => acc + sumarVenta(v), 0);

  const pasosEnRango = (pasosServicio ?? []).filter(
    (p) => p.creado_en >= `${desde}T00:00:00` && p.creado_en <= `${hasta}T23:59:59`,
  );
  const totalServiciosPagados = pasosEnRango
    .filter((p) => p.lote_origen?.orden?.estado_pago === "pagado")
    .reduce((acc, p) => acc + Number(p.costo_total ?? 0), 0);

  const pasosPendientes = (pasosServicio ?? []).filter((p) => p.lote_origen?.orden?.estado_pago === "pendiente");
  const ordenesPendientesIds = new Set(pasosPendientes.map((p) => p.lote_origen?.orden_servicio_id).filter(Boolean));
  const montoServiciosPendientes = pasosPendientes.reduce((acc, p) => acc + Number(p.costo_total ?? 0), 0);

  const gastosPorTipo = { lote: 0, insumo: 0, producto_terminado: 0 };
  for (const c of compras ?? []) {
    if (c.tipo_compra in gastosPorTipo) {
      gastosPorTipo[c.tipo_compra as keyof typeof gastosPorTipo] += Number(c.costo_total ?? 0);
    }
  }
  const totalGastosCompras = gastosPorTipo.lote + gastosPorTipo.insumo + gastosPorTipo.producto_terminado;

  const gastosOperativosPorCategoria = new Map<string, number>();
  for (const g of gastosOperativos ?? []) {
    const nombre = g.categoria?.nombre ?? "Sin categoría";
    gastosOperativosPorCategoria.set(nombre, (gastosOperativosPorCategoria.get(nombre) ?? 0) + Number(g.monto ?? 0));
  }
  const totalGastosOperativos = [...gastosOperativosPorCategoria.values()].reduce((acc, v) => acc + v, 0);

  const totalGastos = totalGastosCompras + totalGastosOperativos;
  const totalIngresos = totalVentasPagadas + totalServiciosPagados;

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <ReportesMd3Cargador
        desde={desde}
        hasta={hasta}
        ingresos={{ ventas: totalVentasPagadas, servicios: totalServiciosPagados, total: totalIngresos }}
        gastos={{
          ...gastosPorTipo,
          operativos: [...gastosOperativosPorCategoria.entries()].map(([categoria, monto]) => ({ categoria, monto })),
          total: totalGastos,
        }}
        resultadoCaja={totalIngresos - totalGastos}
        pendientes={{
          ventas: { cantidad: ventasPendientesLista.length, monto: montoVentasPendientes },
          servicios: { cantidad: ordenesPendientesIds.size, monto: montoServiciosPendientes },
        }}
      />
    </main>
  );
}
