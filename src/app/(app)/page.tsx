import { createClient } from "@/lib/supabase/server";
import { decodeJwtPayload } from "@/lib/jwt";
import LogoutButton from "@/features/auth/components/logout-button";

export default async function Home() {
  const supabase = await createClient();

  // getUser() valida contra el servidor de Auth (correo confiable).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // getSession() solo se usa por el access_token, nunca por su .user
  // (ese .user no está verificado y supabase-js lo marca como inseguro).
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!user || !session) return null;

  const claims = decodeJwtPayload(session.access_token);

  return (
    <main className="mx-auto max-w-xl p-4 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-base font-semibold text-zinc-900 sm:text-lg">
          Sistema de gestión — Xalachi
        </h1>
        <LogoutButton />
      </div>

      <div className="border-primary rounded-lg border border-l-4 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-sm text-zinc-500">Sesión activa</p>
        <p className="mt-1 break-words text-sm">
          <span className="text-zinc-500">Correo:</span> {user.email}
        </p>
        <p className="text-sm">
          <span className="text-zinc-500">Rol asignado:</span>{" "}
          <span className="bg-primary-soft text-primary rounded px-1.5 py-0.5 font-mono text-xs font-medium">
            {String(claims.user_role ?? "sin rol asignado")}
          </span>
        </p>
      </div>

      <p className="mt-4 text-xs text-zinc-400">
        Si ves &quot;sin rol asignado&quot; aquí, revisa que el Auth Hook esté activo en Dashboard →
        Authentication → Hooks, y que exista tu fila en la tabla <code>usuarios</code>.
      </p>
    </main>
  );
}
