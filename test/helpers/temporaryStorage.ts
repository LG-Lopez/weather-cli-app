import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { withStorageDir } from "../../src/storage/settingsStorage.ts";

/**
 * Ejecuta el test con un directorio de storage temporal e independiente,
 * sin tocar el HOME real ni compartir estado entre tests.
 */
export async function withTemporaryStorage<T>(
  operation: (directory: string) => Promise<T>,
): Promise<T> {
  const directory = await mkdtemp(join(tmpdir(), "weather-cli-test-"));
  try {
    return await withStorageDir(directory, () => operation(directory));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
