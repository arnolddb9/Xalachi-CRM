import { createClient } from "@/lib/supabase/server";
import { obtenerRolActual } from "@/lib/session";
import { PedidosMd3Cargador } from "@/features/pedidos/pedidos-md3-cargador";

export default async function PedidosPage() {
  const supabase = await createClient();
  const [{ data: pedidos }, { data: clientes }, rol] = await Promise.all([
    supabase
      .from("pedidos")
      .select("id, estado, venta_id, creado_en, cliente:clientes(nombre), pedido_items(subtotal)")
      .order("creado_en", { ascending: false }),
    supabase.from("clientes").select("id, nombre").eq("activo", true).order("nombre"),
    obtenerRolActual(),
  ]);

  const pedidosConTotal = (pedidos ?? []).map((p) => ({
    ...p,
    total: (p.pedido_items ?? []).reduce((acc, item) => acc + Number(item.subtotal), 0),
  }));

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <PedidosMd3Cargador
        pedidos={pedidosConTotal}
        clientes={clientes ?? []}
        puedeEscribir={rol === "admin" || rol === "vendedor"}
        esAdmin={rol === "admin"}
      />
    </main>
  );
}
