import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type NodoHistorial = {
  lote: {
    id: string;
    nombre: string | null;
    etapa: string;
    peso_inicial_kg: number;
    peso_actual_kg: number;
    cantidad_cajuelas: number | null;
    calidad: string | null;
    fecha_cosecha: string | null;
    numero_cama_secado: string | null;
    variedad: { nombre: string } | null;
    proveedor: { nombre: string } | null;
    finca: { nombre: string } | null;
    perfil_tueste: { nombre: string } | null;
  };
  // El proceso que produjo este lote (ausente en la raíz, que se registró directo)
  procesoEntrada: {
    tipo_proceso: string;
    merma_pct: number;
    creado_en: string;
    proceso_beneficiado: { nombre: string } | null;
    usuario: { nombre: string } | null;
  } | null;
  // Empacados hechos directo desde este lote: no generan un lote hijo (M4),
  // así que se listan aparte en vez de como una rama del árbol.
  empacados: {
    id: string;
    unidades: number;
    peso_kg: number;
    creado_en: string;
    articulo: { nombre: string } | null;
    presentacion: { nombre: string } | null;
  }[];
  hijos: NodoHistorial[];
};

const SELECT_LOTE =
  "id, nombre, etapa, peso_inicial_kg, peso_actual_kg, cantidad_cajuelas, calidad, fecha_cosecha, numero_cama_secado, variedad:variedades(nombre), proveedor:proveedores(nombre), finca:fincas(nombre), perfil_tueste:perfiles_tueste(nombre)";

async function obtenerLote(supabase: SupabaseClient, loteId: string) {
  const { data } = await supabase.from("lotes").select(SELECT_LOTE).eq("id", loteId).single();
  return data;
}

export async function encontrarRaizLote(supabase: SupabaseClient, loteId: string): Promise<string> {
  let actual = loteId;
  // Cadena acotada (unos pocos pasos por diseño); una vuelta por nivel.
  for (let i = 0; i < 100; i++) {
    const { data } = await supabase
      .from("ordenes_proceso")
      .select("lote_origen_id")
      .eq("lote_destino_id", actual)
      .maybeSingle();
    if (!data) return actual;
    actual = data.lote_origen_id;
  }
  return actual;
}

async function obtenerProcesosSalida(supabase: SupabaseClient, loteId: string) {
  const { data } = await supabase
    .from("ordenes_proceso")
    .select(
      "lote_destino_id, tipo_proceso, merma_pct, creado_en, proceso_beneficiado:procesos_beneficiado(nombre), usuario:usuarios(nombre)",
    )
    .eq("lote_origen_id", loteId)
    .order("creado_en");
  return data ?? [];
}

async function obtenerEmpacados(supabase: SupabaseClient, loteId: string) {
  const { data } = await supabase
    .from("empacados")
    .select(
      "id, unidades, peso_kg, creado_en, articulo:articulos!empacados_articulo_id_fkey(nombre), presentacion:presentaciones(nombre)",
    )
    .eq("lote_origen_id", loteId)
    .order("creado_en");
  return data ?? [];
}

async function construirArbol(
  supabase: SupabaseClient,
  loteId: string,
  procesoEntrada: NodoHistorial["procesoEntrada"],
): Promise<NodoHistorial | null> {
  // El lote, sus procesos de salida y sus empacados no dependen entre sí: se
  // piden en paralelo en vez de uno tras otro (cada vuelta de la recursión ya
  // suma varios round-trips; en un árbol con varios pasos esto se notaba
  // bastante corriendo en serie).
  const [lote, procesos, empacados] = await Promise.all([
    obtenerLote(supabase, loteId),
    obtenerProcesosSalida(supabase, loteId),
    obtenerEmpacados(supabase, loteId),
  ]);
  if (!lote) return null;

  // Las ramas (hijos) tampoco dependen entre sí — se construyen en paralelo.
  const hijos = await Promise.all(
    procesos.map((proceso) =>
      construirArbol(supabase, proceso.lote_destino_id, {
        tipo_proceso: proceso.tipo_proceso,
        merma_pct: Number(proceso.merma_pct),
        creado_en: proceso.creado_en,
        proceso_beneficiado: proceso.proceso_beneficiado,
        usuario: proceso.usuario,
      }),
    ),
  );

  return {
    lote,
    procesoEntrada,
    empacados,
    hijos: hijos.filter((h) => h !== null),
  };
}

export async function obtenerHistorialLote(
  supabase: SupabaseClient,
  loteId: string,
): Promise<NodoHistorial | null> {
  const raizId = await encontrarRaizLote(supabase, loteId);
  return construirArbol(supabase, raizId, null);
}
