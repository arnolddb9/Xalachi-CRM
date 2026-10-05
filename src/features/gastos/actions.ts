"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { traducirErrorEliminar } from "@/lib/db-errors";
import { registrarGastoSchema } from "./schemas";

export type ActionState = { error?: string } | { success: true };

function datosDesdeFormulario(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function registrarGasto(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registrarGastoSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("gastos_operativos").insert({
    categoria_id: parsed.data.categoria_id,
    descripcion: parsed.data.descripcion,
    monto: parsed.data.monto,
    fecha: parsed.data.fecha ?? undefined,
    numero_factura: parsed.data.numero_factura,
  });
  if (error) return { error: error.message };

  revalidatePath("/gastos");
  revalidatePath("/reportes");
  return { success: true };
}

export async function eliminarGasto(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("gastos_operativos").delete().eq("id", id);
  if (error) return { error: traducirErrorEliminar(error) };

  revalidatePath("/gastos");
  revalidatePath("/reportes");
  return { success: true };
}
