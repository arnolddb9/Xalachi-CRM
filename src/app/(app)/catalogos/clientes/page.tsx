import { createClient } from "@/lib/supabase/server";
import { obtenerRolActual } from "@/lib/session";
import { SimpleCatalogoCargador } from "@/features/catalogos/simple-catalogo-cargador";
import { VolverACatalogos } from "@/features/catalogos/volver-catalogos";

export default async function ClientesPage() {
  const supabase = await createClient();
  const [{ data: filas }, rol] = await Promise.all([
    supabase.from("clientes").select("*").order("nombre"),
    obtenerRolActual(),
  ]);

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <VolverACatalogos />
      <SimpleCatalogoCargador
        tabla="clientes"
        titulo="Clientes"
        campos={[
          { name: "nombre", label: "Nombre", type: "text", requerido: true },
          {
            name: "tipo",
            label: "Tipo",
            type: "select",
            requerido: true,
            opciones: [
              { value: "menudeo", label: "Menudeo" },
              { value: "mayoreo", label: "Mayoreo" },
            ],
          },
          { name: "telefono", label: "Teléfono", type: "text" },
          { name: "email", label: "Correo", type: "text" },
          { name: "direccion", label: "Dirección", type: "textarea" },
          { name: "notas", label: "Notas", type: "textarea" },
        ]}
        filasIniciales={filas ?? []}
        puedeEscribir={rol === "admin" || rol === "vendedor"}
        esAdmin={rol === "admin"}
      />
    </main>
  );
}
