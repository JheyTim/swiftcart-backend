import { Body, Controller, Post } from '@nestjs/common';
import { AuthProxyService } from './auth-proxy.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

// This controller exposes public auth endpoints from the API Gateway.
@Controller('auth')
export class AuthController {
  constructor(private readonly authProxyService: AuthProxyService) {}

  // Client calls API Gateway, then API Gateway forwards to Auth Service.
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authProxyService.register(registerDto);
  }

  // Client receives a JWT from this endpoint after successful login.
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authProxyService.login(loginDto);
  }
}
