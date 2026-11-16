import { Injectable, Logger } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { LineMessagingService } from '@/modules/integration/line-messaging/line-messaging.service';

export enum NotificationType {
    NEW_QUEUE_REQUEST = 'NEW_QUEUE_REQUEST',
    QUEUE_APPROVED = 'QUEUE_APPROVED',
    QUEUE_PENDING_EXECUTIVE = 'QUEUE_PENDING_EXECUTIVE',
    QUEUE_EXECUTIVE_APPROVED = 'QUEUE_EXECUTIVE_APPROVED',
    QUEUE_EXECUTIVE_REJECTED = 'QUEUE_EXECUTIVE_REJECTED',
    QUEUE_REJECTED = 'QUEUE_REJECTED',
    QUEUE_CONFIRMED = 'QUEUE_CONFIRMED',
    QUEUE_CANCELLED = 'QUEUE_CANCELLED',
    QUEUE_EDITED = 'QUEUE_EDITED',
    VOLUNTEER_ASSIGNED = 'VOLUNTEER_ASSIGNED',
    JOB_STATUS_UPDATED = 'JOB_STATUS_UPDATED',
    JOB_ACCEPTED = 'JOB_ACCEPTED',
    JOB_COMPLETED = 'JOB_COMPLETED',
    FEEDBACK_REQUEST = 'FEEDBACK_REQUEST',
    EDIT_REQUEST_NEW = 'EDIT_REQUEST_NEW',
    EDIT_REQUEST_APPROVED = 'EDIT_REQUEST_APPROVED',
    EDIT_REQUEST_REJECTED = 'EDIT_REQUEST_REJECTED',
    APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
    REWARD_REDEMPTION_SUBMITTED = 'REWARD_REDEMPTION_SUBMITTED',
    REWARD_REDEMPTION_APPROVED = 'REWARD_REDEMPTION_APPROVED',
    REWARD_REDEMPTION_REJECTED = 'REWARD_REDEMPTION_REJECTED',
    REWARD_REDEMPTION_COMPLETED = 'REWARD_REDEMPTION_COMPLETED',
    CAREGIVER_REQUEST_SUBMITTED = 'CAREGIVER_REQUEST_SUBMITTED',
    CAREGIVER_REQUEST_APPROVED = 'CAREGIVER_REQUEST_APPROVED',
    CAREGIVER_REQUEST_REJECTED = 'CAREGIVER_REQUEST_REJECTED',
    ROLE_REQUEST_SUBMITTED = 'ROLE_REQUEST_SUBMITTED',
    ROLE_REQUEST_APPROVED = 'ROLE_REQUEST_APPROVED',
    ROLE_REQUEST_REJECTED = 'ROLE_REQUEST_REJECTED',
}

export enum NotificationCategory {
    GENERAL = 'GENERAL',
    ACTION_REQUIRED = 'ACTION_REQUIRED',
}

export interface NotificationPayload {
    id?: number;
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
    createdAt?: Date;
    read?: boolean;
    category?: NotificationCategory;
}

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    private getCategoryByType(
        type: NotificationType,
        role?: string,
        data?: Record<string, unknown>,
    ): NotificationCategory {
        const alwaysAction: Set<NotificationType> = new Set([
            NotificationType.QUEUE_EDITED,
            NotificationType.FEEDBACK_REQUEST,
            NotificationType.CAREGIVER_REQUEST_SUBMITTED,
            NotificationType.EDIT_REQUEST_NEW,
        ]);

        if (alwaysAction.has(type)) {
            return NotificationCategory.ACTION_REQUIRED;
        }

        if (role === 'STAFF' && type === NotificationType.NEW_QUEUE_REQUEST) {
            return NotificationCategory.ACTION_REQUIRED;
        }

        if (
            type === NotificationType.JOB_STATUS_UPDATED &&
            data?.returnPickupRequested &&
            (role === 'DRIVE' || role === 'CAREU')
        ) {
            return NotificationCategory.ACTION_REQUIRED;
        }

        return NotificationCategory.GENERAL;
    }

    constructor(
        private readonly notificationGateway: NotificationGateway,
        private readonly prisma: PrismaService,
        private readonly lineMessagingService: LineMessagingService,
    ) { }

    private getFullName(user: { firstName?: string | null; lastName?: string | null } | null | undefined): string {
        if (!user) return 'ผู้ใช้';
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        return firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'ผู้ใช้';
    }

    emitRefreshQueues(data?: any) {
        try {
            if (this.notificationGateway?.server) {
                this.notificationGateway.server.emit('refresh_queues', data || {});
                this.notificationGateway.server.emit('refresh_dashboard', data || {});
            }
        } catch (e) {
            this.logger.warn('Failed to emit refresh_queues via socket', e);
        }
    }


    async sendToUser(userId: string, notification: NotificationPayload) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });
            const category = notification.category ?? this.getCategoryByType(
                notification.type,
                user?.role ?? undefined,
                notification.data,
            );
            const savedNotification = await this.prisma.notification.create({
                data: {
                    userId,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    data: notification.data || {},
                    read: false,
                },
            });

            this.notificationGateway.emitToUser(userId, 'notification', {
                ...savedNotification,
                data: savedNotification.data || {},
                category,
            });

            this.sendLineNotification(userId, notification).catch(err => {
                this.logger.warn(`Failed to send LINE notification to user ${userId}: ${err.message}`);
            });

            this.logger.log(`Notification sent to user ${userId}: ${notification.type}`);
            return {
                ...savedNotification,
                category,
            };
        } catch (error) {
            this.logger.error(`Failed to send notification to user ${userId}:`, error);
            throw error;
        }
    }

    private async sendLineNotification(userId: string, notification: NotificationPayload): Promise<void> {
        if (notification.type === NotificationType.QUEUE_APPROVED) {
            return;
        }
        const message = `📢 ${notification.title}\n\n${notification.message}`;
        await this.lineMessagingService.sendNotificationToUser(userId, message);
    }

    async sendToRole(role: string, notification: NotificationPayload) {
        try {
            const category = notification.category ?? this.getCategoryByType(
                notification.type,
                role,
                notification.data,
            );
            const users = await this.prisma.user.findMany({
                where: { role: role as any },
                select: { id: true },
            });

            const notifications = await Promise.all(
                users.map((user) =>
                    this.prisma.notification.create({
                        data: {
                            userId: user.id,
                            type: notification.type,
                            title: notification.title,
                            message: notification.message,
                            data: notification.data || {},
                            read: false,
                        },
                    }),
                ),
            );

            for (const user of users) {
                this.notificationGateway.emitToUser(user.id, 'notification', {
                    ...notification,
                    category,
                });
            }

            this.logger.log(`Notification sent to role ${role}: ${notification.type}`);
            return notifications.map((created) => ({
                ...created,
                category,
            }));
        } catch (error) {
            this.logger.error(`Failed to send notification to role ${role}:`, error);
            throw error;
        }
    }

    async sendToOrganizationRole(organizationId: string, role: string, notification: NotificationPayload) {
        try {
            const category = notification.category ?? this.getCategoryByType(
                notification.type,
                role,
                notification.data,
            );
            const users = await this.prisma.user.findMany({
                where: {
                    organizationId,
                    role: role === 'STAFF' ? { in: ['STAFF', 'ADMIN'] } : (role as any),
                },
                select: { id: true },
            });

            const notifications = await Promise.all(
                users.map((user) =>
                    this.prisma.notification.create({
                        data: {
                            userId: user.id,
                            type: notification.type,
                            title: notification.title,
                            message: notification.message,
                            data: notification.data || {},
                            read: false,
                        },
                    }),
                ),
            );

            for (const user of users) {
                this.notificationGateway.emitToUser(user.id, 'notification', {
                    ...notification,
                    category,
                });
            }

            this.logger.log(`Notification sent to organization ${organizationId} role ${role}: ${notification.type}`);
            return notifications.map((created) => ({
                ...created,
                category,
            }));
        } catch (error) {
            this.logger.error(`Failed to send notification to organization ${organizationId} role ${role}:`, error);
            throw error;
        }
    }


    async getUserNotifications(userId: string, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            this.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.notification.count({
                where: { userId },
            }),
            this.prisma.notification.count({
                where: { userId, read: false },
            }),
        ]);

        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        const enrichedNotifications = notifications.map((notification) => ({
            ...notification,
            category: this.getCategoryByType(
                notification.type as NotificationType,
                user?.role ?? undefined,
                notification.data as Record<string, unknown>,
            ),
        }));

        return {
            data: enrichedNotifications,
            pagination: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage,
                hasPrevPage,
            },
            unreadCount,
        };
    }

    async markAsRead(notificationId: number, userId: string) {
        return this.prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId,
            },
            data: { read: true },
        });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: {
                userId,
                read: false,
            },
            data: { read: true },
        });
    }

    async getUnreadCount(userId: string) {
        return this.prisma.notification.count({
            where: {
                userId,
                read: false,
            },
        });
    }

    async deleteNotification(notificationId: number, userId: string) {
        return this.prisma.notification.deleteMany({
            where: {
                id: notificationId,
                userId,
            },
        });
    }

    public async getPatientCaregivers(patientId: string): Promise<string[]> {
        const caregiverPatients = await this.prisma.caregiverPatient.findMany({
            where: {
                patientId,
                status: 'APPROVED',
            },
            select: {
                caregiverId: true,
            },
        });
        return caregiverPatients.map(cp => cp.caregiverId);
    }


    async notifyNewQueueRequest(queueId: number) {
        const queue = await this.prisma.queue.findUnique({
            where: { id: queueId },
            include: {
                user: true,
                hospital: true,
                creator: true,
            },
        });

        if (!queue) return;

        const isBookedByCaregiver = queue.creator && queue.createdBy !== queue.userId;
        const creatorName = queue.creator ? this.getFullName(queue.creator) : '';

        const notificationPayload = {
            type: NotificationType.NEW_QUEUE_REQUEST,
            title: 'มีคำขอจองคิวใหม่',
            message: isBookedByCaregiver
                ? `${creatorName} จองคิวให้ ${this.getFullName(queue.user)} ที่ ${queue.hospital?.name || 'โรงพยาบาล'}`
                : `${this.getFullName(queue.user)} ขอจองคิวที่ ${queue.hospital?.name || 'โรงพยาบาล'}`,
            data: { queueId, userId: queue.userId },
        };

        if (queue.user.organizationId) {
            await this.sendToOrganizationRole(queue.user.organizationId, 'STAFF', notificationPayload);
        } else {
            await this.sendToRole('STAFF', notificationPayload);
        }

        await this.sendToUser(queue.userId, {
            type: NotificationType.NEW_QUEUE_REQUEST,
            title: 'ส่งคำขอจองคิวสำเร็จ',
            message: isBookedByCaregiver
                ? `${creatorName} จองคิวให้คุณที่ ${queue.hospital?.name || 'โรงพยาบาล'} เรียบร้อยแล้ว รอเจ้าหน้าที่ตรวจสอบ`
                : `คำขอจองคิวของคุณที่ ${queue.hospital?.name || 'โรงพยาบาล'} ส่งแล้ว รอเจ้าหน้าที่ตรวจสอบ`,
            data: {
                queueId,
                hospitalName: queue.hospital?.name || 'โรงพยาบาล',
                requestDate: queue.requestDate,
                bookingTime: queue.bookingTime,
            },
        });

        if (isBookedByCaregiver && queue.createdBy) {
            await this.sendToUser(queue.createdBy, {
                type: NotificationType.NEW_QUEUE_REQUEST,
                title: 'จองคิวให้ผู้ป่วยสำเร็จ',
                message: `ส่งคำขอจองคิวให้ ${this.getFullName(queue.user)} เรียบร้อยแล้ว รอเจ้าหน้าที่ตรวจสอบ`,
                data: {
                    queueId,
                    hospitalName: queue.hospital?.name || 'โรงพยาบาล',
                    requestDate: queue.requestDate,
                    bookingTime: queue.bookingTime,
                },
            });
        }

        const caregiverIds = await this.getPatientCaregivers(queue.userId);
        for (const caregiverId of caregiverIds) {
            if (caregiverId === queue.createdBy) continue;

            await this.sendToUser(caregiverId, {
                type: NotificationType.NEW_QUEUE_REQUEST,
                title: 'มีการจองคิวใหม่ของประชาชนในความดูแล',
                message: isBookedByCaregiver
                    ? `${creatorName} จองคิวให้ ${this.getFullName(queue.user)} ที่ ${queue.hospital?.name || 'โรงพยาบาล'} รอเจ้าหน้าที่ตรวจสอบ`
                    : `${this.getFullName(queue.user)} ส่งคำขอจองคิวที่ ${queue.hospital?.name || 'โรงพยาบาล'} รอเจ้าหน้าที่ตรวจสอบ`,
                data: {
                    queueId,
                    patientName: this.getFullName(queue.user),
                    patientPictureUrl: queue.user?.pictureUrl,
                    hospitalName: queue.hospital?.name || 'โรงพยาบาล',
                    requestDate: queue.requestDate,
                    bookingTime: queue.bookingTime,
                },
            });
        }

        this.notificationGateway.server.emit('refresh_dashboard', {
            source: 'new_queue_request',
            queueId,
        });
        this.emitRefreshQueues({ source: 'new_queue_request', queueId });
    }

    async notifyQueueApproved(queueId: number) {
        const queue = await this.prisma.queue.findUnique({
            where: { id: queueId },
            include: {
                user: true,
                hospital: true,
                job: {
                    include: {
                        vlt: true,
                    },
                },
            },
        });

        if (!queue) return;

        await this.sendToUser(queue.userId, {
            type: NotificationType.QUEUE_APPROVED,
            title: 'คิวของคุณได้รับการยืนยันแล้ว',
            message: `คำขอจองคิวของคุณที่ ${queue.hospital?.name || 'โรงพยาบาล'} ได้รับการอนุมัติและยืนยันแล้ว`,
            data: {
                queueId,
                hospitalName: queue.hospital?.name || 'โรงพยาบาล',
                requestDate: queue.requestDate,
                bookingTime: queue.bookingTime,
                hasAppointment: queue.hasAppointment,
                status: 'CONFIRMED',
                job: queue.job,
            },
        });

        const user = await this.prisma.user.findUnique({
            where: { id: queue.userId },
            select: { iamUserId: true, firstName: true, lastName: true },
        });

        if (user?.iamUserId) {
            const requestDate = queue.requestDate instanceof Date
                ? queue.requestDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
                : new Date(queue.requestDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

            try {
                await this.lineMessagingService.sendQueueApprovedMessage(
                    user.iamUserId,
                    {
                        queueId,
                        hospitalName: queue.hospital?.name || 'โรงพยาบาล',
                        appointmentDate: requestDate,
                        appointmentTime: queue.bookingTime || '09:00 น.',
                        patientName: this.getFullName(user),
                    }
                );
            } catch (error) {
                this.logger.error(`Failed to send LINE approved message for queue ${queueId}: ${error.message}`);
            }
        }

        const caregiverIds = await this.getPatientCaregivers(queue.userId);
        for (const caregiverId of caregiverIds) {
            await this.sendToUser(caregiverId, {
                type: NotificationType.QUEUE_APPROVED,
                title: 'การจองของประชาชนในความดูแลได้รับการยืนยันแล้ว',
                message: `คำขอจองคิวของ ${this.getFullName(queue.user)} ที่ ${queue.hospital?.name || 'โรงพยาบาล'} ได้รับการอนุมัติและยืนยันแล้ว`,
                data: {
                    queueId,
                    patientName: this.getFullName(queue.user),
                    patientPictureUrl: queue.user.pictureUrl,
                    hospitalName: queue.hospital?.name || 'โรงพยาบาล',
                    requestDate: queue.requestDate,
                    bookingTime: queue.bookingTime,
                    hasAppointment: queue.hasAppointment,
                    status: 'CONFIRMED',
                    job: queue.job,
                },
            });

            const caregiver = await this.prisma.user.findUnique({
                where: { id: caregiverId },
                select: { iamUserId: true, firstName: true, lastName: true },
            });

            if (caregiver?.iamUserId) {
                const requestDate = queue.requestDate instanceof Date
                    ? queue.requestDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
                    : new Date(queue.requestDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

                try {
                    await this.lineMessagingService.sendQueueApprovedMessage(
                        caregiver.iamUserId,
                        {
                            queueId,
                            hospitalName: queue.hospital?.name || 'โรงพยาบาล',
                            appointmentDate: requestDate,
                            appointmentTime: queue.bookingTime || '09:00 น.',
                            patientName: this.getFullName(queue.user),
                        }
                    );
                } catch (error) {
                    this.logger.error(`Failed to send LINE approved message to caregiver ${caregiverId}: ${error.message}`);
                }
            }
        }

        this.emitRefreshQueues({ source: 'queue_approved', queueId });
    }

    async notifyQueuePendingExecutiveApproval(queueId: number) {
        const queue = await this.prisma.queue.findUnique({
            where: { id: queueId },
            include: {
                user: true,
                hospital: true,
            },
        });

        if (!queue) return;

        const payload = {
            type: NotificationType.QUEUE_PENDING_EXECUTIVE,
            title: 'มีคิวรอผู้บริหารอนุมัติ',
            message: `${this.getFullName(queue.user)} รอผู้บริหารอนุมัติคำขอไป ${queue.hospital?.name || 'โรงพยาบาล'}`,
            data: {
                queueId,
                patientName: this.getFullName(queue.user),
                hospitalName: queue.hospital?.name || 'โรงพยาบาล',
                status: 'PENDING_EXECUTIVE',
            },
            category: NotificationCategory.ACTION_REQUIRED,
        };

        if (queue.user.organizationId) {
            await this.sendToOrganizationRole(queue.user.organizationId, 'EXECUTIVE', payload);
        } else {
            await this.sendToRole('EXECUTIVE', payload);
        }

        this.emitRefreshQueues({ source: 'queue_pending_executive', queueId });
    }

    async notifyQueueApprovedByExecutive(queueId: number) {
        const queue = await this.prisma.queue.findUnique({
            where: { id: queueId },
            include: {
                user: true,
                hospital: true,
            },
        });

        if (!queue) return;

        const payload = {
            type: NotificationType.QUEUE_EXECUTIVE_APPROVED,
            title: 'ผู้บริหารอนุมัติคิวแล้ว',
            message: `${this.getFullName(queue.user)} ได้รับอนุมัติจากผู้บริหารแล้ว พร้อมมอบหมายงาน`,
            data: {
                queueId,
                patientName: this.getFullName(queue.user),
                hospitalName: queue.hospital?.name || 'โรงพยาบาล',
                status: 'CONFIRMED',
            },
        };

        if (queue.user.organizationId) {
            await this.sendToOrganizationRole(queue.user.organizationId, 'STAFF', payload);
        } else {
            await this.sendToRole('STAFF', payload);
        }

        this.emitRefreshQueues({ source: 'queue_approved_by_executive', queueId });
    }

    async notifyQueueRejectedByExecutive(queueId: number, reason?: string) {
        const queue = await this.prisma.queue.findUnique({
            where: { id: queueId },
            include: {
                user: true,
                hospital: true,
            },
        });

        if (!queue) return;

        const hospitalName = queue.hospital?.name || 'โรงพยาบาล';
        const staffMessage = reason
            ? `${this.getFullName(queue.user)} ถูกผู้บริหารส่งกลับให้แก้ไข\nเหตุผล: ${reason}\nกรุณาแก้ไขข้อมูลและส่งกลับผู้บริหาร`
            : `${this.getFullName(queue.user)} ถูกผู้บริหารส่งกลับให้แก้ไข กรุณาแก้ไขข้อมูลและส่งกลับผู้บริหาร`;

        const payload = {
            type: NotificationType.QUEUE_EXECUTIVE_REJECTED,
            title: 'ผู้บริหารส่งกลับให้แก้ไข',
            message: staffMessage,
            data: {
                queueId,
                patientName: this.getFullName(queue.user),
                hospitalName,
                reason,
                rejectReason: reason,
                status: 'EXECUTIVE_REJECTED',
            },
            category: NotificationCategory.ACTION_REQUIRED,
        };

        if (queue.user.organizationId) {
            await this.sendToOrganizationRole(queue.user.organizationId, 'STAFF', payload);
        } else {
            await this.sendToRole('STAFF', payload);
        }

        this.emitRefreshQueues({ source: 'queue_rejected_by_executive', queueId });
    }

    async notifyQueueConfirmedByUser(queueId: number) {
        const queue = await this.prisma.queue.findUnique({
            where: { id: queueId },
            include: {
                user: true,
                hospital: true,
            },
        });

        if (!queue) return;

        await this.sendToRole('STAFF', {
            type: NotificationType.QUEUE_CONFIRMED,
            title: 'ประชาชนยืนยันการจอง',
            message: `${this.getFullName(queue.user)} ยืนยันข้อมูลการจองแล้ว`,
            data: { queueId, userId: queue.userId },
        });

        if (queue.user.organizationId) {
            await this.sendToOrganizationRole(queue.user.organizationId, 'EXECUTIVE', {
                type: NotificationType.QUEUE_CONFIRMED,
                title: 'ประชาชนยืนยันการจอง',
                message: `${this.getFullName(queue.user)} ยืนยันข้อมูลการจองแล้ว รอผู้บริหารอนุมัติ`,
                data: { queueId, userId: queue.userId, status: 'PENDING_EXECUTIVE' },
                category: NotificationCategory.ACTION_REQUIRED,
            });
        }

        const caregiverIds = await this.getPatientCaregivers(queue.userId);
        for (const caregiverId of caregiverIds) {
            await this.sendToUser(caregiverId, {
                type: NotificationType.QUEUE_CONFIRMED,
                title: 'ประชาชนในความดูแลยืนยันการจอง',
                message: `${this.getFullName(queue.user)} ยืนยันการจองที่ ${queue.hospital?.name || 'โรงพยาบาล'} แล้ว`,
                data: {
                    queueId,
                    patientName: this.getFullName(queue.user),
                    hospitalName: queue.hospital?.name || 'โรงพยาบาล',
                },
            });
        }

        this.emitRefreshQueues({ source: 'queue_confirmed_by_user', queueId });
    }

    async notifyQueueRejected(queueId: number, reason?: string) {
        const queue = await this.prisma.queue.findUnique({
            where: { id: queueId },
            include: { user: true, hospital: true },
        });

        if (!queue) return;

        const hospitalName = queue.hospital?.name || 'โรงพยาบาล';
        const baseMessage = `คำขอจองคิวที่ ${hospitalName} ถูกปฏิเสธ`;
        const fullMessage = reason ? `${baseMessage}\nเหตุผล: ${reason}` : baseMessage;

        await this.sendToUser(queue.userId, {
            type: NotificationType.QUEUE_REJECTED,
            title: 'คำขอจองคิวถูกปฏิเสธ',
            message: fullMessage,
            data: { queueId, hospitalName, reason },
        });

        const caregiverIds = await this.getPatientCaregivers(queue.userId);
        for (const caregiverId of caregiverIds) {
            await this.sendToUser(caregiverId, {
                type: NotificationType.QUEUE_REJECTED,
                title: 'การจองของประชาชนในความดูแลถูกปฏิเสธ',
                message: `คำขอจองคิวของ ${this.getFullName(queue.user)} ที่ ${queue.hospital?.name || 'โรงพยาบาล'} ถูกปฏิเสธ`,
                data: { queueId, patientName: this.getFullName(queue.user), reason },
            });
        }

        this.emitRefreshQueues({ source: 'queue_rejected', queueId });
    }

    async notifyQueueCancelled(queueId: number, cancelledByUserId: string) {
        const queue = await this.prisma.queue.findUnique({
            where: { id: queueId },
            include: {
                user: true,
                hospital: true,
                job: { include: { vlt: true } },
            },
        });

        if (!queue) return;

        const cancelledByUser = await this.prisma.user.findUnique({
            where: { id: cancelledByUserId },
        });

        const isMunicipalCanceller = ['STAFF', 'ADMIN', 'EXECUTIVE'].includes(cancelledByUser?.role as string);
        const cancellerName = this.getFullName(cancelledByUser);
        const hospitalName = queue.hospital?.name || 'โรงพยาบาล';

        const orgId = queue.user?.organizationId || cancelledByUser?.organizationId;
        const staffMessage = isMunicipalCanceller
            ? `คิวของ ${this.getFullName(queue.user)} ที่ ${hospitalName} ถูกยกเลิกโดยเทศบาล`
            : `คิวของ ${this.getFullName(queue.user)} ที่ ${hospitalName} ถูกยกเลิกโดยผู้ใช้`;

        if (orgId) {
            await this.sendToOrganizationRole(orgId, 'STAFF', {
                type: NotificationType.QUEUE_CANCELLED,
                title: 'คิวถูกยกเลิก',
                message: staffMessage,
                data: { queueId, hospitalName },
            });
        } else {
            await this.sendToRole('STAFF', {
                type: NotificationType.QUEUE_CANCELLED,
                title: 'คิวถูกยกเลิก',
                message: staffMessage,
                data: { queueId, hospitalName },
            });
        }

        const citizenTitle = isMunicipalCanceller ? 'คิวถูกยกเลิกโดยเทศบาล' : 'ยกเลิกคิวสำเร็จ';
        const citizenMessage = isMunicipalCanceller
            ? `คิวของคุณที่ ${hospitalName} ถูกยกเลิกโดยเทศบาล`
            : `คุณได้ยกเลิกคิวที่ ${hospitalName} เรียบร้อยแล้ว`;

        await this.sendToUser(queue.userId, {
            type: NotificationType.QUEUE_CANCELLED,
            title: citizenTitle,
            message: citizenMessage,
            data: { queueId, hospitalName, isMunicipal: isMunicipalCanceller },
        });

        if (queue.job?.vltId && queue.job.vltId !== cancelledByUserId) {
            await this.sendToUser(queue.job.vltId, {
                type: NotificationType.QUEUE_CANCELLED,
                title: 'งานถูกยกเลิก',
                message: `งานรับส่งที่ ${hospitalName} ถูกยกเลิกแล้ว`,
                data: { queueId, hospitalName },
            });
        }

        if (queue.job?.careuId && queue.job.careuId !== cancelledByUserId) {
            await this.sendToUser(queue.job.careuId, {
                type: NotificationType.QUEUE_CANCELLED,
                title: 'งานถูกยกเลิก',
                message: `งานดูแลที่ ${hospitalName} ถูกยกเลิกแล้ว`,
                data: { queueId, hospitalName },
            });
        }

        const caregiverIds = await this.getPatientCaregivers(queue.userId);
        const caregiverCancelMsg = isMunicipalCanceller
            ? `คิวของ ${this.getFullName(queue.user)} ที่ ${hospitalName} ถูกยกเลิกโดยเทศบาล`
            : `คิวของ ${this.getFullName(queue.user)} ที่ ${hospitalName} ถูกยกเลิก`;

        for (const caregiverId of caregiverIds) {
            if (caregiverId !== cancelledByUserId) {
                await this.sendToUser(caregiverId, {
                    type: NotificationType.QUEUE_CANCELLED,
                    title: 'การจองของประชาชนในความดูแลถูกยกเลิก',
                    message: caregiverCancelMsg,
                    data: { queueId, patientName: this.getFullName(queue.user) },
                });
            }
        }

        this.emitRefreshQueues({ source: 'queue_cancelled', queueId });
    }

    async notifyQueueEdited(queueId: number, changes: {
        hospitalName?: { from: string; to: string };
        bookingTime?: { from: string; to: string };
        requestDate?: { from: string; to: string };
    }) {
        const queue = await this.prisma.queue.findUnique({
            where: { id: queueId },
            include: {
                user: true,
                hospital: true,
            },
        });

        if (!queue) return;

        const changeDetails: string[] = [];
        if (changes.hospitalName) {
            changeDetails.push(`โรงพยาบาล: จาก "${changes.hospitalName.from}" เป็น "${changes.hospitalName.to}"`);
        }
        if (changes.bookingTime) {
            changeDetails.push(`เวลาที่จอง: จาก ${changes.bookingTime.from} เป็น ${changes.bookingTime.to}`);
        }
        if (changes.requestDate) {
            changeDetails.push(`วันที่จอง: จาก ${changes.requestDate.from} เป็น ${changes.requestDate.to}`);
        }

        const message = changeDetails.length > 0
            ? `เจ้าหน้าที่ได้แก้ไขข้อมูลการจองของคุณ:\n${changeDetails.join('\n')}\n\nกรุณายืนยันการจองอีกครั้ง`
            : `เจ้าหน้าที่ได้แก้ไขข้อมูลการจองของคุณที่ ${queue.hospital?.name || 'โรงพยาบาล'}\n\nกรุณายืนยันการจองอีกครั้ง`;

        await this.sendToUser(queue.userId, {
            type: NotificationType.QUEUE_EDITED,
            title: 'ข้อมูลการจองถูกแก้ไข — กรุณายืนยัน',
            message,
            data: { queueId, changes, status: 'APPROVED' },
        });

        const user = await this.prisma.user.findUnique({
            where: { id: queue.userId },
            select: { iamUserId: true, firstName: true, lastName: true },
        });

        if (user?.iamUserId) {
            const requestDate = queue.requestDate instanceof Date
                ? queue.requestDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
                : new Date(queue.requestDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

            try {
                await this.lineMessagingService.sendQueueConfirmationMessage(
                    user.iamUserId,
                    {
                        queueId,
                        hospitalName: queue.hospital?.name || 'โรงพยาบาล',
                        appointmentDate: requestDate,
                        appointmentTime: queue.bookingTime || '09:00 น.',
                        patientName: this.getFullName(user),
                    },
                );
            } catch (error) {
                this.logger.error(`Failed to send LINE edit confirmation to user ${queue.userId}: ${error.message}`);
            }
        }

        const caregiverIds = await this.getPatientCaregivers(queue.userId);
        for (const caregiverId of caregiverIds) {
            await this.sendToUser(caregiverId, {
                type: NotificationType.QUEUE_EDITED,
                title: 'ข้อมูลการจองถูกแก้ไข — กรุณายืนยัน',
                message: `เจ้าหน้าที่ได้แก้ไขข้อมูลการจองของ ${this.getFullName(queue.user)}:\n${changeDetails.join('\n')}\n\nกรุณายืนยันการจองอีกครั้ง`,
                data: {
                    queueId,
                    patientName: this.getFullName(queue.user),
                    patientPictureUrl: queue.user?.pictureUrl,
                    changes,
                    status: 'APPROVED',
                },
            });

            const caregiver = await this.prisma.user.findUnique({
                where: { id: caregiverId },
                select: { iamUserId: true, firstName: true, lastName: true },
            });

            if (caregiver?.iamUserId) {
                const requestDate = queue.requestDate instanceof Date
                    ? queue.requestDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
                    : new Date(queue.requestDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

                try {
                    await this.lineMessagingService.sendQueueConfirmationMessage(
                        caregiver.iamUserId,
                        {
                            queueId,
                            hospitalName: queue.hospital?.name || 'โรงพยาบาล',
                            appointmentDate: requestDate,
                            appointmentTime: queue.bookingTime || '09:00 น.',
                            patientName: this.getFullName(queue.user),
                        },
                    );
                } catch (error) {
                    this.logger.error(`Failed to send LINE edit confirmation to caregiver ${caregiverId}: ${error.message}`);
                }
            }
        }
    }

    async notifyVolunteerAssigned(jobId: number) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                vlt: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        pictureUrl: true,
                    },
                },
                careu: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        pictureUrl: true,
                    },
                },
                queue: {
                    include: {
                        hospital: true,
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                phone: true,
                                pictureUrl: true,
                                villageName: true,
                                subdistrictName: true,
                                districtName: true,
                                provinceName: true,
                                mobilityStatus: true,
                            },
                        },
                    },
                },
            },
        });

        if (!job || !job.vltId) return;

        const volunteerName = this.getFullName(job.vlt);
        const hospitalName = job.queue.hospital?.name || 'โรงพยาบาล';

        await this.sendToUser(job.vltId, {
            type: NotificationType.VOLUNTEER_ASSIGNED,
            title: 'คุณได้รับมอบหมายงานใหม่',
            message: `คุณได้รับมอบหมายให้ช่วยเหลือ ${this.getFullName(job.queue.user)} ไปที่ ${hospitalName}`,
            data: {
                jobId,
                queueId: job.queueId,
                hospitalName,
                requestDate: job.queue.requestDate,
                bookingTime: job.queue.bookingTime,
                hasAppointment: job.queue.hasAppointment,
                severityLevel: job.queue.severityLevel,
                user: job.queue.user,
            },
        });

        if (job.careuId) {
            await this.sendToUser(job.careuId, {
                type: NotificationType.VOLUNTEER_ASSIGNED,
                title: 'คุณได้รับมอบหมายงานใหม่',
                message: `คุณได้รับมอบหมายให้เป็นจิตอาสาแคร์ยูดูแล ${this.getFullName(job.queue.user)} ไปที่ ${hospitalName}`,
                data: {
                    jobId,
                    queueId: job.queueId,
                    hospitalName,
                    requestDate: job.queue.requestDate,
                    bookingTime: job.queue.bookingTime,
                    hasAppointment: job.queue.hasAppointment,
                    severityLevel: job.queue.severityLevel,
                    user: job.queue.user,
                },
            });
        }

        let messageToElderly = `จิตอาสา ${volunteerName} ได้รับมอบหมายมาดูแลคุณ`;
        if (job.careu) {
            messageToElderly += ` พร้อมด้วย ${this.getFullName(job.careu)}`;
        }
        await this.sendToUser(job.queue.userId, {
            type: NotificationType.VOLUNTEER_ASSIGNED,
            title: `มีจิตอาสาพาคุณไปที่ ${hospitalName}`,
            message: messageToElderly,
            data: {
                jobId,
                volunteerName,
                volunteerPictureUrl: job.vlt?.pictureUrl,
                volunteerPhone: job.vlt?.phone,
                careuName: job.careu ? this.getFullName(job.careu) : null,
                careuPictureUrl: job.careu?.pictureUrl,
                hospitalName,
            },
        });

        const caregiverIds = await this.getPatientCaregivers(job.queue.userId);
        for (const caregiverId of caregiverIds) {
            let messageToCaregiver = `จิตอาสา ${volunteerName} ได้รับมอบหมายดูแล ${this.getFullName(job.queue.user)} ไปที่ ${hospitalName}`;
            if (job.careu) {
                messageToCaregiver = `จิตอาสา ${volunteerName} และ ${this.getFullName(job.careu)} ได้รับมอบหมายดูแล ${this.getFullName(job.queue.user)} ไปที่ ${hospitalName}`;
            }
            await this.sendToUser(caregiverId, {
                type: NotificationType.VOLUNTEER_ASSIGNED,
                title: 'จิตอาสาได้รับมอบหมายดูแลประชาชน',
                message: messageToCaregiver,
                data: {
                    jobId,
                    volunteerName,
                    volunteerPictureUrl: job.vlt?.pictureUrl,
                    careuName: job.careu ? this.getFullName(job.careu) : null,
                    patientName: this.getFullName(job.queue.user),
                    hospitalName,
                },
            });
        }

        this.emitRefreshQueues({ source: 'volunteer_assigned', jobId, queueId: job.queueId });
    }

    async notifyJobStatusUpdated(jobId: number, newStatus: string) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                queue: {
                    include: {
                        user: true,
                        hospital: true,
                    },
                },
                vlt: true,
                careu: true,
            },
        });

        if (!job) return;

        const statusTranslation: Record<string, string> = {
            ASSIGNED: 'ได้รับมอบหมาย',
            ACCEPTED: 'จิตอาสารับงานแล้ว',
            EN_ROUTE: 'กำลังเดินทางมารับ',
            PICKING_UP: 'ถึงจุดรับแล้ว',
            IN_PROGRESS: 'กำลังเดินทางไปรับ',
            IN_TRANSIT: 'กำลังเดินทางไปโรงพยาบาล',
            AT_HOSPITAL: 'อยู่ที่โรงพยาบาล',
            RETURN_HOME: 'กำลังพาประชาชนกลับบ้าน',
            AT_PATIENT_HOME: 'ส่งถึงบ้านแล้ว รอคนขับยืนยัน',
            RETURN_OFFICE: 'ส่งประชาชนแล้ว / กำลังกลับศูนย์',
            COMPLETED: 'ส่งผู้โดยสารแล้ว',
            CANCELLED: 'ยกเลิกการให้บริการ',
            REJECTED: 'ปฏิเสธการให้บริการ',
        };

        const thaiStatus = statusTranslation[newStatus] || newStatus;

        const statusInfo = {
            title: 'อัพเดทสถานะงาน',
            message: `สถานะงานเปลี่ยนเป็น ${thaiStatus}`
        };

        await this.sendToUser(job.queue.userId, {
            type: NotificationType.JOB_STATUS_UPDATED,
            title: statusInfo.title,
            message: statusInfo.message,
            data: { jobId, status: newStatus },
        });

        const caregiverIds = await this.getPatientCaregivers(job.queue.userId);
        for (const caregiverId of caregiverIds) {
            await this.sendToUser(caregiverId, {
                type: NotificationType.JOB_STATUS_UPDATED,
                title: statusInfo.title,
                message: `งานของ ${this.getFullName(job.queue.user)}: ${statusInfo.message}`,
                data: {
                    jobId,
                    status: newStatus,
                    patientName: this.getFullName(job.queue.user),
                },
            });
        }

        if (['CANCELLED', 'REJECTED', 'COMPLETED'].includes(newStatus)) {
            await this.sendToRole('STAFF', {
                type: NotificationType.JOB_STATUS_UPDATED,
                title: statusInfo.title,
                message: statusInfo.message,
                data: { jobId, status: newStatus },
            });
        }

        if (job.vltId) {
            this.notificationGateway.emitToUser(job.vltId, 'refresh_jobs', { jobId, status: newStatus });
            if (newStatus === 'CANCELLED') {
                await this.sendToUser(job.vltId, {
                    type: NotificationType.JOB_STATUS_UPDATED,
                    title: 'งานถูกยกเลิก',
                    message: `งานรับส่งที่ ${job.queue.hospital?.name || 'โรงพยาบาล'} ถูกยกเลิก`,
                    data: { jobId, status: newStatus },
                });
            }
        }
        if (job.careuId) {
            this.notificationGateway.emitToUser(job.careuId, 'refresh_jobs', { jobId, status: newStatus });
            if (newStatus === 'CANCELLED') {
                await this.sendToUser(job.careuId, {
                    type: NotificationType.JOB_STATUS_UPDATED,
                    title: 'งานถูกยกเลิก',
                    message: `งานดูแลที่ ${job.queue.hospital?.name || 'โรงพยาบาล'} ถูกยกเลิก`,
                    data: { jobId, status: newStatus },
                });
            }
        }

        this.notificationGateway.server.emit('refresh_dashboard');
        this.emitRefreshQueues({ source: 'job_status_updated', jobId, status: newStatus });
    }

    async notifyReturnPickupRequested(jobId: number) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                queue: {
                    include: {
                        user: true,
                        hospital: true,
                    },
                },
                vlt: true,
            },
        });

        if (!job || !job.vltId) return;

        const patientName = this.getFullName(job.queue.user);
        const hospitalName = job.queue.hospital?.name || 'โรงพยาบาล';

        await this.sendToUser(job.vltId, {
            type: NotificationType.JOB_STATUS_UPDATED,
            title: 'มีคนเรียกรถกลับ',
            message: `${patientName} เรียกรถกลับจาก ${hospitalName}`,
            data: {
                jobId,
                status: 'AT_HOSPITAL',
                returnPickupRequested: true,
                patientName,
                hospitalName,
            },
        });

        this.notificationGateway.emitToUser(job.vltId, 'refresh_jobs', {
            jobId,
            status: 'AT_HOSPITAL',
            returnPickupRequested: true,
        });
        this.notificationGateway.server.emit('refresh_dashboard');
    }

    async notifyJobAccepted(jobId: number) {
        this.logger.log(`Job ${jobId} accepted`);
        this.notificationGateway.server.emit('refresh_dashboard');
        this.emitRefreshQueues({ source: 'job_accepted', jobId });
    }

    async notifyJobRejectedByVolunteer(jobId: number, volunteerId: string, reason?: string) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                queue: {
                    include: {
                        user: true,
                        hospital: true,
                    },
                },
            },
        });

        if (!job) return;

        const volunteer = await this.prisma.user.findUnique({
            where: { id: volunteerId },
        });

        const volunteerName = this.getFullName(volunteer);
        const patientName = this.getFullName(job.queue.user);
        const hospitalName = job.queue.hospital?.name || 'โรงพยาบาล';

        const roleText = volunteer?.role === 'CAREU' ? 'จิตอาสาแคร์ยู' : 'เจ้าหน้าที่ขับรถ';
        const reasonText = reason ? `\nเหตุผล: ${reason}` : '';

        const payload = {
            type: NotificationType.JOB_STATUS_UPDATED,
            title: `${roleText}ขอยกเลิกงาน`,
            message: `${roleText} ${volunteerName} ขอยกเลิกงานดูแล ${patientName} (${hospitalName})${reasonText}\nระบบส่งกลับให้เทศบาลจัดรถ/เปลี่ยนคนขับใหม่`,
            data: {
                jobId,
                queueId: job.queueId,
                volunteerId,
                volunteerName,
                reason,
                status: 'OPEN',
            },
            category: NotificationCategory.ACTION_REQUIRED,
        };

        const orgId = job.queue?.user?.organizationId || volunteer?.organizationId;
        if (orgId) {
            await this.sendToOrganizationRole(orgId, 'STAFF', payload);
        } else {
            await this.sendToRole('STAFF', payload);
        }
        await this.sendToRole('ADMIN', payload);

        this.notificationGateway.server.emit('refresh_dashboard');
        this.notificationGateway.server.emit('refresh_jobs', { jobId, status: 'OPEN' });
        this.emitRefreshQueues({ source: 'job_rejected_by_volunteer', jobId, queueId: job.queueId });
    }

    async notifyJobCompleted(jobId: number) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                queue: {
                    include: {
                        user: true,
                        hospital: true,
                    },
                },
                vlt: true,
            },
        });

        if (!job) return;

        await this.sendToUser(job.queue.userId, {
            type: NotificationType.JOB_COMPLETED,
            title: 'งานเสร็จสิ้น',
            message: 'การให้บริการเสร็จสิ้นแล้ว ขอบคุณที่ใช้บริการ',
            data: { jobId },
        });

        const caregiverIds = await this.getPatientCaregivers(job.queue.userId);
        for (const caregiverId of caregiverIds) {
            await this.sendToUser(caregiverId, {
                type: NotificationType.JOB_COMPLETED,
                title: 'งานของประชาชนในความดูแลเสร็จสิ้น',
                message: `การให้บริการของ ${this.getFullName(job.queue.user)} ที่ ${job.queue.hospital?.name || 'โรงพยาบาล'} เสร็จสิ้นแล้ว`,
                data: {
                    jobId,
                    patientName: this.getFullName(job.queue.user),
                    hospitalName: job.queue.hospital?.name || 'โรงพยาบาล',
                },
            });
        }

        await this.sendToRole('STAFF', {
            type: NotificationType.JOB_COMPLETED,
            title: 'งานเสร็จสิ้น',
            message: `งานของ ${this.getFullName(job.queue.user)} ให้บริการเสร็จสิ้นแล้ว`,
            data: { jobId },
        });
    }

    async notifyFeedbackRequest(jobId: number) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                queue: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                phone: true,
                                pictureUrl: true,
                            },
                        },
                    },
                },
                vlt: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        pictureUrl: true,
                    },
                },
                careu: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        pictureUrl: true,
                    },
                },
            },
        });

        if (!job) return;

        if (job.ratingScore !== null) {
            this.logger.log(`[notifyFeedbackRequest] Job ${jobId} already has rating, skipping notification`);
            return;
        }

        const isBookedByCaregiver = job.queue.createdBy && job.queue.createdBy !== job.queue.userId;

        if (isBookedByCaregiver && job.queue.createdBy) {
            await this.sendToUser(job.queue.createdBy, {
                type: NotificationType.FEEDBACK_REQUEST,
                title: 'แบบประเมินการบริการของประชาชนในความดูแล',
                message: `โปรดประเมินการบริการสำหรับ ${this.getFullName(job.queue.user)}`,
                data: {
                    jobId,
                    queueId: job.queueId,
                    patientName: this.getFullName(job.queue.user),
                    patientPictureUrl: job.queue.user.pictureUrl,
                    volunteer: job.vlt,
                    careu: job.careu,
                },
            });
        } else {
            await this.sendToUser(job.queue.userId, {
                type: NotificationType.FEEDBACK_REQUEST,
                title: 'แบบประเมินการบริการ',
                message: 'โปรดเลือกสิ่งที่คุณรู้สึกเพื่อประเมินการบริการ',
                data: {
                    jobId,
                    queueId: job.queueId,
                    volunteer: job.vlt,
                    careu: job.careu,
                    user: job.queue.user,
                },
            });
        }
    }


    async notifyCaregiverRequestApproved(requestId: number) {
        const request = await this.prisma.caregiverPatient.findUnique({
            where: { id: requestId },
            include: {
                caregiver: {
                    select: { id: true, firstName: true, lastName: true },
                },
                patient: {
                    select: { id: true, firstName: true, lastName: true, pictureUrl: true },
                },
            },
        });

        if (!request) return;

        const patientName = this.getFullName(request.patient);

        await this.sendToUser(request.caregiverId, {
            type: NotificationType.CAREGIVER_REQUEST_APPROVED,
            title: 'คำร้องได้รับการอนุมัติ',
            message: `คำร้องขอดูแล ${patientName} ได้รับการอนุมัติแล้ว คุณสามารถจองคิวให้ประชาชนได้แล้ว`,
            data: {
                requestId,
                patientId: request.patientId,
                patientName,
                patientPictureUrl: request.patient.pictureUrl,
            },
        });

        this.logger.log(`Caregiver request ${requestId} approved notification sent to caregiver ${request.caregiverId}`);
    }

    async notifyCaregiverRequestRejected(requestId: number, reason?: string) {
        const request = await this.prisma.caregiverPatient.findUnique({
            where: { id: requestId },
            include: {
                caregiver: {
                    select: { id: true, firstName: true, lastName: true },
                },
                patient: {
                    select: { id: true, firstName: true, lastName: true, pictureUrl: true },
                },
            },
        });

        if (!request) return;

        const patientName = this.getFullName(request.patient);

        await this.sendToUser(request.caregiverId, {
            type: NotificationType.CAREGIVER_REQUEST_REJECTED,
            title: 'คำร้องไม่ได้รับการอนุมัติ',
            message: reason
                ? `คำร้องขอดูแล ${patientName} ไม่ได้รับการอนุมัติ เหตุผล: ${reason}`
                : `คำร้องขอดูแล ${patientName} ไม่ได้รับการอนุมัติ`,
            data: {
                requestId,
                patientId: request.patientId,
                patientName,
                patientPictureUrl: request.patient.pictureUrl,
                rejectReason: reason,
            },
        });

        this.logger.log(`Caregiver request ${requestId} rejected notification sent to caregiver ${request.caregiverId}`);
    }

    async notifyCaregiverRequestSubmitted(requestId: number) {
        const request = await this.prisma.caregiverPatient.findUnique({
            where: { id: requestId },
            include: {
                caregiver: {
                    select: { id: true, firstName: true, lastName: true, pictureUrl: true, phone: true },
                },
                patient: {
                    select: { id: true, firstName: true, lastName: true, pictureUrl: true },
                },
            },
        });

        if (!request) return;

        const caregiverName = this.getFullName(request.caregiver);
        const patientName = this.getFullName(request.patient);

        const relationshipLabels: Record<string, string> = {
            FAMILY: 'ครอบครัว',
            RELATIVE: 'ญาติ',
            CLOSE_PERSON: 'คนใกล้ชิด',
        };
        const relationshipLabel = relationshipLabels[request.relationship] || request.relationship;

        await this.sendToUser(request.patientId, {
            type: NotificationType.CAREGIVER_REQUEST_SUBMITTED,
            title: 'มีผู้ขอเป็นผู้ดูแลประชาชนคุณ',
            message: `${caregiverName} ขอลงทะเบียนเป็นผู้ดูแลประชาชนของคุณ (${relationshipLabel}) รอเจ้าหน้าที่ตรวจสอบ`,
            data: {
                requestId,
                caregiverId: request.caregiverId,
                caregiverName,
                caregiverPictureUrl: request.caregiver.pictureUrl,
                caregiverPhone: request.caregiver.phone,
                relationship: request.relationship,
                relationshipLabel,
            },
        });

        await this.sendToRole('STAFF', {
            type: NotificationType.CAREGIVER_REQUEST_SUBMITTED,
            title: 'มีคำร้องขอเป็นผู้ดูแลประชาชนใหม่',
            message: `${caregiverName} ขอลงทะเบียนเป็นผู้ดูแลประชาชนของ ${patientName} (${relationshipLabel})`,
            data: {
                requestId,
                caregiverId: request.caregiverId,
                caregiverName,
                caregiverPictureUrl: request.caregiver.pictureUrl,
                patientId: request.patientId,
                patientName,
                patientPictureUrl: request.patient.pictureUrl,
                relationship: request.relationship,
                relationshipLabel,
            },
        });

        this.logger.log(`Caregiver request ${requestId} submitted notification sent to patient ${request.patientId} and staff`);
    }

    async getOnlineUsers() {
        const { total, userIds, socketCount } = this.notificationGateway.getOnlineUsersSummary();
        if (userIds.length === 0) {
            return {
                total: 0,
                socketCount: 0,
                byRole: {
                    USERS: 0,
                    CAREGIVER: 0,
                    DRIVE: 0,
                    CAREU: 0,
                    STAFF: 0,
                    EXECUTIVE: 0,
                    ADMIN: 0,
                },
                users: [],
            };
        }

        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                pictureUrl: true,
                phone: true,
                organization: {
                    select: { id: true, name: true },
                },
            },
        });

        const byRole: Record<string, number> = {
            USERS: 0,
            CAREGIVER: 0,
            DRIVE: 0,
            CAREU: 0,
            STAFF: 0,
            EXECUTIVE: 0,
            ADMIN: 0,
        };

        users.forEach((u) => {
            const r = u.role || 'USERS';
            byRole[r] = (byRole[r] || 0) + 1;
        });

        return {
            total: users.length,
            socketCount,
            byRole,
            users,
        };
    }
}
