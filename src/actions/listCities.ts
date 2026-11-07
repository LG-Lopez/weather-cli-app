import { loadCities } from "../storage/citiesStorage.ts";
import type { City } from "../types/City.ts";

export async function listCities(): Promise<City[]> {
  return await loadCities();
}
