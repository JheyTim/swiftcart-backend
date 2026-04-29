import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

// This service forwards auth-related requests from the API Gateway to the Auth Service.
@Injectable()
export class AuthProxyService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // Forward registration to the Auth Service.
  async register(registerDto: RegisterDto) {
    return this.forwardRequest('/auth/register', registerDto);
  }

  // Forward login to the Auth Service.
  async login(loginDto: LoginDto) {
    return this.forwardRequest('/auth/login', loginDto);
  }

  // Shared helper for forwarding POST requests to the Auth Service.
  private async forwardRequest(path: string, body: unknown) {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');

    try {
      // HttpService returns an RxJS Observable, so firstValueFrom converts it to a Promise.
      const response = await firstValueFrom(
        this.httpService.post(`${authServiceUrl}${path}`, body),
      );

      // Return only the response body to the client.
      return response.data;
    } catch (error) {
      // Preserve useful status codes from the Auth Service, like 401 or 409.
      const axiosError = error as AxiosError<any>;

      if (axiosError.response) {
        throw new HttpException(
          axiosError.response.data,
          axiosError.response.status,
        );
      }

      // If there is no response, the Auth Service may be down or unreachable.
      throw new HttpException('Auth Service is unavailable', 503);
    }
  }
}
