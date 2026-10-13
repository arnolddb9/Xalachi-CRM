import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { obtenerRolActual } from "@/lib/session";
import { RecetaInsumosCargador } from "@/features/catalogos/receta-insumos-cargador";
import { VolverACatalogos } from "@/features/catalogos/volver-catalogos";

export default async function ArticuloDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: articulo }, { data: items }, { data: insumos }, rol] = await Promise.all([
    supabase.from("articulos").select("id, nombre, tipo").eq("id", id).single(),
    supabase
      .from("articulo_insumos")
      .select("id, insumo_articulo_id, cantidad_por_unidad, insumo:articulos!articulo_insumos_insumo_articulo_id_fkey(nombre, unidad_medida)")
      .eq("articulo_id", id)
      .order("creado_en"),
    supabase.from("articulos").select("id, nombre, unidad_medida").eq("tipo", "insumo").eq("activo", true).order("nombre"),
    obtenerRolActual(),
  ]);

  if (!articulo || articulo.tipo !== "producto_terminado") notFound();

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <VolverACatalogos href="/catalogos/articulos" label="Volver a artículos" />
      <h1 className="mb-1 text-lg font-semibold text-zinc-900">{articulo.nombre}</h1>
      <p className="mb-4 text-sm text-zinc-500">
        Insumos que se descuentan automáticamente al empacar este producto.
      </p>
      <RecetaInsumosCargador
        articuloId={id}
        items={items ?? []}
        insumosDisponibles={insumos ?? []}
        puedeEscribir={rol === "admin" || rol === "operador"}
      />
    </main>
  );
}
