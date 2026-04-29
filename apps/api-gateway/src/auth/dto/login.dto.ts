import { IsEmail, IsString, MinLength } from 'class-validator';

// API Gateway login DTO mirrors the Auth Service login DTO.
// Later we can move shared DTOs into libs/common to remove duplication.
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
