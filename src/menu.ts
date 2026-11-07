import { getWeather, searchCities, describeWeatherCode, weatherIcon, type WeatherInfo } from "./weather.ts";
import { addCity, removeCity, setDefaultCity, setUnit } from "./cities.ts";
import type { CitySettings, Unit } from "./storage.ts";

function buildBanner(savedCount: number): string {
  return [
    "════════════════════════════════════════",
    "         WEATHER CLI",
    "════════════════════════════════════════",
    "  1. Clima de ciudad default",
    `  2. Clima de todas las ciudades (${savedCount})`,
    "  3. Buscar y agregar ciudad",
    "  4. Eliminar ciudad",
    "  5. Establecer ciudad default",
    "  8. Ajustes (°C)",
    "  9. Salir",
    "════════════════════════════════════════",
  ].join("\n");
}

const PROMPT = "  Selecciona una opción: ";

function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

function formatTemperature(celsius: number, unit: Unit): string {
  const value = unit === "F" ? celsiusToFahrenheit(celsius) : celsius;
  return `${Math.round(value)}°${unit}`;
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

export async function runMenu(initialSettings: CitySettings): Promise<void> {
  let settings = initialSettings;

  while (true) {
    console.clear();
    console.log(`\n${buildBanner(settings.savedCities.length)}`);
    const raw = (await prompt(PROMPT))?.trim() ?? "";
    if (raw === "" || raw === "9") break;

    const option = Number(raw);
    if (!Number.isInteger(option) || option < 1 || option > 9) {
      console.log("Opción no válida. Selecciona un número del menú.");
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
          console.log(`No se encontró la ciudad "${settings.defaultCity}".`);
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
            console.log(`No se pudo obtener el clima de ${city}.`);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`Error: ${message}`);
    }
  }
}

async function handleAddCity(query: string, current: CitySettings): Promise<CitySettings> {
  const results = await searchCities(query, 5);
  const first = results[0];
  if (!first) {
    console.log(`No se encontró ninguna ciudad para "${query}".`);
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

  console.log(`Agregando "${chosen.name}" como ciudad guardada.`);
  const updated = await addCity(chosen.name);

  console.log(`Consultando el clima de ${chosen.name}...`);
  const weather = await getWeather(chosen.name);
  if (!weather) {
    console.clear();
    console.log(`No se pudo obtener el clima de ${chosen.name}.`);
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

  console.log(`Eliminando "${target}"...`);
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
    if (Number.isInteger(index) && index > 0 && index <= current.savedCities.length) {
      target = current.savedCities[index - 1];
    }
  }

  if (!target) {
    const name = (await prompt("Ingresa el nombre de la ciudad default: "))?.trim() ?? "";
    if (name) {
      target = name;
    }
  }

  if (!target) {
    console.log("Operación cancelada.");
    return current;
  }

  console.log(`Estableciendo "${target}" como ciudad default.`);
  return await setDefaultCity(target);
}

async function handleSetUnit(current: CitySettings): Promise<CitySettings> {
  const currentLabel = current.unit === "C" ? "Celsius (°C)" : "Fahrenheit (°F)";
  console.log(`Unidad actual: ${currentLabel}`);

  const choice = (await prompt("Selecciona la unidad (1. Celsius, 2. Fahrenheit): "))?.trim() ?? "";
  const value = Number(choice);
  const unit: Unit = value === 2 ? "F" : "C";
  console.log(`Ajustando la unidad a ${unit === "C" ? "Celsius (°C)" : "Fahrenheit (°F)"}.`);

  return await setUnit(unit);
}
