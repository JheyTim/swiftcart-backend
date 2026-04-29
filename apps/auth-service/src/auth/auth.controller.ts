import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

// This controller exposes HTTP endpoints owned by the Auth Service.
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  // Public endpoint for creating a new user account.
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
  // Public endpoint for logging in and receiving a JWT.
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
  // Protected endpoint that returns the currently authenticated user.
  // This proves that JWT validation works inside the Auth Service.
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() request: Request) {
    // Passport attaches the validated JWT payload to request.user.
    return request.user;
  }
}
