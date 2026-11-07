export class CityNotFoundError extends Error {
  constructor(readonly query: string) {
    super(`No se encontró la ciudad "${query}"`);
    this.name = "CityNotFoundError";
  }
}
