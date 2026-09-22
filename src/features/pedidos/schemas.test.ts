import { describe, it, expect } from "vitest";
import {
  registrarPedidoSchema,
  agregarItemPedidoProductoSchema,
  agregarItemPedidoGranelSchema,
} from "./schemas";

const UUID = "d290f1ee-6c54-4b01-90e6-d701748f0851";

describe("registrarPedidoSchema", () => {
  it("acepta cliente_id válido sin notas", () => {
    expect(registrarPedidoSchema.safeParse({ cliente_id: UUID }).success).toBe(true);
  });

  it("rechaza cliente_id inválido", () => {
    expect(registrarPedidoSchema.safeParse({ cliente_id: "no-es-uuid" }).success).toBe(false);
  });
});

describe("agregarItemPedidoProductoSchema", () => {
  it("acepta cantidad positiva sin cambio de precio", () => {
    const parsed = agregarItemPedidoProductoSchema.safeParse({
      pedido_id: UUID,
      articulo_id: UUID,
      cantidad: "3",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.precio_unitario).toBeNull();
  });

  it("rechaza cantidad 0", () => {
    expect(
      agregarItemPedidoProductoSchema.safeParse({
        pedido_id: UUID,
        articulo_id: UUID,
        cantidad: "0",
      }).success,
    ).toBe(false);
  });
});

describe("agregarItemPedidoGranelSchema", () => {
  it("acepta kg y precio positivos", () => {
    const parsed = agregarItemPedidoGranelSchema.safeParse({
      pedido_id: UUID,
      lote_id: UUID,
      cantidad_kg: "5",
      precio_unitario: "1500",
    });
    expect(parsed.success).toBe(true);
  });

  it("rechaza sin precio_unitario", () => {
    expect(
      agregarItemPedidoGranelSchema.safeParse({
        pedido_id: UUID,
        lote_id: UUID,
        cantidad_kg: "5",
      }).success,
    ).toBe(false);
  });
});
