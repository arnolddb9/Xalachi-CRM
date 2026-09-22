import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { obtenerRolActual } from "@/lib/session";
import { obtenerArbolServicio } from "@/features/servicios/arbol";
import { ServicioDetalleMd3Cargador } from "@/features/servicios/servicio-detalle-md3-cargador";

export default async function DetalleOrdenServicioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: orden }, { data: lotesServicio }, { data: perfilesTueste }, rol] = await Promise.all([
    supabase
      .from("ordenes_servicio")
      .select("id, etapa_entrada, cantidad_kg, estado, fecha_recepcion, fecha_entrega, notas, cliente:clientes(nombre)")
      .eq("id", id)
      .single(),
    supabase.from("lotes_servicio").select("id").eq("orden_servicio_id", id),
    supabase.from("perfiles_tueste").select("id, nombre").eq("activo", true).order("nombre"),
    obtenerRolActual(),
  ]);

  if (!orden) notFound();

  const loteIds = (lotesServicio ?? []).map((l) => l.id);
  const [arbol, { data: pasos }] = await Promise.all([
    obtenerArbolServicio(supabase, id),
    loteIds.length > 0
      ? supabase
          .from("pasos_servicio")
          .select("id, tipo_proceso, peso_procesado_kg, tarifa_kg, costo_total, creado_en")
          .in("lote_servicio_origen_id", loteIds)
          .order("creado_en")
      : Promise.resolve({ data: [] as { id: string; tipo_proceso: string; peso_procesado_kg: number; tarifa_kg: number; costo_total: number; creado_en: string }[] }),
  ]);

  const costoTotal = (pasos ?? []).reduce((acc, p) => acc + Number(p.costo_total), 0);
  const puedeEscribir = rol === "admin" || rol === "vendedor";

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <ServicioDetalleMd3Cargador
        clienteNombre={orden.cliente?.nombre ?? "cliente"}
        etapaEntrada={orden.etapa_entrada}
        cantidadKg={Number(orden.cantidad_kg)}
        fechaRecepcion={orden.fecha_recepcion}
        notas={orden.notas}
        arbol={arbol}
        perfilesTueste={perfilesTueste ?? []}
        puedeEscribir={puedeEscribir}
        pasos={(pasos ?? []).map((p) => ({
          id: p.id,
          tipo_proceso: p.tipo_proceso,
          peso_procesado_kg: Number(p.peso_procesado_kg),
          tarifa_kg: Number(p.tarifa_kg),
          costo_total: Number(p.costo_total),
        }))}
        costoTotal={costoTotal}
      />
    </main>
  );
}
