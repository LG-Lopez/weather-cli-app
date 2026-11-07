import { searchCities } from "../api/geocoding.ts";
import { fetchDailyForecast } from "../api/weather.ts";
import type { DailyForecast } from "../types/Weather.ts";

export async function getForecast(city: string, days = 7): Promise<DailyForecast | null> {
  const results = await searchCities(city, 1);
  const location = results[0];
  if (!location) {
    return null;
  }
  return await fetchDailyForecast(location, days);
}
