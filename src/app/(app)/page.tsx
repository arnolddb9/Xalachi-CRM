import { createClient } from "@/lib/supabase/server";
import { decodeJwtPayload } from "@/lib/jwt";
import { InicioMd3Cargador } from "@/features/inicio/inicio-md3-cargador";

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
      <InicioMd3Cargador email={user.email ?? ""} rol={String(claims.user_role ?? "sin rol asignado")} />
    </main>
  );
}
