import { searchCities } from "../api/geocoding.ts";
import { fetchCurrentWeather } from "../api/weather.ts";
import { CityNotFoundError } from "../errors/CityNotFoundError.ts";
import type { WeatherInfo } from "../types/Weather.ts";

export async function getWeather(city: string): Promise<WeatherInfo> {
  const results = await searchCities(city, 1);
  const location = results[0];
  if (!location) {
    throw new CityNotFoundError(city);
  }
  return await fetchCurrentWeather(location);
}
