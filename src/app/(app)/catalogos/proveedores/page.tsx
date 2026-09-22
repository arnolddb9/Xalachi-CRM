import { createClient } from "@/lib/supabase/server";
import { obtenerRolActual } from "@/lib/session";
import { SimpleCatalogoCargador } from "@/features/catalogos/simple-catalogo-cargador";
import { VolverACatalogos } from "@/features/catalogos/volver-catalogos";

export default async function ProveedoresPage() {
  const supabase = await createClient();
  const [{ data: filas }, rol] = await Promise.all([
    supabase.from("proveedores").select("*").order("nombre"),
    obtenerRolActual(),
  ]);

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <VolverACatalogos />
      <SimpleCatalogoCargador
        tabla="proveedores"
        titulo="Proveedores"
        campos={[
          { name: "nombre", label: "Nombre", type: "text", requerido: true },
          { name: "telefono", label: "Teléfono", type: "text" },
          { name: "email", label: "Correo", type: "text" },
          { name: "direccion", label: "Dirección", type: "textarea" },
          { name: "notas", label: "Notas", type: "textarea" },
        ]}
        filasIniciales={filas ?? []}
        puedeEscribir={rol === "admin"}
        esAdmin={rol === "admin"}
      />
    </main>
  );
}
