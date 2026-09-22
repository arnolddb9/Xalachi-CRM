"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { traducirErrorEliminar } from "@/lib/db-errors";

export type ActionState = { error?: string } | { success: true };

export async function marcarVentaPagada(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("ventas").update({ estado_pago: "pagado" }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/ventas");
  return { success: true };
}

export async function eliminarVenta(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("eliminar_venta", { p_venta_id: id });
  if (error) return { error: traducirErrorEliminar(error) };

  revalidatePath("/ventas");
  revalidatePath("/pedidos");
  return { success: true };
}
