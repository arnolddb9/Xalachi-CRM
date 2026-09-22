import { createClient } from "@/lib/supabase/server";
import { obtenerRolActual } from "@/lib/session";
import { PresupuestosMd3Cargador } from "@/features/presupuestos/presupuestos-md3-cargador";

export default async function PresupuestosPage() {
  const supabase = await createClient();
  const [{ data: presupuestos }, { data: clientes }, { data: procesosBeneficiado }, { data: configuracion }, rol] =
    await Promise.all([
      supabase
        .from("presupuestos_servicio")
        .select(
          "id, etapa_entrada, cantidad_kg, cantidad_cajuelas, estado, orden_servicio_id, creado_en, cliente:clientes(nombre), presupuesto_items(costo_estimado)",
        )
        .order("creado_en", { ascending: false }),
      supabase.from("clientes").select("id, nombre").eq("activo", true).order("nombre"),
      supabase.from("procesos_beneficiado").select("id, nombre").eq("activo", true).order("nombre"),
      supabase.from("configuracion").select("factor_kg_por_cajuela").eq("id", 1).single(),
      obtenerRolActual(),
    ]);

  const presupuestosConTotal = (presupuestos ?? []).map((p) => ({
    ...p,
    cantidad_kg: p.cantidad_kg !== null ? Number(p.cantidad_kg) : null,
    cantidad_cajuelas: p.cantidad_cajuelas !== null ? Number(p.cantidad_cajuelas) : null,
    costoTotal: (p.presupuesto_items ?? []).reduce((acc, item) => acc + Number(item.costo_estimado), 0),
  }));

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <PresupuestosMd3Cargador
        presupuestos={presupuestosConTotal}
        clientes={clientes ?? []}
        procesosBeneficiado={procesosBeneficiado ?? []}
        factorCajuela={Number(configuracion?.factor_kg_por_cajuela ?? 1)}
        puedeEscribir={rol === "admin" || rol === "vendedor"}
        esAdmin={rol === "admin"}
      />
    </main>
  );
}
