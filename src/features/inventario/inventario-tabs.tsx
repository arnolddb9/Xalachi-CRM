"use client";

import { useState, type ReactNode } from "react";

export function InventarioTabs({
  tabLotes,
  tabArticulos,
}: {
  tabLotes: ReactNode;
  tabArticulos: ReactNode;
}) {
  const [tab, setTab] = useState<"lotes" | "articulos">("lotes");

  return (
    <div>
      <div className="mb-4 flex gap-1 border-b border-zinc-200">
        <button
          onClick={() => setTab("lotes")}
          className={
            tab === "lotes"
              ? "border-primary text-primary min-h-10 border-b-2 px-3 py-2 text-sm font-medium"
              : "min-h-10 border-b-2 border-transparent px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700"
          }
        >
          Inventario y lotes
        </button>
        <button
          onClick={() => setTab("articulos")}
          className={
            tab === "articulos"
              ? "border-primary text-primary min-h-10 border-b-2 px-3 py-2 text-sm font-medium"
              : "min-h-10 border-b-2 border-transparent px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700"
          }
        >
          Insumos y productos
        </button>
      </div>

      <div hidden={tab !== "lotes"}>{tabLotes}</div>
      <div hidden={tab !== "articulos"}>{tabArticulos}</div>
    </div>
  );
}
