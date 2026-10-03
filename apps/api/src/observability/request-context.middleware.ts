import { randomUUID } from "node:crypto";

import type { NextFunction, Response } from "express";

import type { RequestWithId } from "./request-with-id.type.js";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/u;

function readIncomingRequestId(request: RequestWithId): string | null {
  const value = request.header("x-request-id");

  if (!value) {
    return null;
  }

  const normalized = value.trim();

  if (!REQUEST_ID_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
}

export function requestContextMiddleware(
  request: RequestWithId,

  response: Response,

  next: NextFunction,
): void {
  const requestId = readIncomingRequestId(request) ?? randomUUID();

  request.requestId = requestId;

  response.setHeader("X-Request-Id", requestId);

  response.setHeader("Cache-Control", "no-store");

  response.setHeader("Pragma", "no-cache");

  next();
}
