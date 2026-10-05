import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Cliente con la service_role key: evita RLS por completo. Solo se debe
// importar desde archivos "use server" (acciones de src/features/usuarios) —
// nunca desde un componente cliente ni desde src/lib/supabase/client.ts.
export function createAdminClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
