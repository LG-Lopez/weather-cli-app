import { mock } from "bun:test";

export type FetchHandler = (url: string) => Response | Promise<Response>;

export interface FetchMock {
  calls: string[];
  restore: () => void;
}

/**
 * Reemplaza `fetch` durante un test para evitar llamadas reales a la red.
 * Devuelve las URLs solicitadas y una función para restaurar el original.
 */
export function mockFetch(handler: FetchHandler): FetchMock {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];

  const fetchMock = mock(async (input: string | URL | Request) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    calls.push(url);
    return await handler(url);
  });

  globalThis.fetch = fetchMock as unknown as typeof fetch;

  return {
    calls,
    restore: () => {
      globalThis.fetch = originalFetch;
    },
  };
}
