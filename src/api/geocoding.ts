import type { GeoResult } from "../types/Weather.ts";
import { GEOCODING_URL } from "../utils/constants.ts";

export async function searchCities(query: string, count = 5): Promise<GeoResult[]> {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=${count}&language=es&format=json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error consultando la API de geocoding (HTTP ${response.status})`);
  }
  const data = (await response.json()) as { results?: GeoResult[] };
  return data.results ?? [];
}
