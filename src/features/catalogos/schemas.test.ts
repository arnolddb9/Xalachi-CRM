import { describe, it, expect } from "vitest";
import { variedadSchema, clienteSchema, articuloSchema } from "./schemas";

describe("variedadSchema", () => {
  it("acepta un nombre válido sin descripción", () => {
    const parsed = variedadSchema.safeParse({ nombre: "Bourbon" });
    expect(parsed.success).toBe(true);
  });

  it("rechaza nombre vacío", () => {
    const parsed = variedadSchema.safeParse({ nombre: "" });
    expect(parsed.success).toBe(false);
  });

  it("convierte descripción vacía a null", () => {
    const parsed = variedadSchema.safeParse({ nombre: "Typica", descripcion: "" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.descripcion).toBeNull();
  });
});

describe("clienteSchema", () => {
  it("acepta un cliente de mayoreo válido", () => {
    const parsed = clienteSchema.safeParse({
      nombre: "Café La Esquina",
      tipo: "mayoreo",
      email: "contacto@laesquina.test",
    });
    expect(parsed.success).toBe(true);
  });

  it("rechaza un tipo inválido", () => {
    const parsed = clienteSchema.safeParse({ nombre: "Juan Pérez", tipo: "otro" });
    expect(parsed.success).toBe(false);
  });

  it("rechaza un correo con formato inválido", () => {
    const parsed = clienteSchema.safeParse({
      nombre: "Juan Pérez",
      tipo: "menudeo",
      email: "no-es-un-correo",
    });
    expect(parsed.success).toBe(false);
  });

  it("acepta correo vacío como null", () => {
    const parsed = clienteSchema.safeParse({
      nombre: "Juan Pérez",
      tipo: "menudeo",
      email: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.email).toBeNull();
  });
});

describe("articuloSchema", () => {
  it("acepta un insumo válido", () => {
    const parsed = articuloSchema.safeParse({
      nombre: "Bolsas kraft 1kg",
      tipo: "insumo",
      unidad_medida: "pieza",
    });
    expect(parsed.success).toBe(true);
  });

  it("rechaza un tipo inválido", () => {
    const parsed = articuloSchema.safeParse({
      nombre: "Café tostado de otro productor",
      tipo: "otro",
      unidad_medida: "kg",
    });
    expect(parsed.success).toBe(false);
  });

  it("rechaza unidad de medida vacía", () => {
    const parsed = articuloSchema.safeParse({
      nombre: "Etiquetas",
      tipo: "insumo",
      unidad_medida: "",
    });
    expect(parsed.success).toBe(false);
  });
});
