import { createClient } from "@/lib/supabase/server";
import { obtenerRolActual } from "@/lib/session";
import { SimpleCatalogoCargador } from "@/features/catalogos/simple-catalogo-cargador";
import { VolverACatalogos } from "@/features/catalogos/volver-catalogos";

export default async function PresentacionesPage() {
  const supabase = await createClient();
  const [{ data: filas }, rol] = await Promise.all([
    supabase.from("presentaciones").select("*").order("nombre"),
    obtenerRolActual(),
  ]);

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <VolverACatalogos />
      <SimpleCatalogoCargador
        tabla="presentaciones"
        titulo="Presentaciones"
        campos={[
          { name: "nombre", label: "Nombre (ej. Bolsa 250g)", type: "text", requerido: true },
          { name: "peso_gramos", label: "Peso en gramos", type: "number" },
        ]}
        filasIniciales={filas ?? []}
        puedeEscribir={rol === "admin" || rol === "operador"}
        esAdmin={rol === "admin"}
      />
    </main>
  );
}
