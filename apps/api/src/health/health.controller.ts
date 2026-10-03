import { Controller, Get } from "@nestjs/common";

import { Public } from "../auth/decorators/public.decorator.js";

import { HealthService } from "./health.service.js";

@Controller("health")
@Public()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get("live")
  liveness() {
    return this.healthService.liveness();
  }

  @Get("ready")
  readiness() {
    return this.healthService.readiness();
  }
}
