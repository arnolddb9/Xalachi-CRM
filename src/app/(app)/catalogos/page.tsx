"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Leaf, Droplets, Flame, Package, Truck, Users, Mountain, Boxes, type LucideIcon } from "lucide-react";

const CATALOGOS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/catalogos/variedades", label: "Variedades", icon: Leaf },
  { href: "/catalogos/procesos", label: "Procesos de beneficiado", icon: Droplets },
  { href: "/catalogos/tueste", label: "Perfiles de tueste", icon: Flame },
  { href: "/catalogos/presentaciones", label: "Presentaciones", icon: Package },
  { href: "/catalogos/proveedores", label: "Proveedores", icon: Truck },
  { href: "/catalogos/clientes", label: "Clientes", icon: Users },
  { href: "/catalogos/fincas", label: "Fincas", icon: Mountain },
  { href: "/catalogos/articulos", label: "Insumos y productos", icon: Boxes },
];

export default function CatalogosPage() {
  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <h1 className="mb-4 text-lg font-semibold text-zinc-900">Catálogos</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CATALOGOS.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.href}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              whileHover={{ y: -2 }}
            >
              <Link
                href={c.href}
                className="hover:border-primary/40 flex min-h-11 items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:shadow-md"
              >
                <span className="bg-primary-soft text-primary flex h-9 w-9 items-center justify-center rounded-md">
                  <Icon size={18} />
                </span>
                {c.label}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </main>
  );
}
