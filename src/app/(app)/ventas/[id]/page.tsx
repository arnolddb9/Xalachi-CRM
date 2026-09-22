import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VentaDetalleMd3Cargador } from "@/features/ventas/venta-detalle-md3-cargador";

const ETAPA_LABEL: Record<string, string> = {
  cereza: "Cereza",
  pergamino: "Pergamino",
  verde: "Verde",
  tostado: "Tostado",
  molido: "Molido",
};

export default async function DetalleVentaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: venta }, { data: items }] = await Promise.all([
    supabase
      .from("ventas")
      .select("id, estado_pago, pedido_id, notas, creado_en, cliente:clientes(nombre)")
      .eq("id", id)
      .single(),
    supabase
      .from("venta_items")
      .select(
        "id, tipo_item, cantidad, precio_unitario, subtotal, articulo:articulos(nombre, unidad_medida), lote:lotes(nombre, etapa, variedad:variedades(nombre))",
      )
      .eq("venta_id", id)
      .order("creado_en"),
  ]);

  if (!venta) notFound();

  const total = (items ?? []).reduce((acc, item) => acc + Number(item.subtotal), 0);

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <VentaDetalleMd3Cargador
        clienteNombre={venta.cliente?.nombre ?? "cliente"}
        estadoPago={venta.estado_pago}
        notas={venta.notas}
        pedidoId={venta.pedido_id}
        items={(items ?? []).map((item) => ({
          id: item.id,
          descripcion:
            item.tipo_item === "producto"
              ? (item.articulo?.nombre ?? "Producto")
              : `${item.lote?.nombre ?? item.lote?.variedad?.nombre ?? "Lote"} (${ETAPA_LABEL[item.lote?.etapa ?? ""] ?? item.lote?.etapa ?? ""})`,
          unidad: item.tipo_item === "producto" ? (item.articulo?.unidad_medida ?? "unidad") : "kg",
          cantidad: Number(item.cantidad),
          precio_unitario: Number(item.precio_unitario),
          subtotal: Number(item.subtotal),
        }))}
        total={total}
      />
    </main>
  );
}
