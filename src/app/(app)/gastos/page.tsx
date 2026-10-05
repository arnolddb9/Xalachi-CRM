import { createClient } from "@/lib/supabase/server";
import { obtenerRolActual } from "@/lib/session";
import { GastosMd3Cargador } from "@/features/gastos/gastos-md3-cargador";

export default async function GastosPage() {
  const supabase = await createClient();
  const [{ data: gastos }, { data: categorias }, rol] = await Promise.all([
    supabase
      .from("gastos_operativos")
      .select("id, descripcion, monto, fecha, numero_factura, categoria:categorias_gasto(nombre)")
      .order("fecha", { ascending: false }),
    supabase.from("categorias_gasto").select("id, nombre").eq("activo", true).order("nombre"),
    obtenerRolActual(),
  ]);

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <GastosMd3Cargador
        gastos={(gastos ?? []).map((g) => ({ ...g, monto: Number(g.monto) }))}
        categorias={categorias ?? []}
        puedeEscribir={rol === "admin"}
        esAdmin={rol === "admin"}
      />
    </main>
  );
}
