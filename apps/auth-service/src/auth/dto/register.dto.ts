import { IsEmail, IsString, MinLength } from 'class-validator';
// DTO means Data Transfer Object.
// It defines and validates the shape of incoming register requests.
export class RegisterDto {
  // The email must be valid because it is used as the login identifier.
  @IsEmail()
  email!: string;

  // Password must have a minimum length for basic security.
  // Later we can add stronger password rules.
  @IsString()
  @MinLength(8)
  password!: string;

  // Full name is stored as basic user profile data.
  @IsString()
  @MinLength(2)
  fullName!: string;
}
