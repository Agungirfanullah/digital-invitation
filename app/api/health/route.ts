import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const DATABASE_TIMEOUT_MS = 5000;

/**
 * Liveness + database check for uptime monitors and the daily keep-alive
 * (vercel.json, D-089). Public by design and reveals nothing beyond
 * ok/degraded: no error text, no versions, no connection details.
 */
export async function GET() {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("database timeout")), DATABASE_TIMEOUT_MS),
      ),
    ]);
    return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "health_check_failed",
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    return NextResponse.json(
      { status: "degraded" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
