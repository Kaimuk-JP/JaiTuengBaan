import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ActivityCategory } from '@prisma/client';

export interface ActivityLogInput {
  userId?: string;
  action: string;
  category: ActivityCategory;
  entityId?: string;
  entityType?: string;
  before?: any;
  after?: any;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  success?: boolean;
  note?: string;
}

@Injectable()
export class ActivityLoggerService {
  constructor(private readonly prisma: PrismaService) { }

    async log(data: ActivityLogInput): Promise<void> {
    const isLocalhost = data.ipAddress === '::1' ||
      data.ipAddress === '127.0.0.1' ||
      data.ipAddress?.includes('localhost');

    if (isLocalhost) {
      return;
    }

    try {
      await this.prisma.activityLog.create({
        data: {
          userId: data.userId || null,
          action: data.action,
          category: data.category,
          entityId: data.entityId || null,
          entityType: data.entityType || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          device: data.device || null,
          before: data.before || null,
          after: data.after || null,
          success: data.success !== false,
          note: data.note || null,
        },
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

    async getLogs(filters: {
    category?: ActivityCategory;
    action?: string;
    userId?: string;
    success?: boolean;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
    organizationId?: string;
  }) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.success !== undefined) {
      where.success = filters.success;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    if (filters.search) {
      where.OR = [
        { note: { contains: filters.search } },
        { entityId: { contains: filters.search } },
        { ipAddress: { contains: filters.search } },
      ];
    }

    if (filters.organizationId) {
      where.user = {
        organizationId: filters.organizationId
      };
    }

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
              pictureUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

    async getLogById(id: number) {
    if (!id || isNaN(id)) {
      return null;
    }
    return this.prisma.activityLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

    async cleanupOldLogs(daysToKeep: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}
