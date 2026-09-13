import { createClient } from "@/lib/supabase/server";
import { obtenerRolActual } from "@/lib/session";
import { LotesTabla } from "@/features/inventario/lotes-tabla";

const ETAPAS_BASE = ["cereza", "pergamino", "verde"];

export default async function InventarioPage() {
  const supabase = await createClient();
  const [
    { data: lotes },
    { data: variedades },
    { data: proveedores },
    { data: procesos },
    { data: configuracion },
    rol,
  ] = await Promise.all([
    supabase
      .from("lotes")
      .select(
        "id, nombre, variedad_id, proveedor_id, etapa, peso_actual_kg, cantidad_cajuelas, fecha_cosecha, calidad, variedad:variedades(nombre), proveedor:proveedores(nombre)",
      )
      .gt("peso_actual_kg", 0)
      .order("creado_en", { ascending: false }),
    supabase.from("variedades").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("proveedores").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("procesos_beneficiado").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("configuracion").select("factor_kg_por_cajuela").eq("id", 1).single(),
    obtenerRolActual(),
  ]);

  const totalKg = (etapaFiltro: (etapa: string) => boolean) =>
    (lotes ?? [])
      .filter((l) => etapaFiltro(l.etapa))
      .reduce((acc, l) => acc + Number(l.peso_actual_kg), 0);

  const resumenPorEtapa = [
    { etiqueta: "Cereza", totalKg: totalKg((e) => e === "cereza") },
    { etiqueta: "En beneficiado", totalKg: totalKg((e) => !ETAPAS_BASE.includes(e)) },
    { etiqueta: "Pergamino", totalKg: totalKg((e) => e === "pergamino") },
    { etiqueta: "Verde", totalKg: totalKg((e) => e === "verde") },
  ];

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <h1 className="mb-4 text-lg font-semibold text-zinc-900">Inventario y Lotes</h1>
      <LotesTabla
        lotes={lotes ?? []}
        resumenPorEtapa={resumenPorEtapa}
        variedades={variedades ?? []}
        proveedores={proveedores ?? []}
        procesosBeneficiado={procesos ?? []}
        factorCajuela={Number(configuracion?.factor_kg_por_cajuela ?? 13.6)}
        puedeEscribir={rol === "admin" || rol === "operador"}
        esAdmin={rol === "admin"}
      />
    </main>
  );
}
