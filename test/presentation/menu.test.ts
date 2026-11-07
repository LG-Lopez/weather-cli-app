import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { runMenu } from "../../src/presentation/menu.ts";
import { loadSettings, saveSettings } from "../../src/storage/settingsStorage.ts";
import type { CitySettings } from "../../src/types/Settings.ts";
import { mockFetch, type FetchMock } from "../helpers/mockFetch.ts";
import {
  CURRENT_WEATHER_RESPONSE,
  DAILY_FORECAST_RESPONSE,
  GEOCODING_RESULT,
  jsonResponse,
} from "../helpers/openMeteoFixtures.ts";
import { stripAnsi } from "../helpers/stripAnsi.ts";
import { withTemporaryStorage } from "../helpers/temporaryStorage.ts";

const originalPrompt = globalThis.prompt;
const originalLog = console.log;
const originalClear = console.clear;

const PASTO_RESULTS = [
  {
    id: 1,
    name: "Pasto",
    latitude: 1.2,
    longitude: -77.3,
    admin1: "Nariño",
    country: "Colombia",
  },
  {
    id: 2,
    name: "Pasto",
    latitude: 1.3,
    longitude: -77.2,
    admin1: "Cauca",
    country: "Colombia",
  },
];

let output: string[] = [];
let fetchMock: FetchMock | undefined;

beforeEach(() => {
  output = [];
  console.log = (...args: unknown[]) => {
    output.push(stripAnsi(args.map((arg) => String(arg)).join(" ")));
  };
  console.clear = () => {};
});

afterEach(() => {
  fetchMock?.restore();
  fetchMock = undefined;
  globalThis.prompt = originalPrompt;
  console.log = originalLog;
  console.clear = originalClear;
});

function queuePrompts(responses: Array<string | null>): void {
  const queue = [...responses];
  globalThis.prompt = (() => queue.shift() ?? null) as unknown as typeof prompt;
}

function settings(partial: Partial<CitySettings> = {}): CitySettings {
  return { defaultCity: null, savedCities: [], unit: "C", ...partial };
}

async function run(
  responses: Array<string | null>,
  initial: CitySettings = settings(),
): Promise<string> {
  queuePrompts(responses);
  await runMenu(initial);
  return output.join("\n");
}

function installWeatherFetch(): FetchMock {
  fetchMock = mockFetch((url) => {
    if (url.includes("geocoding-api")) {
      const name = new URL(url).searchParams.get("name") ?? "Ottawa";
      return jsonResponse({ results: [{ ...GEOCODING_RESULT, name }] });
    }
    if (url.includes("daily=")) {
      return jsonResponse(DAILY_FORECAST_RESPONSE);
    }
    return jsonResponse(CURRENT_WEATHER_RESPONSE);
  });
  return fetchMock;
}

describe("runMenu", () => {
  test("sale al seleccionar la opción 9", () =>
    withTemporaryStorage(async () => {
      const text = await run(["9"]);

      expect(text).toContain("WEATHER CLI");
    }));

  test("sale con entrada vacía", () =>
    withTemporaryStorage(async () => {
      const text = await run([""]);

      expect(text).toContain("WEATHER CLI");
    }));

  test("muestra un error para una opción inválida", () =>
    withTemporaryStorage(async () => {
      const text = await run(["abc", "9"]);

      expect(text).toContain("Opción no válida");
    }));

  test("opción 1 avisa si no hay ciudad default", () =>
    withTemporaryStorage(async () => {
      const text = await run(["1", "2"]);

      expect(text).toContain("No hay ninguna ciudad default configurada");
    }));

  test("opción 1 muestra el clima de la ciudad default", () =>
    withTemporaryStorage(async () => {
      installWeatherFetch();

      const text = await run(
        ["1", "2"],
        settings({ defaultCity: "Ottawa", savedCities: ["Ottawa"] }),
      );

      expect(text).toContain("Consultando el clima de Ottawa");
      expect(text).toContain("Ottawa");
      expect(text).toContain("4°C");
    }));

  test("opción 1 avisa si la ciudad default no existe", () =>
    withTemporaryStorage(async () => {
      fetchMock = mockFetch(() => jsonResponse({}));

      const text = await run(
        ["1", "2"],
        settings({ defaultCity: "Atlantis", savedCities: ["Atlantis"] }),
      );

      expect(text).toContain('No se encontró la ciudad "Atlantis"');
    }));

  test("opción 1 reporta errores de la API", () =>
    withTemporaryStorage(async () => {
      fetchMock = mockFetch((url) =>
        url.includes("geocoding-api")
          ? jsonResponse({ results: [GEOCODING_RESULT] })
          : jsonResponse({}, 500),
      );

      const text = await run(
        ["1", "9"],
        settings({ defaultCity: "Ottawa", savedCities: ["Ottawa"] }),
      );

      expect(text).toContain("Error: Error consultando la API de pronóstico (HTTP 500)");
    }));

  test("opción 2 avisa si no hay ciudades registradas", () =>
    withTemporaryStorage(async () => {
      const text = await run(["2", "2"]);

      expect(text).toContain("No hay ciudades registradas");
    }));

  test("opción 2 consulta el clima de todas las ciudades", () =>
    withTemporaryStorage(async () => {
      installWeatherFetch();

      const text = await run(["2", "2"], settings({ savedCities: ["Ottawa", "Lima"] }));

      expect(text).toContain("Consultando el clima de las ciudades registradas");
      expect(text).toContain("Ottawa");
      expect(text).toContain("Lima");
    }));

  test("opción 2 informa las ciudades cuyo clima falla", () =>
    withTemporaryStorage(async () => {
      fetchMock = mockFetch(() => jsonResponse({}));

      const text = await run(["2", "2"], settings({ savedCities: ["Atlantis"] }));

      expect(text).toContain("No se pudo obtener el clima de Atlantis");
    }));

  test("opción 3 agrega una ciudad encontrada", () =>
    withTemporaryStorage(async () => {
      installWeatherFetch();

      const text = await run(["3", "Ottawa", "2"]);

      expect(text).toContain('Agregando "Ottawa"');
      expect((await loadSettings()).savedCities).toEqual(["Ottawa"]);
    }));

  test("opción 3 permite elegir entre varias coincidencias", () =>
    withTemporaryStorage(async () => {
      fetchMock = mockFetch((url) => {
        if (url.includes("geocoding-api")) {
          return jsonResponse({ results: PASTO_RESULTS });
        }
        return jsonResponse(CURRENT_WEATHER_RESPONSE);
      });

      const text = await run(["3", "Pasto", "1", "2"]);

      expect(text).toContain("Se encontraron varias coincidencias");
      expect((await loadSettings()).savedCities).toEqual(["Pasto"]);
    }));

  test("opción 3 cancela la selección de una coincidencia", () =>
    withTemporaryStorage(async () => {
      fetchMock = mockFetch((url) =>
        url.includes("geocoding-api")
          ? jsonResponse({ results: PASTO_RESULTS })
          : jsonResponse(CURRENT_WEATHER_RESPONSE),
      );

      const text = await run(["3", "Pasto", "0", "2"]);

      expect(text).toContain("Operación cancelada");
      expect((await loadSettings()).savedCities).toEqual([]);
    }));

  test("opción 3 informa si no hay coincidencias", () =>
    withTemporaryStorage(async () => {
      fetchMock = mockFetch(() => jsonResponse({}));

      const text = await run(["3", "Atlantis", "2"]);

      expect(text).toContain('No se encontró ninguna ciudad para "Atlantis"');
    }));

  test("opción 3 ignora una búsqueda vacía", () =>
    withTemporaryStorage(async () => {
      const text = await run(["3", "", "2"]);

      expect(text).toContain("WEATHER CLI");
    }));

  test("opción 3 reporta errores de red al consultar el clima", () =>
    withTemporaryStorage(async () => {
      fetchMock = mockFetch((url) =>
        url.includes("geocoding-api")
          ? jsonResponse({ results: [GEOCODING_RESULT] })
          : jsonResponse({}, 500),
      );

      const text = await run(["3", "Ottawa", "9"]);

      expect(text).toContain("Error: Error consultando la API de pronóstico (HTTP 500)");
      expect((await loadSettings()).savedCities).toEqual(["Ottawa"]);
    }));

  test("opción 4 elimina una ciudad", () =>
    withTemporaryStorage(async () => {
      await saveSettings(settings({ savedCities: ["Ottawa", "Lima"] }));

      const text = await run(["4", "1", "2"]);

      expect(text).toContain('Eliminando "Ottawa"');
      expect((await loadSettings()).savedCities).toEqual(["Lima"]);
    }));

  test("opción 4 avisa si no hay ciudades registradas", () =>
    withTemporaryStorage(async () => {
      const text = await run(["4", "2"]);

      expect(text).toContain("No hay ciudades registradas para eliminar");
    }));

  test("opción 4 cancela la eliminación", () =>
    withTemporaryStorage(async () => {
      await saveSettings(settings({ savedCities: ["Ottawa"] }));

      const text = await run(["4", "0", "2"]);

      expect(text).toContain("Operación cancelada");
      expect((await loadSettings()).savedCities).toEqual(["Ottawa"]);
    }));

  test("opción 5 establece la ciudad default desde la lista", () =>
    withTemporaryStorage(async () => {
      await saveSettings(settings({ savedCities: ["Ottawa", "Lima"] }));

      await run(["5", "2", "2"]);

      expect((await loadSettings()).defaultCity).toBe("Lima");
    }));

  test("opción 5 permite ingresar una ciudad nueva", () =>
    withTemporaryStorage(async () => {
      const text = await run(["5", "Bogotá", "2"]);

      expect(text).toContain('Estableciendo "Bogotá"');
      expect((await loadSettings()).defaultCity).toBe("Bogotá");
      expect((await loadSettings()).savedCities).toEqual(["Bogotá"]);
    }));

  test("opción 5 cancela si no se ingresa una ciudad", () =>
    withTemporaryStorage(async () => {
      const text = await run(["5", "", "2"]);

      expect(text).toContain("Operación cancelada");
      expect((await loadSettings()).defaultCity).toBeNull();
    }));

  test("opción 6 usa la ciudad default", () =>
    withTemporaryStorage(async () => {
      installWeatherFetch();

      const text = await run(
        ["6", "2"],
        settings({ defaultCity: "Ottawa", savedCities: ["Ottawa"] }),
      );

      expect(text).toContain("Pronóstico de 7 días para Ottawa");
    }));

  test("opción 6 permite elegir una ciudad si no hay default", () =>
    withTemporaryStorage(async () => {
      installWeatherFetch();

      const text = await run(["6", "1", "2"], settings({ savedCities: ["Ottawa", "Lima"] }));

      expect(text).toContain("Pronóstico de 7 días para Ottawa");
    }));

  test("opción 6 pide una ciudad si no hay default ni ciudades", () =>
    withTemporaryStorage(async () => {
      installWeatherFetch();

      const text = await run(["6", "Bogotá", "2"]);

      expect(text).toContain("Pronóstico de 7 días para Bogotá");
    }));

  test("opción 6 cancela si no se elige ciudad", () =>
    withTemporaryStorage(async () => {
      const text = await run(["6", "0", "2"], settings({ savedCities: ["Ottawa"] }));

      expect(text).toContain("Operación cancelada");
    }));

  test("opción 6 avisa si la ciudad no existe", () =>
    withTemporaryStorage(async () => {
      fetchMock = mockFetch(() => jsonResponse({}));

      const text = await run(["6", "1", "2"], settings({ savedCities: ["Atlantis"] }));

      expect(text).toContain('No se encontró la ciudad "Atlantis"');
    }));

  test("opción 8 cambia la unidad a Fahrenheit", () =>
    withTemporaryStorage(async () => {
      const text = await run(["8", "2", "2"]);

      expect(text).toContain("Fahrenheit");
      expect((await loadSettings()).unit).toBe("F");
    }));

  test("opción 3 descarta coincidencias duplicadas", () =>
    withTemporaryStorage(async () => {
      fetchMock = mockFetch((url) => {
        if (url.includes("geocoding-api")) {
          return jsonResponse({
            results: [PASTO_RESULTS[0], PASTO_RESULTS[0], PASTO_RESULTS[1]],
          });
        }
        return jsonResponse(CURRENT_WEATHER_RESPONSE);
      });

      const text = await run(["3", "Pasto", "1", "2"]);

      expect(text).toContain("Se encontraron varias coincidencias");
      expect((await loadSettings()).savedCities).toEqual(["Pasto"]);
    }));

  test("opción 3 avisa si la ciudad no existe al consultar el clima", () =>
    withTemporaryStorage(async () => {
      let geocodingCalls = 0;
      fetchMock = mockFetch((url) => {
        if (url.includes("geocoding-api")) {
          geocodingCalls++;
          if (geocodingCalls === 1) {
            return jsonResponse({ results: [GEOCODING_RESULT] });
          }
          return jsonResponse({});
        }
        return jsonResponse(CURRENT_WEATHER_RESPONSE);
      });

      const text = await run(["3", "Ottawa", "2"]);

      expect(text).toContain('No se encontró la ciudad "Ottawa"');
      expect((await loadSettings()).savedCities).toEqual(["Ottawa"]);
    }));

  test("opción 5 cancela si la selección no es válida", () =>
    withTemporaryStorage(async () => {
      await saveSettings(settings({ savedCities: ["Ottawa", "Lima"] }));

      const text = await run(["5", "0", "2"]);

      expect(text).toContain("Operación cancelada");
      expect((await loadSettings()).defaultCity).toBeNull();
    }));

  test("opción 6 reporta errores de la API", () =>
    withTemporaryStorage(async () => {
      fetchMock = mockFetch((url) =>
        url.includes("geocoding-api")
          ? jsonResponse({ results: [GEOCODING_RESULT] })
          : jsonResponse({}, 500),
      );

      const text = await run(
        ["6", "9"],
        settings({ defaultCity: "Ottawa", savedCities: ["Ottawa"] }),
      );

      expect(text).toContain("Error: Error consultando la API de pronóstico (HTTP 500)");
    }));
});
