import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { obtenerRolActual } from "@/lib/session";
import { PedidoDetalleMd3Cargador } from "@/features/pedidos/pedido-detalle-md3-cargador";

const ETAPA_LABEL: Record<string, string> = {
  cereza: "Cereza",
  pergamino: "Pergamino",
  verde: "Verde",
  tostado: "Tostado",
  molido: "Molido",
};

export default async function DetallePedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: pedido }, { data: items }, { data: productos }, { data: lotes }, rol] = await Promise.all([
    supabase
      .from("pedidos")
      .select("id, estado, venta_id, notas, cliente:clientes(nombre)")
      .eq("id", id)
      .single(),
    supabase
      .from("pedido_items")
      .select(
        "id, tipo_item, cantidad, precio_unitario, motivo_cambio_precio, subtotal, creado_en, articulo:articulos(nombre, unidad_medida), lote:lotes(nombre, etapa, variedad:variedades(nombre))",
      )
      .eq("pedido_id", id)
      .order("creado_en"),
    supabase
      .from("articulos")
      .select("id, nombre, unidad_medida, precio_venta")
      .eq("tipo", "producto_terminado")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("lotes")
      .select("id, nombre, etapa, peso_actual_kg, variedad:variedades(nombre)")
      .gt("peso_actual_kg", 0)
      .order("creado_en", { ascending: false }),
    obtenerRolActual(),
  ]);

  if (!pedido) notFound();

  const costoTotal = (items ?? []).reduce((acc, item) => acc + Number(item.subtotal), 0);
  const puedeEscribir = (rol === "admin" || rol === "vendedor") && pedido.estado === "borrador";

  const lotesDisponibles = (lotes ?? []).map((l) => ({
    id: l.id,
    peso_actual_kg: Number(l.peso_actual_kg),
    etiqueta: `${l.nombre ?? l.variedad?.nombre ?? "Lote"} · ${ETAPA_LABEL[l.etapa] ?? l.etapa} · ${l.peso_actual_kg} kg disponibles`,
  }));

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <PedidoDetalleMd3Cargador
        pedidoId={id}
        clienteNombre={pedido.cliente?.nombre ?? "cliente"}
        notas={pedido.notas}
        estado={pedido.estado}
        ventaId={pedido.venta_id}
        puedeEscribir={puedeEscribir}
        productos={(productos ?? []).map((p) => ({ ...p, precio_venta: Number(p.precio_venta) }))}
        lotes={lotesDisponibles}
        items={(items ?? []).map((item) => ({
          id: item.id,
          descripcion:
            item.tipo_item === "producto"
              ? (item.articulo?.nombre ?? "Producto")
              : `${item.lote?.nombre ?? item.lote?.variedad?.nombre ?? "Lote"} (${ETAPA_LABEL[item.lote?.etapa ?? ""] ?? item.lote?.etapa ?? ""})`,
          unidad: item.tipo_item === "producto" ? (item.articulo?.unidad_medida ?? "unidad") : "kg",
          cantidad: Number(item.cantidad),
          precio_unitario: Number(item.precio_unitario),
          motivo_cambio_precio: item.motivo_cambio_precio,
          subtotal: Number(item.subtotal),
        }))}
        costoTotal={costoTotal}
      />
    </main>
  );
}
