import { createClient } from "@/lib/supabase/server";
import { obtenerRolActual } from "@/lib/session";
import { SimpleCatalogo } from "@/features/catalogos/simple-catalogo";
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
      <h1 className="mb-4 text-lg font-semibold text-zinc-900">Perfiles de tueste</h1>
      <SimpleCatalogo
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
