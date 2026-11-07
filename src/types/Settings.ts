import type { City } from "./City.ts";

export type Unit = "C" | "F";

export interface CitySettings {
  defaultCity: City | null;
  savedCities: City[];
  unit: Unit;
}
