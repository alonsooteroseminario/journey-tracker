/** Thrown by provider sync helpers so API routes can map to HTTP status + JSON `{ error }`. */
export class CostSyncError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = "CostSyncError";
  }
}
