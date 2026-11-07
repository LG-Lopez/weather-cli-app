import { loadCities, saveCities } from "../storage/citiesStorage.ts";
import { loadSettings, saveSettings } from "../storage/settingsStorage.ts";
import type { CitySettings } from "../types/Settings.ts";

export async function removeCity(name: string): Promise<CitySettings> {
  const cities = (await loadCities()).filter((city) => city !== name);
  await saveCities(cities);

  const settings = await loadSettings();
  if (settings.defaultCity === name) {
    settings.defaultCity = cities[0] ?? null;
    await saveSettings(settings);
  }
  return settings;
}
