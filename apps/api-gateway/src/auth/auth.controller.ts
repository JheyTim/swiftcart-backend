import type { RequestWithCorrelationId } from '@app/common';
import { Body, Controller, Post, Req } from '@nestjs/common';
import { AuthProxyService } from './auth-proxy.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

// This controller exposes public auth endpoints from the API Gateway.
@Controller('auth')
export class AuthController {
  constructor(private readonly authProxyService: AuthProxyService) {}

  // Client calls API Gateway, then API Gateway forwards to Auth Service.
  @Post('register')
  register(
    @Req() request: RequestWithCorrelationId,
    @Body() registerDto: RegisterDto,
  ) {
    return this.authProxyService.register(registerDto, request.correlationId);
  }

  // Client receives a JWT from this endpoint after successful login.
  @Post('login')
  login(@Req() request: RequestWithCorrelationId, @Body() loginDto: LoginDto) {
    return this.authProxyService.login(loginDto, request.correlationId);
  }
}
