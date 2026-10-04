"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "./sidebar-context";

// Ver nota en sidebar.tsx: este header se renderiza en el servidor en
// cada página, así que no puede usar wrappers de @material/web.
export function MobileHeader() {
  const { abrir } = useSidebar();

  return (
    <header className="bg-sidebar flex w-full items-center justify-between px-4 py-3 md:hidden">
      <span className="text-lg font-bold text-white">Xalachi</span>
      <button
        onClick={abrir}
        aria-label="Abrir menú"
        className="min-h-11 min-w-11 rounded-full p-2 text-white hover:bg-sidebar-hover"
      >
        <Menu size={22} />
      </button>
    </header>
  );
}
