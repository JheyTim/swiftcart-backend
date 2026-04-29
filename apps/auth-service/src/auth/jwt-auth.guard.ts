import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// This guard protects routes using the Passport JWT strategy.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
