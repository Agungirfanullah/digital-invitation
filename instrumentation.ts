import type { Instrumentation } from "next";

import { buildErrorLog } from "@/lib/monitoring/error-log";

/**
 * Next calls this for every server error (render, route handler, server
 * action, proxy). It writes one structured JSON line to the platform logs,
 * so a production failure can be found by its digest instead of only being
 * visible to the visitor who hit it (D-089). `buildErrorLog` strips the
 * query string and carries no headers or bodies.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  console.error(JSON.stringify(buildErrorLog(error, request, context)));
};
