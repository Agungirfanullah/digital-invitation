import { describe, expect, it } from "vitest";

import { buildErrorLog, stripQuery } from "@/lib/monitoring/error-log";

const request = { path: "/invite/bambang-naya?to=SECRET-TOKEN-123#x", method: "GET" };
const context = {
  routerKind: "App Router",
  routePath: "/invite/[slug]",
  routeType: "render",
  renderSource: "react-server-components",
};

describe("stripQuery", () => {
  it("drops the query string and fragment", () => {
    expect(stripQuery("/a/b?to=secret#frag")).toBe("/a/b");
    expect(stripQuery("/a/b")).toBe("/a/b");
  });
});

describe("buildErrorLog", () => {
  it("never carries the guest token from the query string", () => {
    const log = buildErrorLog(new Error("boom"), request, context);
    expect(JSON.stringify(log)).not.toContain("SECRET-TOKEN-123");
    expect(log.path).toBe("/invite/bambang-naya");
  });

  it("records what is needed to find the failure", () => {
    const error = Object.assign(new Error("Database tidak terjangkau"), { digest: "abc123" });
    const log = buildErrorLog(error, request, context);

    expect(log).toMatchObject({
      level: "error",
      event: "request_error",
      name: "Error",
      message: "Database tidak terjangkau",
      digest: "abc123",
      method: "GET",
      routePath: "/invite/[slug]",
      routeType: "render",
    });
  });

  it("limits message and stack size", () => {
    const error = new Error("x".repeat(1000));
    const log = buildErrorLog(error, request, context);

    expect(log.message.length).toBeLessThanOrEqual(301);
    expect(log.stack?.split("\n").length).toBeLessThanOrEqual(6);
  });

  it("copes with a thrown value that is not an Error", () => {
    const log = buildErrorLog("plain string", request, context);
    expect(log.name).toBe("NonError");
    expect(log.message).toBe("plain string");
    expect(log.stack).toBeUndefined();
  });
});
