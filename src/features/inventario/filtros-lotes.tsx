"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Opcion = { id: string; nombre: string };

type ValoresFiltro = {
  finca_id: string;
  variedad_id: string;
  proceso_beneficiado_id: string;
  proveedor_id: string;
  etapa: string;
  desde: string;
  hasta: string;
};

export function FiltrosLotes({
  variedades,
  proveedores,
  fincas,
  procesosBeneficiado,
  valoresIniciales,
}: {
  variedades: Opcion[];
  proveedores: Opcion[];
  fincas: Opcion[];
  procesosBeneficiado: Opcion[];
  valoresIniciales: ValoresFiltro;
}) {
  const router = useRouter();
  const [valores, setValores] = useState(valoresIniciales);
  const hayFiltrosActivos = Object.values(valoresIniciales).some((v) => v !== "");

  function actualizar<K extends keyof ValoresFiltro>(campo: K, valor: string) {
    setValores((v) => ({ ...v, [campo]: valor }));
  }

  function aplicar() {
    const params = new URLSearchParams();
    for (const [clave, valor] of Object.entries(valores)) {
      if (valor) params.set(clave, valor);
    }
    const query = params.toString();
    router.push(query ? `/inventario?${query}` : "/inventario");
  }

  function limpiar() {
    setValores({ finca_id: "", variedad_id: "", proceso_beneficiado_id: "", proveedor_id: "", etapa: "", desde: "", hasta: "" });
    router.push("/inventario");
  }

  return (
    <div
      data-testid="filtros-lotes"
      className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-zinc-200 bg-white p-3 sm:grid-cols-3 lg:grid-cols-4"
    >
      <select
        aria-label="Filtrar por finca"
        value={valores.finca_id}
        onChange={(e) => actualizar("finca_id", e.target.value)}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900"
      >
        <option value="">Todas las fincas</option>
        {fincas.map((f) => (
          <option key={f.id} value={f.id}>
            {f.nombre}
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrar por variedad"
        value={valores.variedad_id}
        onChange={(e) => actualizar("variedad_id", e.target.value)}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900"
      >
        <option value="">Todas las variedades</option>
        {variedades.map((v) => (
          <option key={v.id} value={v.id}>
            {v.nombre}
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrar por proceso de beneficiado"
        value={valores.proceso_beneficiado_id}
        onChange={(e) => actualizar("proceso_beneficiado_id", e.target.value)}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900"
      >
        <option value="">Todos los procesos</option>
        {procesosBeneficiado.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrar por proveedor"
        value={valores.proveedor_id}
        onChange={(e) => actualizar("proveedor_id", e.target.value)}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900"
      >
        <option value="">Todos los proveedores</option>
        {proveedores.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrar por etapa"
        value={valores.etapa}
        onChange={(e) => actualizar("etapa", e.target.value)}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900"
      >
        <option value="">Todas las etapas</option>
        <option value="cereza">Cereza</option>
        <option value="pergamino">Pergamino</option>
        <option value="verde">Verde</option>
        <option value="tostado">Tostado</option>
        <option value="molido">Molido</option>
      </select>

      <input
        aria-label="Cosecha desde"
        type="date"
        value={valores.desde}
        onChange={(e) => actualizar("desde", e.target.value)}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900"
      />

      <input
        aria-label="Cosecha hasta"
        type="date"
        value={valores.hasta}
        onChange={(e) => actualizar("hasta", e.target.value)}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900"
      />

      <div className="col-span-2 flex gap-2 sm:col-span-1">
        <button
          onClick={aplicar}
          className="bg-primary hover:bg-primary-dark min-h-9 flex-1 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors"
        >
          Filtrar
        </button>
        {hayFiltrosActivos && (
          <button
            onClick={limpiar}
            className="min-h-9 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
