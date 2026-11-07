import { addCity } from "../actions/addCity.ts";
import { getForecast } from "../actions/getForecast.ts";
import { getWeather } from "../actions/getWeather.ts";
import { listCities } from "../actions/listCities.ts";
import { removeCity } from "../actions/removeCity.ts";
import { setDefaultCity } from "../actions/setDefaultCity.ts";
import { setUnit } from "../actions/setUnit.ts";
import { searchCities } from "../api/geocoding.ts";
import type { CitySettings, Unit } from "../types/Settings.ts";
import type { GeoResult, WeatherInfo } from "../types/Weather.ts";
import { cyan, paint } from "../utils/colors.ts";
import { BANNER_LINE, CANDIDATE_LIMIT, MAX_CITY_OPTIONS, MENU_PROMPT } from "../utils/constants.ts";
import { formatForecast, formatWeather } from "../utils/format.ts";
import { ask, parseMenuOption, parseSelection } from "./input.ts";
import { clearScreen, printError, printMessage, printSuccess } from "./output.ts";

function buildBanner(savedCount: number): string {
  return [
    paint(BANNER_LINE, cyan),
    paint("         WEATHER CLI", cyan),
    paint(BANNER_LINE, cyan),
    "  1. Clima de ciudad default",
    `  2. Clima de todas las ciudades (${savedCount})`,
    "  3. Buscar y agregar ciudad",
    "  4. Eliminar ciudad",
    "  5. Establecer ciudad default",
    "  6. Pronóstico de 7 días",
    "  8. Ajustes (°C/°F)",
    "  9. Salir",
    paint(BANNER_LINE, cyan),
  ].join("\n");
}

export async function runMenu(initialSettings: CitySettings): Promise<void> {
  let settings = initialSettings;

  while (true) {
    clearScreen();
    printMessage(`\n${buildBanner(settings.savedCities.length)}`);
    const raw = await ask(MENU_PROMPT);
    if (raw === "" || raw === "9") break;

    const option = parseMenuOption(raw);
    if (option === undefined) {
      printError("Opción no válida. Selecciona un número del menú.");
      continue;
    }

    try {
      switch (option) {
      case 1: {
        clearScreen();
        if (!settings.defaultCity) {
          printMessage("No hay ninguna ciudad default configurada. Usa la opción 3 para buscar una.");
          break;
        }
        printMessage(`Consultando el clima de ${settings.defaultCity}...`);
        const weather = await getWeather(settings.defaultCity);
        if (!weather) {
          printError(`No se encontró la ciudad "${settings.defaultCity}".`);
          break;
        }
        printMessage(formatWeather(weather, settings.unit));
        break;
      }
      case 2: {
        clearScreen();
        if (settings.savedCities.length === 0) {
          printMessage("No hay ciudades registradas. Usa la opción 3 para agregar una.");
          break;
        }
        printMessage("Consultando el clima de las ciudades registradas...");
        const results: { city: string; weather: WeatherInfo | null }[] = await Promise.all(
          settings.savedCities.map(async (city) => {
            try {
              const weather = await getWeather(city);
              return { city, weather };
            } catch {
              return { city, weather: null };
            }
          }),
        );
        for (const { city, weather } of results) {
          if (!weather) {
            printError(`No se pudo obtener el clima de ${city}.`);
            continue;
          }
          printMessage(`\n${formatWeather(weather, settings.unit)}`);
        }
        break;
      }
      case 3: {
        clearScreen();
        const query = await ask("Ingresa el nombre de la ciudad: ");
        if (query) {
          settings = await handleAddCity(query, settings);
        }
        break;
      }
      case 4: {
        clearScreen();
        settings = await handleRemoveCity(settings);
        break;
      }
      case 5: {
        clearScreen();
        settings = await handleSetDefaultCity(settings);
        break;
      }
      case 6: {
        clearScreen();
        const city = await resolveForecastCity(settings);
        if (!city) break;
        printMessage(`Consultando el pronóstico de ${city}...`);
        const forecast = await getForecast(city);
        if (!forecast) {
          printError(`No se encontró la ciudad "${city}".`);
          break;
        }
        printMessage(formatForecast(forecast, settings.unit));
        break;
      }
      case 8: {
        clearScreen();
        settings = await handleSetUnit(settings);
        break;
      }
      }

      printMessage("\n¿Deseas realizar una nueva acción?");
      printMessage("");
      printMessage("  1. Sí");
      printMessage("  2. No");
      const subRaw = await ask(MENU_PROMPT);
      if (Number(subRaw) === 2) break;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      printError(`Error: ${message}`);
    }
  }
}

async function resolveForecastCity(settings: CitySettings): Promise<string | undefined> {
  if (settings.defaultCity) {
    return settings.defaultCity;
  }

  if (settings.savedCities.length > 0) {
    printMessage("Ciudades registradas:");
    settings.savedCities.forEach((city, index) => {
      printMessage(`  ${index + 1}. ${city}`);
    });
    const choice = await ask("Selecciona una ciudad (0 para cancelar): ");
    const index = parseSelection(choice, settings.savedCities.length);
    const selected = index !== undefined ? settings.savedCities[index - 1] : undefined;
    if (!selected) {
      printMessage("Operación cancelada.");
    }
    return selected;
  }

  const name = await ask("Ingresa el nombre de la ciudad: ");
  return name || undefined;
}

function uniqueCities(results: GeoResult[]): GeoResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.name}|${result.admin1 ?? ""}|${result.country ?? ""}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function handleAddCity(query: string, current: CitySettings): Promise<CitySettings> {
  const candidates = await searchCities(query, CANDIDATE_LIMIT);
  const results = uniqueCities(candidates).slice(0, MAX_CITY_OPTIONS);
  const first = results[0];
  if (!first) {
    printError(`No se encontró ninguna ciudad para "${query}".`);
    return current;
  }

  let chosen = first;
  if (results.length > 1) {
    printMessage("Se encontraron varias coincidencias:");
    results.forEach((result, index) => {
      const details = [result.admin1, result.country]
        .filter((part): part is string => !!part && part.length > 0)
        .join(", ");
      printMessage(`  ${index + 1}. ${result.name}${details ? ` (${details})` : ""}`);
    });
    const choice = await ask("Selecciona una opción (0 para cancelar): ");
    const index = parseSelection(choice, results.length);
    const selected = index !== undefined ? results[index - 1] : undefined;
    if (!selected) {
      printMessage("Operación cancelada.");
      return current;
    }
    chosen = selected;
  }

  printSuccess(`Agregando "${chosen.name}" como ciudad guardada.`);
  const updated = await addCity(chosen.name);

  printMessage(`Consultando el clima de ${chosen.name}...`);
  const weather = await getWeather(chosen.name);
  if (!weather) {
    clearScreen();
    printError(`No se pudo obtener el clima de ${chosen.name}.`);
  } else {
    clearScreen();
    printMessage(formatWeather(weather, updated.unit));
  }

  return updated;
}

async function handleRemoveCity(current: CitySettings): Promise<CitySettings> {
  const cities = await listCities();
  if (cities.length === 0) {
    printMessage("No hay ciudades registradas para eliminar.");
    return current;
  }

  printMessage("Ciudades registradas:");
  cities.forEach((city, index) => {
    printMessage(`  ${index + 1}. ${city}`);
  });

  const choice = await ask("Selecciona la ciudad a eliminar (0 para cancelar): ");
  const index = parseSelection(choice, cities.length);
  const target = index !== undefined ? cities[index - 1] : undefined;
  if (!target) {
    printMessage("Operación cancelada.");
    return current;
  }

  printSuccess(`Eliminando "${target}"...`);
  return await removeCity(target);
}

async function handleSetDefaultCity(current: CitySettings): Promise<CitySettings> {
  const cities = await listCities();
  let target: string | undefined;

  if (cities.length > 0) {
    printMessage("Ciudades registradas:");
    cities.forEach((city, index) => {
      printMessage(`  ${index + 1}. ${city}`);
    });
    const choice = await ask("Selecciona la ciudad default (0 para cancelar): ");
    const index = parseSelection(choice, cities.length);
    const selected = index !== undefined ? cities[index - 1] : undefined;
    if (!selected) {
      printMessage("Operación cancelada.");
      return current;
    }
    target = selected;
  }

  if (!target) {
    const name = await ask("Ingresa el nombre de la ciudad default: ");
    if (name && name !== "0") {
      target = name;
    }
  }

  if (!target) {
    printMessage("Operación cancelada.");
    return current;
  }

  printSuccess(`Estableciendo "${target}" como ciudad default.`);
  return await setDefaultCity(target);
}

async function handleSetUnit(current: CitySettings): Promise<CitySettings> {
  const currentLabel = current.unit === "C" ? "Celsius (°C)" : "Fahrenheit (°F)";
  printMessage(`Unidad actual: ${currentLabel}`);

  const choice = await ask("Selecciona la unidad (1. Celsius, 2. Fahrenheit): ");
  const value = Number(choice);
  const unit: Unit = value === 2 ? "F" : "C";
  printSuccess(`Ajustando la unidad a ${unit === "C" ? "Celsius (°C)" : "Fahrenheit (°F)"}.`);

  return await setUnit(unit);
}
