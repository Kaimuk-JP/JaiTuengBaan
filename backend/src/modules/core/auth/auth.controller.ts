import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Req,
  Res,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import type { Response } from 'express';
import { AuthService } from './auth.service';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { UpdateUserRoleDto, SwitchRoleDto } from './dto';
import { ConfigService } from '../../../core/config';
import { Throttle } from '@nestjs/throttler';


@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) { }



  @Post('line-login')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'LINE Login callback', description: 'รับ code จาก LINE Login แล้วเข้าสู่ระบบ (สร้างบัญชีให้ถ้ายังไม่มี)' })
  @ApiResponse({ status: 200, description: 'Login สำเร็จ' })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  async lineLogin(
    @Body() body: { code: string; redirectUri: string },
    @Res({ passthrough: true }) res: Response,
    @Req() req: any,
  ) {
    if (!body?.code || typeof body.code !== 'string' || !body?.redirectUri || typeof body.redirectUri !== 'string') {
      throw new BadRequestException('ต้องระบุ code และ redirectUri');
    }
    const user = await this.authService.handleLineLogin(body.code, body.redirectUri);
    return this.authService.login(user, res, req);
  }

  @Post('verify-and-link')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Verify และ Link account ด้วยเลขบัตรประชาชนและเบอร์โทร',
    description: 'ใช้สำหรับประชาชนที่ login ด้วย LINE เพื่อ match กับข้อมูลที่ผู้ดูแลประชาชนลงทะเบียนไว้'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'ยืนยันตัวตนสำเร็จ' })
  @ApiResponse({ status: 400, description: 'ข้อมูลไม่ถูกต้อง' })
  async verifyAndLink(
    @Request() req,
    @Body() body: { idCard: string; phone: string },
  ) {
    if (!body.idCard || body.idCard.length !== 13) {
      throw new BadRequestException('เลขบัตรประชาชนต้องมี 13 หลัก');
    }

    if (!body.phone || body.phone.length !== 10) {
      throw new BadRequestException('เบอร์โทรศัพท์ต้องมี 10 หลัก');
    }

    const result = await this.authService.verifyAndLinkAccount(
      req.user.userId,
      body.idCard,
      body.phone,
    );

    return result;
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'ดึงข้อมูลโปรไฟล์ผู้ใช้ปัจจุบัน' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'ข้อมูลโปรไฟล์' })
  async getProfile(@Request() req) {
    return this.authService.getMinimalUser({ id: req.user.userId });
  }

  @Post('user/update-role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async updateUserRole(@Body() updateUserRoleDto: UpdateUserRoleDto) {
    const user = await this.authService.updateUserRole(
      updateUserRoleDto.iamUserId,
      updateUserRoleDto.role as any,
    );
    return {
      success: true,
      message: 'เปลี่ยนบทบาทสำเร็จ',
      user,
    };
  }

  @Post('switch-role')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'เปลี่ยนบทบาทตัวเอง',
    description: 'ให้ผู้ใช้เปลี่ยนบทบาทตัวเองได้เฉพาะ USERS และ CAREGIVER เท่านั้น DRIVE/CAREU ต้องขออนุมัติจากเทศบาลผ่าน RoleRequest'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'เปลี่ยนบทบาทสำเร็จ' })
  @ApiResponse({ status: 400, description: 'ไม่สามารถเปลี่ยนบทบาทได้ หรือบทบาทไม่ถูกต้อง' })
  async switchRole(
    @Request() req,
    @Body() switchRoleDto: SwitchRoleDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.switchUserRole(
      req.user.userId,
      switchRoleDto.role as any,
    );

    return await this.authService.login(user, res, req);
  }

  @Post('refresh')
  @Public()
  async refresh(@Request() req, @Res({ passthrough: true }) res: Response) {
    const refresh_token = req.cookies?.refresh_token;
    return await this.authService.refreshSession(refresh_token, res);
  }

  @Post('logout')
  async logout(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    let userId: string | null = req.user?.id || req.user?.sub || null;

    if (!userId) {
      try {
        const accessToken = req.cookies?.access_token;
        if (accessToken) {
          const verified = this.authService.verifyTokenIgnoringExpiration(accessToken);
          if (verified && typeof verified === 'object' && verified.sub) {
            userId = String(verified.sub);
          }
        }
      } catch (error) {
        this.logger.warn('Could not verify token for logout');
      }
    }

    if (userId) {
      try {
        await this.authService['prisma'].user.update({
          where: { id: userId },
          data: {
            refreshToken: null,
          },
        });

        const forwardedFor = req?.headers?.['x-forwarded-for'];
        const realIp = req?.headers?.['x-real-ip'];
        const ipAddress = forwardedFor
          ? (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0].trim())
          : realIp || req?.ip || req?.connection?.remoteAddress || null;

        const userAgent = req?.headers?.['user-agent'] || null;
        let device = '-';
        if (userAgent) {
          const ua = userAgent.toLowerCase();
          if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) {
            device = 'Mobile';
          } else if (ua.includes('tablet') || ua.includes('ipad')) {
            device = 'Tablet';
          } else {
            device = 'Desktop';
          }

          if (ua.includes('chrome') && !ua.includes('edg')) {
            device += ' (Chrome)';
          } else if (ua.includes('edg')) {
            device += ' (Edge)';
          } else if (ua.includes('firefox')) {
            device += ' (Firefox)';
          } else if (ua.includes('safari') && !ua.includes('chrome')) {
            device += ' (Safari)';
          }
        }

        this.authService['activityLogger'].log({
          userId,
          action: 'LOGOUT',
          category: 'AUTH' as any,
          ipAddress,
          userAgent,
          device,
          success: true,
        }).catch(err => this.logger.error('Failed to log logout:', err));
      } catch (error) {
        this.logger.warn('Failed to clear refresh token from DB');
      }
    }

    const frontendUrl = process.env.FRONTEND_URL || '';
    const isHttps = frontendUrl.startsWith('https');

    const commonOptions = {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'strict' as const,
      path: '/',
    };

    res.clearCookie('access_token', commonOptions);
    res.clearCookie('refresh_token', commonOptions);

    res.clearCookie('next-auth.session-token', {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
    });
    res.clearCookie('next-auth.callback-url', {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
    });
    res.clearCookie('next-auth.csrf-token', {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
    });

    res.clearCookie('oauth_state', {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
    });

    return {
      success: true,
      message: 'ออกจากระบบสำเร็จ',
    };
  }
}
