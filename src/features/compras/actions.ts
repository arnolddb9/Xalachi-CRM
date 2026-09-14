"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { traducirErrorEliminar } from "@/lib/db-errors";
import {
  registrarCompraLoteSchema,
  registrarCompraArticuloSchema,
  actualizarCompraSchema,
} from "./schemas";

export type ActionState = { error?: string } | { success: true };

function datosDesdeFormulario(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function registrarCompraLote(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registrarCompraLoteSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  // Los tipos generados marcan estos parámetros como no-nulables, pero la
  // función de Postgres acepta NULL (campos opcionales del lote/compra).
  const { error } = await supabase.rpc("registrar_compra_lote", {
    p_proveedor_id: parsed.data.proveedor_id,
    p_variedad_id: parsed.data.variedad_id,
    p_etapa: parsed.data.etapa,
    p_cantidad_cajuelas: parsed.data.cantidad_cajuelas as number,
    p_peso_actual_kg: parsed.data.peso_actual_kg as number,
    p_fecha_cosecha: parsed.data.fecha_cosecha as string,
    p_finca_id: parsed.data.finca_id as string,
    p_numero_cama_secado: parsed.data.numero_cama_secado as string,
    p_nombre: parsed.data.nombre as string,
    p_fecha_compra: parsed.data.fecha_compra as string,
    p_costo_total: parsed.data.costo_total as number,
    p_numero_factura: parsed.data.numero_factura as string,
    p_notas: parsed.data.notas as string,
  });
  if (error) return { error: error.message };

  revalidatePath("/compras");
  revalidatePath("/inventario");
  return { success: true };
}

export async function registrarCompraArticulo(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registrarCompraArticuloSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("registrar_compra_articulo", {
    p_proveedor_id: parsed.data.proveedor_id,
    p_articulo_id: parsed.data.articulo_id,
    p_cantidad: parsed.data.cantidad,
    p_fecha_compra: parsed.data.fecha_compra as string,
    p_costo_total: parsed.data.costo_total as number,
    p_numero_factura: parsed.data.numero_factura as string,
    p_notas: parsed.data.notas as string,
  });
  if (error) return { error: error.message };

  revalidatePath("/compras");
  revalidatePath("/inventario");
  return { success: true };
}

export async function actualizarCompra(
  id: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = actualizarCompraSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  // fecha_compra no admite NULL en la tabla; si el campo llegó vacío se
  // omite del update en vez de forzar el valor nulo.
  const { fecha_compra, ...resto } = parsed.data;
  const cambios = fecha_compra ? { ...resto, fecha_compra } : resto;
  const { error } = await supabase.from("compras").update(cambios).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/compras");
  return { success: true };
}

// Vía RPC en vez de `.delete()` directo: si la compra es de un artículo,
// la función revierte primero el stock que había sumado.
export async function eliminarCompra(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("eliminar_compra", { p_compra_id: id });
  if (error) return { error: traducirErrorEliminar(error) };

  revalidatePath("/compras");
  revalidatePath("/inventario");
  return { success: true };
}
