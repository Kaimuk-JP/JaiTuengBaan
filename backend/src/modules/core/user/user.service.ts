import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { UploadService } from '../../features/upload/upload.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) { }

  async updateUserProfile(userId: string, updateData: any) {
    const {
      idCard,
      firstName,
      lastName,
      phone,
      relativePhone,
      relativeName,
      birthDate,
      gender,
      villageName,
      subdistrictName,
      districtName,
      provinceName,
      country,
      addressDetail,
      lat,
      lng,
      mobilityStatus,
      diseaseIds,
      customDiseases,
      pictureUrl,
      privacyAcceptedAt,
      privacyVersion,
    } = updateData;

    if (pictureUrl !== undefined) {
      try {
        const currentUser = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { pictureUrl: true },
        });
        if (currentUser?.pictureUrl && currentUser.pictureUrl !== pictureUrl) {
          await this.uploadService.deleteImage(currentUser.pictureUrl);
          this.logger.log(`Deleted old profile picture for user ${userId}: ${currentUser.pictureUrl}`);
        }
      } catch (error) {
        this.logger.warn(`Failed to delete old profile picture for user ${userId}: ${error?.message || error}`);
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        idCard,
        firstName,
        lastName,
        phone,
        relativePhone,
        relativeName,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        gender,
        villageName,
        subdistrictName,
        districtName,
        provinceName,
        country,
        addressDetail,
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
        mobilityStatus,
        customDiseases,
        diseases: diseaseIds ? {
          deleteMany: {},
          create: diseaseIds.map((id: number) => ({ diseaseId: id })),
        } : undefined,
        pictureUrl: pictureUrl !== undefined ? pictureUrl : undefined,
        privacyAcceptedAt: privacyAcceptedAt ? new Date(privacyAcceptedAt) : undefined,
        privacyVersion: privacyVersion !== undefined ? privacyVersion : undefined,
      },
    });

    return user;
  }

  async createPendingUser(data: any, staffId?: string) {
    const {
      idCard,
      firstName,
      lastName,
      phone,
      relativePhone,
      relativeName,
      birthDate,
      gender,
      villageName,
      subdistrictName,
      districtName,
      provinceName,
      country,
      addressDetail,
      lat,
      lng,
      mobilityStatus,
      diseaseIds,
      customDiseases,
      pictureUrl,
      role
    } = data;

    const iamUserId = `pending_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    let municipalityData = {};
    if (staffId) {
      const staffUser = await this.prisma.user.findUnique({
        where: { id: staffId },
        select: {
          organizationId: true,
        }
      });
      if (staffUser && staffUser.organizationId) {
        municipalityData = {
          organizationId: staffUser.organizationId,
        };
      }
    }

    const user = await this.prisma.user.create({
      data: {
        iamUserId,
        role: role || 'USERS',
        idCard,
        firstName,
        lastName,
        phone,
        relativePhone,
        relativeName,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        gender,
        villageName,
        subdistrictName,
        districtName,
        provinceName,
        country,
        addressDetail,
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
        mobilityStatus,
        customDiseases: customDiseases || [],
        diseases: diseaseIds ? {
          create: diseaseIds.map((id: number) => ({ diseaseId: id })),
        } : undefined,
        pictureUrl: pictureUrl !== undefined ? pictureUrl : undefined,
        ...municipalityData,
      },
    });

    return user;
  }

  async getAllUsers(page: number = 1, limit: number = 20) {
    const MAX_LIMIT = 100;
    const safeLimit = Math.min(limit, MAX_LIMIT);
    const skip = (page - 1) * safeLimit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          pictureUrl: true,
          role: true,
          organizationId: true,
          createdAt: true,
        },
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);

    return {
      data: users,
      pagination: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async getAllUsersWithFilter(query: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    organizationId?: string;
  }) {
    const MAX_LIMIT = 100;
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, MAX_LIMIT);
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (query.organizationId) {
      where.organizationId = query.organizationId;
    }

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }

    if (query.role && query.role !== 'ALL') {
      where.role = query.role;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          pictureUrl: true,
          role: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        queues: {
          include: {
            hospital: true,
          },
        },
        createdQueues: {
          include: {
            hospital: true,
            user: true,
          },
        },
        jobsAsVlt: true,
        patientCaregivers: {
          include: {
            caregiver: true,
          },
        },
        diseases: {
          include: {
            disease: true,
          },
        },
      },
    });
  }

  async searchUsers(query: string, roles?: string[], page: number = 1, limit: number = 20, orgId?: string) {
    const MAX_LIMIT = 100;
    const safeLimit = Math.min(limit, MAX_LIMIT);
    const skip = (page - 1) * safeLimit;

    const where: any = { deletedAt: null };

    if (query && query.trim() !== '') {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
      ];
    }

    if (roles && roles.length > 0) {
      where.role = { in: roles };
    }

    if (orgId) {
      where.organizationId = orgId;
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        take: safeLimit,
        skip: skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({
        where,
      }),
    ]);


    return {
      data,
      total,
      page,
      limit: safeLimit,
      hasMore: total > page * safeLimit,
    };
  }

  async getVolunteers(query: { page?: number; limit?: number; search?: string; organizationId?: string }) {
    const MAX_LIMIT = 100;
    const page = query.page || 1;
    const limit = Math.min(query.limit || 9, MAX_LIMIT);
    const skip = (page - 1) * limit;

    const where: any = {
      role: 'DRIVE',
      deletedAt: null,
    };

    if (query.organizationId) {
      where.organizationId = query.organizationId;
    }

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          firstName: 'asc',
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async getCareUs(query: { page?: number; limit?: number; search?: string; organizationId?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 9;
    const skip = (page - 1) * limit;

    const where: any = {
      role: 'CAREU',
      deletedAt: null,
    };

    if (query.organizationId) {
      where.organizationId = query.organizationId;
    }

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          firstName: 'asc',
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async createUser(data: {
    iamUserId: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    addressDetail?: string;
    idCard?: string;
    villageName?: string;
    subdistrictName?: string;
    districtName?: string;
    provinceName?: string;
    country?: string;
    lat?: number;
    lng?: number;
    mobilityStatus?: 'WALKING' | 'WHEELCHAIR' | 'BEDRIDDEN';
    role?: 'USERS' | 'DRIVE' | 'CAREGIVER' | 'CAREU' | 'STAFF' | 'ADMIN';
  }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { iamUserId: data.iamUserId },
    });

    if (existingUser) {
      return this.prisma.user.update({
        where: { iamUserId: data.iamUserId },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          addressDetail: data.addressDetail,
          idCard: data.idCard,
          villageName: data.villageName,
          subdistrictName: data.subdistrictName,
          districtName: data.districtName,
          provinceName: data.provinceName,
          country: data.country,
          lat: data.lat,
          lng: data.lng,
          mobilityStatus: data.mobilityStatus,
          ...(data.role && { role: data.role }),
        },
      });
    }

    return this.prisma.user.create({
      data: {
        iamUserId: data.iamUserId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        addressDetail: data.addressDetail,
        idCard: data.idCard,
        villageName: data.villageName,
        subdistrictName: data.subdistrictName,
        districtName: data.districtName,
        provinceName: data.provinceName,
        country: data.country,
        lat: data.lat,
        lng: data.lng,
        mobilityStatus: data.mobilityStatus,
        role: data.role || 'USERS',
      },
    });
  }

  async deleteUser(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      await tx.job.updateMany({
        where: { vltId: userId, deletedAt: null },
        data: { deletedAt: now }
      });

      await tx.queue.updateMany({
        where: { userId: userId, deletedAt: null },
        data: { deletedAt: now }
      });

      await tx.notification.deleteMany({
        where: { userId },
      });

      await tx.profileEditRequest.deleteMany({
        where: { userId },
      });

      const deletedUser = await tx.user.update({
        where: { id: userId },
        data: { deletedAt: now }
      });

      return {
        success: true,
        message: 'ปิดใช้งานบัญชีผู้ใช้สำเร็จ (Soft Delete)',
        deletedUser: {
          id: deletedUser.id,
          firstName: deletedUser.firstName,
          lastName: deletedUser.lastName,
        },
      };
    });
  }

  async getMyResidences(userId: string) {
    return this.prisma.iamUserResidence.findMany({
      where: { userId },
      orderBy: [
        { status: 'asc' },
        { syncedAt: 'desc' },
      ],
    });
  }
}
