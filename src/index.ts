import { runMenu } from "./presentation/menu.ts";
import { loadSettings, saveSettings } from "./storage/settingsStorage.ts";
import type { Unit } from "./types/Settings.ts";

function getInitialUnit(): Unit | undefined {
  const args = Bun.argv.slice(2);
  const flagIndex = args.indexOf("--unit");
  if (flagIndex === -1) {
    return undefined;
  }
  const value = args[flagIndex + 1];
  return value === "F" ? "F" : "C";
}

async function main(): Promise<void> {
  const settings = await loadSettings();
  const flagUnit = getInitialUnit();
  if (flagUnit) {
    settings.unit = flagUnit;
    await saveSettings(settings);
  }
  await runMenu(settings);
}

main();
