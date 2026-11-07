import type { DailyForecast, ForecastDay, GeoResult, WeatherInfo } from "../types/Weather.ts";
import { FORECAST_URL } from "../utils/constants.ts";

interface CurrentWeather {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  weather_code: number;
  wind_speed_10m: number;
}

interface DailyWeather {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
}

interface ForecastResponse {
  current?: CurrentWeather;
  daily?: DailyWeather;
}

export async function fetchCurrentWeather(location: GeoResult): Promise<WeatherInfo> {
  const forecastUrl = `${FORECAST_URL}?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m`;
  const response = await fetch(forecastUrl);
  if (!response.ok) {
    throw new Error(`Error consultando la API de pronóstico (HTTP ${response.status})`);
  }
  const data = (await response.json()) as ForecastResponse;
  const current = data.current;
  if (!current) {
    throw new Error("La API de pronóstico devolvió una respuesta sin datos de clima");
  }

  return {
    city: location.name,
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude,
    temperatureC: current.temperature_2m,
    apparentTemperatureC: current.apparent_temperature,
    weatherCode: current.weather_code,
    windKph: current.wind_speed_10m,
    time: current.time,
  };
}

export async function fetchDailyForecast(location: GeoResult, days = 7): Promise<DailyForecast> {
  const forecastUrl = `${FORECAST_URL}?latitude=${location.latitude}&longitude=${location.longitude}&daily=temperature_2m_max,temperature_2m_min&forecast_days=${days}&timezone=auto`;
  const response = await fetch(forecastUrl);
  if (!response.ok) {
    throw new Error(`Error consultando la API de pronóstico (HTTP ${response.status})`);
  }
  const data = (await response.json()) as ForecastResponse;
  const daily = data.daily;
  if (!daily) {
    throw new Error("La API de pronóstico devolvió una respuesta sin datos diarios");
  }

  const forecastDays: ForecastDay[] = [];
  for (let index = 0; index < daily.time.length; index++) {
    const date = daily.time[index];
    const maxC = daily.temperature_2m_max[index];
    const minC = daily.temperature_2m_min[index];
    if (date === undefined || maxC === undefined || minC === undefined) {
      continue;
    }
    forecastDays.push({ date, maxC, minC });
  }

  return {
    city: location.name,
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude,
    days: forecastDays,
  };
}
