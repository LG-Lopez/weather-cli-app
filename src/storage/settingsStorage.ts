import type { CitySettings, Unit } from "../types/Settings.ts";
import { DEFAULT_UNIT } from "../utils/constants.ts";

const STORAGE_DIR = `${Bun.env.HOME ?? ""}/.weather-cli`;
const STORAGE_PATH = `${STORAGE_DIR}/cities.json`;

const DEFAULT_SETTINGS: CitySettings = {
  defaultCity: null,
  savedCities: [],
  unit: DEFAULT_UNIT,
};

export async function loadSettings(): Promise<CitySettings> {
  const file = Bun.file(STORAGE_PATH);

  if (!(await file.exists())) {
    return { ...DEFAULT_SETTINGS };
  }

  try {
    const data = (await file.json()) as Partial<CitySettings>;
    const rawCities: unknown = data.savedCities;
    const savedCities: string[] = Array.isArray(rawCities)
      ? rawCities.filter((city): city is string => typeof city === "string")
      : [];
    const unit: Unit = data.unit === "F" ? "F" : "C";
    const defaultCity = typeof data.defaultCity === "string" ? data.defaultCity : null;

    return { defaultCity, savedCities, unit };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: CitySettings): Promise<void> {
  await Bun.write(STORAGE_PATH, JSON.stringify(settings, null, 2));
}
