import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { obtenerRolActual } from "@/lib/session";
import { PresupuestoDetalleMd3Cargador } from "@/features/presupuestos/presupuesto-detalle-md3-cargador";

export default async function DetallePresupuestoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: presupuesto }, { data: items }, { data: configuracion }, rol] = await Promise.all([
    supabase
      .from("presupuestos_servicio")
      .select(
        "id, etapa_entrada, cantidad_kg, cantidad_cajuelas, estado, orden_servicio_id, notas, cliente:clientes(nombre), proceso_beneficiado:procesos_beneficiado(nombre)",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("presupuesto_items")
      .select("id, tipo_proceso, kg_estimado, tarifa_kg, costo_estimado, creado_en")
      .eq("presupuesto_id", id)
      .order("creado_en"),
    supabase.from("configuracion").select("factor_kg_por_cajuela").eq("id", 1).single(),
    obtenerRolActual(),
  ]);

  if (!presupuesto) notFound();

  const pesoEstimadoCereza = presupuesto.cantidad_cajuelas
    ? Number(presupuesto.cantidad_cajuelas) * Number(configuracion?.factor_kg_por_cajuela ?? 1)
    : null;

  const costoTotal = (items ?? []).reduce((acc, item) => acc + Number(item.costo_estimado), 0);
  const puedeEscribir = (rol === "admin" || rol === "vendedor") && presupuesto.estado === "borrador";

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <PresupuestoDetalleMd3Cargador
        presupuestoId={id}
        clienteNombre={presupuesto.cliente?.nombre ?? "cliente"}
        etapaEntrada={presupuesto.etapa_entrada}
        cantidadKg={presupuesto.cantidad_kg !== null ? Number(presupuesto.cantidad_kg) : null}
        cantidadCajuelas={presupuesto.cantidad_cajuelas !== null ? Number(presupuesto.cantidad_cajuelas) : null}
        procesoBeneficiadoNombre={presupuesto.proceso_beneficiado?.nombre ?? null}
        notas={presupuesto.notas}
        estado={presupuesto.estado}
        ordenServicioId={presupuesto.orden_servicio_id}
        puedeEscribir={puedeEscribir}
        pesoEstimadoCereza={pesoEstimadoCereza}
        items={(items ?? []).map((item) => ({
          id: item.id,
          tipo_proceso: item.tipo_proceso,
          kg_estimado: Number(item.kg_estimado),
          tarifa_kg: Number(item.tarifa_kg),
          costo_estimado: Number(item.costo_estimado),
        }))}
        costoTotal={costoTotal}
      />
    </main>
  );
}
