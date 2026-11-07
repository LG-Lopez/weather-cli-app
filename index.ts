import { runMenu } from "./src/menu.ts";
import { loadSettings, saveSettings, type CitySettings, type Unit } from "./src/storage.ts";

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
