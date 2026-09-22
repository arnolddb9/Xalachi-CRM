import { describe, it, expect } from "vitest";
import {
  registrarOrdenServicioSchema,
  aplicarPeladoSchema,
  aplicarBeneficiadoServicioSchema,
  aplicarTuesteServicioSchema,
  aplicarMolidoServicioSchema,
  aplicarClasificacionServicioSchema,
  tarifasServicioSchema,
} from "./schemas";

const UUID = "d290f1ee-6c54-4b01-90e6-d701748f0851";

describe("registrarOrdenServicioSchema", () => {
  it("acepta una orden en pergamino", () => {
    const parsed = registrarOrdenServicioSchema.safeParse({
      cliente_id: UUID,
      etapa_entrada: "pergamino",
      cantidad_kg: "10",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.cantidad_kg).toBe(10);
  });

  it("rechaza cantidad_kg 0 o negativa", () => {
    expect(
      registrarOrdenServicioSchema.safeParse({ cliente_id: UUID, etapa_entrada: "verde", cantidad_kg: "0" })
        .success,
    ).toBe(false);
  });

  it("rechaza una etapa de entrada inválida", () => {
    expect(
      registrarOrdenServicioSchema.safeParse({ cliente_id: UUID, etapa_entrada: "molido", cantidad_kg: "10" })
        .success,
    ).toBe(false);
  });

  it("acepta cereza con cajuelas y proceso de beneficiado", () => {
    const parsed = registrarOrdenServicioSchema.safeParse({
      cliente_id: UUID,
      etapa_entrada: "cereza",
      cantidad_cajuelas: "8",
      proceso_beneficiado_id: UUID,
    });
    expect(parsed.success).toBe(true);
  });

  it("rechaza cereza sin proceso de beneficiado", () => {
    expect(
      registrarOrdenServicioSchema.safeParse({
        cliente_id: UUID,
        etapa_entrada: "cereza",
        cantidad_cajuelas: "8",
      }).success,
    ).toBe(false);
  });

  it("rechaza cereza sin cajuelas", () => {
    expect(
      registrarOrdenServicioSchema.safeParse({
        cliente_id: UUID,
        etapa_entrada: "cereza",
        proceso_beneficiado_id: UUID,
      }).success,
    ).toBe(false);
  });
});

describe("aplicarBeneficiadoServicioSchema", () => {
  it("acepta kg y merma válidos", () => {
    const parsed = aplicarBeneficiadoServicioSchema.safeParse({
      lote_servicio_origen_id: UUID,
      kg_a_procesar: "4",
      merma_pct: "10",
    });
    expect(parsed.success).toBe(true);
  });

  it("rechaza kg_a_procesar 0", () => {
    expect(
      aplicarBeneficiadoServicioSchema.safeParse({
        lote_servicio_origen_id: UUID,
        kg_a_procesar: "0",
        merma_pct: "10",
      }).success,
    ).toBe(false);
  });
});

describe("aplicarPeladoSchema", () => {
  it("acepta kg y merma válidos", () => {
    const parsed = aplicarPeladoSchema.safeParse({
      lote_servicio_origen_id: UUID,
      kg_a_procesar: "5",
      merma_pct: "18",
    });
    expect(parsed.success).toBe(true);
  });

  it("rechaza kg_a_procesar 0", () => {
    expect(
      aplicarPeladoSchema.safeParse({ lote_servicio_origen_id: UUID, kg_a_procesar: "0", merma_pct: "10" })
        .success,
    ).toBe(false);
  });
});

describe("aplicarTuesteServicioSchema", () => {
  it("acepta perfil, kg y merma", () => {
    const parsed = aplicarTuesteServicioSchema.safeParse({
      lote_servicio_origen_id: UUID,
      perfil_tueste_id: UUID,
      kg_a_procesar: "3",
      merma_pct: "15",
    });
    expect(parsed.success).toBe(true);
  });

  it("rechaza si falta el perfil de tueste", () => {
    expect(
      aplicarTuesteServicioSchema.safeParse({
        lote_servicio_origen_id: UUID,
        kg_a_procesar: "3",
        merma_pct: "15",
      }).success,
    ).toBe(false);
  });
});

describe("aplicarMolidoServicioSchema", () => {
  it("acepta kg y merma sin perfil", () => {
    const parsed = aplicarMolidoServicioSchema.safeParse({
      lote_servicio_origen_id: UUID,
      kg_a_procesar: "2",
      merma_pct: "3",
    });
    expect(parsed.success).toBe(true);
  });

  it("rechaza merma fuera de rango", () => {
    expect(
      aplicarMolidoServicioSchema.safeParse({
        lote_servicio_origen_id: UUID,
        kg_a_procesar: "2",
        merma_pct: "150",
      }).success,
    ).toBe(false);
  });
});

describe("aplicarClasificacionServicioSchema", () => {
  it("acepta una división en varias calidades", () => {
    const parsed = aplicarClasificacionServicioSchema.safeParse({
      lote_servicio_origen_id: UUID,
      primera_kg: "3",
      segunda_kg: "2",
      tercera_kg: "",
      rechazo_kg: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.primera_kg).toBe(3);
  });

  it("rechaza si todas las calidades quedan en 0", () => {
    expect(
      aplicarClasificacionServicioSchema.safeParse({
        lote_servicio_origen_id: UUID,
        primera_kg: "0",
        segunda_kg: "",
        tercera_kg: "",
        rechazo_kg: "",
      }).success,
    ).toBe(false);
  });
});

describe("tarifasServicioSchema", () => {
  it("acepta las 5 tarifas", () => {
    const parsed = tarifasServicioSchema.safeParse({
      pelado: "3",
      clasificacion: "2",
      tueste: "10",
      molido: "1.5",
      beneficiado: "4",
    });
    expect(parsed.success).toBe(true);
  });

  it("rechaza una tarifa negativa", () => {
    expect(
      tarifasServicioSchema.safeParse({
        pelado: "-1",
        clasificacion: "2",
        tueste: "10",
        molido: "1.5",
        beneficiado: "4",
      }).success,
    ).toBe(false);
  });
});
