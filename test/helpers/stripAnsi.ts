const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;

/**
 * Elimina los códigos ANSI de color para que los asserts no dependan
 * de si la salida es una terminal interactiva (TTY) o no.
 */
export function stripAnsi(text: string): string {
  return text.replace(ANSI_PATTERN, "");
}
