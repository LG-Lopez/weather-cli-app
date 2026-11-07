import {
  getForecast,
  getWeather,
  searchCities,
  describeWeatherCode,
  weatherIcon,
  type DailyForecast,
  type GeoResult,
  type WeatherInfo,
} from "./weather.ts";
import { addCity, removeCity, setDefaultCity, setUnit } from "./cities.ts";
import type { CitySettings, Unit } from "./storage.ts";
import { cyan, error, ok, paint, temp } from "./colors.ts";

const BANNER_LINE = "════════════════════════════════════════";

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

const PROMPT = "  Selecciona una opción: ";

function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

function temperatureValue(celsius: number, unit: Unit): string {
  const value = unit === "F" ? celsiusToFahrenheit(celsius) : celsius;
  return `${Math.round(value)}°${unit}`;
}

function formatTemperature(celsius: number, unit: Unit): string {
  return paint(temperatureValue(celsius, unit), temp);
}

function formatWeather(weather: WeatherInfo, unit: Unit): string {
  const icon = weatherIcon(weather.weatherCode);
  const conditions = describeWeatherCode(weather.weatherCode);
  const lines = [
    `${icon}  ${weather.city}`,
    `    ${formatTemperature(weather.temperatureC, unit)} · ${conditions}`,
    `    Sensación: ${formatTemperature(weather.apparentTemperatureC, unit)} · Viento: ${Math.round(weather.windKph)} km/h`,
  ];
  return lines.join("\n");
}

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  weekday: "short",
  day: "2-digit",
});

function formatDayLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    return date;
  }
  const label = DAY_LABEL_FORMATTER.format(new Date(year, month - 1, day));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatForecast(forecast: DailyForecast, unit: Unit): string {
  const header = paint(`  ${"Día".padEnd(14)}${"Máx".padStart(6)}${"Mín".padStart(8)}`, cyan);
  const rows = forecast.days.map((day) => {
    const label = formatDayLabel(day.date).padEnd(14);
    const max = temperatureValue(day.maxC, unit).padStart(6);
    const min = temperatureValue(day.minC, unit).padStart(8);
    return `  ${label}${paint(max, temp)}${paint(min, temp)}`;
  });
  return [`Pronóstico de 7 días para ${forecast.city}`, "", header, ...rows].join("\n");
}

export async function runMenu(initialSettings: CitySettings): Promise<void> {
  let settings = initialSettings;

  while (true) {
    console.clear();
    console.log(`\n${buildBanner(settings.savedCities.length)}`);
    const raw = (await prompt(PROMPT))?.trim() ?? "";
    if (raw === "" || raw === "9") break;

    const option = Number(raw);
    if (!Number.isInteger(option) || option < 1 || option > 9) {
      console.log(paint("Opción no válida. Selecciona un número del menú.", error));
      continue;
    }

    try {
      switch (option) {
      case 1: {
        console.clear();
        if (!settings.defaultCity) {
          console.log("No hay ninguna ciudad default configurada. Usa la opción 3 para buscar una.");
          break;
        }
        console.log(`Consultando el clima de ${settings.defaultCity}...`);
        const weather = await getWeather(settings.defaultCity);
        if (!weather) {
          console.log(paint(`No se encontró la ciudad "${settings.defaultCity}".`, error));
          break;
        }
        console.log(formatWeather(weather, settings.unit));
        break;
      }
      case 2: {
        console.clear();
        if (settings.savedCities.length === 0) {
          console.log("No hay ciudades registradas. Usa la opción 3 para agregar una.");
          break;
        }
        console.log("Consultando el clima de las ciudades registradas...");
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
            console.log(paint(`No se pudo obtener el clima de ${city}.`, error));
            continue;
          }
          console.log(`\n${formatWeather(weather, settings.unit)}`);
        }
        break;
      }
      case 3: {
        console.clear();
        const query = (await prompt("Ingresa el nombre de la ciudad: "))?.trim() ?? "";
        if (query) {
          settings = await handleAddCity(query, settings);
        }
        break;
      }
      case 4: {
        console.clear();
        settings = await handleRemoveCity(settings);
        break;
      }
      case 5: {
        console.clear();
        settings = await handleSetDefaultCity(settings);
        break;
      }
      case 6: {
        console.clear();
        const city = await resolveForecastCity(settings);
        if (!city) break;
        console.log(`Consultando el pronóstico de ${city}...`);
        const forecast = await getForecast(city);
        if (!forecast) {
          console.log(paint(`No se encontró la ciudad "${city}".`, error));
          break;
        }
        console.log(formatForecast(forecast, settings.unit));
        break;
      }
      case 8: {
        console.clear();
        settings = await handleSetUnit(settings);
        break;
      }
      }

      console.log("\n¿Deseas realizar una nueva acción?");
      console.log("");
      console.log("  1. Sí");
      console.log("  2. No");
      const subRaw = (await prompt("  Selecciona una opción: "))?.trim() ?? "";
      if (Number(subRaw) === 2) break;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(paint(`Error: ${message}`, error));
    }
  }
}

async function resolveForecastCity(settings: CitySettings): Promise<string | undefined> {
  if (settings.defaultCity) {
    return settings.defaultCity;
  }

  if (settings.savedCities.length > 0) {
    console.log("Ciudades registradas:");
    settings.savedCities.forEach((city, index) => {
      console.log(`  ${index + 1}. ${city}`);
    });
    const choice = (await prompt("Selecciona una ciudad (0 para cancelar): "))?.trim() ?? "";
    const index = Number(choice);
    const selected =
      Number.isInteger(index) && index > 0 && index <= settings.savedCities.length
        ? settings.savedCities[index - 1]
        : undefined;
    if (!selected) {
      console.log("Operación cancelada.");
    }
    return selected;
  }

  const name = (await prompt("Ingresa el nombre de la ciudad: "))?.trim() ?? "";
  return name || undefined;
}

const CANDIDATE_LIMIT = 20;
const MAX_CITY_OPTIONS = 5;

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
    console.log(paint(`No se encontró ninguna ciudad para "${query}".`, error));
    return current;
  }

  let chosen = first;
  if (results.length > 1) {
    console.log("Se encontraron varias coincidencias:");
    results.forEach((result, index) => {
      const details = [result.admin1, result.country]
        .filter((part): part is string => !!part && part.length > 0)
        .join(", ");
      console.log(`  ${index + 1}. ${result.name}${details ? ` (${details})` : ""}`);
    });
    const choice = (await prompt("Selecciona una opción (0 para cancelar): "))?.trim() ?? "";
    const index = Number(choice);
    const selected =
      Number.isInteger(index) && index > 0 && index <= results.length ? results[index - 1] : undefined;
    if (!selected) {
      console.log("Operación cancelada.");
      return current;
    }
    chosen = selected;
  }

  console.log(paint(`Agregando "${chosen.name}" como ciudad guardada.`, ok));
  const updated = await addCity(chosen.name);

  console.log(`Consultando el clima de ${chosen.name}...`);
  const weather = await getWeather(chosen.name);
  if (!weather) {
    console.clear();
    console.log(paint(`No se pudo obtener el clima de ${chosen.name}.`, error));
  } else {
    console.clear();
    console.log(formatWeather(weather, updated.unit));
  }

  return updated;
}

async function handleRemoveCity(current: CitySettings): Promise<CitySettings> {
  if (current.savedCities.length === 0) {
    console.log("No hay ciudades registradas para eliminar.");
    return current;
  }

  console.log("Ciudades registradas:");
  current.savedCities.forEach((city, index) => {
    console.log(`  ${index + 1}. ${city}`);
  });

  const choice = (await prompt("Selecciona la ciudad a eliminar (0 para cancelar): "))?.trim() ?? "";
  const index = Number(choice);
  const target =
    Number.isInteger(index) && index > 0 && index <= current.savedCities.length
      ? current.savedCities[index - 1]
      : undefined;
  if (!target) {
    console.log("Operación cancelada.");
    return current;
  }

  console.log(paint(`Eliminando "${target}"...`, ok));
  return await removeCity(target);
}

async function handleSetDefaultCity(current: CitySettings): Promise<CitySettings> {
  let target: string | undefined;

  if (current.savedCities.length > 0) {
    console.log("Ciudades registradas:");
    current.savedCities.forEach((city, index) => {
      console.log(`  ${index + 1}. ${city}`);
    });
    const choice = (await prompt("Selecciona la ciudad default (0 para cancelar): "))?.trim() ?? "";
    const index = Number(choice);
    const selected =
      Number.isInteger(index) && index > 0 && index <= current.savedCities.length
        ? current.savedCities[index - 1]
        : undefined;
    if (!selected) {
      console.log("Operación cancelada.");
      return current;
    }
    target = selected;
  }

  if (!target) {
    const name = (await prompt("Ingresa el nombre de la ciudad default: "))?.trim() ?? "";
    if (name && name !== "0") {
      target = name;
    }
  }

  if (!target) {
    console.log("Operación cancelada.");
    return current;
  }

  console.log(paint(`Estableciendo "${target}" como ciudad default.`, ok));
  return await setDefaultCity(target);
}

async function handleSetUnit(current: CitySettings): Promise<CitySettings> {
  const currentLabel = current.unit === "C" ? "Celsius (°C)" : "Fahrenheit (°F)";
  console.log(`Unidad actual: ${currentLabel}`);

  const choice = (await prompt("Selecciona la unidad (1. Celsius, 2. Fahrenheit): "))?.trim() ?? "";
  const value = Number(choice);
  const unit: Unit = value === 2 ? "F" : "C";
  console.log(paint(`Ajustando la unidad a ${unit === "C" ? "Celsius (°C)" : "Fahrenheit (°F)"}.`, ok));

  return await setUnit(unit);
}
