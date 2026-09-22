import { createClient } from "@/lib/supabase/server";
import { obtenerRolActual } from "@/lib/session";
import { VentasMd3Cargador } from "@/features/ventas/ventas-md3-cargador";

export default async function VentasPage() {
  const supabase = await createClient();
  const [{ data: ventas }, rol] = await Promise.all([
    supabase
      .from("ventas")
      .select("id, estado_pago, creado_en, cliente:clientes(nombre), venta_items(subtotal)")
      .order("creado_en", { ascending: false }),
    obtenerRolActual(),
  ]);

  const ventasConTotal = (ventas ?? []).map((v) => ({
    ...v,
    total: (v.venta_items ?? []).reduce((acc, item) => acc + Number(item.subtotal), 0),
  }));

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <VentasMd3Cargador ventas={ventasConTotal} puedeEscribir={rol === "admin" || rol === "vendedor"} esAdmin={rol === "admin"} />
    </main>
  );
}
