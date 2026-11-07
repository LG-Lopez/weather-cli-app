import { loadSettings, saveSettings, type CitySettings, type Unit } from "./storage.ts";

export async function getSettings(): Promise<CitySettings> {
  return loadSettings();
}

export async function addCity(name: string): Promise<CitySettings> {
  const settings = await loadSettings();
  if (!settings.savedCities.includes(name)) {
    settings.savedCities.push(name);
    await saveSettings(settings);
  }
  return settings;
}

export async function removeCity(name: string): Promise<CitySettings> {
  const settings = await loadSettings();
  settings.savedCities = settings.savedCities.filter((city) => city !== name);
  if (settings.defaultCity === name) {
    settings.defaultCity = settings.savedCities[0] ?? null;
  }
  await saveSettings(settings);
  return settings;
}

export async function setDefaultCity(name: string): Promise<CitySettings> {
  const settings = await loadSettings();
  settings.defaultCity = name;
  if (!settings.savedCities.includes(name)) {
    settings.savedCities.push(name);
  }
  await saveSettings(settings);
  return settings;
}

export async function setUnit(unit: Unit): Promise<CitySettings> {
  const settings = await loadSettings();
  settings.unit = unit;
  await saveSettings(settings);
  return settings;
}
