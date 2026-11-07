# AGENTS.md

## What this repo is

A Bun CLI weather app (Udemy exercise). User-facing text is in Spanish.

- Entrypoint: `src/index.ts`. Loads persisted settings, applies the optional `--unit C|F` flag, then runs the interactive menu (`src/presentation/menu.ts`).
- Menu options: `1` default city weather, `2` all saved cities, `3` search & add city, `4` remove city, `5` set default city, `6` 7-day forecast, `8` settings (°C/°F), `9` exit. There is no option `7`.
- `README.md` is the original specification (in Spanish); most of it is implemented now. It can lag behind the code — treat the source as the source of truth.
- `revision-ideas.md` is a local review checklist with pending ideas.

## Layout

- `src/actions/` — use cases: `addCity`, `getForecast`, `getWeather`, `listCities`, `removeCity`, `setDefaultCity`, `setUnit`.
- `src/api/` — OpenMeteo clients: `geocoding.ts`, `weather.ts`.
- `src/presentation/` — `menu.ts` (interactive loop), `input.ts` (prompt + parsing), `output.ts` (messages, clear screen).
- `src/storage/` — persistence: `settingsStorage.ts`, `citiesStorage.ts`.
- `src/errors/` — `CityNotFoundError`.
- `src/types/` — shared types (`City`, `MenuOption`, `Settings`, `Weather`).
- `src/utils/` — `constants.ts`, `colors.ts`, `format.ts`.
- `test/` — mirrors `src/` with `bun:test`; helpers in `test/helpers/`; live API test in `test/integration/`.
- `references/` — supporting reference material.

## Commands

- `bun install` — install (Bun 1.4.4; `bun.lock` is the source of truth, not npm).
- `bun run typecheck` — runs `bun check` (Bun's built-in checker, ~50 ms, 46 files).
- `bun run start` — run the CLI (`bun run src/index.ts`); `bun run dev` does the same in watch mode.
- `bun test` / `bun run test` — unit tests (timeout 15 s). `bun run test:coverage` for coverage.
- `bun run test:integration` — hits the real OpenMeteo API (`RUN_INTEGRATION=1 bun test --timeout 30000 test/integration/openmeteo.test.ts`).
- `bun run build` — runs the test suite, then `bun build --compile src/index.ts --outfile out/weather`.

There is no lint, formatter, or CI setup. If you add tests, use `bun:test` (`bun test`).

**Do not use `tsc`.** TypeScript is a `^7` peer dependency (native preview); `bun x tsc` crashes with `ERR_UNKNOWN_FILE_EXTENSION` here. `bun check` is the only working typecheck.

## Domain notes

- Data comes from OpenMeteo, no API key:
  - Geocoding: `https://geocoding-api.open-meteo.com/v1/search?name=…&count=…&language=es&format=json`
  - Current weather: `https://api.open-meteo.com/v1/forecast?…&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m`
  - Daily forecast: `https://api.open-meteo.com/v1/forecast?…&daily=temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=auto`
  - Base URLs are in `src/utils/constants.ts`; exact examples are in `README.md`.
- Persistence is a single JSON file at `~/.weather-cli/cities.json` with `{ defaultCity, savedCities, unit }` (`unit` is `"C" | "F"`). Missing or corrupt files fall back to defaults. No database.
- `withStorageDir(dir, fn)` in `src/storage/settingsStorage.ts` (backed by `AsyncLocalStorage`) isolates storage in tests. Use it instead of touching `$HOME`.
- Default temperature unit is °C. It can be changed from menu option 8 or at startup with `--unit F` (any value other than `F` means `C`); both persist the setting.
- The compiled binary is produced by `bun run build` at `out/weather`; `out/`, `dist/`, and `coverage/` are gitignored.

## TypeScript conventions

- ESM only (`"type": "module"`); Bun executes `.ts` directly, no build step for development.
- Relative imports must include the `.ts` extension (`allowImportingTsExtensions`, `noEmit`).
- `verbatimModuleSyntax` is on: use `import type` for type-only imports.
- `noUncheckedIndexedAccess` is on: indexed/array access is `T | undefined`. Narrow before use instead of adding non-null assertions.
- `noFallthroughCasesInSwitch` is on.
