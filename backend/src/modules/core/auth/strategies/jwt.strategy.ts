import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.access_token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      algorithms: ['HS256'],
      secretOrKey: (() => {
        const jwtSecret = configService.get('JWT_SECRET');
        if (!jwtSecret) {
          throw new Error('การตั้งค่าระบบไม่สมบูรณ์ กรุณาติดต่อผู้ดูแลระบบ');
        }
        return jwtSecret;
      })(),
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      role: payload.role,
      organizationId: payload.organizationId,
    };
  }
}
