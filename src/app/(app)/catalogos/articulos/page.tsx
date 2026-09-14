import { createClient } from "@/lib/supabase/server";
import { obtenerRolActual } from "@/lib/session";
import { SimpleCatalogo } from "@/features/catalogos/simple-catalogo";
import { VolverACatalogos } from "@/features/catalogos/volver-catalogos";

export default async function ArticulosPage() {
  const supabase = await createClient();
  const [{ data: filas }, rol] = await Promise.all([
    supabase.from("articulos").select("*").order("nombre"),
    obtenerRolActual(),
  ]);

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <VolverACatalogos />
      <h1 className="mb-4 text-lg font-semibold text-zinc-900">Insumos y productos</h1>
      <SimpleCatalogo
        tabla="articulos"
        titulo="Artículos"
        campos={[
          { name: "nombre", label: "Nombre", type: "text", requerido: true },
          {
            name: "tipo",
            label: "Tipo",
            type: "select",
            requerido: true,
            opciones: [
              { value: "insumo", label: "Insumo" },
              { value: "producto_terminado", label: "Producto terminado" },
            ],
          },
          { name: "unidad_medida", label: "Unidad de medida", type: "text", requerido: true },
        ]}
        filasIniciales={filas ?? []}
        puedeEscribir={rol === "admin" || rol === "operador"}
        esAdmin={rol === "admin"}
      />
    </main>
  );
}
