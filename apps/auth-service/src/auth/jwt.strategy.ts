import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { JwtPayload } from './types/jwt-payload.type';

// This strategy tells Passport how to validate JWT bearer tokens.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      // Extract the JWT from the Authorization: Bearer <token> header.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Reject expired tokens automatically.
      ignoreExpiration: false,
      // Secret used to verify the JWT signature.
      secretOrKey: configService.get<string>('JWT_SECRET') || '',
    });
  }
  // validate runs after Passport verifies the token signature and expiration.
  async validate(payload: JwtPayload) {
    // Load the current user from the database so deleted users cannot keep using old tokens.
    return this.authService.findSafeUserById(payload.sub);
  }
}
