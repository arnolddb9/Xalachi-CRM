import { createClient } from "@/lib/supabase/server";
import { obtenerRolActual } from "@/lib/session";
import { ComprasMd3Cargador } from "@/features/compras/compras-md3-cargador";

export default async function ComprasPage() {
  const supabase = await createClient();
  const [
    { data: compras },
    { data: variedades },
    { data: proveedores },
    { data: fincas },
    { data: configuracion },
    { data: articulos },
    rol,
  ] = await Promise.all([
    supabase
      .from("compras")
      .select(
        "id, tipo_compra, fecha_compra, costo_total, numero_factura, notas, cantidad, proveedor:proveedores(nombre), lote:lotes(id, nombre, etapa, peso_actual_kg, variedad:variedades(nombre)), articulo:articulos(nombre, unidad_medida)",
      )
      .order("fecha_compra", { ascending: false }),
    supabase.from("variedades").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("proveedores").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("fincas").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("configuracion").select("factor_kg_por_cajuela").eq("id", 1).single(),
    supabase.from("articulos").select("id, nombre, tipo").eq("activo", true).order("nombre"),
    obtenerRolActual(),
  ]);

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <ComprasMd3Cargador
        compras={(compras ?? []).map((c) => ({
          ...c,
          costo_total: c.costo_total !== null ? Number(c.costo_total) : null,
          cantidad: c.cantidad !== null ? Number(c.cantidad) : null,
          lote: c.lote ? { ...c.lote, peso_actual_kg: Number(c.lote.peso_actual_kg) } : null,
        }))}
        variedades={variedades ?? []}
        proveedores={proveedores ?? []}
        fincas={fincas ?? []}
        articulos={articulos ?? []}
        factorCajuela={Number(configuracion?.factor_kg_por_cajuela ?? 13.6)}
        esAdmin={rol === "admin"}
      />
    </main>
  );
}
