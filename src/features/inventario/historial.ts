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
    variedad: { nombre: string } | null;
    proveedor: { nombre: string } | null;
  };
  // El proceso que produjo este lote (ausente en la raíz, que se registró directo)
  procesoEntrada: {
    tipo_proceso: string;
    merma_pct: number;
    creado_en: string;
    proceso_beneficiado: { nombre: string } | null;
    usuario: { nombre: string } | null;
  } | null;
  hijos: NodoHistorial[];
};

const SELECT_LOTE =
  "id, nombre, etapa, peso_inicial_kg, peso_actual_kg, cantidad_cajuelas, calidad, fecha_cosecha, variedad:variedades(nombre), proveedor:proveedores(nombre)";

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

async function construirArbol(
  supabase: SupabaseClient,
  loteId: string,
  procesoEntrada: NodoHistorial["procesoEntrada"],
): Promise<NodoHistorial | null> {
  const lote = await obtenerLote(supabase, loteId);
  if (!lote) return null;

  const { data: procesos } = await supabase
    .from("ordenes_proceso")
    .select(
      "lote_destino_id, tipo_proceso, merma_pct, creado_en, proceso_beneficiado:procesos_beneficiado(nombre), usuario:usuarios(nombre)",
    )
    .eq("lote_origen_id", loteId)
    .order("creado_en");

  const hijos: NodoHistorial[] = [];
  for (const proceso of procesos ?? []) {
    const hijo = await construirArbol(supabase, proceso.lote_destino_id, {
      tipo_proceso: proceso.tipo_proceso,
      merma_pct: Number(proceso.merma_pct),
      creado_en: proceso.creado_en,
      proceso_beneficiado: proceso.proceso_beneficiado,
      usuario: proceso.usuario,
    });
    if (hijo) hijos.push(hijo);
  }

  return {
    lote,
    procesoEntrada,
    hijos,
  };
}

export async function obtenerHistorialLote(
  supabase: SupabaseClient,
  loteId: string,
): Promise<NodoHistorial | null> {
  const raizId = await encontrarRaizLote(supabase, loteId);
  return construirArbol(supabase, raizId, null);
}
