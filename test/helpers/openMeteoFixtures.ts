export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const GEOCODING_RESULT = {
  id: 6094817,
  name: "Ottawa",
  latitude: 45.41117,
  longitude: -75.69812,
  admin1: "Ontario",
  country: "Canadá",
};

export const GEOCODING_RESPONSE = {
  results: [GEOCODING_RESULT],
};

export const CURRENT_WEATHER_RESPONSE = {
  current: {
    time: "2026-11-07T12:00",
    temperature_2m: 4.3,
    apparent_temperature: 1.2,
    weather_code: 3,
    wind_speed_10m: 14.5,
  },
};

export const DAILY_FORECAST_RESPONSE = {
  daily: {
    time: ["2026-11-07", "2026-11-08", "2026-11-09"],
    temperature_2m_max: [10.4, 11.2, 9.8],
    temperature_2m_min: [-1.6, 0.4, -0.2],
  },
};
