import { describe, expect, it, vi } from "vitest";

import type { NextFunction, Response } from "express";

import { requestContextMiddleware } from "./request-context.middleware.js";

import type { RequestWithId } from "./request-with-id.type.js";

describe("requestContextMiddleware", () => {
  it("preserves a valid incoming request id", () => {
    const request = {
      header: vi.fn().mockReturnValue("step10-request-123"),
    } as unknown as RequestWithId;

    const setHeader = vi.fn();

    const response = {
      setHeader,
    } as unknown as Response;

    const next = vi.fn() as NextFunction;

    requestContextMiddleware(request, response, next);

    expect(request.requestId).toBe("step10-request-123");

    expect(setHeader).toHaveBeenCalledWith(
      "X-Request-Id",
      "step10-request-123",
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("replaces an invalid request id", () => {
    const request = {
      header: vi.fn().mockReturnValue("../../bad request id"),
    } as unknown as RequestWithId;

    const setHeader = vi.fn();

    const response = {
      setHeader,
    } as unknown as Response;

    const next = vi.fn() as NextFunction;

    requestContextMiddleware(request, response, next);

    expect(request.requestId).toMatch(/^[0-9a-f-]{36}$/u);

    expect(request.requestId).not.toBe("../../bad request id");
  });
});
