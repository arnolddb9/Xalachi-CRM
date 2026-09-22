"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { traducirErrorEliminar } from "@/lib/db-errors";
import { registrarPresupuestoSchema, agregarItemPresupuestoSchema } from "./schemas";

export type ActionState = { error?: string } | { success: true };

function datosDesdeFormulario(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function registrarPresupuesto(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registrarPresupuestoSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("registrar_presupuesto_servicio", {
    p_cliente_id: parsed.data.cliente_id,
    p_etapa_entrada: parsed.data.etapa_entrada,
    p_cantidad_kg: parsed.data.cantidad_kg as number,
    p_cantidad_cajuelas: parsed.data.cantidad_cajuelas as number,
    p_proceso_beneficiado_id: parsed.data.proceso_beneficiado_id as string,
    p_notas: parsed.data.notas as string,
  });
  if (error) return { error: error.message };

  revalidatePath("/presupuestos");
  return { success: true };
}

export async function agregarItemPresupuesto(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = agregarItemPresupuestoSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("agregar_item_presupuesto", {
    p_presupuesto_id: parsed.data.presupuesto_id,
    p_tipo_proceso: parsed.data.tipo_proceso,
    p_kg_estimado: parsed.data.kg_estimado,
  });
  if (error) return { error: error.message };

  revalidatePath("/presupuestos", "layout");
  return { success: true };
}

export async function eliminarItemPresupuesto(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("presupuesto_items").delete().eq("id", id);
  if (error) return { error: traducirErrorEliminar(error) };

  revalidatePath("/presupuestos", "layout");
  return { success: true };
}

export async function aprobarPresupuesto(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("aprobar_presupuesto_servicio", { p_presupuesto_id: id });
  if (error) return { error: error.message };

  revalidatePath("/presupuestos", "layout");
  revalidatePath("/servicios");
  return { success: true };
}

export async function rechazarPresupuesto(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("presupuestos_servicio")
    .update({ estado: "rechazado" })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/presupuestos");
  return { success: true };
}

export async function eliminarPresupuesto(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("presupuestos_servicio").delete().eq("id", id);
  if (error) return { error: traducirErrorEliminar(error) };

  revalidatePath("/presupuestos");
  return { success: true };
}
