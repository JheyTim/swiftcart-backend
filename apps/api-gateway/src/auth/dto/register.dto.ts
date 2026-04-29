import { IsEmail, IsString, MinLength } from 'class-validator';

// API Gateway validates the request before forwarding it to Auth Service.
// This catches bad input at the edge of the system.
export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;
}
