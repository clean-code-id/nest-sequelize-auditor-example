import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: any) {
    // This shows what req.user looks like after JWT validation
    return {
      message: 'Authenticated user profile',
      user: req.user, // This will have { id, email, user_id }
    };
  }

  @Get('test-token')
  getTestToken() {
    // Quick way to get a test token without login
    return {
      access_token: this.authService.generateToken('user-456', 'admin@example.com'),
      instructions: 'Use this token in Authorization header: Bearer <token>'
    };
  }
}