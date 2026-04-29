import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

// Extend Express Request so TypeScript knows request.user exists after authentication.
type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
  };
};

// This controller contains protected API Gateway routes.
@Controller('profile')
export class ProfileController {
  // This route requires a valid JWT.
  @UseGuards(JwtAuthGuard)
  @Get()
  getProfile(@Req() request: AuthenticatedRequest) {
    // request.user is attached by Passport after JWT validation succeeds.
    return {
      message: 'You accessed a protected API Gateway route',
      user: request.user,
    };
  }
}
