import { Injectable, ServiceUnavailableException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  liveness() {
    return {
      status: "ok",

      service: "warehouse-api",

      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  async readiness() {
    try {
      await this.prisma.$queryRaw`
          SELECT 1
        `;

      return {
        status: "ok",

        checks: {
          database: "up",
        },
      };
    } catch {
      throw new ServiceUnavailableException({
        status: "not_ready",

        checks: {
          database: "down",
        },
      });
    }
  }
}
