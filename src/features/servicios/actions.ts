"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { traducirErrorEliminar } from "@/lib/db-errors";
import {
  registrarOrdenServicioSchema,
  aplicarPeladoSchema,
  aplicarBeneficiadoServicioSchema,
  aplicarClasificacionServicioSchema,
  aplicarTuesteServicioSchema,
  aplicarMolidoServicioSchema,
  tarifasServicioSchema,
} from "./schemas";

export type ActionState = { error?: string } | { success: true };

function datosDesdeFormulario(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function registrarOrdenServicio(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registrarOrdenServicioSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("registrar_orden_servicio", {
    p_cliente_id: parsed.data.cliente_id,
    p_etapa_entrada: parsed.data.etapa_entrada,
    p_cantidad_kg: parsed.data.cantidad_kg as number,
    p_cantidad_cajuelas: parsed.data.cantidad_cajuelas as number,
    p_proceso_beneficiado_id: parsed.data.proceso_beneficiado_id as string,
    p_fecha_recepcion: parsed.data.fecha_recepcion as string,
    p_notas: parsed.data.notas as string,
  });
  if (error) return { error: error.message };

  revalidatePath("/servicios");
  return { success: true };
}

export async function aplicarBeneficiadoServicio(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = aplicarBeneficiadoServicioSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("aplicar_beneficiado_servicio", {
    p_lote_servicio_origen_id: parsed.data.lote_servicio_origen_id,
    p_kg_a_procesar: parsed.data.kg_a_procesar,
    p_merma_pct: parsed.data.merma_pct,
  });
  if (error) return { error: error.message };

  revalidatePath("/servicios", "layout");
  return { success: true };
}

export async function aplicarPeladoServicio(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = aplicarPeladoSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("aplicar_pelado_servicio", {
    p_lote_servicio_origen_id: parsed.data.lote_servicio_origen_id,
    p_kg_a_procesar: parsed.data.kg_a_procesar,
    p_merma_pct: parsed.data.merma_pct,
  });
  if (error) return { error: error.message };

  revalidatePath("/servicios", "layout");
  return { success: true };
}

export async function aplicarTuesteServicio(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = aplicarTuesteServicioSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("aplicar_tueste_servicio", {
    p_lote_servicio_origen_id: parsed.data.lote_servicio_origen_id,
    p_perfil_tueste_id: parsed.data.perfil_tueste_id,
    p_kg_a_procesar: parsed.data.kg_a_procesar,
    p_merma_pct: parsed.data.merma_pct,
  });
  if (error) return { error: error.message };

  revalidatePath("/servicios", "layout");
  return { success: true };
}

export async function aplicarMolidoServicio(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = aplicarMolidoServicioSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("aplicar_molido_servicio", {
    p_lote_servicio_origen_id: parsed.data.lote_servicio_origen_id,
    p_kg_a_procesar: parsed.data.kg_a_procesar,
    p_merma_pct: parsed.data.merma_pct,
  });
  if (error) return { error: error.message };

  revalidatePath("/servicios", "layout");
  return { success: true };
}

export async function aplicarClasificacionServicio(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = aplicarClasificacionServicioSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("aplicar_clasificacion_servicio", {
    p_lote_servicio_origen_id: parsed.data.lote_servicio_origen_id,
    p_primera_kg: parsed.data.primera_kg,
    p_segunda_kg: parsed.data.segunda_kg,
    p_tercera_kg: parsed.data.tercera_kg,
    p_rechazo_kg: parsed.data.rechazo_kg,
  });
  if (error) return { error: error.message };

  revalidatePath("/servicios", "layout");
  return { success: true };
}

export async function marcarOrdenEntregada(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("ordenes_servicio")
    .update({ estado: "entregado", fecha_entrega: hoy })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/servicios", "layout");
  return { success: true };
}

export async function eliminarOrdenServicio(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("ordenes_servicio").delete().eq("id", id);
  if (error) return { error: traducirErrorEliminar(error) };

  revalidatePath("/servicios");
  return { success: true };
}

export async function actualizarTarifasServicio(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = tarifasServicioSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const resultados = await Promise.all(
    (["pelado", "clasificacion", "tueste", "molido", "beneficiado"] as const).map((tipo) =>
      supabase.from("tarifas_servicio").update({ tarifa_kg: parsed.data[tipo] }).eq("tipo_servicio", tipo),
    ),
  );
  const conError = resultados.find((r) => r.error);
  if (conError?.error) return { error: conError.error.message };

  revalidatePath("/servicios");
  return { success: true };
}
