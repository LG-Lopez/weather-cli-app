import { afterEach, describe, expect, test } from "bun:test";
import { getWeather } from "../../src/actions/getWeather.ts";
import { CityNotFoundError } from "../../src/errors/CityNotFoundError.ts";
import { mockFetch, type FetchMock } from "../helpers/mockFetch.ts";
import {
  CURRENT_WEATHER_RESPONSE,
  GEOCODING_RESPONSE,
  jsonResponse,
} from "../helpers/openMeteoFixtures.ts";

let fetchMock: FetchMock | undefined;

afterEach(() => {
  fetchMock?.restore();
  fetchMock = undefined;
});

describe("getWeather (fetch simulado)", () => {
  test("busca la ciudad y devuelve su clima actual", async () => {
    fetchMock = mockFetch((url) =>
      url.includes("geocoding-api")
        ? jsonResponse(GEOCODING_RESPONSE)
        : jsonResponse(CURRENT_WEATHER_RESPONSE),
    );

    const weather = await getWeather("Ottawa");

    expect(weather.city).toBe("Ottawa");
    expect(weather.temperatureC).toBe(4.3);
    expect(fetchMock.calls).toHaveLength(2);
    expect(fetchMock.calls[0]).toContain("geocoding-api.open-meteo.com");
    expect(fetchMock.calls[1]).toContain("api.open-meteo.com");
  });

  test("lanza CityNotFoundError y no consulta el pronóstico si no hay resultados", async () => {
    fetchMock = mockFetch(() => jsonResponse({}));

    const promise = getWeather("Atlantis");

    await expect(promise).rejects.toBeInstanceOf(CityNotFoundError);
    await expect(promise).rejects.toMatchObject({ query: "Atlantis" });
    expect(fetchMock.calls).toHaveLength(1);
  });
});
