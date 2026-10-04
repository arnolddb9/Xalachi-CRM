"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import "@/features/inventario/md3-theme.css";
import { createClient } from "@/lib/supabase/client";
import { traducirErrorAuth } from "@/features/auth/auth-errors";
import { Md3Card } from "@/components/md3/card";
import { Md3TextField } from "@/components/md3/text-field";
import { Md3Button } from "@/components/md3/button";

export function LoginMd3Vista() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const datos = new FormData(e.currentTarget);
    const email = String(datos.get("email") ?? "");
    const password = String(datos.get("password") ?? "");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(traducirErrorAuth(error.message));
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="from-sidebar flex min-h-screen items-center justify-center bg-gradient-to-br to-slate-700 p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="md3-scope w-full max-w-sm rounded-xl"
      >
        <Md3Card variant="elevated" style={{ padding: 0 }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 sm:p-8">
            <h1 className="text-lg font-medium" style={{ color: "var(--md-sys-color-on-surface)" }}>
              Iniciar sesión — Xalachi
            </h1>

            <Md3TextField
              label="Correo electrónico"
              name="email"
              type="email"
              required
              autoComplete="email"
              style={{ width: "100%" }}
            />

            <Md3TextField
              label="Contraseña"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              style={{ width: "100%" }}
            />

            {error && (
              <p className="text-sm" style={{ color: "var(--md-sys-color-error)" }}>
                {error}
              </p>
            )}

            <Md3Button type="submit" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Entrando..." : "Entrar"}
            </Md3Button>
          </form>
        </Md3Card>
      </motion.div>
    </main>
  );
}
