import { loadCities, saveCities } from "../storage/citiesStorage.ts";
import { loadSettings } from "../storage/settingsStorage.ts";
import type { CitySettings } from "../types/Settings.ts";

export async function addCity(name: string): Promise<CitySettings> {
  const cities = await loadCities();
  if (!cities.includes(name)) {
    cities.push(name);
    await saveCities(cities);
  }
  return await loadSettings();
}
