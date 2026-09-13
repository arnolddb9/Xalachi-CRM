"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { traducirErrorAuth } from "@/features/auth/auth-errors";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl sm:p-8"
      >
        <h1 className="mb-6 text-lg font-semibold text-zinc-900">
          Iniciar sesión — Xalachi
        </h1>

        <label htmlFor="email" className="mb-1 block text-sm text-zinc-600">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="focus:border-primary focus:ring-primary/30 mb-4 w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:outline-none"
        />

        <label htmlFor="password" className="mb-1 block text-sm text-zinc-600">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="focus:border-primary focus:ring-primary/30 mb-4 w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:outline-none"
        />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.98 }}
          className="bg-primary hover:bg-primary-dark w-full rounded-md px-4 py-3 text-base font-medium text-white transition-colors disabled:opacity-50 sm:py-2.5 sm:text-sm"
        >
          {loading ? "Entrando..." : "Entrar"}
        </motion.button>
      </motion.form>
    </main>
  );
}
