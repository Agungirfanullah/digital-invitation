import "server-only";
import { EventNotFoundError, mapEventErrorMessage } from "@/lib/events/errors";

export { EventNotFoundError };

const GENERIC_MESSAGE = "Terjadi kesalahan. Coba lagi.";

export function mapAnalyticsErrorMessage(error: unknown): string {
  if (error instanceof EventNotFoundError) return mapEventErrorMessage(error);
  console.error("[analytics] Unexpected error", error);
  return GENERIC_MESSAGE;
}
