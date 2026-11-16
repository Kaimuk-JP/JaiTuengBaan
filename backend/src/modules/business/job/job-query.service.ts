import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class JobQueryService {
    private readonly logger = new Logger(JobQueryService.name);

    constructor(private prisma: PrismaService) { }

    async getAllJobs(filters?: { status?: string | string[]; vltId?: string; queueId?: number; userId?: string; page?: number; limit?: number; organizationId?: string }) {
        const where: any = {};

        if (filters?.status) {
            if (Array.isArray(filters.status)) {
                where.status = { in: filters.status };
            } else {
                where.status = filters.status;
            }
        }

        if (filters?.organizationId) {
            where.queue = {
                user: {
                    organizationId: filters.organizationId,
                },
            };
        }

        if (filters?.vltId) {
            where.vltId = filters.vltId;
        }

        if (filters?.queueId) {
            where.queueId = filters.queueId;
        }

        if (filters?.userId) {
            where.queue = {
                ...where.queue,
                userId: filters.userId,
            };
        }

        const page = filters?.page || 1;
        const limit = filters?.limit || 30;
        const skip = (page - 1) * limit;

        const [jobs, total] = await Promise.all([
            this.prisma.job.findMany({
                where,
                include: {
                    queue: {
                        include: {
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
                                    addressDetail: true,
                                    lat: true,
                                    lng: true,
                                    mobilityStatus: true,
                                    diseases: {
                                        include: { disease: true }
                                    },
                                    customDiseases: true,
                                    specialNeeds: true,
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
                    municipalRating: {
                        select: { id: true },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.job.count({ where }),
        ]);

        return {
            jobs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getAvailableJobs() {
        return this.prisma.job.findMany({
            where: {
                status: 'OPEN',
                queue: {
                    status: 'CONFIRMED',
                },
            },
            include: {
                queue: {
                    include: {
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
                                diseases: {
                                    include: { disease: true }
                                },
                                customDiseases: true,
                                specialNeeds: true,
                                pictureUrl: true,
                            },
                        },
                    },
                },
            },
            orderBy: [
                { queue: { severityLevel: 'desc' } },
                { createdAt: 'asc' },
            ],
        });
    }

    private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    async getJobsAssignedToVolunteer(vltId: string, statusFilter?: string[], date?: string) {
        this.logger.log(`Fetching jobs for volunteer ${vltId}${statusFilter?.length ? ` (Status: ${statusFilter.join(',')})` : ''}${date ? ` (Date: ${date})` : ''}`);

        const volunteer = await this.prisma.user.findUnique({
            where: { id: vltId },
            select: { lat: true, lng: true },
        });

        const where: any = {
            OR: [
                { vltId },
                { careuId: vltId }
            ]
        };

        if (statusFilter && statusFilter.length > 0) {
            where.status = {
                in: statusFilter,
            };
        } else {
            where.status = {
                in: [
                    'ASSIGNED', 'ACCEPTED', 'PICKING_UP', 'IN_TRANSIT',
                    'AT_HOSPITAL', 'AT_PATIENT_HOME',
                    'RETURN_HOME', 'RETURN_OFFICE', 'COMPLETED',
                ],
            };
        }

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            where.queue = {
                requestDate: {
                    gte: startDate,
                    lte: endDate,
                },
            };
        }

        const jobs = await this.prisma.job.findMany({
            where,
            include: {
                queue: {
                    select: {
                        id: true,
                        hospital: { select: { name: true, lat: true, lng: true } },
                        requestDate: true,
                        bookingTime: true,
                        hasAppointment: true,
                        severityLevel: true,
                        requiredEquipment: true,
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
                                addressDetail: true,
                                lat: true,
                                lng: true,
                                mobilityStatus: true,
                                diseases: {
                                    include: { disease: true }
                                },
                                customDiseases: true,
                                specialNeeds: true,
                                pictureUrl: true,
                                relativeName: true,
                                relativePhone: true,
                                birthDate: true,
                                organization: {
                                    select: {
                                        id: true,
                                        name: true,
                                        lat: true,
                                        lng: true,
                                        lockReturnOfficeEnabled: true,
                                        returnOfficeRadiusMeters: true,
                                    },
                                },
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
                vehicle: true,
            },
        });

        const driverLat = volunteer?.lat;
        const driverLng = volunteer?.lng;

        const pickupStatuses = ['ASSIGNED', 'ACCEPTED', 'PICKING_UP', 'IN_TRANSIT'];
        const atHospitalStatuses = ['AT_HOSPITAL', 'AT_PATIENT_HOME'];
        const returnStatuses = ['RETURN_HOME', 'RETURN_OFFICE'];

        const pickupJobs = jobs.filter(j => pickupStatuses.includes(j.status));
        const atHospitalJobs = jobs.filter(j => atHospitalStatuses.includes(j.status));
        const returnJobs = jobs.filter(j => returnStatuses.includes(j.status));
        const completedJobs = jobs.filter(
            j =>
                !pickupStatuses.includes(j.status) &&
                !atHospitalStatuses.includes(j.status) &&
                !returnStatuses.includes(j.status),
        );

        atHospitalJobs.sort((a, b) => {
            const aRequested = a.returnPickupRequestedAt
                ? new Date(a.returnPickupRequestedAt).getTime()
                : Infinity;
            const bRequested = b.returnPickupRequestedAt
                ? new Date(b.returnPickupRequestedAt).getTime()
                : Infinity;
            if (aRequested !== bRequested) return aRequested - bRequested;
            return a.createdAt.getTime() - b.createdAt.getTime();
        });

        if (driverLat != null && driverLng != null) {
            pickupJobs.sort((a, b) => {
                const aDist = (a.queue?.user?.lat != null && a.queue?.user?.lng != null)
                    ? this.haversineDistance(driverLat, driverLng, a.queue.user.lat, a.queue.user.lng)
                    : Infinity;
                const bDist = (b.queue?.user?.lat != null && b.queue?.user?.lng != null)
                    ? this.haversineDistance(driverLat, driverLng, b.queue.user.lat, b.queue.user.lng)
                    : Infinity;
                return aDist - bDist;
            });
        }

        returnJobs.sort((a, b) => {
            const aHospLat = a.queue?.hospital?.lat;
            const aHospLng = a.queue?.hospital?.lng;
            const bHospLat = b.queue?.hospital?.lat;
            const bHospLng = b.queue?.hospital?.lng;

            const aDist = (aHospLat != null && aHospLng != null && a.queue?.user?.lat != null && a.queue?.user?.lng != null)
                ? this.haversineDistance(aHospLat, aHospLng, a.queue.user.lat, a.queue.user.lng)
                : Infinity;
            const bDist = (bHospLat != null && bHospLng != null && b.queue?.user?.lat != null && b.queue?.user?.lng != null)
                ? this.haversineDistance(bHospLat, bHospLng, b.queue.user.lat, b.queue.user.lng)
                : Infinity;
            return aDist - bDist;
        });

        completedJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return [...pickupJobs, ...atHospitalJobs, ...returnJobs, ...completedJobs];
    }

    async getVolunteerHistoryDates(volunteerId: string, role?: 'DRIVE' | 'CAREU') {
        const assignmentFilter = role === 'CAREU'
            ? { careuId: volunteerId }
            : role === 'DRIVE'
                ? { vltId: volunteerId }
                : { OR: [{ vltId: volunteerId }, { careuId: volunteerId }] };

        const jobs = await this.prisma.job.findMany({
            where: {
                ...assignmentFilter,
                status: { in: ['COMPLETED', 'CANCELLED', 'REJECTED'] },
            },
            select: {
                queue: {
                    select: {
                        requestDate: true
                    }
                }
            },
            orderBy: {
                queue: {
                    requestDate: 'desc'
                }
            }
        });

        const dates = new Set<string>();
        jobs.forEach(job => {
            if (job.queue?.requestDate) {
                const dateStr = job.queue.requestDate.toISOString().split('T')[0];
                dates.add(dateStr);
            }
        });

        return Array.from(dates);
    }

    async getJobById(id: number) {
        this.logger.log(`Fetching job detail for ID ${id}`);
        return this.prisma.job.findUnique({
            where: { id },
            include: {
                queue: {
                    select: {
                        id: true,
                        hospital: { select: { name: true, lat: true, lng: true } },
                        requestDate: true,
                        bookingTime: true,
                        hasAppointment: true,
                        severityLevel: true,
                        status: true,
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
                                addressDetail: true,
                                lat: true,
                                lng: true,
                                mobilityStatus: true,
                                diseases: {
                                    include: { disease: true }
                                },
                                customDiseases: true,
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
                                phone: true,
                            }
                        }
                    },
                },
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
                        lat: true,
                        lng: true,
                    },
                },
            },
        });
    }

        async getMyPendingRatings(userId: string) {
        this.logger.log(`Checking pending ratings for user ${userId}`);

        const jobs = await this.prisma.job.findMany({
            where: {
                status: 'COMPLETED',
                completedAt: { not: null },
                OR: [
                    {
                        queue: {
                            userId: userId,
                            createdBy: null,
                        }
                    },
                    {
                        queue: {
                            userId: userId,
                            createdBy: userId,
                        }
                    },
                    {
                        queue: {
                            createdBy: userId,
                        }
                    }
                ]
            },
            select: {
                id: true,
                status: true,
                completedAt: true,
                ratingScore: true,
                careuRatingScore: true,
                queue: {
                    select: {
                        userId: true,
                        createdBy: true,
                    }
                },
                vlt: {
                    select: {
                        id: true,
                        firstName: true,
                        phone: true,
                        pictureUrl: true,
                    },
                },
                careu: {
                    select: {
                        id: true,
                        firstName: true,
                        phone: true,
                        pictureUrl: true,
                    },
                },
                municipalRating: {
                    select: { id: true },
                },
            },
            orderBy: { completedAt: 'desc' },
            take: 5,
        });

        return jobs.filter(job =>
            job.ratingScore === null || !job.municipalRating
        );
    }

    async getJobLocationTrail(jobId: number) {
        const [job, points] = await Promise.all([
            this.prisma.job.findUnique({
                where: { id: jobId },
                select: {
                    startLat: true,
                    startLng: true,
                    returnPickupRequestedAt: true,
                    patientDroppedOffAt: true,
                    completedAt: true,
                    queue: {
                        select: {
                            hospital: { select: { lat: true, lng: true, name: true } },
                            user: {
                                select: {
                                    lat: true,
                                    lng: true,
                                    organization: { select: { lat: true, lng: true, name: true } },
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.jobLocationLog.findMany({
                where: { jobId },
                orderBy: { recordedAt: 'asc' },
                select: {
                    lat: true,
                    lng: true,
                    recordedAt: true,
                    source: true,
                    leg: true,
                },
            }),
        ]);

        const mapped = points
            .map((p) => ({
                lat: p.lat,
                lng: p.lng,
                recordedAt: p.recordedAt.toISOString(),
                source: p.source,
                leg: p.leg || 'pickup',
            }))
            .filter((p) => p.lat >= 5 && p.lat <= 21 && p.lng >= 97 && p.lng <= 106);

        const user = job?.queue?.user;
        const hospital = job?.queue?.hospital;
        const org = user?.organization;

        const toCoord = (lat?: number | null, lng?: number | null) =>
            lat != null && lng != null && lat >= 5 && lat <= 21 && lng >= 97 && lng <= 106
                ? { lat, lng }
                : null;

        return {
            points: mapped,
            latest: mapped.length > 0 ? mapped[mapped.length - 1] : null,
            waypoints: {
                patientHome: toCoord(user?.lat, user?.lng),
                hospital: toCoord(hospital?.lat, hospital?.lng),
                hospitalName: hospital?.name ?? null,
                office: toCoord(org?.lat, org?.lng),
                officeName: org?.name ?? null,
                jobStart: toCoord(job?.startLat, job?.startLng),
            },
            timestamps: {
                returnPickupRequestedAt: job?.returnPickupRequestedAt?.toISOString() ?? null,
                patientDroppedOffAt: job?.patientDroppedOffAt?.toISOString() ?? null,
                completedAt: job?.completedAt?.toISOString() ?? null,
            },
        };
    }
}
