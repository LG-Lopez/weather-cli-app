import { searchCities } from "../api/geocoding.ts";
import { fetchCurrentWeather } from "../api/weather.ts";
import type { WeatherInfo } from "../types/Weather.ts";

export async function getWeather(city: string): Promise<WeatherInfo | null> {
  const results = await searchCities(city, 1);
  const location = results[0];
  if (!location) {
    return null;
  }
  return await fetchCurrentWeather(location);
}
