import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerRolActual } from "@/lib/session";
import { UsuariosMd3Cargador } from "@/features/usuarios/usuarios-md3-cargador";

export default async function UsuariosPage() {
  const rol = await obtenerRolActual();
  if (rol !== "admin") {
    redirect("/");
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  const [
    { data: usuarios },
    {
      data: { user },
    },
    { data: authUsers },
  ] = await Promise.all([
    supabase.from("usuarios").select("id, nombre, role, activo, creado_en").order("creado_en"),
    supabase.auth.getUser(),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailPorId = new Map(authUsers?.users.map((u) => [u.id, u.email ?? ""]) ?? []);

  const usuariosConEmail = (usuarios ?? []).map((u) => ({
    ...u,
    email: emailPorId.get(u.id) ?? "",
  }));

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <UsuariosMd3Cargador usuarios={usuariosConEmail} propioId={user?.id ?? ""} />
    </main>
  );
}
