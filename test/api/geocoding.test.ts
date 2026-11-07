import { afterEach, describe, expect, test } from "bun:test";
import { searchCities } from "../../src/api/geocoding.ts";
import { mockFetch, type FetchMock } from "../helpers/mockFetch.ts";
import { GEOCODING_RESPONSE, jsonResponse } from "../helpers/openMeteoFixtures.ts";

let fetchMock: FetchMock | undefined;

afterEach(() => {
  fetchMock?.restore();
  fetchMock = undefined;
});

function install(handler: (url: string) => Response | Promise<Response>): FetchMock {
  fetchMock = mockFetch(handler);
  return fetchMock;
}

describe("searchCities (fetch simulado)", () => {
  test("construye la URL con el nombre codificado, idioma y formato esperados", async () => {
    const mocked = install(() => jsonResponse(GEOCODING_RESPONSE));

    const results = await searchCities("Buenos Aires", 3);

    expect(results).toEqual(GEOCODING_RESPONSE.results);
    expect(mocked.calls).toHaveLength(1);
    const [requested] = mocked.calls;
    if (!requested) {
      throw new Error("No se registró ninguna petición");
    }
    const url = new URL(requested);
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://geocoding-api.open-meteo.com/v1/search",
    );
    expect(url.searchParams.get("name")).toBe("Buenos Aires");
    expect(url.searchParams.get("count")).toBe("3");
    expect(url.searchParams.get("language")).toBe("es");
    expect(url.searchParams.get("format")).toBe("json");
  });

  test("devuelve una lista vacía cuando la respuesta no incluye results", async () => {
    install(() => jsonResponse({}));

    expect(await searchCities("Atlantis", 1)).toEqual([]);
  });

  test("lanza un error con el status HTTP cuando la API falla", async () => {
    install(() => jsonResponse({}, 503));

    await expect(searchCities("Ottawa", 1)).rejects.toThrow(
      "Error consultando la API de geocoding (HTTP 503)",
    );
  });
});
