import { createClient } from "@/lib/supabase/server";
import { obtenerRolActual } from "@/lib/session";
import { SimpleCatalogo } from "@/features/catalogos/simple-catalogo";
import { VolverACatalogos } from "@/features/catalogos/volver-catalogos";

export default async function ProcesosBeneficiadoPage() {
  const supabase = await createClient();
  const [{ data: filas }, rol] = await Promise.all([
    supabase.from("procesos_beneficiado").select("*").order("nombre"),
    obtenerRolActual(),
  ]);

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <VolverACatalogos />
      <h1 className="mb-4 text-lg font-semibold text-zinc-900">Procesos de beneficiado</h1>
      <SimpleCatalogo
        tabla="procesos_beneficiado"
        titulo="Procesos"
        campos={[
          { name: "nombre", label: "Nombre", type: "text", requerido: true },
          { name: "descripcion", label: "Descripción", type: "textarea" },
        ]}
        filasIniciales={filas ?? []}
        puedeEscribir={rol === "admin" || rol === "operador"}
        esAdmin={rol === "admin"}
        verDetallePrefijo="/catalogos/procesos"
      />
    </main>
  );
}
