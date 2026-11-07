import { searchCities } from "../api/geocoding.ts";
import { fetchDailyForecast } from "../api/weather.ts";
import { CityNotFoundError } from "../errors/CityNotFoundError.ts";
import type { DailyForecast } from "../types/Weather.ts";

export async function getForecast(city: string, days = 7): Promise<DailyForecast> {
  const results = await searchCities(city, 1);
  const location = results[0];
  if (!location) {
    throw new CityNotFoundError(city);
  }
  return await fetchDailyForecast(location, days);
}
