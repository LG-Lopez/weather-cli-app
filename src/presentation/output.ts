import { error, ok, paint } from "../utils/colors.ts";

export function clearScreen(): void {
  console.clear();
}

export function printMessage(message: string): void {
  console.log(message);
}

export function printError(message: string): void {
  console.log(paint(message, error));
}

export function printSuccess(message: string): void {
  console.log(paint(message, ok));
}
