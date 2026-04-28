import { Controller, Get } from '@nestjs/common';

// This controller receives HTTP requests for the API Gateway.
// For now, it only exposes a health endpoint so we can verify the app is running.
@Controller()
export class AppController {
  // This endpoint is used to confirm that the API Gateway process is alive.
  // Later, Kubernetes can use similar endpoints for liveness and readiness probes.
  @Get('health')
  getHealth() {
    // A simple JSON response makes it easy for humans and tools to inspect service status.
    return {
      service: 'api-gateway',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
