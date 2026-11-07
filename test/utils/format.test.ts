import { describe, expect, test } from "bun:test";
import type { DailyForecast, WeatherInfo } from "../../src/types/Weather.ts";
import {
  describeWeatherCode,
  formatForecast,
  formatWeather,
  weatherIcon,
} from "../../src/utils/format.ts";
import { stripAnsi } from "../helpers/stripAnsi.ts";

const WEATHER_CODES: Array<[number, string]> = [
  [0, "Despejado"],
  [1, "Mayormente despejado"],
  [2, "Parcialmente nublado"],
  [3, "Nublado"],
  [45, "Niebla"],
  [48, "Niebla"],
  [51, "Lluvia"],
  [53, "Lluvia"],
  [55, "Lluvia"],
  [56, "Lluvia congelada"],
  [57, "Lluvia congelada"],
  [61, "Lluvia"],
  [63, "Lluvia"],
  [65, "Lluvia"],
  [66, "Lluvia congelada"],
  [67, "Lluvia congelada"],
  [71, "Nieve"],
  [73, "Nieve"],
  [75, "Nieve"],
  [77, "Nieve"],
  [80, "Lluvia"],
  [81, "Lluvia"],
  [82, "Lluvia"],
  [85, "Nieve"],
  [86, "Nieve"],
  [95, "Tormenta"],
  [96, "Tormenta"],
  [99, "Tormenta"],
  [999, "Condiciones desconocidas"],
];

const WEATHER_ICONS: Array<[number, string]> = [
  [0, "☀️"],
  [1, "🌤️"],
  [2, "⛅"],
  [3, "☁️"],
  [45, "🌫️"],
  [48, "🌫️"],
  [51, "🌧️"],
  [53, "🌧️"],
  [55, "🌧️"],
  [56, "🌨️"],
  [57, "🌨️"],
  [61, "🌧️"],
  [63, "🌧️"],
  [65, "🌧️"],
  [66, "🌨️"],
  [67, "🌨️"],
  [71, "❄️"],
  [73, "❄️"],
  [75, "❄️"],
  [77, "❄️"],
  [80, "🌧️"],
  [81, "🌧️"],
  [82, "🌧️"],
  [85, "❄️"],
  [86, "❄️"],
  [95, "⛈️"],
  [96, "⛈️"],
  [99, "⛈️"],
  [999, "🌡️"],
];

const weather: WeatherInfo = {
  city: "Ottawa",
  country: "Canadá",
  latitude: 45.41117,
  longitude: -75.69812,
  temperatureC: 21.6,
  apparentTemperatureC: 20.2,
  weatherCode: 0,
  windKph: 12.4,
  time: "2026-11-07T12:00",
};

const forecast: DailyForecast = {
  city: "Ottawa",
  country: "Canadá",
  latitude: 45.41117,
  longitude: -75.69812,
  days: [
    { date: "2026-11-07", maxC: 10.4, minC: -1.6 },
    { date: "2026-11-08", maxC: 0, minC: -10 },
  ],
};

describe("describeWeatherCode", () => {
  for (const [code, expected] of WEATHER_CODES) {
    test(`traduce el código ${code} a "${expected}"`, () => {
      expect(describeWeatherCode(code)).toBe(expected);
    });
  }
});

describe("weatherIcon", () => {
  for (const [code, expected] of WEATHER_ICONS) {
    test(`devuelve el icono correcto para el código ${code}`, () => {
      expect(weatherIcon(code)).toBe(expected);
    });
  }
});

describe("formatWeather", () => {
  test("muestra ciudad, temperatura en °C, sensación y viento redondeado", () => {
    const output = stripAnsi(formatWeather(weather, "C"));

    expect(output).toContain("Ottawa");
    expect(output).toContain("22°C");
    expect(output).toContain("Sensación: 20°C");
    expect(output).toContain("Viento: 12 km/h");
    expect(output).toContain("Despejado");
  });

  test("convierte la temperatura a °F", () => {
    const output = stripAnsi(formatWeather(weather, "F"));

    expect(output).toContain("71°F");
    expect(output).toContain("Sensación: 68°F");
  });
});

describe("formatForecast", () => {
  test("incluye el encabezado y las temperaturas en °C", () => {
    const output = stripAnsi(formatForecast(forecast, "C"));

    expect(output).toContain("Pronóstico de 7 días para Ottawa");
    expect(output).toContain("10°C");
    expect(output).toContain("-2°C");
    expect(output).toContain("0°C");
    expect(output).toContain("-10°C");
  });

  test("convierte las temperaturas del pronóstico a °F", () => {
    const output = stripAnsi(formatForecast(forecast, "F"));

    expect(output).toContain("51°F");
    expect(output).toContain("29°F");
    expect(output).toContain("32°F");
    expect(output).toContain("14°F");
  });

  test("mantiene la fecha original si no tiene el formato esperado", () => {
    const output = stripAnsi(
      formatForecast(
        { ...forecast, days: [{ date: "2026-11", maxC: 1, minC: 0 }] },
        "C",
      ),
    );

    expect(output).toContain("2026-11");
  });
});
