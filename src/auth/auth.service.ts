import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../user/user.model';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User)
    private userModel: typeof User
  ) {}

  // Real login with database validation
  async login(email: string, password: string) {
    // Find user in database
    const user = await this.userModel.findOne({
      where: { email }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Create JWT payload with real user data
    const payload = { 
      id: user.id.toString(),  // Real user ID from database
      email: user.email,
      name: user.name
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };
  }

  // Generate token for specific user (for testing)
  generateToken(userId: string, email: string) {
    const payload = { id: userId, email };
    return this.jwtService.sign(payload);
  }
}