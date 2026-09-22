"use client";

import Link from "next/link";
import { Leaf, Droplets, Flame, Package, Truck, Users, Mountain, Boxes, type LucideIcon } from "lucide-react";
import "@/features/inventario/md3-theme.css";
import { Md3Card } from "@/components/md3/card";

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

export function CatalogosMd3Vista() {
  return (
    <div className="md3-scope rounded-2xl p-4">
      <h1 className="mb-4 text-2xl font-medium">Catálogos</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CATALOGOS.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.href} href={c.href}>
              <Md3Card variant="elevated" style={{ padding: 16 }}>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ background: "var(--md-sys-color-primary-container)", color: "var(--md-sys-color-on-primary-container)" }}
                  >
                    <Icon size={18} />
                  </span>
                  {c.label}
                </div>
              </Md3Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
