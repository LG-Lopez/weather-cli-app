import { AsyncLocalStorage } from "node:async_hooks";
import type { CitySettings, Unit } from "../types/Settings.ts";
import { DEFAULT_UNIT } from "../utils/constants.ts";

const storageDirContext = new AsyncLocalStorage<string>();

/**
 * Ejecuta una operación con un directorio de storage aislado.
 * Sin override se usa `~/.weather-cli`, que es el comportamiento normal de la app.
 */
export function withStorageDir<T>(directory: string, operation: () => Promise<T>): Promise<T> {
  return storageDirContext.run(directory, operation);
}

function storagePath(): string {
  const directory = storageDirContext.getStore() ?? `${Bun.env.HOME ?? ""}/.weather-cli`;
  return `${directory}/cities.json`;
}

function defaultSettings(): CitySettings {
  return { defaultCity: null, savedCities: [], unit: DEFAULT_UNIT };
}

export async function loadSettings(): Promise<CitySettings> {
  const file = Bun.file(storagePath());

  if (!(await file.exists())) {
    return defaultSettings();
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
    return defaultSettings();
  }
}

export async function saveSettings(settings: CitySettings): Promise<void> {
  await Bun.write(storagePath(), JSON.stringify(settings, null, 2));
}
