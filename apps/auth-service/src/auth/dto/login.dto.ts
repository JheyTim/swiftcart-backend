import { IsEmail, IsString, MinLength } from 'class-validator';
// This DTO validates login requests.
export class LoginDto {
  // The user logs in with their email address.
  @IsEmail()
  email!: string;

  // We require a string here because bcrypt will compare it with the stored hash.
  @IsString()
  @MinLength(8)
  password!: string;
}
