import { describe, it, expect } from "vitest";
import { registrarPresupuestoSchema, agregarItemPresupuestoSchema } from "./schemas";

const UUID = "d290f1ee-6c54-4b01-90e6-d701748f0851";

describe("registrarPresupuestoSchema", () => {
  it("acepta un presupuesto en verde con kg", () => {
    const parsed = registrarPresupuestoSchema.safeParse({
      cliente_id: UUID,
      etapa_entrada: "verde",
      cantidad_kg: "10",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.cantidad_kg).toBe(10);
  });

  it("rechaza verde sin cantidad_kg", () => {
    expect(
      registrarPresupuestoSchema.safeParse({ cliente_id: UUID, etapa_entrada: "verde" }).success,
    ).toBe(false);
  });

  it("acepta cereza con cajuelas y proceso de beneficiado", () => {
    const parsed = registrarPresupuestoSchema.safeParse({
      cliente_id: UUID,
      etapa_entrada: "cereza",
      cantidad_cajuelas: "5",
      proceso_beneficiado_id: UUID,
    });
    expect(parsed.success).toBe(true);
  });

  it("rechaza cereza sin proceso de beneficiado", () => {
    expect(
      registrarPresupuestoSchema.safeParse({
        cliente_id: UUID,
        etapa_entrada: "cereza",
        cantidad_cajuelas: "5",
      }).success,
    ).toBe(false);
  });

  it("rechaza cereza sin cajuelas", () => {
    expect(
      registrarPresupuestoSchema.safeParse({
        cliente_id: UUID,
        etapa_entrada: "cereza",
        proceso_beneficiado_id: UUID,
      }).success,
    ).toBe(false);
  });
});

describe("agregarItemPresupuestoSchema", () => {
  it("acepta un tipo de proceso válido con kg positivo", () => {
    const parsed = agregarItemPresupuestoSchema.safeParse({
      presupuesto_id: UUID,
      tipo_proceso: "tueste",
      kg_estimado: "4",
    });
    expect(parsed.success).toBe(true);
  });

  it("rechaza kg_estimado 0", () => {
    expect(
      agregarItemPresupuestoSchema.safeParse({
        presupuesto_id: UUID,
        tipo_proceso: "molido",
        kg_estimado: "0",
      }).success,
    ).toBe(false);
  });

  it("rechaza un tipo de proceso inválido", () => {
    expect(
      agregarItemPresupuestoSchema.safeParse({
        presupuesto_id: UUID,
        tipo_proceso: "otro",
        kg_estimado: "4",
      }).success,
    ).toBe(false);
  });
});
