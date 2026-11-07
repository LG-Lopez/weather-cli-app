import { afterEach, describe, expect, test } from "bun:test";
import { fetchCurrentWeather, fetchDailyForecast } from "../../src/api/weather.ts";
import type { GeoResult } from "../../src/types/Weather.ts";
import { mockFetch, type FetchMock } from "../helpers/mockFetch.ts";
import {
  CURRENT_WEATHER_RESPONSE,
  DAILY_FORECAST_RESPONSE,
  jsonResponse,
} from "../helpers/openMeteoFixtures.ts";

const OTTAWA: GeoResult = {
  id: 6094817,
  name: "Ottawa",
  latitude: 45.41117,
  longitude: -75.69812,
  country: "Canadá",
};

let fetchMock: FetchMock | undefined;

afterEach(() => {
  fetchMock?.restore();
  fetchMock = undefined;
});

function install(handler: (url: string) => Response | Promise<Response>): FetchMock {
  fetchMock = mockFetch(handler);
  return fetchMock;
}

describe("fetchCurrentWeather (fetch simulado)", () => {
  test("mapea la respuesta y construye la URL con las coordenadas", async () => {
    const mocked = install(() => jsonResponse(CURRENT_WEATHER_RESPONSE));

    const weather = await fetchCurrentWeather(OTTAWA);

    expect(weather).toEqual({
      city: "Ottawa",
      country: "Canadá",
      latitude: 45.41117,
      longitude: -75.69812,
      temperatureC: 4.3,
      apparentTemperatureC: 1.2,
      weatherCode: 3,
      windKph: 14.5,
      time: "2026-11-07T12:00",
    });
    const [requested] = mocked.calls;
    if (!requested) {
      throw new Error("No se registró ninguna petición");
    }
    const url = new URL(requested);
    expect(`${url.origin}${url.pathname}`).toBe("https://api.open-meteo.com/v1/forecast");
    expect(url.searchParams.get("latitude")).toBe(String(OTTAWA.latitude));
    expect(url.searchParams.get("longitude")).toBe(String(OTTAWA.longitude));
    expect(url.searchParams.get("current")).toBe(
      "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
    );
  });

  test("lanza un error si la respuesta no trae datos actuales", async () => {
    install(() => jsonResponse({}));

    await expect(fetchCurrentWeather(OTTAWA)).rejects.toThrow(
      "La API de pronóstico devolvió una respuesta sin datos de clima",
    );
  });

  test("lanza un error con el status HTTP cuando la API falla", async () => {
    install(() => jsonResponse({}, 500));

    await expect(fetchCurrentWeather(OTTAWA)).rejects.toThrow(
      "Error consultando la API de pronóstico (HTTP 500)",
    );
  });
});

describe("fetchDailyForecast (fetch simulado)", () => {
  test("mapea los días y construye la URL con forecast_days y timezone", async () => {
    const mocked = install(() => jsonResponse(DAILY_FORECAST_RESPONSE));

    const forecast = await fetchDailyForecast(OTTAWA, 3);

    expect(forecast).toEqual({
      city: "Ottawa",
      country: "Canadá",
      latitude: 45.41117,
      longitude: -75.69812,
      days: [
        { date: "2026-11-07", maxC: 10.4, minC: -1.6 },
        { date: "2026-11-08", maxC: 11.2, minC: 0.4 },
        { date: "2026-11-09", maxC: 9.8, minC: -0.2 },
      ],
    });
    const [requested] = mocked.calls;
    if (!requested) {
      throw new Error("No se registró ninguna petición");
    }
    const url = new URL(requested);
    expect(url.searchParams.get("daily")).toBe(
      "temperature_2m_max,temperature_2m_min",
    );
    expect(url.searchParams.get("forecast_days")).toBe("3");
    expect(url.searchParams.get("timezone")).toBe("auto");
  });

  test("omite los días con datos incompletos", async () => {
    install(() =>
      jsonResponse({
        daily: {
          time: ["2026-11-07", "2026-11-08", "2026-11-09"],
          temperature_2m_max: [10.4, 11.2],
          temperature_2m_min: [-1.6, 0.4],
        },
      }),
    );

    const forecast = await fetchDailyForecast(OTTAWA, 3);

    expect(forecast.days).toHaveLength(2);
    expect(forecast.days.map((day) => day.date)).toEqual(["2026-11-07", "2026-11-08"]);
  });

  test("lanza un error si la respuesta no trae datos diarios", async () => {
    install(() => jsonResponse({}));

    await expect(fetchDailyForecast(OTTAWA)).rejects.toThrow(
      "La API de pronóstico devolvió una respuesta sin datos diarios",
    );
  });

  test("lanza un error con el status HTTP cuando falla la API", async () => {
    install(() => jsonResponse({}, 429));

    await expect(fetchDailyForecast(OTTAWA)).rejects.toThrow(
      "Error consultando la API de pronóstico (HTTP 429)",
    );
  });
});
