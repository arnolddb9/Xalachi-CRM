import { describe, it, expect } from "vitest";
import {
  registrarLoteSchema,
  actualizarLoteSchema,
  iniciarOAvanzarBeneficiadoSchema,
  aplicarTrilladoSchema,
  aplicarTuesteSchema,
  aplicarMolidoSchema,
  empacarLoteSchema,
  clasificarCalidadSchema,
  configuracionSchema,
} from "./schemas";

const UUID = "d290f1ee-6c54-4b01-90e6-d701748f0851";

describe("registrarLoteSchema", () => {
  it("un lote en cereza requiere cajuelas, no peso directo", () => {
    const parsed = registrarLoteSchema.safeParse({
      variedad_id: UUID,
      etapa: "cereza",
      cantidad_cajuelas: "8",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.cantidad_cajuelas).toBe(8);
      expect(parsed.data.proveedor_id).toBeNull();
    }
  });

  it("rechaza cereza sin cajuelas aunque venga un peso suelto", () => {
    const parsed = registrarLoteSchema.safeParse({
      variedad_id: UUID,
      etapa: "cereza",
      peso_actual_kg: "100",
    });
    expect(parsed.success).toBe(false);
  });

  it("un lote en pergamino/verde requiere peso directo, no cajuelas", () => {
    const parsed = registrarLoteSchema.safeParse({
      variedad_id: UUID,
      etapa: "pergamino",
      peso_actual_kg: "80",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.peso_actual_kg).toBe(80);
  });

  it("rechaza peso negativo o cero en pergamino", () => {
    expect(
      registrarLoteSchema.safeParse({ variedad_id: UUID, etapa: "pergamino", peso_actual_kg: "0" })
        .success,
    ).toBe(false);
  });

  it("rechaza una etapa inválida", () => {
    expect(
      registrarLoteSchema.safeParse({
        variedad_id: UUID,
        etapa: "tostado",
        peso_actual_kg: "10",
      }).success,
    ).toBe(false);
  });

  it("acepta finca y número de cama de secado opcionales", () => {
    const parsed = registrarLoteSchema.safeParse({
      variedad_id: UUID,
      etapa: "cereza",
      cantidad_cajuelas: "8",
      finca_id: UUID,
      numero_cama_secado: "12",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.finca_id).toBe(UUID);
      expect(parsed.data.numero_cama_secado).toBe("12");
    }
  });

  it("finca y cama de secado quedan en null si se omiten", () => {
    const parsed = registrarLoteSchema.safeParse({
      variedad_id: UUID,
      etapa: "cereza",
      cantidad_cajuelas: "8",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.finca_id).toBeNull();
      expect(parsed.data.numero_cama_secado).toBeNull();
    }
  });
});

describe("actualizarLoteSchema", () => {
  it("valida igual que registrar (misma forma de datos)", () => {
    expect(
      actualizarLoteSchema.safeParse({ variedad_id: UUID, etapa: "verde", peso_actual_kg: "50" })
        .success,
    ).toBe(true);
  });
});

describe("iniciarOAvanzarBeneficiadoSchema", () => {
  it("acepta una merma dentro de rango, con proceso opcional", () => {
    const parsed = iniciarOAvanzarBeneficiadoSchema.safeParse({
      lote_origen_id: UUID,
      proceso_beneficiado_id: UUID,
      merma_pct: "18.5",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.merma_pct).toBe(18.5);
  });

  it("rechaza merma fuera de 0-100", () => {
    expect(
      iniciarOAvanzarBeneficiadoSchema.safeParse({
        lote_origen_id: UUID,
        merma_pct: "150",
      }).success,
    ).toBe(false);
  });
});

describe("aplicarTrilladoSchema", () => {
  it("acepta una merma dentro de rango", () => {
    const parsed = aplicarTrilladoSchema.safeParse({ lote_origen_id: UUID, merma_pct: "12" });
    expect(parsed.success).toBe(true);
  });

  it("rechaza merma negativa", () => {
    expect(
      aplicarTrilladoSchema.safeParse({ lote_origen_id: UUID, merma_pct: "-1" }).success,
    ).toBe(false);
  });
});

describe("aplicarTuesteSchema", () => {
  it("acepta un perfil, cantidad a tostar y una merma dentro de rango", () => {
    const parsed = aplicarTuesteSchema.safeParse({
      lote_origen_id: UUID,
      perfil_tueste_id: UUID,
      kg_a_procesar: "5",
      merma_pct: "15",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.kg_a_procesar).toBe(5);
  });

  it("rechaza si falta el perfil de tueste", () => {
    expect(
      aplicarTuesteSchema.safeParse({ lote_origen_id: UUID, kg_a_procesar: "5", merma_pct: "15" })
        .success,
    ).toBe(false);
  });

  it("rechaza cantidad a procesar 0 o negativa", () => {
    expect(
      aplicarTuesteSchema.safeParse({
        lote_origen_id: UUID,
        perfil_tueste_id: UUID,
        kg_a_procesar: "0",
        merma_pct: "15",
      }).success,
    ).toBe(false);
  });
});

describe("aplicarMolidoSchema", () => {
  it("acepta cantidad a moler y una merma dentro de rango, sin perfil", () => {
    const parsed = aplicarMolidoSchema.safeParse({
      lote_origen_id: UUID,
      kg_a_procesar: "3",
      merma_pct: "3",
    });
    expect(parsed.success).toBe(true);
  });

  it("rechaza merma fuera de rango", () => {
    expect(
      aplicarMolidoSchema.safeParse({ lote_origen_id: UUID, kg_a_procesar: "3", merma_pct: "101" })
        .success,
    ).toBe(false);
  });

  it("rechaza si falta la cantidad a procesar", () => {
    expect(
      aplicarMolidoSchema.safeParse({ lote_origen_id: UUID, merma_pct: "3" }).success,
    ).toBe(false);
  });
});

describe("empacarLoteSchema", () => {
  it("acepta unidades con insumo opcional", () => {
    const parsed = empacarLoteSchema.safeParse({
      lote_origen_id: UUID,
      articulo_id: UUID,
      presentacion_id: UUID,
      unidades: "20",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.unidades).toBe(20);
      expect(parsed.data.insumo_articulo_id).toBeNull();
    }
  });

  it("acepta un insumo de empaque cuando se indica", () => {
    const parsed = empacarLoteSchema.safeParse({
      lote_origen_id: UUID,
      articulo_id: UUID,
      presentacion_id: UUID,
      unidades: "20",
      insumo_articulo_id: UUID,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.insumo_articulo_id).toBe(UUID);
  });

  it("rechaza unidades 0 o negativas", () => {
    expect(
      empacarLoteSchema.safeParse({
        lote_origen_id: UUID,
        articulo_id: UUID,
        presentacion_id: UUID,
        unidades: "0",
      }).success,
    ).toBe(false);
  });
});

describe("clasificarCalidadSchema", () => {
  it("acepta una división en varias calidades", () => {
    const parsed = clasificarCalidadSchema.safeParse({
      lote_origen_id: UUID,
      primera_kg: "50",
      segunda_kg: "20",
      tercera_kg: "",
      rechazo_kg: "5",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.primera_kg).toBe(50);
      expect(parsed.data.tercera_kg).toBe(0);
    }
  });

  it("rechaza si todas las calidades quedan en 0", () => {
    const parsed = clasificarCalidadSchema.safeParse({
      lote_origen_id: UUID,
      primera_kg: "0",
      segunda_kg: "",
      tercera_kg: "",
      rechazo_kg: "",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("configuracionSchema", () => {
  it("acepta un factor positivo", () => {
    const parsed = configuracionSchema.safeParse({ factor_kg_por_cajuela: "13.6" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.factor_kg_por_cajuela).toBe(13.6);
  });

  it("rechaza un factor de 0 o negativo", () => {
    expect(configuracionSchema.safeParse({ factor_kg_por_cajuela: "0" }).success).toBe(false);
    expect(configuracionSchema.safeParse({ factor_kg_por_cajuela: "-5" }).success).toBe(false);
  });
});
