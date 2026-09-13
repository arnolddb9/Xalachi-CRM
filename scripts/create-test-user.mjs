// Crea (o recrea) un usuario dedicado para pruebas e2e.
// Uso: node --env-file=.env.local scripts/create-test-user.mjs <email> <nombre> <role>
// Ejemplo: node --env-file=.env.local scripts/create-test-user.mjs qa.e2e@xalachi.test "QA E2E" operador
import { createClient } from "@supabase/supabase-js";

const [, , email, nombre, role] = process.argv;
if (!email || !nombre || !role) {
  console.error("Uso: node scripts/create-test-user.mjs <email> <nombre> <role>");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const password = `TestE2E-${Math.random().toString(36).slice(2, 10)}!9`;

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  console.error("Error creando usuario de prueba:", error.message);
  process.exit(1);
}

const { error: dbError } = await supabase
  .from("usuarios")
  .insert({ id: data.user.id, nombre, role });

if (dbError) {
  console.error("Error registrando en tabla usuarios:", dbError.message);
  process.exit(1);
}

console.log(`Usuario e2e (${role}) creado. Agrega esto a tu .env.local:\n`);
console.log(`EMAIL=${email}`);
console.log(`PASSWORD=${password}`);
