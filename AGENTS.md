# AGENTS.md

## What this repo is

A Bun CLI weather app (Udemy exercise). Single entrypoint: `index.ts`, currently just `console.log("Hello via Bun!")`. `README.md` is the **specification, not a description of existing code** — menu, saved cities, and default city are unimplemented. README and user-facing UI text are in Spanish.

## Commands

- `bun install` — install (Bun 1.4.4; `bun.lock` is the source of truth, not npm).
- `bun run typecheck` — runs `bun check` (Bun's built-in checker, ~20-40 ms).
- `bun run index.ts` — run the CLI.

There is no lint, formatter, test, or CI setup. If you add tests, use `bun:test` (`bun test`) and add a `test` script.

**Do not use `tsc`.** TypeScript is a `^7` peer dependency (native preview); `bun x tsc` crashes with `ERR_UNKNOWN_FILE_EXTENSION` here. `bun check` is the only working typecheck.

## TypeScript conventions

- ESM only (`"type": "module"`), no build step; Bun executes `.ts` directly.
- Relative imports must include the `.ts` extension (`allowImportingTsExtensions`, `noEmit`).
- `verbatimModuleSyntax` is on: use `import type` for type-only imports.
- `noUncheckedIndexedAccess` is on: indexed/array access is `T | undefined`. Narrow before use instead of adding non-null assertions.
- `noFallthroughCasesInSwitch` is on.

## Domain notes

- Data comes from OpenMeteo, no API key. Two sequential calls: geocoding (`geocoding-api.open-meteo.com/v1/search`) to get lat/lon, then forecast (`api.open-meteo.com/v1/forecast?current=temperature_2m`). Exact URLs are in `README.md`.
- Default temperature unit is °C; the spec also wants a configurable unit setting.
- The stated end goal is a compiled binary via `bun build --compile`; no script exists yet. `out/` and `dist/` are gitignored.
- No persistence layer exists yet, so saved/default cities need one added from scratch.
