import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

// HealthModule provides liveness and readiness endpoints.
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
