import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

// HealthController exposes liveness and readiness endpoints.
@Controller('health')
export class HealthController {
  constructor(private readonly healthCheckService: HealthCheckService) {}
  // Liveness means the process is running.
  @Get('live')
  live() {
    return {
      status: 'ok',
      check: 'live',
      timestamp: new Date().toISOString(),
    };
  }
  // Readiness means the service can receive traffic.
  // We start with a basic readiness check and improve dependency checks later.
  @Get('ready')
  @HealthCheck()
  ready() {
    return this.healthCheckService.check([]);
  }
}
