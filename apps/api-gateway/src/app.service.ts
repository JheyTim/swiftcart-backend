import { Injectable } from '@nestjs/common';

// Injectable marks this class as a NestJS provider.
// Providers usually hold business logic and can be injected into controllers.
@Injectable()
export class AppService {
  // This method is not used much yet, but we keep it as a simple example
  // of where reusable application logic would live.
  getHello(): string {
    return 'API Gateway is running';
  }
}