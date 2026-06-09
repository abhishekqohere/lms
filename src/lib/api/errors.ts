export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return { message: error.message, status: error.statusCode };
  }
  console.error("API Error:", error);
  return { message: "Internal server error", status: 500 };
}
