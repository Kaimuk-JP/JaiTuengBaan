import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { NotificationService } from '@/modules/system/notification/notification.service';
import { SettingsService } from '@/modules/system/settings/settings.service';
import { ActivityLoggerService } from '@/modules/system/activity-log/activity-logger.service';
import { ActivityCategory } from '@prisma/client';

@Injectable()
export class QueueService {
    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService,
        private settingsService: SettingsService,
        private activityLogger: ActivityLoggerService,
    ) { }

    async getAllQueues(filters?: {
        status?: string | string[];
        severityLevel?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
        organizationId?: string;
    }) {
        const { page, limit } = filters || {};

        const usePagination = page !== undefined && limit !== undefined;
        const skip = usePagination ? (page - 1) * limit : undefined;
        const take = usePagination ? limit : undefined;

        const where: any = {};

        const queueStatuses = ['PENDING_MUNICIPAL', 'APPROVED', 'PENDING_EXECUTIVE', 'EXECUTIVE_REJECTED', 'CONFIRMED', 'REJECTED', 'CANCELLED_BY_USER', 'CANCELLED_BY_MUNICIPAL'];
        const jobStatuses = ['OPEN', 'ASSIGNED', 'ACCEPTED', 'REJECTED', 'PICKING_UP', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'];

        if (filters?.status) {
            const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];

            const queueStatusFilters = statusArray.filter(s => queueStatuses.includes(s));
            const jobStatusFilters = statusArray.filter(s => jobStatuses.includes(s));

            if (queueStatusFilters.length > 0 && jobStatusFilters.length > 0) {
                where.OR = [
                    { status: { in: queueStatusFilters } },
                    { job: { status: { in: jobStatusFilters } } }
                ];
            } else if (queueStatusFilters.length > 0) {
                where.status = queueStatusFilters.length === 1 ? queueStatusFilters[0] : { in: queueStatusFilters };
            } else if (jobStatusFilters.length > 0) {
                where.job = { status: jobStatusFilters.length === 1 ? jobStatusFilters[0] : { in: jobStatusFilters } };
            }
        }

        if (filters?.severityLevel) {
            where.severityLevel = filters.severityLevel;
        }

        if (filters?.organizationId) {
            where.user = {
                organizationId: filters.organizationId,
            };
        }

        if (filters?.startDate || filters?.endDate) {
            where.requestDate = {};
            if (filters.startDate) {
                where.requestDate.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                where.requestDate.lte = new Date(filters.endDate);
            }
        }

        const total = await this.prisma.queue.count({ where });

        const queues = await this.prisma.queue.findMany({
            where,
            orderBy: [
                { requestDate: 'asc' },
                { id: 'asc' }
            ],
            ...(skip !== undefined && { skip }),
            ...(take !== undefined && { take }),
            include: {
                hospital: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        villageName: true,
                        subdistrictName: true,
                        districtName: true,
                        provinceName: true,
                        country: true,
                        lat: true,
                        lng: true,
                        mobilityStatus: true,
                        specialNeeds: true,
                        pictureUrl: true,
                        organizationId: true,
                    },
                },
                verifier: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                job: {
                    where: { deletedAt: null },
                    include: {
                        vehicle: true,
                        vlt: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                phone: true,
                                pictureUrl: true,
                                lat: true,
                                lng: true,
                            },
                        },
                        careu: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                phone: true,
                                pictureUrl: true,
                                role: true,
                            },
                        },
                    },
                },
            },
        });

        if (usePagination) {
            const totalPages = Math.ceil(total / limit!);
            const hasNextPage = page! < totalPages;
            const hasPrevPage = page! > 1;

            return {
                data: queues,
                pagination: {
                    total,
                    page: page!,
                    limit: limit!,
                    totalPages,
                    hasNextPage,
                    hasPrevPage,
                },
            };
        }

        return {
            data: queues,
            pagination: {
                total,
                page: 1,
                limit: total,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false,
            },
        };
    }

    async getPendingQueues(page?: number, limit?: number, organizationId?: string) {
        const skip = page && limit ? (page - 1) * limit : undefined;
        const take = limit;

        const where: any = {
            status: 'PENDING_MUNICIPAL',
        };

        if (organizationId) {
            where.user = {
                organizationId
            };
        }

        const [queues, total] = await Promise.all([
            this.prisma.queue.findMany({
                where,
                include: {
                    hospital: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            villageName: true,
                            subdistrictName: true,
                            districtName: true,
                            provinceName: true,
                            country: true,
                            lat: true,
                            lng: true,
                            mobilityStatus: true,
                            specialNeeds: true,
                            pictureUrl: true,
                        },
                    },
                },
                orderBy: [
                    { severityLevel: 'desc' },
                    { createdAt: 'asc' },
                ],
                skip,
                take,
            }),
            this.prisma.queue.count({
                where,
            }),
        ]);

        return {
            data: queues,
            pagination: {
                total,
                page: page || 1,
                limit: limit || total,
                totalPages: limit ? Math.ceil(total / limit) : 1,
            },
        };
    }

    async getQueuesByUserId(userId: string, page: number = 1, limit: number = 20, search?: string) {
        const MAX_LIMIT = 100;
        const safeLimit = Math.min(limit, MAX_LIMIT);
        const skip = (page - 1) * safeLimit;

        const where: any = { userId };

        if (search) {
            where.OR = [
                { hospital: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const total = await this.prisma.queue.count({ where });

        const queues = await this.prisma.queue.findMany({
            where,
            include: {
                hospital: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        villageName: true,
                        subdistrictName: true,
                        districtName: true,
                        provinceName: true,
                        country: true,
                        mobilityStatus: true,
                        pictureUrl: true,
                        lat: true,
                        lng: true,
                    },
                },
                verifier: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                    },
                },
                job: {
                    include: {
                        vehicle: true,
                        vlt: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                phone: true,
                                pictureUrl: true,
                                lat: true,
                                lng: true,
                            },
                        },
                        careu: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                phone: true,
                                pictureUrl: true,
                                role: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip,
            take: safeLimit,
        });


        return {
            queues,
            total,
            page,
            limit: safeLimit,
            totalPages: Math.ceil(total / safeLimit),
        };
    }

    async getLatestQueueByUserId(userId: string) {

        const activeStatuses = ['APPROVED', 'PENDING_EXECUTIVE', 'EXECUTIVE_REJECTED', 'CONFIRMED'] as const;

        let latestQueue = await this.prisma.queue.findFirst({
            where: {
                userId,
                status: { in: [...activeStatuses] as any }
            },
            include: {
                hospital: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        villageName: true,
                        subdistrictName: true,
                        districtName: true,
                        provinceName: true,
                        country: true,
                        mobilityStatus: true,
                        pictureUrl: true,
                    },
                },
                verifier: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                job: {
                    include: {
                        vlt: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                phone: true,
                                pictureUrl: true,
                                lat: true,
                                lng: true,
                            },
                        },
                        careu: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                phone: true,
                                pictureUrl: true,
                                role: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (!latestQueue) {
            latestQueue = await this.prisma.queue.findFirst({
                where: { userId },
                include: {
                    hospital: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            villageName: true,
                            subdistrictName: true,
                            districtName: true,
                            provinceName: true,
                            country: true,
                            mobilityStatus: true,
                            pictureUrl: true,
                        },
                    },
                    verifier: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    job: {
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
                                    role: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
        }

        return latestQueue;
    }

    async getQueueById(id: number) {
        return this.prisma.queue.findUnique({
            where: { id },
            include: {
                hospital: true,
                user: {
                    select: {
                        id: true,
                        organizationId: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        pictureUrl: true,
                        villageName: true,
                        subdistrictName: true,
                        districtName: true,
                        provinceName: true,
                        country: true,
                        addressDetail: true,
                        lat: true,
                        lng: true,
                        mobilityStatus: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                    },
                },
                verifier: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                job: {
                    include: {
                        vlt: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                phone: true,
                                pictureUrl: true,
                                lat: true,
                                lng: true,
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
                },
            },
        });
    }

    async getUserOrganizationId(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { organizationId: true },
        });

        return user?.organizationId || null;
    }

    async createQueue(data: {
        userId: string;
        createdBy?: string;
        hospitalId: number;
        requestDate: string;
        bookingTime?: string;
        hasAppointment?: boolean;
        appointmentImage?: string;
        requiredEquipment?: string;
        severityLevel?: 'GREEN' | 'YELLOW' | 'RED';
        wantCareU?: boolean;
    }) {

        try {
            const requestDate = new Date(data.requestDate);
            const dateStr = requestDate.toISOString().split('T')[0];

            const user = await this.prisma.user.findUnique({
                where: { id: data.userId },
                select: { organization: true },
            });
            const org = user?.organization;
            if (org && org.advanceBookingLimitEnabled) {
                const unit = org.advanceBookingUnit || 'DAYS';
                const value = typeof org.advanceBookingValue === 'number' ? org.advanceBookingValue : (org.minAdvanceBookingDays ?? 1);

                if (unit === 'HOURS' && value > 0) {
                    const appointmentDateTime = this.getAppointmentStartDateTime(requestDate, data.bookingTime);
                    const now = new Date();
                    const diffHours = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

                    if (diffHours < value) {
                        throw new BadRequestException(`ไม่สามารถจองคิวได้ เนื่องจากต้องจองล่วงหน้าอย่างน้อย ${value} ชั่วโมงก่อนเวลานัดหมาย`);
                    }
                } else if (unit === 'DAYS' && value > 0) {
                    const now = new Date();
                    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                    const reqDateStr = dateStr;

                    const todayDate = new Date(todayStr);
                    const bookingDate = new Date(reqDateStr);

                    const diffTime = bookingDate.getTime() - todayDate.getTime();
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays < value) {
                        const timeText = value === 1 ? '1 วัน (เริ่มจองได้ตั้งแต่วันถัดไป)' : `${value} วัน`;
                        throw new BadRequestException(`ไม่สามารถจองคิวได้ เนื่องจากต้องจองล่วงหน้าอย่างน้อย ${timeText}`);
                    }
                }
            }

            const dailyLimit = await this.settingsService.getLimitForDate(dateStr);

            const startOfDay = new Date(requestDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(requestDate);
            endOfDay.setHours(23, 59, 59, 999);

            const existingCount = await this.prisma.queue.count({
                where: {
                    requestDate: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                    status: {
                        notIn: ['CANCELLED_BY_USER', 'CANCELLED_BY_MUNICIPAL', 'REJECTED'],
                    },
                    OR: [
                        { job: null },
                        { job: { status: { notIn: ['CANCELLED'] } } }
                    ]
                },
            });

            if (existingCount >= dailyLimit) {
                throw new BadRequestException(
                    `วันที่เลือกมีการจองเต็มแล้ว (${existingCount}/${dailyLimit} รอบ) กรุณาเลือกวันอื่น`,
                );
            }

            const duplicateWhere: any = {
                userId: data.userId,
                requestDate: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                status: {
                    notIn: ['CANCELLED_BY_USER', 'CANCELLED_BY_MUNICIPAL', 'REJECTED'],
                },
                OR: [
                    { job: null },
                    { job: { status: { notIn: ['COMPLETED', 'CANCELLED'] } } }
                ]
            };

            if (data.bookingTime) {
                duplicateWhere.bookingTime = data.bookingTime;
            }

            const duplicateQueue = await this.prisma.queue.findFirst({
                where: duplicateWhere,
                select: { id: true, bookingTime: true, status: true },
            });

            if (duplicateQueue) {
                const timeText = duplicateQueue.bookingTime
                    ? ` รอบ ${duplicateQueue.bookingTime}`
                    : '';
                throw new BadRequestException(
                    `คุณมีการจองวันนี้${timeText}อยู่แล้ว (สถานะ: รอดำเนินการ) หากต้องการจองใหม่ กรุณายกเลิกรายการเดิมก่อน`,
                );
            }

            const queue = await this.prisma.queue.create({
                data: {
                    userId: data.userId,
                    createdBy: data.createdBy,
                    hospitalId: data.hospitalId,
                    requestDate: new Date(data.requestDate),
                    bookingTime: data.bookingTime,
                    hasAppointment: data.hasAppointment ?? false,
                    appointmentImage: data.appointmentImage,
                    requiredEquipment: data.requiredEquipment,
                    severityLevel: data.severityLevel || 'GREEN',
                    wantCareU: data.wantCareU ?? false,
                    status: 'PENDING_MUNICIPAL',
                },
                include: {
                    user: true,
                    creator: true,
                    hospital: true,
                },
            });

            await this.notificationService.notifyNewQueueRequest(queue.id);

            this.activityLogger.log({
                userId: data.createdBy || data.userId,
                action: 'QUEUE_CREATE',
                category: ActivityCategory.QUEUE,
                entityId: queue.id.toString(),
                entityType: 'Queue',
                after: {
                    status: 'PENDING_MUNICIPAL',
                    requestDate: data.requestDate,
                    hospitalId: data.hospitalId
                },
                success: true,
            }).catch(err => console.error('Failed to log queue creation:', err));

            return queue;
        } catch (error) {
            console.error('เจ้าหน้าที่ขับรถError creating queue:', error);
            throw error;
        }
    }

    async updateQueue(
        id: number,
        data: {
            hospitalId?: number;
            requestDate?: string;
            bookingTime?: string;
            requiredEquipment?: string;
            adminNote?: string;
        }
    ) {
        const originalQueue = await this.prisma.queue.findUnique({
            where: { id },
            include: { hospital: true, job: true },
        });

        if (!originalQueue) {
            throw new NotFoundException('ไม่พบคิวที่ระบุ');
        }

        const updateData: any = {};
        const changes: {
            hospitalName?: { from: string; to: string };
            bookingTime?: { from: string; to: string };
            requestDate?: { from: string; to: string };
        } = {};

        if (data.hospitalId && data.hospitalId !== originalQueue.hospitalId) {
            updateData.hospitalId = data.hospitalId;
            const newHospital = await this.prisma.hospital.findUnique({
                where: { id: data.hospitalId },
            });
            changes.hospitalName = {
                from: originalQueue.hospital?.name || '-',
                to: newHospital?.name || '-',
            };
        }
        if (data.bookingTime && data.bookingTime !== originalQueue.bookingTime) {
            updateData.bookingTime = data.bookingTime;
            changes.bookingTime = {
                from: originalQueue.bookingTime || '-',
                to: data.bookingTime,
            };
        }
        if (data.requestDate) {
            const newDate = new Date(data.requestDate);
            const originalDate = originalQueue.requestDate;
            if (newDate.toISOString().split('T')[0] !== originalDate.toISOString().split('T')[0]) {
                updateData.requestDate = newDate;
                changes.requestDate = {
                    from: originalDate.toLocaleDateString('th-TH'),
                    to: newDate.toLocaleDateString('th-TH'),
                };
            }
        }
        if (data.requiredEquipment !== undefined) {
            updateData.requiredEquipment = data.requiredEquipment;
        }
        if (data.adminNote !== undefined) {
            updateData.adminNote = data.adminNote;
        }

        if (Object.keys(updateData).length === 0) {
            return originalQueue;
        }

        const hasMeaningfulChanges = Object.keys(changes).length > 0;

        const completedJobStatuses = ['COMPLETED', 'RETURN_OFFICE'];
        if (originalQueue.job && completedJobStatuses.includes(originalQueue.job.status)) {
            updateData.status = 'PENDING_MUNICIPAL';
            updateData.confirmedByUser = false;
            updateData.confirmedAt = null;
            updateData.verifiedBy = null;
            updateData.verifiedAt = null;

            await this.prisma.resourceTimeSlot.deleteMany({
                where: { jobId: originalQueue.job.id },
            });
            await this.prisma.job.update({
                where: { id: originalQueue.job.id },
                data: {
                    status: 'OPEN',
                    vlt: { disconnect: true },
                    careu: { disconnect: true },
                    vehicle: { disconnect: true },
                    acceptedAt: null,
                    startedAt: null,
                    completedAt: null,
                    patientDroppedOffAt: null,
                    startLat: null,
                    startLng: null,
                    returnEvidenceUrl: null,
                },
            });

            console.log(`[updateQueue] Reset queue ${id} to PENDING_MUNICIPAL, job ${originalQueue.job.id} reset to OPEN`);
        } else if (hasMeaningfulChanges) {
            updateData.status = 'APPROVED';
            updateData.confirmedByUser = false;
            updateData.confirmedAt = null;

            updateData.adminNote = JSON.stringify(changes);

            console.log(`[updateQueue] Queue ${id} status changed to APPROVED - waiting for user to confirm edits`);
        }

        const updatedQueue = await this.prisma.queue.update({
            where: { id },
            data: updateData,
            include: {
                user: true,
                hospital: true,
            },
        });

        if (Object.keys(changes).length > 0) {
            await this.notificationService.notifyQueueEdited(id, changes);
        }

        return updatedQueue;
    }

    private async getQueueOrganizationId(queueId: number): Promise<string | null> {
        const queue = await this.prisma.queue.findUnique({
            where: { id: queueId },
            select: { user: { select: { organizationId: true } } },
        });
        return queue?.user?.organizationId ?? null;
    }

    private async isExecutiveApprovalEnabledForQueue(queueId: number): Promise<boolean> {
        const orgId = await this.getQueueOrganizationId(queueId);
        if (!orgId) return true;
        return this.settingsService.getExecutiveApprovalEnabled(orgId);
    }

    private async promoteQueueToConfirmed(
        id: number,
        options: {
            actorId: string;
            action: string;
            beforeStatus: string;
            executiveId?: string;
            notifyExecutiveApproved?: boolean;
        },
    ) {
        const updateData: Record<string, unknown> = {
            status: 'CONFIRMED',
            rejectReason: null,
            executiveRejectedBy: null,
            executiveRejectedAt: null,
        };

        if (options.executiveId) {
            updateData.executiveApprovedBy = options.executiveId;
            updateData.executiveApprovedAt = new Date();
        } else {
            updateData.executiveApprovedBy = null;
            updateData.executiveApprovedAt = null;
        }

        const queue = await this.prisma.queue.update({
            where: { id },
            data: updateData,
            include: {
                user: true,
                verifier: true,
                job: true,
            },
        });

        let job = queue.job;
        if (!job) {
            job = await this.prisma.job.create({
                data: {
                    queueId: id,
                    status: 'OPEN',
                },
            });
        }

        await this.notificationService.notifyQueueApproved(id);
        if (options.notifyExecutiveApproved && options.executiveId) {
            await this.notificationService.notifyQueueApprovedByExecutive(id);
        }

        this.activityLogger.log({
            userId: options.actorId,
            action: options.action,
            category: ActivityCategory.QUEUE,
            entityId: id.toString(),
            entityType: 'Queue',
            before: { status: options.beforeStatus },
            after: { status: 'CONFIRMED', jobId: job.id },
            success: true,
        }).catch(err => console.error(`Failed to log ${options.action}:`, err));

        return {
            ...queue,
            job,
        };
    }



    async approveQueue(
        id: number,
        data: {
            staffId: string;
            requiredVolunteers?: number;
            adminNote?: string;
        }
    ) {
        const existing = await this.prisma.queue.findUnique({
            where: { id },
            include: { user: { select: { organizationId: true } } },
        });
        if (!existing) {
            throw new NotFoundException('ไม่พบคิวที่ระบุ');
        }

        const executiveEnabled = existing.user.organizationId
            ? await this.settingsService.getExecutiveApprovalEnabled(existing.user.organizationId)
            : true;

        if (!executiveEnabled) {
            await this.prisma.queue.update({
                where: { id },
                data: {
                    verifiedBy: data.staffId,
                    verifiedAt: new Date(),
                    requiredVolunteers: data.requiredVolunteers ?? 0,
                    adminNote: data.adminNote,
                    executiveApprovedBy: null,
                    executiveApprovedAt: null,
                    executiveRejectedBy: null,
                    executiveRejectedAt: null,
                },
            });

            return this.promoteQueueToConfirmed(id, {
                actorId: data.staffId,
                action: 'QUEUE_APPROVE',
                beforeStatus: 'PENDING_MUNICIPAL',
            });
        }

        const queue = await this.prisma.queue.update({
            where: { id },
            data: {
                status: 'PENDING_EXECUTIVE',
                verifiedBy: data.staffId,
                verifiedAt: new Date(),
                requiredVolunteers: data.requiredVolunteers ?? 0,
                adminNote: data.adminNote,
                executiveApprovedBy: null,
                executiveApprovedAt: null,
                executiveRejectedBy: null,
                executiveRejectedAt: null,
            },
            include: {
                user: true,
                verifier: true,
                job: true,
            },
        });

        await this.notificationService.notifyQueuePendingExecutiveApproval(id);

        this.activityLogger.log({
            userId: data.staffId,
            action: 'QUEUE_APPROVE',
            category: ActivityCategory.QUEUE,
            entityId: id.toString(),
            entityType: 'Queue',
            before: { status: 'PENDING_MUNICIPAL' },
            after: { status: 'PENDING_EXECUTIVE' },
            note: data.adminNote ?? undefined,
            success: true,
        }).catch(err => console.error('Failed to log queue approval:', err));

        return queue;
    }

    async rejectQueue(
        id: number,
        data: {
            staffId: string;
            rejectReason: string;
        }
    ) {

        const queue = await this.prisma.queue.update({
            where: { id },
            data: {
                status: 'REJECTED',
                verifiedBy: data.staffId,
                verifiedAt: new Date(),
                rejectReason: data.rejectReason,
            },
            include: {
                user: true,
                verifier: true,
            },
        });

        await this.notificationService.notifyQueueRejected(id, data.rejectReason);

        this.activityLogger.log({
            userId: data.staffId,
            action: 'QUEUE_REJECT',
            category: ActivityCategory.QUEUE,
            entityId: id.toString(),
            entityType: 'Queue',
            before: { status: 'PENDING_MUNICIPAL' },
            after: { status: 'REJECTED' },
            note: data.rejectReason,
            success: true,
        }).catch(err => console.error('Failed to log queue rejection:', err));

        return queue;
    }

    async approveQueueByExecutive(
        id: number,
        executiveId: string,
    ) {
        const existing = await this.prisma.queue.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('ไม่พบคิวที่ระบุ');
        }
        if (existing.status !== 'PENDING_EXECUTIVE') {
            throw new BadRequestException('คิวนี้ไม่อยู่ในสถานะรอผู้บริหารอนุมัติ');
        }

        const executiveEnabled = await this.isExecutiveApprovalEnabledForQueue(id);
        if (!executiveEnabled) {
            throw new BadRequestException('ระบบผู้อนุมัติถูกปิดใช้งานสำหรับหน่วยงานนี้');
        }

        return this.promoteQueueToConfirmed(id, {
            actorId: executiveId,
            action: 'QUEUE_EXECUTIVE_APPROVE',
            beforeStatus: 'PENDING_EXECUTIVE',
            executiveId,
            notifyExecutiveApproved: true,
        });
    }

    async rejectQueueByExecutive(
        id: number,
        data: {
            executiveId: string;
            rejectReason: string;
        },
    ) {
        const existing = await this.prisma.queue.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('ไม่พบคิวที่ระบุ');
        }
        if (existing.status !== 'PENDING_EXECUTIVE') {
            throw new BadRequestException('คิวนี้ไม่อยู่ในสถานะรอผู้บริหารอนุมัติ');
        }

        const executiveEnabled = await this.isExecutiveApprovalEnabledForQueue(id);
        if (!executiveEnabled) {
            throw new BadRequestException('ระบบผู้อนุมัติถูกปิดใช้งานสำหรับหน่วยงานนี้');
        }

        const queue = await this.prisma.queue.update({
            where: { id },
            data: {
                status: 'EXECUTIVE_REJECTED',
                rejectReason: data.rejectReason,
                executiveRejectedBy: data.executiveId,
                executiveRejectedAt: new Date(),
            },
            include: {
                user: true,
                verifier: true,
            },
        });

        await this.notificationService.notifyQueueRejectedByExecutive(id, data.rejectReason);

        this.activityLogger.log({
            userId: data.executiveId,
            action: 'QUEUE_EXECUTIVE_REJECT',
            category: ActivityCategory.QUEUE,
            entityId: id.toString(),
            entityType: 'Queue',
            before: { status: 'PENDING_EXECUTIVE' },
            after: { status: 'EXECUTIVE_REJECTED' },
            note: data.rejectReason,
            success: true,
        }).catch(err => console.error('Failed to log executive queue rejection:', err));

        return queue;
    }

    async resubmitQueueToExecutive(
        id: number,
        staffId: string,
    ) {
        const existing = await this.prisma.queue.findUnique({
            where: { id },
            include: { hospital: true },
        });

        if (!existing) {
            throw new NotFoundException('ไม่พบคิวที่ระบุ');
        }

        if (existing.status !== 'EXECUTIVE_REJECTED') {
            throw new BadRequestException('คิวนี้ไม่ได้อยู่ในสถานะรอเจ้าหน้าที่แก้ไข');
        }

        if (!existing.hospitalId || !existing.bookingTime || !existing.requestDate) {
            throw new BadRequestException('กรุณาแก้ไขข้อมูลให้ครบก่อนส่งกลับผู้บริหาร');
        }

        const executiveEnabled = await this.isExecutiveApprovalEnabledForQueue(id);

        if (!executiveEnabled) {
            await this.prisma.queue.update({
                where: { id },
                data: {
                    rejectReason: null,
                    executiveRejectedBy: null,
                    executiveRejectedAt: null,
                    executiveApprovedBy: null,
                    executiveApprovedAt: null,
                },
            });

            return this.promoteQueueToConfirmed(id, {
                actorId: staffId,
                action: 'QUEUE_RESUBMIT_EXECUTIVE',
                beforeStatus: 'EXECUTIVE_REJECTED',
            });
        }

        const queue = await this.prisma.queue.update({
            where: { id },
            data: {
                status: 'PENDING_EXECUTIVE',
                rejectReason: null,
                executiveRejectedBy: null,
                executiveRejectedAt: null,
                executiveApprovedBy: null,
                executiveApprovedAt: null,
            },
            include: {
                user: true,
                verifier: true,
                job: true,
            },
        });

        await this.notificationService.notifyQueuePendingExecutiveApproval(id);

        this.activityLogger.log({
            userId: staffId,
            action: 'QUEUE_RESUBMIT_EXECUTIVE',
            category: ActivityCategory.QUEUE,
            entityId: id.toString(),
            entityType: 'Queue',
            before: { status: 'EXECUTIVE_REJECTED' },
            after: { status: 'PENDING_EXECUTIVE' },
            success: true,
        }).catch(err => console.error('Failed to log queue resubmit to executive:', err));

        return queue;
    }

    async confirmQueue(id: number) {
        const existing = await this.prisma.queue.findUnique({
            where: { id },
            include: { user: { select: { organizationId: true } } },
        });
        if (!existing) {
            throw new NotFoundException('ไม่พบคิวที่ระบุ');
        }

        const executiveEnabled = existing.user.organizationId
            ? await this.settingsService.getExecutiveApprovalEnabled(existing.user.organizationId)
            : true;

        await this.prisma.queue.update({
            where: { id },
            data: {
                confirmedByUser: true,
                confirmedAt: new Date(),
                rejectReason: null,
                executiveRejectedBy: null,
                executiveRejectedAt: null,
                executiveApprovedBy: null,
                executiveApprovedAt: null,
            },
        });

        if (!executiveEnabled) {
            const result = await this.promoteQueueToConfirmed(id, {
                actorId: existing.userId,
                action: 'QUEUE_CONFIRM',
                beforeStatus: existing.status,
            });
            await this.notificationService.notifyQueueConfirmedByUser(id);
            return result;
        }

        const queue = await this.prisma.queue.update({
            where: { id },
            data: {
                status: 'PENDING_EXECUTIVE',
            },
            include: {
                user: true,
                verifier: true,
                job: true,
            },
        });

        await this.notificationService.notifyQueueConfirmedByUser(queue.id);
        await this.notificationService.notifyQueuePendingExecutiveApproval(queue.id);

        this.activityLogger.log({
            userId: queue.userId,
            action: 'QUEUE_CONFIRM',
            category: ActivityCategory.QUEUE,
            entityId: id.toString(),
            entityType: 'Queue',
            before: { status: 'APPROVED' },
            after: { status: 'PENDING_EXECUTIVE' },
            success: true,
        }).catch(err => console.error('Failed to log queue confirmation:', err));

        return queue;
    }

    async cancelQueue(id: number, cancelledByUserId: string, cancelledByRole?: string) {
        const queue = await this.prisma.queue.findUnique({
            where: { id },
            include: { job: true },
        });

        if (!queue) {
            throw new NotFoundException('ไม่พบคิวที่ระบุ');
        }

        if ((queue.status as string) === 'COMPLETED') {
            throw new BadRequestException('ไม่สามารถยกเลิกคิวที่เสร็จสิ้นแล้ว');
        }

        const isMunicipal = ['STAFF', 'ADMIN', 'EXECUTIVE'].includes(cancelledByRole || '');

        if (!isMunicipal) {
            const user = await this.prisma.user.findUnique({
                where: { id: queue.userId },
                select: { organization: true },
            });

            const org = user?.organization;
            if (org) {
                if (org.allowUserCancelQueue === false) {
                    throw new BadRequestException('เทศบาลไม่อนุญาตให้ยกเลิกคิวด้วยตนเอง กรุณาติดต่อเจ้าหน้าที่เทศบาล');
                }

                const unit = org.cancelQueueUnit || (org.minCancelHoursBefore >= 24 && org.minCancelHoursBefore % 24 === 0 ? 'DAYS' : 'HOURS');
                const value = typeof org.cancelQueueValue === 'number'
                    ? org.cancelQueueValue
                    : (unit === 'DAYS' ? Math.max(1, Math.round((org.minCancelHoursBefore || 24) / 24)) : (org.minCancelHoursBefore || 24));

                if (queue.requestDate) {
                    if (unit === 'DAYS' && value > 0) {
                        const now = new Date();
                        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                        const reqDate = new Date(queue.requestDate);
                        const reqDateStr = `${reqDate.getUTCFullYear()}-${String(reqDate.getUTCMonth() + 1).padStart(2, '0')}-${String(reqDate.getUTCDate()).padStart(2, '0')}`;

                        const todayDate = new Date(todayStr);
                        const jobDate = new Date(reqDateStr);
                        const diffDays = Math.round((jobDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

                        if (diffDays < value) {
                            const timeText = value === 1 ? '1 วันก่อนวันเริ่มงาน (ต้องยกเลิกก่อนถึงวันนัดหมาย)' : `${value} วันก่อนวันเริ่มงาน`;
                            throw new BadRequestException(`ไม่สามารถยกเลิกคิวได้ เนื่องจากต้องยกเลิกล่วงหน้าอย่างน้อย ${timeText}`);
                        }
                    } else if (unit === 'HOURS' && value > 0) {
                        const appointmentDateTime = this.getAppointmentStartDateTime(queue.requestDate, queue.bookingTime);
                        const now = new Date();
                        const diffHours = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

                        if (diffHours < value) {
                            throw new BadRequestException(`ไม่สามารถยกเลิกคิวได้ เนื่องจากต้องยกเลิกล่วงหน้าอย่างน้อย ${value} ชั่วโมงก่อนเวลานัดหมาย`);
                        }
                    }
                }
            }
        }

        const cancelStatus = isMunicipal ? 'CANCELLED_BY_MUNICIPAL' : 'CANCELLED_BY_USER';

        const updatedQueue = await this.prisma.queue.update({
            where: { id },
            data: {
                status: cancelStatus,
            },
            include: {
                user: true,
            },
        });

        if (queue.job) {
            await this.prisma.job.update({
                where: { id: queue.job.id },
                data: { status: 'CANCELLED' },
            });

            await this.prisma.resourceTimeSlot.deleteMany({
                where: { jobId: queue.job.id },
            });
        }

        await this.notificationService.notifyQueueCancelled(id, cancelledByUserId);

        this.activityLogger.log({
            userId: cancelledByUserId,
            action: 'QUEUE_CANCEL',
            category: ActivityCategory.QUEUE,
            entityId: id.toString(),
            entityType: 'Queue',
            before: { status: queue.status },
            after: { status: cancelStatus },
            success: true,
        }).catch(err => console.error('Failed to log queue cancellation:', err));

        return {
            message: 'ยกเลิกคิวสำเร็จ',
            queue: updatedQueue,
        };
    }

    async getBookingAvailability(year: number, month: number, organizationId?: string) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const [defaultLimit, dateSpecificLimits] = await Promise.all([
            this.settingsService.getDailyBookingLimit(),
            this.settingsService.getAllDateSpecificLimits(),
        ]);

        const dateLimits: Record<string, number> = {};
        dateSpecificLimits.forEach(dl => {
            dateLimits[dl.date] = dl.limit;
        });

        const where: any = {
            requestDate: {
                gte: startDate,
                lte: endDate,
            },
            status: {
                notIn: ['CANCELLED_BY_USER', 'CANCELLED_BY_MUNICIPAL', 'REJECTED']
            }
        };

        if (organizationId) {
            where.user = {
                organizationId,
            };
        }

        const queues = await this.prisma.queue.findMany({
            where,
            select: {
                requestDate: true
            }
        });

        const bookings: Record<string, number> = {};

        queues.forEach(q => {
            const dateStr = q.requestDate.toISOString().split('T')[0];
            bookings[dateStr] = (bookings[dateStr] || 0) + 1;
        });

        return {
            bookings,
            defaultLimit,
            dateLimits,
        };
    }

    async markNotificationAsRead(id: number) {
        return this.prisma.queue.update({
            where: { id },
            data: {
                notificationReadAt: new Date(),
            },
        });
    }

    async getCaregiverPatients(caregiverId: string) {
        return this.prisma.caregiverPatient.findMany({
            where: {
                caregiverId,
            },
            select: {
                patientId: true,
                status: true,
            },
        });
    }

    private getAppointmentStartDateTime(requestDate: Date, bookingTime?: string | null): Date {
        const d = new Date(requestDate);
        let hour = 8;
        let minute = 0;
        if (bookingTime) {
            const match = bookingTime.match(/(\d{1,2})[:.](\d{2})/);
            if (match) {
                hour = parseInt(match[1], 10);
                minute = parseInt(match[2], 10);
            }
        }
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return new Date(`${year}-${month}-${day}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+07:00`);
    }
}
