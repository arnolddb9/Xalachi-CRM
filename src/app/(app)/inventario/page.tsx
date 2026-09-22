import { createClient } from "@/lib/supabase/server";
import { obtenerRolActual } from "@/lib/session";
import { InventarioMd3Cargador } from "@/features/inventario/inventario-md3-cargador";

const ETAPAS_CONOCIDAS = ["cereza", "pergamino", "verde", "tostado", "molido"];

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";
  const finca_id = uno(params.finca_id);
  const variedad_id = uno(params.variedad_id);
  const proceso_beneficiado_id = uno(params.proceso_beneficiado_id);
  const proveedor_id = uno(params.proveedor_id);
  const etapa = uno(params.etapa);
  const desde = uno(params.desde);
  const hasta = uno(params.hasta);

  const supabase = await createClient();

  let consulta = supabase
    .from("lotes")
    .select(
      "id, nombre, variedad_id, proveedor_id, finca_id, numero_cama_secado, etapa, peso_actual_kg, cantidad_cajuelas, fecha_cosecha, calidad, variedad:variedades(nombre), proveedor:proveedores(nombre), finca:fincas(nombre), perfil_tueste:perfiles_tueste(nombre)",
    )
    .gt("peso_actual_kg", 0)
    .order("creado_en", { ascending: false });

  if (finca_id) consulta = consulta.eq("finca_id", finca_id);
  if (variedad_id) consulta = consulta.eq("variedad_id", variedad_id);
  if (proceso_beneficiado_id) consulta = consulta.eq("proceso_beneficiado_id", proceso_beneficiado_id);
  if (proveedor_id) consulta = consulta.eq("proveedor_id", proveedor_id);
  if (etapa) consulta = consulta.eq("etapa", etapa);
  if (desde) consulta = consulta.gte("fecha_cosecha", desde);
  if (hasta) consulta = consulta.lte("fecha_cosecha", hasta);

  const [
    { data: lotes },
    { data: variedades },
    { data: proveedores },
    { data: fincas },
    { data: procesos },
    { data: perfilesTueste },
    { data: presentaciones },
    { data: configuracion },
    { data: articulos },
    rol,
  ] = await Promise.all([
    consulta,
    supabase.from("variedades").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("proveedores").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("fincas").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("procesos_beneficiado").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("perfiles_tueste").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("presentaciones").select("id, nombre, peso_gramos").eq("activo", true).order("nombre"),
    supabase.from("configuracion").select("factor_kg_por_cajuela").eq("id", 1).single(),
    supabase
      .from("articulos")
      .select("id, nombre, tipo, unidad_medida, stock_actual, precio_venta")
      .eq("activo", true)
      .order("nombre"),
    obtenerRolActual(),
  ]);

  const totalKg = (etapaFiltro: (etapa: string) => boolean) =>
    (lotes ?? []).filter((l) => etapaFiltro(l.etapa)).reduce((acc, l) => acc + Number(l.peso_actual_kg), 0);

  const resumenPorEtapa = [
    { etiqueta: "Cereza", totalKg: totalKg((e) => e === "cereza") },
    { etiqueta: "En beneficiado", totalKg: totalKg((e) => !ETAPAS_CONOCIDAS.includes(e)) },
    { etiqueta: "Pergamino", totalKg: totalKg((e) => e === "pergamino") },
    { etiqueta: "Verde", totalKg: totalKg((e) => e === "verde") },
    { etiqueta: "Tostado", totalKg: totalKg((e) => e === "tostado") },
    { etiqueta: "Molido", totalKg: totalKg((e) => e === "molido") },
  ];

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <InventarioMd3Cargador
        lotes={(lotes ?? []).map((l) => ({ ...l, peso_actual_kg: Number(l.peso_actual_kg) }))}
        resumenPorEtapa={resumenPorEtapa}
        variedades={variedades ?? []}
        proveedores={proveedores ?? []}
        fincas={fincas ?? []}
        procesosBeneficiado={procesos ?? []}
        perfilesTueste={perfilesTueste ?? []}
        articulos={(articulos ?? []).map((a) => ({
          ...a,
          stock_actual: Number(a.stock_actual),
          precio_venta: Number(a.precio_venta),
        }))}
        presentaciones={presentaciones ?? []}
        factorCajuela={Number(configuracion?.factor_kg_por_cajuela ?? 13.6)}
        puedeEscribir={rol === "admin" || rol === "operador"}
        esAdmin={rol === "admin"}
        valoresFiltroIniciales={{ finca_id, variedad_id, proceso_beneficiado_id, proveedor_id, etapa, desde, hasta }}
      />
    </main>
  );
}
