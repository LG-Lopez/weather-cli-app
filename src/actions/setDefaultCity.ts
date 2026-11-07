import { loadCities, saveCities } from "../storage/citiesStorage.ts";
import { loadSettings, saveSettings } from "../storage/settingsStorage.ts";
import type { CitySettings } from "../types/Settings.ts";

export async function setDefaultCity(name: string): Promise<CitySettings> {
  const cities = await loadCities();
  if (!cities.includes(name)) {
    cities.push(name);
    await saveCities(cities);
  }

  const settings = await loadSettings();
  settings.defaultCity = name;
  await saveSettings(settings);
  return settings;
}
