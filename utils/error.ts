export class CustomError extends Error {
  public status: number;
  constructor(m: string, status?: number) {
    super(m)
    this.status = status || 500
  }
}

/**
 * Formats the error with a status code and a message.
 * @param message The message for the error.
 * @param status The status code for the response.
 */
export const formatError = (message: string, status?: number): Error => {
  return new CustomError(message, status)
}
