import type { PostgrestError } from "@supabase/supabase-js";

// Código SQLSTATE de Postgres para violación de foreign key.
const FOREIGN_KEY_VIOLATION = "23503";

/** Traduce errores comunes de Postgres/Supabase a un mensaje entendible. */
export function traducirErrorEliminar(error: PostgrestError): string {
  if (error.code === FOREIGN_KEY_VIOLATION) {
    return "No se puede eliminar: este registro ya está en uso en otra parte del sistema (por ejemplo, un lote que ya se transformó o se usó en un proceso). Si ya no lo necesitas, márcalo como inactivo en vez de eliminarlo, si esa opción existe.";
  }
  return error.message;
}
