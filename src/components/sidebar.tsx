"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  LayoutGrid,
  Package,
  ShoppingCart,
  Flame,
  Wrench,
  FileText,
  ClipboardList,
  Receipt,
  BarChart3,
  Users,
  UserCircle,
  X,
  type LucideIcon,
} from "lucide-react";
import { useSidebar } from "./sidebar-context";

// Nota: este componente (y MobileHeader) se renderiza en el servidor en
// cada carga de página, vía AppLayout — a diferencia del resto del sistema,
// NO puede usar los wrappers de @material/web (Md3Button, Md3IconButton…):
// esos componentes mutan `customElements` al definirse y solo existen en
// el navegador (por eso el resto del sistema los carga con
// `dynamic(..., { ssr: false })`). Usarlos aquí rompería el SSR de toda la
// app, no solo de esta página. Los colores sí usan los roles de color M3
// (bg-primary-container, etc. — ver src/app/globals.css) para mantener
// coherencia visual con el resto del sistema ya migrado.
const MODULOS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/catalogos", label: "Catálogos", icon: LayoutGrid },
  { href: "/inventario", label: "Inventario", icon: Package },
  { href: "/compras", label: "Compras", icon: ShoppingCart },
  { href: "/produccion", label: "Producción", icon: Flame },
  { href: "/servicios", label: "Servicios", icon: Wrench },
  { href: "/presupuestos", label: "Presupuestos", icon: FileText },
  { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/ventas", label: "Ventas", icon: Receipt },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
];

const MODULO_USUARIOS = { href: "/usuarios", label: "Usuarios", icon: Users };
const MODULO_CUENTA = { href: "/cuenta", label: "Mi cuenta", icon: UserCircle };

function NavLinks({
  pathname,
  modulos,
  onNavigate,
}: {
  pathname: string;
  modulos: { href: string; label: string; icon: LucideIcon }[];
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {modulos.map((m) => {
        const activo = m.href === "/" ? pathname === "/" : pathname.startsWith(m.href);
        const Icon = m.icon;
        return (
          <Link
            key={m.href}
            href={m.href}
            onClick={onNavigate}
            className={`flex min-h-11 items-center gap-3 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activo
                ? "bg-primary-container text-on-primary-container"
                : "text-slate-300 hover:bg-sidebar-hover hover:text-white"
            }`}
          >
            <Icon size={18} strokeWidth={2} />
            {m.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ esAdmin = false }: { esAdmin?: boolean }) {
  const pathname = usePathname();
  const { abierto, cerrar } = useSidebar();
  const modulos = [...MODULOS, ...(esAdmin ? [MODULO_USUARIOS] : []), MODULO_CUENTA];

  return (
    <>
      {/* Desktop: rail fijo */}
      <aside className="bg-sidebar hidden w-64 shrink-0 flex-col py-5 md:flex">
        <div className="mb-6 px-4 text-lg font-bold text-white">Xalachi</div>
        <NavLinks pathname={pathname} modulos={modulos} />
      </aside>

      {/* Mobile: drawer animado, controlado desde MobileHeader */}
      <AnimatePresence>
        {abierto && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cerrar}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="bg-sidebar fixed inset-y-0 left-0 z-50 flex w-64 flex-col py-5 md:hidden"
            >
              <div className="mb-6 flex items-center justify-between px-4">
                <span className="text-lg font-bold text-white">Xalachi</span>
                <button
                  onClick={cerrar}
                  aria-label="Cerrar menú"
                  className="min-h-11 min-w-11 rounded-full p-2 text-white hover:bg-sidebar-hover"
                >
                  <X size={20} />
                </button>
              </div>
              <NavLinks pathname={pathname} modulos={modulos} onNavigate={cerrar} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
