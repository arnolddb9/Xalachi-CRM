import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { obtenerRolActual } from "@/lib/session";
import { PasosBeneficiadoCargador } from "@/features/catalogos/pasos-beneficiado-cargador";
import { VolverACatalogos } from "@/features/catalogos/volver-catalogos";

export default async function ProcesoBeneficiadoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: proceso }, { data: pasos }, rol] = await Promise.all([
    supabase.from("procesos_beneficiado").select("id, nombre").eq("id", id).single(),
    supabase.from("pasos_beneficiado").select("id, orden, nombre").eq("proceso_beneficiado_id", id).order("orden"),
    obtenerRolActual(),
  ]);

  if (!proceso) notFound();

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <VolverACatalogos href="/catalogos/procesos" label="Volver a procesos de beneficiado" />
      <h1 className="mb-1 text-lg font-semibold text-zinc-900">{proceso.nombre}</h1>
      <p className="mb-4 text-sm text-zinc-500">
        Secuencia de pasos entre cereza y pergamino para este proceso de beneficiado.
      </p>
      <PasosBeneficiadoCargador
        procesoBeneficiadoId={id}
        pasos={pasos ?? []}
        puedeEscribir={rol === "admin" || rol === "operador"}
      />
    </main>
  );
}
