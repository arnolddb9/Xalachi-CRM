import { createClient } from "@/lib/supabase/server";
import { obtenerRolActual } from "@/lib/session";
import { SimpleCatalogoCargador } from "@/features/catalogos/simple-catalogo-cargador";
import { VolverACatalogos } from "@/features/catalogos/volver-catalogos";

export default async function PerfilesTuestePage() {
  const supabase = await createClient();
  const [{ data: filas }, rol] = await Promise.all([
    supabase.from("perfiles_tueste").select("*").order("nombre"),
    obtenerRolActual(),
  ]);

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <VolverACatalogos />
      <SimpleCatalogoCargador
        tabla="perfiles_tueste"
        titulo="Perfiles de tueste"
        campos={[
          { name: "nombre", label: "Nombre", type: "text", requerido: true },
          {
            name: "nivel",
            label: "Nivel",
            type: "select",
            requerido: true,
            opciones: [
              { value: "claro", label: "Claro" },
              { value: "medio", label: "Medio" },
              { value: "oscuro", label: "Oscuro" },
            ],
          },
          { name: "descripcion", label: "Descripción", type: "textarea" },
        ]}
        filasIniciales={filas ?? []}
        puedeEscribir={rol === "admin" || rol === "operador"}
        esAdmin={rol === "admin"}
      />
    </main>
  );
}
