import { createClient } from "@/lib/supabase/server";
import { decodeJwtPayload } from "@/lib/jwt";

export async function obtenerRolActual(): Promise<string | null> {
  const supabase = await createClient();

  // getUser() valida contra el servidor; getSession() solo se usa por el
  // access_token (nunca por su .user, que no está verificado).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const claims = decodeJwtPayload(session.access_token);
  return typeof claims.user_role === "string" ? claims.user_role : null;
}
