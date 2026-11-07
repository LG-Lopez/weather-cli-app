export interface GeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
}

export interface WeatherInfo {
  city: string;
  country?: string;
  latitude: number;
  longitude: number;
  temperatureC: number;
  apparentTemperatureC: number;
  weatherCode: number;
  windKph: number;
  time: string;
}

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export async function searchCities(query: string, count = 5): Promise<GeoResult[]> {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=${count}&language=es&format=json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error consultando la API de geocoding (HTTP ${response.status})`);
  }
  const data = (await response.json()) as { results?: GeoResult[] };
  return data.results ?? [];
}

interface CurrentWeather {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  weather_code: number;
  wind_speed_10m: number;
}

interface ForecastResponse {
  current?: CurrentWeather;
}

export async function getWeather(city: string): Promise<WeatherInfo | null> {
  const results = await searchCities(city, 1);
  const location = results[0];
  if (!location) {
    return null;
  }

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
