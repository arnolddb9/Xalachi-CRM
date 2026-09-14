"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { traducirErrorEliminar } from "@/lib/db-errors";
import {
  registrarLoteSchema,
  actualizarLoteSchema,
  iniciarOAvanzarBeneficiadoSchema,
  aplicarTrilladoSchema,
  aplicarTuesteSchema,
  aplicarMolidoSchema,
  empacarLoteSchema,
  clasificarCalidadSchema,
  configuracionSchema,
  ajustarStockSchema,
} from "./schemas";

export type ActionState = { error?: string } | { success: true };

function datosDesdeFormulario(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

async function obtenerFactorCajuela(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await supabase
    .from("configuracion")
    .select("factor_kg_por_cajuela")
    .eq("id", 1)
    .single();
  if (error || !data) throw new Error("No se pudo leer el factor de conversión de cajuelas.");
  return Number(data.factor_kg_por_cajuela);
}

// Si es cereza, el peso se calcula desde las cajuelas; en cualquier otra
// etapa se usa el peso capturado directamente.
async function calcularPesoLote(
  supabase: Awaited<ReturnType<typeof createClient>>,
  datos: { etapa: string; cantidad_cajuelas: number | null; peso_actual_kg: number | null },
) {
  if (datos.etapa === "cereza") {
    const factor = await obtenerFactorCajuela(supabase);
    // Redondeo a 2 decimales: cajuelas * factor en punto flotante puede dar
    // arrastres como 108.80000000000001, que se guardarían tal cual en el
    // numeric de Postgres si no se limpian aquí.
    const pesoCalculado = Math.round(datos.cantidad_cajuelas! * factor * 100) / 100;
    return {
      peso_actual_kg: pesoCalculado,
      peso_inicial_kg: pesoCalculado,
      cantidad_cajuelas: datos.cantidad_cajuelas,
    };
  }
  return {
    peso_actual_kg: datos.peso_actual_kg!,
    peso_inicial_kg: datos.peso_actual_kg!,
    cantidad_cajuelas: null,
  };
}

export async function registrarLote(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registrarLoteSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  try {
    const calculado = await calcularPesoLote(supabase, parsed.data);
    const { error } = await supabase.from("lotes").insert({ ...parsed.data, ...calculado });
    if (error) return { error: error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al registrar el lote." };
  }

  revalidatePath("/inventario");
  return { success: true };
}

export async function actualizarLote(
  id: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = actualizarLoteSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  try {
    const calculado = await calcularPesoLote(supabase, parsed.data);
    const { error } = await supabase
      .from("lotes")
      .update({ ...parsed.data, ...calculado })
      .eq("id", id);
    if (error) return { error: error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al actualizar el lote." };
  }

  revalidatePath("/inventario");
  return { success: true };
}

// Borrado real (no soft-delete) — restringido a admin por RLS. Si el lote ya
// tiene historial (es origen o destino de alguna orden de proceso), Postgres
// rechaza el borrado por la FK y el error se muestra tal cual.
export async function eliminarLote(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("lotes").delete().eq("id", id);
  if (error) return { error: traducirErrorEliminar(error) };

  revalidatePath("/inventario");
  return { success: true };
}

export async function iniciarOAvanzarBeneficiado(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = iniciarOAvanzarBeneficiadoSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("iniciar_o_avanzar_beneficiado", {
    p_lote_origen_id: parsed.data.lote_origen_id,
    // Los tipos generados marcan el parámetro como string no-nulable, pero la función
    // de Postgres acepta NULL (al avanzar un paso ya en curso no hace falta reenviarlo).
    p_proceso_beneficiado_id: parsed.data.proceso_beneficiado_id as string,
    p_merma_pct: parsed.data.merma_pct,
  });
  if (error) return { error: error.message };

  revalidatePath("/inventario");
  return { success: true };
}

export async function aplicarTrillado(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = aplicarTrilladoSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("aplicar_trillado", {
    p_lote_origen_id: parsed.data.lote_origen_id,
    p_merma_pct: parsed.data.merma_pct,
  });
  if (error) return { error: error.message };

  revalidatePath("/inventario");
  return { success: true };
}

export async function aplicarTueste(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = aplicarTuesteSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("aplicar_tueste", {
    p_lote_origen_id: parsed.data.lote_origen_id,
    p_perfil_tueste_id: parsed.data.perfil_tueste_id,
    p_merma_pct: parsed.data.merma_pct,
  });
  if (error) return { error: error.message };

  revalidatePath("/inventario");
  return { success: true };
}

export async function aplicarMolido(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = aplicarMolidoSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("aplicar_molido", {
    p_lote_origen_id: parsed.data.lote_origen_id,
    p_merma_pct: parsed.data.merma_pct,
  });
  if (error) return { error: error.message };

  revalidatePath("/inventario");
  return { success: true };
}

export async function empacarLote(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = empacarLoteSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  // El parámetro es no-nulable en los tipos generados, pero la función de
  // Postgres acepta NULL (empacar sin descontar un insumo de empaque).
  const { error } = await supabase.rpc("empacar_lote", {
    p_lote_origen_id: parsed.data.lote_origen_id,
    p_articulo_id: parsed.data.articulo_id,
    p_presentacion_id: parsed.data.presentacion_id,
    p_unidades: parsed.data.unidades,
    p_insumo_articulo_id: parsed.data.insumo_articulo_id as string,
  });
  if (error) return { error: error.message };

  revalidatePath("/inventario");
  return { success: true };
}

export async function eliminarEmpacado(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("eliminar_empacado", { p_empacado_id: id });
  if (error) return { error: traducirErrorEliminar(error) };

  revalidatePath("/inventario");
  return { success: true };
}

export async function clasificarCalidadLote(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = clasificarCalidadSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("clasificar_calidad_lote", {
    p_lote_origen_id: parsed.data.lote_origen_id,
    p_primera_kg: parsed.data.primera_kg,
    p_segunda_kg: parsed.data.segunda_kg,
    p_tercera_kg: parsed.data.tercera_kg,
    p_rechazo_kg: parsed.data.rechazo_kg,
  });
  if (error) return { error: error.message };

  revalidatePath("/inventario");
  return { success: true };
}

export async function actualizarFactorCajuela(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = configuracionSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracion")
    .update({ factor_kg_por_cajuela: parsed.data.factor_kg_por_cajuela })
    .eq("id", 1);
  if (error) return { error: error.message };

  revalidatePath("/inventario");
  return { success: true };
}

export async function ajustarStockArticulo(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = ajustarStockSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("ajustar_stock_articulo", {
    p_articulo_id: parsed.data.articulo_id,
    p_stock_nuevo: parsed.data.stock_nuevo,
  });
  if (error) return { error: error.message };

  revalidatePath("/inventario");
  return { success: true };
}
