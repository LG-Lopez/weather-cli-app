import { loadSettings, saveSettings } from "../storage/settingsStorage.ts";
import type { CitySettings, Unit } from "../types/Settings.ts";

export async function setUnit(unit: Unit): Promise<CitySettings> {
  const settings = await loadSettings();
  settings.unit = unit;
  await saveSettings(settings);
  return settings;
}
