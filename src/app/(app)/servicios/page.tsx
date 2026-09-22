import { createClient } from "@/lib/supabase/server";
import { obtenerRolActual } from "@/lib/session";
import { ServiciosMd3Cargador } from "@/features/servicios/servicios-md3-cargador";

export default async function ServiciosPage() {
  const supabase = await createClient();
  const [{ data: ordenes }, { data: clientes }, { data: procesosBeneficiado }, { data: configuracion }, { data: tarifas }, rol] =
    await Promise.all([
      supabase
        .from("ordenes_servicio")
        .select("id, etapa_entrada, cantidad_kg, estado, fecha_recepcion, fecha_entrega, notas, cliente:clientes(nombre)")
        .order("fecha_recepcion", { ascending: false }),
      supabase.from("clientes").select("id, nombre").eq("activo", true).order("nombre"),
      supabase.from("procesos_beneficiado").select("id, nombre").eq("activo", true).order("nombre"),
      supabase.from("configuracion").select("factor_kg_por_cajuela").eq("id", 1).single(),
      supabase.from("tarifas_servicio").select("tipo_servicio, tarifa_kg"),
      obtenerRolActual(),
    ]);

  const tarifasPorTipo = {
    pelado: 0,
    clasificacion: 0,
    tueste: 0,
    molido: 0,
    beneficiado: 0,
  };
  for (const t of tarifas ?? []) {
    if (t.tipo_servicio in tarifasPorTipo) {
      tarifasPorTipo[t.tipo_servicio as keyof typeof tarifasPorTipo] = Number(t.tarifa_kg);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <ServiciosMd3Cargador
        ordenes={(ordenes ?? []).map((o) => ({ ...o, cantidad_kg: Number(o.cantidad_kg) }))}
        clientes={clientes ?? []}
        procesosBeneficiado={procesosBeneficiado ?? []}
        factorCajuela={Number(configuracion?.factor_kg_por_cajuela ?? 13.6)}
        tarifas={tarifasPorTipo}
        puedeEscribir={rol === "admin" || rol === "vendedor"}
        esAdmin={rol === "admin"}
      />
    </main>
  );
}
