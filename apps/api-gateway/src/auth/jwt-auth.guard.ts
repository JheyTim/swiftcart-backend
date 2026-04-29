import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// This guard protects API Gateway routes using JWT authentication.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
