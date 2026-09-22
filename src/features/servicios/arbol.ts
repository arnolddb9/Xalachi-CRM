import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type NodoServicio = {
  lote: {
    id: string;
    etapa: string;
    peso_actual_kg: number;
    peso_inicial_kg: number;
    calidad: string | null;
    cantidad_cajuelas: number | null;
    perfil_tueste: { nombre: string } | null;
    proceso_beneficiado: { nombre: string } | null;
  };
  pasoEntrada: {
    tipo_proceso: string;
    peso_procesado_kg: number;
    merma_pct: number;
    tarifa_kg: number;
    costo_total: number;
    usuario: { nombre: string } | null;
    creado_en: string;
  } | null;
  hijos: NodoServicio[];
};

const SELECT_LOTE =
  "id, etapa, peso_actual_kg, peso_inicial_kg, calidad, cantidad_cajuelas, perfil_tueste:perfiles_tueste(nombre), proceso_beneficiado:procesos_beneficiado(nombre)";

async function obtenerRaiz(supabase: SupabaseClient, ordenServicioId: string) {
  const { data: lotes } = await supabase
    .from("lotes_servicio")
    .select(SELECT_LOTE)
    .eq("orden_servicio_id", ordenServicioId);
  const ids = (lotes ?? []).map((l) => l.id);
  if (ids.length === 0) return null;

  const { data: destinos } = await supabase
    .from("pasos_servicio")
    .select("lote_servicio_destino_id")
    .in("lote_servicio_destino_id", ids);
  const idsDestino = new Set((destinos ?? []).map((d) => d.lote_servicio_destino_id));

  return (lotes ?? []).find((l) => !idsDestino.has(l.id)) ?? null;
}

async function obtenerPasosSalida(supabase: SupabaseClient, loteServicioId: string) {
  const { data } = await supabase
    .from("pasos_servicio")
    .select(
      "lote_servicio_destino_id, tipo_proceso, peso_procesado_kg, merma_pct, tarifa_kg, costo_total, creado_en, usuario:usuarios(nombre)",
    )
    .eq("lote_servicio_origen_id", loteServicioId)
    .order("creado_en");
  return data ?? [];
}

async function construirArbol(
  supabase: SupabaseClient,
  loteServicioId: string,
  pasoEntrada: NodoServicio["pasoEntrada"],
): Promise<NodoServicio | null> {
  const [{ data: lote }, pasos] = await Promise.all([
    supabase.from("lotes_servicio").select(SELECT_LOTE).eq("id", loteServicioId).single(),
    obtenerPasosSalida(supabase, loteServicioId),
  ]);
  if (!lote) return null;

  const hijos = await Promise.all(
    pasos.map((paso) =>
      construirArbol(supabase, paso.lote_servicio_destino_id, {
        tipo_proceso: paso.tipo_proceso,
        peso_procesado_kg: Number(paso.peso_procesado_kg),
        merma_pct: Number(paso.merma_pct),
        tarifa_kg: Number(paso.tarifa_kg),
        costo_total: Number(paso.costo_total),
        usuario: paso.usuario,
        creado_en: paso.creado_en,
      }),
    ),
  );

  return { lote, pasoEntrada, hijos: hijos.filter((h) => h !== null) };
}

export async function obtenerArbolServicio(
  supabase: SupabaseClient,
  ordenServicioId: string,
): Promise<NodoServicio | null> {
  const raiz = await obtenerRaiz(supabase, ordenServicioId);
  if (!raiz) return null;
  return construirArbol(supabase, raiz.id, null);
}
