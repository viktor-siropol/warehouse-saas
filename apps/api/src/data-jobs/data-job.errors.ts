export class PermanentDataJobError extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'PermanentDataJobError';
  }
}
