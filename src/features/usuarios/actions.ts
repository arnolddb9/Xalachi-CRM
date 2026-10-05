"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { crearUsuarioSchema, cambiarPropiaContrasenaSchema, ROLES } from "./schemas";

export type ActionState = { error?: string } | { success: true };

function datosDesdeFormulario(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

const BAN_PERMANENTE = "876000h";

export async function crearUsuario(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = crearUsuarioSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const admin = createAdminClient();
  const { data, error: errorAuth } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });
  if (errorAuth || !data.user) {
    return { error: errorAuth?.message ?? "No se pudo crear el usuario." };
  }

  const { error: errorUsuario } = await admin
    .from("usuarios")
    .insert({ id: data.user.id, nombre: parsed.data.nombre, role: parsed.data.role });
  if (errorUsuario) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: errorUsuario.message };
  }

  revalidatePath("/usuarios");
  return { success: true };
}

export async function cambiarRolUsuario(id: string, role: (typeof ROLES)[number]): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("usuarios").update({ role }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/usuarios");
  return { success: true };
}

export async function suspenderUsuario(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id === id) {
    return { error: "No puedes suspender tu propio usuario." };
  }

  const admin = createAdminClient();
  const { error: errorBan } = await admin.auth.admin.updateUserById(id, { ban_duration: BAN_PERMANENTE });
  if (errorBan) return { error: errorBan.message };

  const { error: errorUsuario } = await supabase.from("usuarios").update({ activo: false }).eq("id", id);
  if (errorUsuario) return { error: errorUsuario.message };

  revalidatePath("/usuarios");
  return { success: true };
}

export async function reactivarUsuario(id: string): Promise<ActionState> {
  const admin = createAdminClient();
  const { error: errorBan } = await admin.auth.admin.updateUserById(id, { ban_duration: "none" });
  if (errorBan) return { error: errorBan.message };

  const supabase = await createClient();
  const { error: errorUsuario } = await supabase.from("usuarios").update({ activo: true }).eq("id", id);
  if (errorUsuario) return { error: errorUsuario.message };

  revalidatePath("/usuarios");
  return { success: true };
}

export async function cambiarPropiaContrasena(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = cambiarPropiaContrasenaSchema.safeParse(datosDesdeFormulario(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };

  return { success: true };
}
