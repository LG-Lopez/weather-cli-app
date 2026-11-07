import { describe, expect, test } from "bun:test";
import { CityNotFoundError } from "../../src/errors/CityNotFoundError.ts";

describe("CityNotFoundError", () => {
  test("es un Error con nombre, consulta y mensaje descriptivos", () => {
    const error = new CityNotFoundError("Atlantis");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CityNotFoundError);
    expect(error.name).toBe("CityNotFoundError");
    expect(error.query).toBe("Atlantis");
    expect(error.message).toBe('No se encontró la ciudad "Atlantis"');
  });
});
