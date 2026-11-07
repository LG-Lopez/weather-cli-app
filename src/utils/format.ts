import type { Unit } from "../types/Settings.ts";
import type { DailyForecast, WeatherInfo } from "../types/Weather.ts";
import { cyan, paint, temp } from "./colors.ts";

function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

function temperatureValue(celsius: number, unit: Unit): string {
  const value = unit === "F" ? celsiusToFahrenheit(celsius) : celsius;
  return `${Math.round(value)}°${unit}`;
}

function formatTemperature(celsius: number, unit: Unit): string {
  return paint(temperatureValue(celsius, unit), temp);
}

export function formatWeather(weather: WeatherInfo, unit: Unit): string {
  const icon = weatherIcon(weather.weatherCode);
  const conditions = describeWeatherCode(weather.weatherCode);
  const lines = [
    `${icon}  ${weather.city}`,
    `    ${formatTemperature(weather.temperatureC, unit)} · ${conditions}`,
    `    Sensación: ${formatTemperature(weather.apparentTemperatureC, unit)} · Viento: ${Math.round(weather.windKph)} km/h`,
  ];
  return lines.join("\n");
}

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  weekday: "short",
  day: "2-digit",
});

function formatDayLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    return date;
  }
  const label = DAY_LABEL_FORMATTER.format(new Date(year, month - 1, day));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatForecast(forecast: DailyForecast, unit: Unit): string {
  const header = paint(`  ${"Día".padEnd(14)}${"Máx".padStart(6)}${"Mín".padStart(8)}`, cyan);
  const rows = forecast.days.map((day) => {
    const label = formatDayLabel(day.date).padEnd(14);
    const max = temperatureValue(day.maxC, unit).padStart(6);
    const min = temperatureValue(day.minC, unit).padStart(8);
    return `  ${label}${paint(max, temp)}${paint(min, temp)}`;
  });
  return [`Pronóstico de 7 días para ${forecast.city}`, "", header, ...rows].join("\n");
}

export function describeWeatherCode(code: number): string {
  switch (code) {
    case 0:
      return "Despejado";
    case 1:
      return "Mayormente despejado";
    case 2:
      return "Parcialmente nublado";
    case 3:
      return "Nublado";
    case 45:
    case 48:
      return "Niebla";
    case 51:
    case 53:
    case 55:
    case 61:
    case 63:
    case 65:
    case 80:
    case 81:
    case 82:
      return "Lluvia";
    case 56:
    case 57:
    case 66:
    case 67:
      return "Lluvia congelada";
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return "Nieve";
    case 95:
    case 96:
    case 99:
      return "Tormenta";
    default:
      return "Condiciones desconocidas";
  }
}

export function weatherIcon(code: number): string {
  switch (code) {
    case 0:
      return "☀️";
    case 1:
      return "🌤️";
    case 2:
      return "⛅";
    case 3:
      return "☁️";
    case 45:
    case 48:
      return "🌫️";
    case 51:
    case 53:
    case 55:
    case 61:
    case 63:
    case 65:
    case 80:
    case 81:
    case 82:
      return "🌧️";
    case 56:
    case 57:
    case 66:
    case 67:
      return "🌨️";
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return "❄️";
    case 95:
    case 96:
    case 99:
      return "⛈️";
    default:
      return "🌡️";
  }
}
