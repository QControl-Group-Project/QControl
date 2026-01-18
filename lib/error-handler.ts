import { toast } from "sonner";

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function handleError(error: unknown) {
  console.error("Error:", error);

  if (error instanceof AppError) {
    toast.error(error.message);
    return;
  }

  if (error instanceof Error) {
    toast.error(error.message);
    return;
  }

  toast.error("An unexpected error occurred");
}

export function logError(error: unknown, context?: string) {
  console.error(`[${context || "Error"}]:`, error);

  // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error, { tags: { context } })
  // }
}
