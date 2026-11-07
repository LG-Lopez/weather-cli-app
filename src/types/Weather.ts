export interface GeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
}

export interface WeatherInfo {
  city: string;
  country?: string;
  latitude: number;
  longitude: number;
  temperatureC: number;
  apparentTemperatureC: number;
  weatherCode: number;
  windKph: number;
  time: string;
}

export interface ForecastDay {
  date: string;
  maxC: number;
  minC: number;
}

export interface DailyForecast {
  city: string;
  country?: string;
  latitude: number;
  longitude: number;
  days: ForecastDay[];
}
