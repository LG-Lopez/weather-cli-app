import type { City } from "../types/City.ts";
import { loadSettings, saveSettings } from "./settingsStorage.ts";

export async function loadCities(): Promise<City[]> {
  const settings = await loadSettings();
  return settings.savedCities;
}

export async function saveCities(cities: City[]): Promise<void> {
  const settings = await loadSettings();
  settings.savedCities = cities;
  await saveSettings(settings);
}
