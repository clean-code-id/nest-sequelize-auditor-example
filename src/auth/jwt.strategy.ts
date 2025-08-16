import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'your-secret-key' // In production, use environment variable
    });
  }

  async validate(payload: { id: string; email: string }) {
    // This mimics your friend's JWT strategy
    return {
      ...payload,
      user_id: payload.id // Maps 'id' to 'user_id' (like your friend's setup)
    };
  }
}