import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto, RegisterDto } from '@app/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { JwtPayload } from './types/jwt-payload.type';

// Injectable allows this service to be injected into controllers.
@Injectable()
export class AuthService {
  constructor(
    // InjectRepository gives us database access for the User entity.
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    // JwtService signs and verifies JWTs.
    private readonly jwtService: JwtService,
  ) {}

  // Registers a new user and returns a safe user object without passwordHash.
  async register(registerDto: RegisterDto) {
    // Normalize email so User@Email.com and user@email.com are treated the same.
    const email = registerDto.email.toLowerCase().trim();

    // Check if the email is already registered.
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      // ConflictException becomes HTTP 409.
      throw new ConflictException('Email is already registered');
    }

    // Generate a salted password hash.
    // The number 12 is the salt rounds value; higher is slower but stronger.
    const passwordHash = await bcrypt.hash(registerDto.password, 12);

    // Create an entity instance but do not save it yet.
    const user = this.usersRepository.create({
      email,
      passwordHash,
      fullName: registerDto.fullName,
    });

    // Save the new user to PostgreSQL.
    const savedUser = await this.usersRepository.save(user);

    // Return only safe fields to the client.
    return this.toSafeUser(savedUser);
  }

  // Logs in a user by checking email and password.
  async login(loginDto: LoginDto) {
    const email = loginDto.email.toLowerCase().trim();

    // Look up the user by email.
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Use a generic message so attackers cannot tell whether an email exists.
      throw new UnauthorizedException('Invalid email or password');
    }

    // Compare the plain password with the stored bcrypt hash.
    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Build a small JWT payload.
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    // Sign the JWT using the secret configured in AuthModule.
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      user: this.toSafeUser(user),
    };
  }

  // Finds a user by ID and returns safe fields.
  async findSafeUserById(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return this.toSafeUser(user);
  }

  // Converts a User entity into an object that is safe to return from APIs.
  private toSafeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
