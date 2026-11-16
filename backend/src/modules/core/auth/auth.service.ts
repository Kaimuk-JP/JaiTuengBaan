import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { Role, ActivityCategory } from '@prisma/client';
import { UploadService } from '@/modules/features/upload/upload.service';
import { ConfigService } from '../../../core/config';
import { ActivityLoggerService } from '@/modules/system/activity-log/activity-logger.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private uploadService: UploadService,
    private config: ConfigService,
    private activityLogger: ActivityLoggerService,
  ) { }

  async validateOrCreateUser(profile: { iamUserId: string; displayName: string }) {
    const { iamUserId, displayName } = profile;



    let user = await this.prisma.user.findUnique({
      where: { iamUserId },
    });



    if (!user) {

      user = await this.prisma.user.create({
        data: {
          iamUserId,
          firstName: displayName || null,
        },
      });

    } else {

      const updateData: any = {};

      if (!user.firstName && displayName) {
        updateData.firstName = displayName;
      }

      if (Object.keys(updateData).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    }

    return user;
  }

  async handleLineLogin(code: string, redirectUri: string) {
    const channelId = this.config.lineChannelId;
    const channelSecret = this.config.lineChannelSecret;
    if (!channelId || !channelSecret) {
      this.logger.error('[LINE] Missing LINE_CHANNEL_ID or LINE_CHANNEL_SECRET');
      throw new BadRequestException('การตั้งค่า LINE Login ไม่สมบูรณ์ กรุณาติดต่อผู้ดูแลระบบ');
    }

    let target: URL;
    try { target = new URL(redirectUri); } catch { throw new BadRequestException('redirectUri ไม่ถูกต้อง'); }
    const allowedOrigins = this.config.frontendUrl.split(',').map((s) => s.trim()).filter(Boolean).map((s) => { try { return new URL(s).origin; } catch { return ''; } });
    const isLocal = this.config.nodeEnv !== 'production' && /^(localhost|127\.0\.0\.1)$/.test(target.hostname);
    if (target.pathname !== '/auth/line-callback' || !(allowedOrigins.includes(target.origin) || isLocal)) {
      throw new BadRequestException('redirectUri ไม่ได้รับอนุญาต');
    }

    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: channelId,
        client_secret: channelSecret,
      }).toString(),
    });
    if (!tokenRes.ok) {
      this.logger.warn(`[LINE] token exchange failed: ${tokenRes.status}`);
      throw new UnauthorizedException('เข้าสู่ระบบด้วย LINE ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
    const tokenData: any = await tokenRes.json();

    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!profileRes.ok) {
      this.logger.warn(`[LINE] profile failed: ${profileRes.status}`);
      throw new UnauthorizedException('ไม่สามารถดึงข้อมูลโปรไฟล์ LINE ได้');
    }
    const profile: any = await profileRes.json();
    const lineUserId: string = profile.userId;
    if (!lineUserId) throw new UnauthorizedException('ไม่พบข้อมูลผู้ใช้จาก LINE');

    let user = await this.prisma.user.findUnique({ where: { lineUserId } });
    if (user?.deletedAt) {
      throw new UnauthorizedException('บัญชีนี้ถูกปิดการใช้งาน กรุณาติดต่อเจ้าหน้าที่');
    }
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          iamUserId: `line:${lineUserId}`,
          lineUserId,
          firstName: profile.displayName || null,
          lineDisplayName: profile.displayName || null,
          linePictureUrl: profile.pictureUrl || null,
          lineConnectedAt: new Date(),
        },
      });
      this.logger.log(`[LINE] created user ${user.id}`);
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { lineDisplayName: profile.displayName || null, linePictureUrl: profile.pictureUrl || null },
      });
    }
    return user;
  }

  async verifyAndLinkAccount(userId: string, idCard: string, phone: string) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new BadRequestException('ไม่พบผู้ใช้');
    }

    if (currentUser.phone && currentUser.idCard) {
      return {
        success: true,
        matched: false,
        message: 'คุณลงทะเบียนเรียบร้อยแล้ว',
        user: currentUser,
      };
    }

    const cleanIdCard = idCard ? idCard.replace(/\D/g, '') : '';
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';

    const pendingUser = await this.prisma.user.findFirst({
      where: {
        iamUserId: {
          startsWith: 'pending_',
        },
        idCard: cleanIdCard,
        phone: cleanPhone,
      },
    });

    if (pendingUser) {
      const result = await this.prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: currentUser.id },
          data: {
            role: pendingUser.role || currentUser.role || 'USERS',
            idCard: pendingUser.idCard,
            firstName: pendingUser.firstName,
            lastName: pendingUser.lastName,
            phone: pendingUser.phone,
            gender: pendingUser.gender,
            birthDate: pendingUser.birthDate,
            villageName: pendingUser.villageName,
            subdistrictName: pendingUser.subdistrictName,
            districtName: pendingUser.districtName,
            provinceName: pendingUser.provinceName,
            country: pendingUser.country,
            addressDetail: pendingUser.addressDetail,
            houseNo: pendingUser.houseNo,
            road: pendingUser.road,
            postalCode: pendingUser.postalCode,
            lat: pendingUser.lat,
            lng: pendingUser.lng,
            mobilityStatus: pendingUser.mobilityStatus,
            pictureUrl: pendingUser.pictureUrl,
            organizationId: pendingUser.organizationId,
            specialNeeds: pendingUser.specialNeeds,
            customDiseases: pendingUser.customDiseases,
            relativeName: pendingUser.relativeName,
            relativePhone: pendingUser.relativePhone,
          },
        });

        await tx.caregiverPatient.updateMany({
          where: { patientId: pendingUser.id },
          data: { patientId: currentUser.id },
        });

        await tx.caregiverPatient.updateMany({
          where: { caregiverId: pendingUser.id },
          data: { caregiverId: currentUser.id },
        });

        const pendingDiseases = await tx.userDisease.findMany({
          where: { userId: pendingUser.id },
        });

        for (const pd of pendingDiseases) {
          await tx.userDisease.upsert({
            where: {
              userId_diseaseId: {
                userId: currentUser.id,
                diseaseId: pd.diseaseId,
              },
            },
            create: {
              userId: currentUser.id,
              diseaseId: pd.diseaseId,
            },
            update: {},
          });
        }

        await tx.userDisease.deleteMany({
          where: { userId: pendingUser.id },
        });

        await tx.user.delete({
          where: { id: pendingUser.id },
        });

        return updatedUser;
      });

      return {
        success: true,
        matched: true,
        message: 'ยืนยันตัวตนสำเร็จ! พบข้อมูลที่เทศบาลลงทะเบียนไว้ในระบบ',
        user: result,
      };
    }

    return {
      success: true,
      matched: false,
      message: 'ไม่พบข้อมูลที่ลงทะเบียนไว้ กรุณากรอกข้อมูลใหม่',
      user: currentUser,
    };
  }

  async login(user: any, res: Response, request?: any) {
    const forwardedFor = request?.headers?.['x-forwarded-for'];
    const realIp = request?.headers?.['x-real-ip'];
    const ipAddress = forwardedFor
      ? (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0].trim())
      : realIp || request?.ip || request?.connection?.remoteAddress || null;

    const userAgent = request?.headers?.['user-agent'] || null;

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


    const payload = {
      sub: user.id,
      role: user.role,
      organizationId: user.organizationId,
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: '24h',
    });

    const refresh_token = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: '7d' },
    );

    const hashedRefreshToken = await bcrypt.hash(refresh_token, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashedRefreshToken,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || '';
    const isHttps = frontendUrl.startsWith('https');

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });


    const response = {
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        pictureUrl: user.pictureUrl,
        role: user.role,
        phone: user.phone,
        idCard: user.idCard,
      },
    };

    this.activityLogger.log({
      userId: user.id,
      action: 'LOGIN',
      category: ActivityCategory.AUTH,
      ipAddress,
      userAgent,
      device,
      after: { role: user.role },
      success: true,
    }).catch(err => this.logger.error('Failed to log login:', err));

    return response;
  }

  verifyTokenIgnoringExpiration(token: string) {
    try {
      return this.jwtService.verify(token, {
        ignoreExpiration: true,
        algorithms: ['HS256'],
      });
    } catch {
      return null;
    }
  }

  async refreshSession(refreshToken: string, res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('ไม่พบ session กรุณาเข้าสู่ระบบใหม่');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
    }

    if (!payload || payload.type !== 'refresh' || !payload.sub) {
      throw new UnauthorizedException('ประเภท token ไม่ถูกต้อง');
    }

    return await this.refreshAccessToken(payload.sub, refreshToken, res);
  }

  async refreshAccessToken(userId: string, refreshToken: string, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('ไม่พบข้อมูลผู้ใช้');
    }

    let isMatch = false;
    try {
      if (user.refreshToken && user.refreshToken.startsWith('$2')) {
        isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
      } else if (user.refreshToken === refreshToken) {
        isMatch = true;
      }
    } catch (e) {
      isMatch = false;
    }

    if (!isMatch) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          refreshToken: null,
        },
      });
      throw new UnauthorizedException('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
    }

    const payload = {
      sub: user.id,
      role: user.role,
      organizationId: user.organizationId,
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: '24h',
    });

    const new_refresh_token = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: '7d' },
    );

    const hashedRefreshToken = await bcrypt.hash(new_refresh_token, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashedRefreshToken,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || '';
    const isHttps = frontendUrl.startsWith('https');

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.cookie('refresh_token', new_refresh_token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      success: true,
      user: {
        id: user.id,
        iamUserId: user.iamUserId,
        firstName: user.firstName,
        lastName: user.lastName,
        pictureUrl: user.pictureUrl,
        role: user.role,
        pointsBalance: user.pointsBalance,
        phone: user.phone,
        idCard: user.idCard,
      },
    };
  }

  async updateUserRole(iamUserId: string, newRole: Role) {
    const user = await this.prisma.user.update({
      where: { iamUserId },
      data: { role: newRole },
    });
    return user;
  }

  async switchUserRole(userId: string, newRole: Role) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new NotFoundException('ไม่พบผู้ใช้');
    }

    const allowed = (currentUser.allowedRoles && currentUser.allowedRoles.length > 0
      ? currentUser.allowedRoles
      : (currentUser.role ? [Role.USERS, currentUser.role] : [Role.USERS])) as Role[];

    const isAdmin = currentUser.role === 'ADMIN' || allowed.includes(Role.ADMIN);
    const isCitizenTier = newRole === Role.USERS || newRole === Role.CAREGIVER;

    if (!isAdmin && !isCitizenTier && !allowed.includes(newRole)) {
      throw new BadRequestException('คุณไม่ได้รับสิทธิ์ให้ใช้งานในบทบาทนี้ กรุณายื่นคำร้องขอสิทธิ์');
    }

    const currentAllowedSet = new Set<Role>(allowed);
    currentAllowedSet.add(newRole);
    currentAllowedSet.add(Role.USERS);

    const previousRole = currentUser.role;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: newRole,
        allowedRoles: Array.from(currentAllowedSet),
      },
    });

    this.activityLogger.log({
      userId: user.id,
      action: 'SWITCH_ROLE',
      category: ActivityCategory.AUTH,
      before: { role: previousRole },
      after: { role: newRole },
      success: true,
    }).catch(err => this.logger.error('Failed to log role switch:', err));

    return user;
  }


  async getMinimalUser(criteria: { iamUserId: string } | { id: string }) {
    const user = await this.prisma.user.findFirst({
      where: criteria,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        pictureUrl: true,
        role: true,
        allowedRoles: true,
        phone: true,
        idCard: true,
        pointsBalance: true,
        organizationId: true,
        birthDate: true,
        gender: true,
        lat: true,
        lng: true,
        lineUserId: true,
        lineDisplayName: true,
        linePictureUrl: true,
        lineConnectedAt: true,
        privacyAcceptedAt: true,
        privacyVersion: true,
        organization: {
          select: {
            id: true,
            name: true,
            lat: true,
            lng: true,
            province: true,
            district: true,
            lockReturnOfficeEnabled: true,
            returnOfficeRadiusMeters: true,
            allowUserCancelQueue: true,
            minCancelHoursBefore: true,
            allowVolunteerCancelJob: true,
            minVolunteerCancelHoursBefore: true,
            advanceBookingLimitEnabled: true,
            advanceBookingUnit: true,
            advanceBookingValue: true,
            minAdvanceBookingDays: true,
          }
        }
      },
    });

    return user;
  }

  async getFullUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        iamUserId: true,
        firstName: true,
        lastName: true,
        pictureUrl: true,
        lineUserId: true,
        lineDisplayName: true,
        linePictureUrl: true,
        lineConnectedAt: true,
        role: true,
        idCard: true,
        phone: true,
        relativeName: true,
        relativePhone: true,
        birthDate: true,
        gender: true,
        placeName: true,
        houseNo: true,
        road: true,
        neighbourhood: true,
        postalCode: true,
        villageName: true,
        subdistrictName: true,
        districtName: true,
        provinceName: true,
        country: true,
        addressDetail: true,
        lat: true,
        lng: true,
        mobilityStatus: true,
        customDiseases: true,
        diseases: {
          include: {
            disease: true,
          },
        },
        specialNeeds: true,
        pointsBalance: true,
        privacyAcceptedAt: true,
        privacyVersion: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            lat: true,
            lng: true,
            province: true,
            district: true,
            lockReturnOfficeEnabled: true,
            returnOfficeRadiusMeters: true,
            allowUserCancelQueue: true,
            minCancelHoursBefore: true,
            allowVolunteerCancelJob: true,
            minVolunteerCancelHoursBefore: true,
            advanceBookingLimitEnabled: true,
            advanceBookingUnit: true,
            advanceBookingValue: true,
            minAdvanceBookingDays: true,
          }
        },
        queues: {
          select: {
            id: true,
            department: true,
            requestDate: true,
            bookingTime: true,
            hasAppointment: true,
            status: true,
            adminNote: true,
            appointmentImage: true,
            requiredEquipment: true,
            createdAt: true,
            hospital: {
              select: {
                name: true,
              },
            },
            user: {
              select: {
                firstName: true,
                lastName: true,
                mobilityStatus: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        createdQueues: {
          select: {
            id: true,
            department: true,
            requestDate: true,
            bookingTime: true,
            hasAppointment: true,
            status: true,
            adminNote: true,
            appointmentImage: true,
            requiredEquipment: true,
            createdAt: true,
            hospital: {
              select: {
                name: true,
              },
            },
            user: {
              select: {
                firstName: true,
                lastName: true,
                mobilityStatus: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        patientCaregivers: {
          where: { status: 'APPROVED' },
          select: {
            caregiver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                pictureUrl: true,
                phone: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!user) return null;

    if (!user) return null;

    const caregiver = user.patientCaregivers?.[0]?.caregiver || null;

    const [driverPointsResult, careuPointsResult] = await Promise.all([
      this.prisma.job.aggregate({
        _sum: { earnedPoints: true },
        where: {
          vltId: userId,
          status: 'COMPLETED',
        },
      }),
      this.prisma.job.aggregate({
        _sum: { earnedPoints: true },
        where: {
          careuId: userId,
          status: 'COMPLETED',
        },
      }),
    ]);

    const driverPoints = driverPointsResult._sum.earnedPoints || 0;
    const careuPoints = careuPointsResult._sum.earnedPoints || 0;
    const volunteerPoints = Math.max(0, (user.pointsBalance || 0) - driverPoints - careuPoints);

    return {
      ...user,
      caregiver,
      allDiseases: [
        ...user.diseases.map(d => ({ type: 'db', id: d.diseaseId, name: d.disease.name })),
        ...(user.customDiseases || []).map(name => ({ type: 'custom', name })),
      ],
      pointsBreakdown: {
        volunteer: volunteerPoints,
        driver: driverPoints,
        careu: careuPoints,
      },
    };
  }

  private maskIdCard(idCard: string | null): string | null {
    if (!idCard) return null;
    if (idCard.length >= 4) {
      return '*'.repeat(idCard.length - 4) + idCard.slice(-4);
    }
    return idCard;
  }

  private maskPhone(phone: string | null): string | null {
    if (!phone) return null;
    if (phone.length >= 4) {
      return '*'.repeat(phone.length - 4) + phone.slice(-4);
    }
    return phone;
  }

  async getMaskedUserProfile(criteria: { iamUserId: string } | { id: string }) {
    const user = await this.prisma.user.findFirst({
      where: criteria,
      select: {
        id: true,
        iamUserId: true,
        firstName: true,
        lastName: true,
        pictureUrl: true,
        role: true,
        idCard: true,
        phone: true,
        birthDate: true,
        gender: true,
        placeName: true,
        houseNo: true,
        road: true,
        neighbourhood: true,
        postalCode: true,
        villageName: true,
        subdistrictName: true,
        districtName: true,
        provinceName: true,
        country: true,
        addressDetail: true,
        lat: true,
        lng: true,
        mobilityStatus: true,
        customDiseases: true,
        diseases: {
          include: {
            disease: true,
          },
        },
        specialNeeds: true,
        pointsBalance: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            lat: true,
            lng: true,
            province: true,
            district: true,
            lockReturnOfficeEnabled: true,
            returnOfficeRadiusMeters: true,
            allowUserCancelQueue: true,
            minCancelHoursBefore: true,
            allowVolunteerCancelJob: true,
            minVolunteerCancelHoursBefore: true,
            advanceBookingLimitEnabled: true,
            advanceBookingUnit: true,
            advanceBookingValue: true,
            minAdvanceBookingDays: true,
          }
        },
        queues: {
          select: {
            id: true,
            department: true,
            requestDate: true,
            bookingTime: true,
            hasAppointment: true,
            status: true,
            adminNote: true,
            createdAt: true,
            hospital: {
              select: {
                name: true,
              },
            },
          },
        },
        patientCaregivers: {
          select: {
            id: true,
            caregiver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                pictureUrl: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    return {
      ...user,
      idCard: this.maskIdCard(user.idCard),
      phone: this.maskPhone(user.phone),
      patientCaregivers: user.patientCaregivers.map((pc) => ({
        ...pc,
        caregiver: {
          ...pc.caregiver,
          phone: this.maskPhone(pc.caregiver.phone),
        },
      })),
      allDiseases: [
        ...user.diseases.map(d => ({ type: 'db', id: d.diseaseId, name: d.disease.name })),
        ...user.customDiseases.map(name => ({ type: 'custom', name })),
      ],
    };
  }

}

