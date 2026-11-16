import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { NotificationService, NotificationType } from '../../system/notification/notification.service';
import { ActivityLoggerService } from '../../system/activity-log/activity-logger.service';
import { CreateRoleRequestDto, ReviewRoleRequestDto } from './dto/role-request.dto';
import { ActivityCategory, Role, RoleRequestStatus } from '@prisma/client';

export const getRoleDisplayName = (role: Role | string): string => {
    const map: Record<string, string> = {
        USERS: 'ประชาชนทั่วไป',
        CAREGIVER: 'ผู้ดูแลประชาชน',
        DRIVE: 'จิตอาสาขับรถ',
        CAREU: 'จิตอาสาแคร์ยู',
        STAFF: 'เจ้าหน้าที่เทศบาล',
        EXECUTIVE: 'ผู้บริหาร',
        ADMIN: 'ผู้ดูแลระบบ',
    };
    return map[role] || role;
};

@Injectable()
export class RoleRequestService {
    private readonly logger = new Logger(RoleRequestService.name);

    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService,
        private activityLogger: ActivityLoggerService,
    ) { }

    async create(userId: string, dto: CreateRoleRequestDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, allowedRoles: true, firstName: true, lastName: true, organizationId: true },
        });

        if (!user) {
            throw new NotFoundException('ไม่พบข้อมูลผู้ใช้');
        }

        const allowed = user.allowedRoles || (user.role ? [user.role] : ['USERS']);
        if (allowed.includes(dto.requestedRole)) {
            throw new BadRequestException(`คุณมีสิทธิ์ในบทบาท "${getRoleDisplayName(dto.requestedRole)}" อยู่แล้ว`);
        }

        const pendingRequest = await this.prisma.roleRequest.findFirst({
            where: {
                userId,
                requestedRole: dto.requestedRole,
                status: RoleRequestStatus.PENDING,
            },
        });

        if (pendingRequest) {
            throw new BadRequestException(`คุณมีคำขอสำหรับบทบาท "${getRoleDisplayName(dto.requestedRole)}" ที่รอการตรวจสอบอยู่แล้ว`);
        }

        const roleRequest = await this.prisma.roleRequest.create({
            data: {
                userId,
                requestedRole: dto.requestedRole,
                currentRole: user.role,
                reason: dto.reason,
                documents: dto.documents || [],
                note: dto.note,
                status: RoleRequestStatus.PENDING,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        idCard: true,
                        pictureUrl: true,
                        organizationId: true,
                    },
                },
            },
        });

        try {
            await this.notificationService.sendToRole('STAFF', {
                type: NotificationType.ROLE_REQUEST_SUBMITTED,
                title: 'มีคำร้องขอสลับ/เพิ่มบทบาทใหม่',
                message: `${user.firstName || ''} ${user.lastName || ''} ยื่นขอสิทธิ์บทบาท ${getRoleDisplayName(dto.requestedRole)}`,
                data: { roleRequestId: roleRequest.id, userId: user.id, requestedRole: dto.requestedRole },
            });
        } catch (err) {
            this.logger.warn('Failed to send role request notification to staff:', err);
        }

        await this.activityLogger.log({
            userId,
            action: 'CREATE_ROLE_REQUEST',
            category: ActivityCategory.AUTH,
            after: { requestedRole: dto.requestedRole },
            success: true,
        }).catch(err => this.logger.error('Failed to log create role request:', err));

        return {
            success: true,
            message: 'ยื่นคำร้องสำเร็จ ระบบกำลังรอเจ้าหน้าที่ตรวจสอบ',
            data: roleRequest,
        };
    }

    async findAll(params: {
        page?: number;
        limit?: number;
        status?: string;
        role?: string;
        organizationId?: string | null;
        search?: string;
    }) {
        const { page = 1, limit = 20, status, role, organizationId, search } = params;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (status && Object.values(RoleRequestStatus).includes(status as any)) {
            where.status = status as RoleRequestStatus;
        }

        if (role && Object.values(Role).includes(role as any)) {
            where.requestedRole = role as Role;
        }

        if (organizationId) {
            where.user = {
                organizationId,
            };
        }

        if (search) {
            where.OR = [
                { user: { firstName: { contains: search, mode: 'insensitive' } } },
                { user: { lastName: { contains: search, mode: 'insensitive' } } },
                { user: { phone: { contains: search } } },
                { user: { idCard: { contains: search } } },
                { reason: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [total, data] = await Promise.all([
            this.prisma.roleRequest.count({ where }),
            this.prisma.roleRequest.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            idCard: true,
                            pictureUrl: true,
                            role: true,
                            allowedRoles: true,
                            organizationId: true,
                            addressDetail: true,
                            subdistrictName: true,
                            districtName: true,
                            provinceName: true,
                        },
                    },
                    reviewedBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            }),
        ]);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            },
        };
    }

    async findMyRequests(userId: string) {
        return this.prisma.roleRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                reviewedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    async findOne(id: string) {
        const roleRequest = await this.prisma.roleRequest.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        idCard: true,
                        pictureUrl: true,
                        role: true,
                        allowedRoles: true,
                        organizationId: true,
                        addressDetail: true,
                        subdistrictName: true,
                        districtName: true,
                        provinceName: true,
                        houseNo: true,
                        villageName: true,
                    },
                },
                reviewedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        if (!roleRequest) {
            throw new NotFoundException('ไม่พบข้อมูลคำร้องขอสิทธิ์');
        }

        return roleRequest;
    }

    async review(id: string, reviewerId: string, dto: ReviewRoleRequestDto) {
        const request = await this.prisma.roleRequest.findUnique({
            where: { id },
            include: { user: true },
        });

        if (!request) {
            throw new NotFoundException('ไม่พบข้อมูลคำร้องขอสิทธิ์');
        }

        if (request.status !== RoleRequestStatus.PENDING) {
            throw new BadRequestException('คำร้องนี้ได้รับการตรวจสอบไปแล้ว');
        }

        const now = new Date();

        if (dto.status === RoleRequestStatus.APPROVED) {
            const currentAllowed = new Set(request.user.allowedRoles || ['USERS']);
            currentAllowed.add(request.requestedRole);
            currentAllowed.add('USERS');

            await this.prisma.$transaction([
                this.prisma.roleRequest.update({
                    where: { id },
                    data: {
                        status: RoleRequestStatus.APPROVED,
                        reviewedById: reviewerId,
                        reviewedAt: now,
                        note: dto.note,
                    },
                }),
                this.prisma.user.update({
                    where: { id: request.userId },
                    data: {
                        role: request.requestedRole,
                        allowedRoles: Array.from(currentAllowed),
                    },
                }),
            ]);

            try {
                const roleName = getRoleDisplayName(request.requestedRole);
                await this.notificationService.sendToUser(request.userId, {
                    type: NotificationType.ROLE_REQUEST_APPROVED,
                    title: 'คำขอสิทธิ์ได้รับการอนุมัติ',
                    message: `คำขอสมัครเป็น "${roleName}" ของคุณได้รับการอนุมัติแล้ว คุณสามารถสลับไปใช้งานบทบาทนี้ได้ทันทีที่หน้าตั้งค่า`,
                    data: { roleRequestId: id, requestedRole: request.requestedRole },
                });
            } catch (err) {
                this.logger.warn('Failed to send approval notification to user:', err);
            }

            await this.activityLogger.log({
                userId: reviewerId,
                action: 'APPROVE_ROLE_REQUEST',
                category: ActivityCategory.AUTH,
                after: { targetUserId: request.userId, approvedRole: request.requestedRole },
                success: true,
            }).catch(err => this.logger.error('Failed to log approve role request:', err));

            return {
                success: true,
                message: `อนุมัติคำขอสิทธิ์ ${getRoleDisplayName(request.requestedRole)} เรียบร้อยแล้ว`,
            };
        } else if (dto.status === RoleRequestStatus.REJECTED) {
            await this.prisma.roleRequest.update({
                where: { id },
                data: {
                    status: RoleRequestStatus.REJECTED,
                    rejectReason: dto.rejectReason || 'ไม่ผ่านเกณฑ์การตรวจสอบ',
                    reviewedById: reviewerId,
                    reviewedAt: now,
                    note: dto.note,
                },
            });

            try {
                const roleName = getRoleDisplayName(request.requestedRole);
                await this.notificationService.sendToUser(request.userId, {
                    type: NotificationType.ROLE_REQUEST_REJECTED,
                    title: 'คำขอสิทธิ์ไม่ผ่านการอนุมัติ',
                    message: `คำขอสมัครเป็น "${roleName}" ไม่ผ่านการอนุมัติ: ${dto.rejectReason || 'เอกสารไม่สมบูรณ์'}`,
                    data: { roleRequestId: id, requestedRole: request.requestedRole, rejectReason: dto.rejectReason },
                });
            } catch (err) {
                this.logger.warn('Failed to send rejection notification to user:', err);
            }

            await this.activityLogger.log({
                userId: reviewerId,
                action: 'REJECT_ROLE_REQUEST',
                category: ActivityCategory.AUTH,
                after: { targetUserId: request.userId, requestedRole: request.requestedRole, reason: dto.rejectReason },
                success: true,
            }).catch(err => this.logger.error('Failed to log reject role request:', err));

            return {
                success: true,
                message: `ปฏิเสธคำขอสิทธิ์เรียบร้อยแล้ว`,
            };
        } else {
            throw new BadRequestException('สถานะการตรวจสอบไม่ถูกต้อง');
        }
    }
}
