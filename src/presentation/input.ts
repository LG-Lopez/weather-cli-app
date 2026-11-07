import type { MenuOption } from "../types/MenuOption.ts";

export async function ask(question: string): Promise<string> {
  return (await prompt(question))?.trim() ?? "";
}

export function parseMenuOption(raw: string): MenuOption | undefined {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 9) {
    return undefined;
  }
  return value as MenuOption;
}

export function parseSelection(raw: string, max: number): number | undefined {
  const index = Number(raw);
  if (!Number.isInteger(index) || index < 1 || index > max) {
    return undefined;
  }
  return index;
}
