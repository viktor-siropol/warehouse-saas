import { ServiceUnavailableException } from "@nestjs/common";

import { describe, expect, it, vi } from "vitest";

import type { PrismaService } from "../prisma/prisma.service.js";

import { HealthService } from "./health.service.js";

describe("HealthService", () => {
  it("reports liveness", () => {
    const prisma = {
      $queryRaw: vi.fn(),
    } as unknown as PrismaService;

    const service = new HealthService(prisma);

    expect(service.liveness()).toMatchObject({
      status: "ok",

      service: "warehouse-api",
    });
  });

  it("reports readiness when database responds", async () => {
    const queryRaw = vi.fn().mockResolvedValue([
      {
        "?column?": 1,
      },
    ]);

    const prisma = {
      $queryRaw: queryRaw,
    } as unknown as PrismaService;

    const service = new HealthService(prisma);

    await expect(service.readiness()).resolves.toEqual({
      status: "ok",

      checks: {
        database: "up",
      },
    });
  });

  it("returns service unavailable when database is unavailable", async () => {
    const prisma = {
      $queryRaw: vi.fn().mockRejectedValue(new Error("database offline")),
    } as unknown as PrismaService;

    const service = new HealthService(prisma);

    await expect(service.readiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
