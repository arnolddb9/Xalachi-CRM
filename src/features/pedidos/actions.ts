"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { traducirErrorEliminar } from "@/lib/db-errors";
import {
  registrarPedidoSchema,
  agregarItemPedidoProductoSchema,
  agregarItemPedidoGranelSchema,
} from "./schemas";

export type ActionState = { error?: string } | { success: true };

function datosDesdeFormulario(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function registrarPedido(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registrarPedidoSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("registrar_pedido", {
    p_cliente_id: parsed.data.cliente_id,
    p_notas: parsed.data.notas as string,
  });
  if (error) return { error: error.message };

  revalidatePath("/pedidos");
  return { success: true };
}

export async function agregarItemPedidoProducto(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = agregarItemPedidoProductoSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("agregar_item_pedido_producto", {
    p_pedido_id: parsed.data.pedido_id,
    p_articulo_id: parsed.data.articulo_id,
    p_cantidad: parsed.data.cantidad,
    p_precio_unitario: parsed.data.precio_unitario as number,
    p_motivo: parsed.data.motivo_cambio_precio as string,
  });
  if (error) return { error: error.message };

  revalidatePath("/pedidos", "layout");
  return { success: true };
}

export async function agregarItemPedidoGranel(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = agregarItemPedidoGranelSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("agregar_item_pedido_granel", {
    p_pedido_id: parsed.data.pedido_id,
    p_lote_id: parsed.data.lote_id,
    p_cantidad_kg: parsed.data.cantidad_kg,
    p_precio_unitario: parsed.data.precio_unitario,
  });
  if (error) return { error: error.message };

  revalidatePath("/pedidos", "layout");
  return { success: true };
}

export async function eliminarItemPedido(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("pedido_items").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/pedidos", "layout");
  return { success: true };
}

export async function confirmarPedido(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirmar_pedido", { p_pedido_id: id });
  if (error) return { error: error.message };

  revalidatePath("/pedidos");
  revalidatePath("/ventas");
  return { success: true };
}

export async function cancelarPedido(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pedidos")
    .update({ estado: "cancelado" })
    .eq("id", id)
    .eq("estado", "borrador");
  if (error) return { error: error.message };

  revalidatePath("/pedidos");
  return { success: true };
}

export async function eliminarPedido(id: string): Promise<ActionState> {
  const supabase = await createClient();

  const { data: pedido } = await supabase.from("pedidos").select("estado").eq("id", id).single();
  if (pedido?.estado === "confirmado") {
    return { error: "Este pedido ya se convirtió en una venta — elimínala desde Ventas si necesitas revertirlo." };
  }

  const { error: errorItems } = await supabase.from("pedido_items").delete().eq("pedido_id", id);
  if (errorItems) return { error: traducirErrorEliminar(errorItems) };

  const { error } = await supabase.from("pedidos").delete().eq("id", id);
  if (error) return { error: traducirErrorEliminar(error) };

  revalidatePath("/pedidos");
  return { success: true };
}
