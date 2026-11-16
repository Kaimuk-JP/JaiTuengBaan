import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';

export interface HistoryItem {
    id: string;
    type: 'booking' | 'profile_edit' | 'caregiver' | 'role';
    status: string;
    requesterName: string;
    reviewerName: string;
    date: Date;
    rejectReason?: string | null;
    adminNote?: string | null;
    driverName?: string | null;
    careuName?: string | null;
    requestedRole?: string | null;
    currentRole?: string | null;
}

@Injectable()
export class HistoryService {
    constructor(private prisma: PrismaService) { }

    async getHistory(page: number = 1, limit: number = 20, types: string[], statuses?: string[], search?: string, orgId?: string | null) {
        const MAX_PAGE_LIMIT = 100;
        const MAX_RECORDS_PER_TYPE = 500;
        const safeLimit = Math.min(limit, MAX_PAGE_LIMIT);
        const skip = (page - 1) * safeLimit;

        const allRecords: HistoryItem[] = [];

        if (types.includes('booking')) {
            const queues = await this.prisma.queue.findMany({
                where: orgId ? {
                    user: {
                        organizationId: orgId,
                    }
                } : {},
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
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
                        select: {
                            id: true,
                            status: true,
                            vlt: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                            careu: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    requestDate: 'desc',
                },
                take: MAX_RECORDS_PER_TYPE,
            });

            const bookingItems = queues.map((queue) => ({
                id: `booking-${queue.id}`,
                type: 'booking' as const,
                status: queue.job && queue.job.status !== 'OPEN' ? queue.job.status : queue.status,
                requesterName:
                    queue.user?.firstName && queue.user?.lastName
                        ? `${queue.user.firstName} ${queue.user.lastName}`
                        : (queue.user?.firstName || queue.user?.lastName || 'ไม่ระบุชื่อ'),
                reviewerName:
                    queue.verifier?.firstName && queue.verifier?.lastName
                        ? `${queue.verifier.firstName} ${queue.verifier.lastName}`
                        : (queue.verifier?.firstName || queue.verifier?.lastName || 'รอดำเนินการ'),
                date: queue.requestDate,
                rejectReason: queue.rejectReason,
                adminNote: queue.adminNote,
                driverName: queue.job?.vlt
                    ? `${queue.job.vlt.firstName} ${queue.job.vlt.lastName || ''}`.trim()
                    : null,
                careuName: queue.job?.careu
                    ? `${queue.job.careu.firstName} ${queue.job.careu.lastName || ''}`.trim()
                    : null,
            }));

            allRecords.push(...bookingItems);
        }

        if (types.includes('caregiver')) {
            const caregiverRequests = await this.prisma.caregiverPatient.findMany({
                where: orgId ? {
                    patient: {
                        organizationId: orgId,
                    }
                } : {},
                include: {
                    patient: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    caregiver: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    reviewer: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: MAX_RECORDS_PER_TYPE,
            });

            const caregiverItems = caregiverRequests.map((req) => ({
                id: `caregiver-${req.id}`,
                type: 'caregiver' as const,
                status: req.status,
                requesterName:
                    req.caregiver?.firstName && req.caregiver?.lastName
                        ? `${req.caregiver.firstName} ${req.caregiver.lastName}`
                        : (req.caregiver?.firstName || req.caregiver?.lastName || 'ไม่ระบุชื่อ'),
                reviewerName:
                    req.reviewer?.firstName && req.reviewer?.lastName
                        ? `${req.reviewer.firstName} ${req.reviewer.lastName}`
                        : (req.reviewer?.firstName || req.reviewer?.lastName || 'รอดำเนินการ'),
                date: req.createdAt,
            }));

            allRecords.push(...caregiverItems);
        }

        if (types.includes('profile_edit')) {
            const profileEdits = await this.prisma.profileEditRequest.findMany({
                where: orgId ? {
                    user: {
                        organizationId: orgId,
                    }
                } : {},
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    reviewer: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: MAX_RECORDS_PER_TYPE,
            });

            const profileEditItems = profileEdits.map((req) => ({
                id: `profile_edit-${req.id}`,
                type: 'profile_edit' as const,
                status: req.status,
                requesterName:
                    req.user?.firstName && req.user?.lastName
                        ? `${req.user.firstName} ${req.user.lastName}`
                        : (req.user?.firstName || req.user?.lastName || 'ไม่ระบุชื่อ'),
                reviewerName:
                    req.reviewer?.firstName && req.reviewer?.lastName
                        ? `${req.reviewer.firstName} ${req.reviewer.lastName}`
                        : (req.reviewer?.firstName || req.reviewer?.lastName || 'รอดำเนินการ'),
                date: req.createdAt,
            }));

            allRecords.push(...profileEditItems);
        }

        if (types.includes('role')) {
            const roleRequests = await this.prisma.roleRequest.findMany({
                where: orgId ? {
                    user: {
                        organizationId: orgId,
                    }
                } : {},
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
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
                orderBy: {
                    createdAt: 'desc',
                },
                take: MAX_RECORDS_PER_TYPE,
            });

            const roleItems = roleRequests.map((req) => ({
                id: `role-${req.id}`,
                type: 'role' as const,
                status: req.status,
                requesterName:
                    req.user?.firstName && req.user?.lastName
                        ? `${req.user.firstName} ${req.user.lastName}`
                        : (req.user?.firstName || req.user?.lastName || 'ไม่ระบุชื่อ'),
                reviewerName:
                    req.reviewedBy?.firstName && req.reviewedBy?.lastName
                        ? `${req.reviewedBy.firstName} ${req.reviewedBy.lastName}`
                        : (req.reviewedBy?.firstName || req.reviewedBy?.lastName || 'รอดำเนินการ'),
                date: req.createdAt,
                rejectReason: req.rejectReason,
                adminNote: req.note,
                requestedRole: req.requestedRole,
                currentRole: req.currentRole,
            }));

            allRecords.push(...roleItems);
        }

        let filteredRecords = allRecords;
        if (statuses && statuses.length > 0) {
            filteredRecords = filteredRecords.filter(r => statuses.includes(r.status));
        }

        if (search) {
            const searchLower = search.toLowerCase();
            filteredRecords = filteredRecords.filter(r =>
                r.requesterName.toLowerCase().includes(searchLower) ||
                r.reviewerName.toLowerCase().includes(searchLower)
            );
        }

        filteredRecords.sort((a, b) => b.date.getTime() - a.date.getTime());

        const total = filteredRecords.length;
        const totalPages = Math.ceil(total / safeLimit);
        const startIndex = skip;
        const endIndex = startIndex + safeLimit;
        const paginatedData = filteredRecords.slice(startIndex, endIndex);

        return {
            data: paginatedData,
            total,
            totalPages,
            currentPage: page,
            limit: safeLimit,
        };
    }
}
