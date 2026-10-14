/**
 * Turns a server error into one structured log line, for the platform's log
 * search (Vercel Logs) — D-089. Built so it cannot leak what the request
 * carried: the query string is dropped (an invitation URL's `?to=` is a
 * guest's secret token), and no headers, cookies or bodies are included.
 */

export interface RequestErrorContext {
  routerKind: string;
  routePath: string;
  routeType: string;
  renderSource?: string;
}

export interface RequestErrorInfo {
  path: string;
  method: string;
}

export interface ErrorLog {
  level: "error";
  event: "request_error";
  name: string;
  message: string;
  digest?: string;
  stack?: string;
  method: string;
  path: string;
  routePath: string;
  routeType: string;
  routerKind: string;
  renderSource?: string;
}

const MAX_MESSAGE_LENGTH = 300;
const MAX_STACK_LINES = 6;

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

/** The path without query string or fragment. */
export function stripQuery(path: string): string {
  return path.split(/[?#]/)[0] ?? path;
}

export function buildErrorLog(
  error: unknown,
  request: RequestErrorInfo,
  context: RequestErrorContext,
): ErrorLog {
  const isError = error instanceof Error;
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String((error as { digest: unknown }).digest)
      : undefined;

  return {
    level: "error",
    event: "request_error",
    name: isError ? error.name : "NonError",
    message: truncate(isError ? error.message : String(error), MAX_MESSAGE_LENGTH),
    digest,
    stack: isError ? error.stack?.split("\n").slice(0, MAX_STACK_LINES).join("\n") : undefined,
    method: request.method,
    path: stripQuery(request.path),
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
    renderSource: context.renderSource,
  };
}
