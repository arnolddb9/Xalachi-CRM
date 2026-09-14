import { describe, it, expect } from "vitest";
import { registrarCompraLoteSchema, registrarCompraArticuloSchema, actualizarCompraSchema } from "./schemas";

const UUID = "d290f1ee-6c54-4b01-90e6-d701748f0851";

describe("registrarCompraLoteSchema", () => {
  it("acepta una compra en cereza con proveedor y costo", () => {
    const parsed = registrarCompraLoteSchema.safeParse({
      proveedor_id: UUID,
      variedad_id: UUID,
      etapa: "cereza",
      cantidad_cajuelas: "10",
      costo_total: "1500",
      numero_factura: "F-001",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.costo_total).toBe(1500);
      expect(parsed.data.proveedor_id).toBe(UUID);
    }
  });

  it("rechaza si falta el proveedor", () => {
    const parsed = registrarCompraLoteSchema.safeParse({
      variedad_id: UUID,
      etapa: "cereza",
      cantidad_cajuelas: "10",
    });
    expect(parsed.success).toBe(false);
  });

  it("rechaza cereza sin cajuelas (misma validación de peso que un lote)", () => {
    const parsed = registrarCompraLoteSchema.safeParse({
      proveedor_id: UUID,
      variedad_id: UUID,
      etapa: "cereza",
      peso_actual_kg: "100",
    });
    expect(parsed.success).toBe(false);
  });

  it("rechaza un costo_total negativo", () => {
    const parsed = registrarCompraLoteSchema.safeParse({
      proveedor_id: UUID,
      variedad_id: UUID,
      etapa: "verde",
      peso_actual_kg: "50",
      costo_total: "-10",
    });
    expect(parsed.success).toBe(false);
  });

  it("costo_total y folio quedan en null si se omiten", () => {
    const parsed = registrarCompraLoteSchema.safeParse({
      proveedor_id: UUID,
      variedad_id: UUID,
      etapa: "verde",
      peso_actual_kg: "50",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.costo_total).toBeNull();
      expect(parsed.data.numero_factura).toBeNull();
    }
  });
});

describe("registrarCompraArticuloSchema", () => {
  it("acepta una compra de insumo con cantidad y costo", () => {
    const parsed = registrarCompraArticuloSchema.safeParse({
      proveedor_id: UUID,
      articulo_id: UUID,
      cantidad: "50",
      costo_total: "300",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.cantidad).toBe(50);
    }
  });

  it("rechaza si falta el artículo", () => {
    const parsed = registrarCompraArticuloSchema.safeParse({
      proveedor_id: UUID,
      cantidad: "10",
    });
    expect(parsed.success).toBe(false);
  });

  it("rechaza cantidad 0 o negativa", () => {
    expect(
      registrarCompraArticuloSchema.safeParse({ proveedor_id: UUID, articulo_id: UUID, cantidad: "0" })
        .success,
    ).toBe(false);
    expect(
      registrarCompraArticuloSchema.safeParse({ proveedor_id: UUID, articulo_id: UUID, cantidad: "-5" })
        .success,
    ).toBe(false);
  });
});

describe("actualizarCompraSchema", () => {
  it("acepta solo los campos comerciales", () => {
    const parsed = actualizarCompraSchema.safeParse({
      fecha_compra: "2026-09-13",
      costo_total: "2000",
      numero_factura: "F-002",
      notas: "pago en efectivo",
    });
    expect(parsed.success).toBe(true);
  });

  it("rechaza un costo_total negativo", () => {
    const parsed = actualizarCompraSchema.safeParse({ costo_total: "-5" });
    expect(parsed.success).toBe(false);
  });
});
