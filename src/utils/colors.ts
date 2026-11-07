const RESET = "\x1b[0m";

export const cyan = "\x1b[36m";
export const temp = "\x1b[1;33m";
export const ok = "\x1b[1;32m";
export const error = "\x1b[1;31m";

const colorsEnabled = process.stdout.isTTY === true;

export function paint(text: string, ...codes: string[]): string {
  if (!colorsEnabled || codes.length === 0) {
    return text;
  }
  return `${codes.join("")}${text}${RESET}`;
}
