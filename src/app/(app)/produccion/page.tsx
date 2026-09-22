import { createClient } from "@/lib/supabase/server";
import { ProduccionMd3Cargador } from "@/features/produccion/produccion-md3-cargador";

export default async function ProduccionPage() {
  const supabase = await createClient();
  const [{ data: procesos }, { data: empacados }] = await Promise.all([
    supabase
      .from("ordenes_proceso")
      .select(
        "id, tipo_proceso, merma_pct, creado_en, lote_origen_id, lote_destino_id, lote_origen:lotes!ordenes_proceso_lote_origen_id_fkey(nombre), lote_destino:lotes!ordenes_proceso_lote_destino_id_fkey(nombre, etapa), proceso_beneficiado:procesos_beneficiado(nombre), usuario:usuarios(nombre)",
      )
      .order("creado_en", { ascending: false })
      .limit(100),
    supabase
      .from("empacados")
      .select(
        "id, unidades, peso_kg, creado_en, lote_origen_id, lote_origen:lotes(nombre), articulo:articulos!empacados_articulo_id_fkey(nombre), presentacion:presentaciones(nombre), usuario:usuarios(nombre)",
      )
      .order("creado_en", { ascending: false })
      .limit(100),
  ]);

  const eventosProceso = (procesos ?? []).map((p) => ({
    id: p.id,
    tipo: "proceso" as const,
    tipoProceso: p.tipo_proceso,
    loteOrigenId: p.lote_origen_id,
    loteOrigenNombre: p.lote_origen?.nombre ?? null,
    loteDestinoId: p.lote_destino_id,
    loteDestinoNombre: p.lote_destino?.nombre ?? null,
    loteDestinoEtapa: p.lote_destino?.etapa ?? "",
    procesoBeneficiado: p.proceso_beneficiado?.nombre ?? null,
    mermaPct: Number(p.merma_pct),
    usuario: p.usuario?.nombre ?? null,
    creadoEn: p.creado_en,
  }));

  const eventosEmpacado = (empacados ?? []).map((e) => ({
    id: e.id,
    tipo: "empacado" as const,
    loteOrigenId: e.lote_origen_id,
    loteOrigenNombre: e.lote_origen?.nombre ?? null,
    articulo: e.articulo?.nombre ?? null,
    presentacion: e.presentacion?.nombre ?? null,
    unidades: Number(e.unidades),
    pesoKg: Number(e.peso_kg),
    usuario: e.usuario?.nombre ?? null,
    creadoEn: e.creado_en,
  }));

  const eventos = [...eventosProceso, ...eventosEmpacado].sort(
    (a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime(),
  );

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <ProduccionMd3Cargador eventos={eventos} />
    </main>
  );
}
