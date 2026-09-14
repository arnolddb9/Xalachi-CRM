import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { obtenerRolActual } from "@/lib/session";
import { obtenerHistorialLote } from "@/features/inventario/historial";
import { HistorialArbol } from "@/features/inventario/historial-arbol";

export default async function HistorialLotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [historial, rol] = await Promise.all([obtenerHistorialLote(supabase, id), obtenerRolActual()]);

  if (!historial) notFound();

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <Link
        href="/inventario"
        className="text-primary mb-3 inline-flex min-h-9 items-center gap-1.5 text-sm font-medium hover:underline"
      >
        <ArrowLeft size={16} />
        Volver a inventario
      </Link>
      <h1 className="mb-1 text-lg font-semibold text-zinc-900">Historial del lote</h1>
      <p className="mb-4 text-sm text-zinc-500">
        Desde la recepción hasta el estado actual, con cada proceso y su merma.
      </p>
      <HistorialArbol nodo={historial} esAdmin={rol === "admin"} />
    </main>
  );
}
