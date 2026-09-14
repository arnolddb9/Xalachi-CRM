"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { traducirErrorEliminar } from "@/lib/db-errors";
import {
  CATALOGOS_GESTIONABLES,
  SCHEMAS_CATALOGOS,
  pasoBeneficiadoSchema,
  type CatalogoGestionable,
} from "./schemas";

export type ActionState = { error?: string } | { success: true };

function esCatalogoValido(tabla: string): tabla is CatalogoGestionable {
  return (CATALOGOS_GESTIONABLES as readonly string[]).includes(tabla);
}

function datosDesdeFormulario(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function crearCatalogoGestionable(
  tabla: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!esCatalogoValido(tabla)) return { error: "Catálogo desconocido." };

  const schema = SCHEMAS_CATALOGOS[tabla];
  const parsed = schema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  // El shape exacto lo garantizó zod arriba (schema por tabla, validado en runtime);
  // TS no puede estrechar el tipo de fila a partir de `tabla: string` genérico.
  const { error } = await supabase.from(tabla).insert(parsed.data as never);
  if (error) return { error: error.message };

  revalidatePath(`/catalogos/${tabla}`);
  return { success: true };
}

export async function actualizarCatalogoGestionable(
  tabla: string,
  id: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!esCatalogoValido(tabla)) return { error: "Catálogo desconocido." };

  const schema = SCHEMAS_CATALOGOS[tabla];
  const parsed = schema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from(tabla).update(parsed.data as never).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/catalogos/${tabla}`);
  return { success: true };
}

export async function desactivarCatalogoGestionable(tabla: string, id: string): Promise<ActionState> {
  if (!esCatalogoValido(tabla)) return { error: "Catálogo desconocido." };

  const supabase = await createClient();
  const { error } = await supabase.from(tabla).update({ activo: false }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/catalogos/${tabla}`);
  return { success: true };
}

export async function reactivarCatalogoGestionable(tabla: string, id: string): Promise<ActionState> {
  if (!esCatalogoValido(tabla)) return { error: "Catálogo desconocido." };

  const supabase = await createClient();
  const { error } = await supabase.from(tabla).update({ activo: true }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/catalogos/${tabla}`);
  return { success: true };
}

export async function crearPasoBeneficiado(
  procesoBeneficiadoId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = pasoBeneficiadoSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("pasos_beneficiado")
    .insert({ ...parsed.data, proceso_beneficiado_id: procesoBeneficiadoId });
  if (error) return { error: error.message };

  revalidatePath(`/catalogos/procesos/${procesoBeneficiadoId}`);
  return { success: true };
}

export async function actualizarPasoBeneficiado(
  procesoBeneficiadoId: string,
  id: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = pasoBeneficiadoSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("pasos_beneficiado").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/catalogos/procesos/${procesoBeneficiadoId}`);
  return { success: true };
}

export async function eliminarPasoBeneficiado(
  procesoBeneficiadoId: string,
  id: string,
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("pasos_beneficiado").delete().eq("id", id);
  if (error) return { error: traducirErrorEliminar(error) };

  revalidatePath(`/catalogos/procesos/${procesoBeneficiadoId}`);
  return { success: true };
}

// Borrado real (no soft-delete) — restringido a admin por RLS.
// Si otro módulo ya referencia esta fila por FK, Postgres rechaza el borrado
// (comportamiento por defecto de las foreign keys) y el error se muestra tal cual.
export async function eliminarCatalogoGestionable(tabla: string, id: string): Promise<ActionState> {
  if (!esCatalogoValido(tabla)) return { error: "Catálogo desconocido." };

  const supabase = await createClient();
  const { error } = await supabase.from(tabla).delete().eq("id", id);
  if (error) return { error: traducirErrorEliminar(error) };

  revalidatePath(`/catalogos/${tabla}`);
  return { success: true };
}
