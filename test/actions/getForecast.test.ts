import { afterEach, describe, expect, test } from "bun:test";
import { getForecast } from "../../src/actions/getForecast.ts";
import { CityNotFoundError } from "../../src/errors/CityNotFoundError.ts";
import { mockFetch, type FetchMock } from "../helpers/mockFetch.ts";
import {
  DAILY_FORECAST_RESPONSE,
  GEOCODING_RESPONSE,
  jsonResponse,
} from "../helpers/openMeteoFixtures.ts";

let fetchMock: FetchMock | undefined;

afterEach(() => {
  fetchMock?.restore();
  fetchMock = undefined;
});

describe("getForecast (fetch simulado)", () => {
  test("busca la ciudad y devuelve su pronóstico", async () => {
    fetchMock = mockFetch((url) =>
      url.includes("geocoding-api")
        ? jsonResponse(GEOCODING_RESPONSE)
        : jsonResponse(DAILY_FORECAST_RESPONSE),
    );

    const forecast = await getForecast("Ottawa", 3);

    expect(forecast.city).toBe("Ottawa");
    expect(forecast.days).toHaveLength(3);
    expect(fetchMock.calls).toHaveLength(2);
    expect(fetchMock.calls[0]).toContain("geocoding-api.open-meteo.com");
    expect(fetchMock.calls[1]).toContain("forecast_days=3");
  });

  test("lanza CityNotFoundError y no consulta el pronóstico si no hay resultados", async () => {
    fetchMock = mockFetch(() => jsonResponse({}));

    const promise = getForecast("Atlantis");

    await expect(promise).rejects.toBeInstanceOf(CityNotFoundError);
    await expect(promise).rejects.toMatchObject({ query: "Atlantis" });
    expect(fetchMock.calls).toHaveLength(1);
  });
});
