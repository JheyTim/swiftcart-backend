import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
// This strategy validates JWTs at the API Gateway layer.
// It lets the gateway protect routes before forwarding requests to internal services.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // Read the token from Authorization: Bearer <token>.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Reject expired tokens.
      ignoreExpiration: false,
      // Use the same local JWT secret as the Auth Service.
      secretOrKey: configService.get<string>('JWT_SECRET') || '',
    });
  }
  // Passport attaches this return value to request.user.
  validate(payload: { sub: string; email: string }) {
    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
}
