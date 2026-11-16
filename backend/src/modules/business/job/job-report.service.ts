import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class JobReportService {
    private readonly logger = new Logger(JobReportService.name);

    constructor(private prisma: PrismaService) { }

    async getDisbursementReport(month: string, organizationId: string | undefined, volunteerId?: string, startDateStr?: string, endDateStr?: string) {
        let filterStartDate: Date;
        let filterEndDate: Date;

        if (startDateStr && endDateStr) {
            filterStartDate = new Date(startDateStr);
            filterEndDate = new Date(endDateStr);
            filterEndDate.setHours(23, 59, 59, 999);
        } else {
            const [yearStr, monthStr] = month.split('-');
            const year = parseInt(yearStr);
            const mon = parseInt(monthStr) - 1;

            filterStartDate = new Date(year, mon, 1);
            filterEndDate = new Date(year, mon + 1, 1);
        }

        const COST_PER_CASE = 300;

        const where: any = {
            status: 'COMPLETED',
            completedAt: {
                gte: filterStartDate,
                lte: filterEndDate,
            },
            ...(organizationId ? {
                queue: {
                    user: {
                        organizationId,
                    },
                },
            } : {}),
        };

        if (volunteerId) {
            where.OR = [
                { vltId: volunteerId },
                { careuId: volunteerId },
            ];
        }

        const jobs = await this.prisma.job.findMany({
            where,
            include: {
                queue: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                        hospital: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                vlt: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
                careu: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
                vehicle: {
                    select: {
                        name: true,
                        licensePlate: true,
                    },
                },
            },
            orderBy: { completedAt: 'asc' },
        });

        const org = organizationId ? await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: { name: true },
        }) : null;

        const volunteerMap = new Map<string, {
            id: string;
            firstName: string;
            lastName: string;
            role: string;
            completedJobs: number;
            totalDistance: number;
            disbursement: number;
            jobs: any[];
        }>();

        let totalDriverJobs = 0;
        let totalCareUJobs = 0;
        let totalDistance = 0;

        for (const job of jobs) {
            const patientName = job.queue.user
                ? `${job.queue.user.firstName || ''} ${job.queue.user.lastName || ''}`.trim() || 'ไม่ระบุ'
                : 'ไม่ระบุ';
            const hospitalName = job.queue.hospital?.name || 'ไม่ระบุ';
            const dist = job.distanceKm || 0;
            totalDistance += dist;

            const jobDetail = {
                id: job.id,
                completedAt: job.completedAt,
                patientName,
                hospitalName,
                distanceKm: dist,
                bookingTime: job.queue.bookingTime || '-',
                vehicleName: job.vehicle ? `${job.vehicle.name} (${job.vehicle.licensePlate})` : '-',
                cost: COST_PER_CASE,
            };

            if (job.vlt) {
                totalDriverJobs++;
                const key = job.vlt.id;
                if (!volunteerMap.has(key)) {
                    volunteerMap.set(key, {
                        id: job.vlt.id,
                        firstName: job.vlt.firstName || '',
                        lastName: job.vlt.lastName || '',
                        role: 'DRIVE',
                        completedJobs: 0,
                        totalDistance: 0,
                        disbursement: 0,
                        jobs: [],
                    });
                }
                const v = volunteerMap.get(key)!;
                v.completedJobs++;
                v.totalDistance += dist;
                v.disbursement = v.completedJobs * COST_PER_CASE;
                v.jobs.push(jobDetail);
            }

            if (job.careu) {
                totalCareUJobs++;
                const key = job.careu.id;
                if (!volunteerMap.has(key)) {
                    volunteerMap.set(key, {
                        id: job.careu.id,
                        firstName: job.careu.firstName || '',
                        lastName: job.careu.lastName || '',
                        role: 'CAREU',
                        completedJobs: 0,
                        totalDistance: 0,
                        disbursement: 0,
                        jobs: [],
                    });
                }
                const v = volunteerMap.get(key)!;
                v.completedJobs++;
                v.totalDistance += dist;
                v.disbursement = v.completedJobs * COST_PER_CASE;
                v.jobs.push({ ...jobDetail, cost: COST_PER_CASE });
            }
        }

        const volunteers = Array.from(volunteerMap.values()).sort((a, b) => b.completedJobs - a.completedJobs);
        const totalDisbursement = volunteers.reduce((sum, v) => sum + v.disbursement, 0);

        return {
            summary: {
                month,
                totalCompletedJobs: jobs.length,
                totalDriverJobs,
                totalCareUJobs,
                totalDistance: Math.round(totalDistance * 100) / 100,
                costPerCase: COST_PER_CASE,
                totalDisbursement,
                organizationName: org?.name || (organizationId ? 'ไม่ระบุ' : 'ทุกองค์กร'),
            },
            volunteers,
        };
    }

    async getRatingsReport(organizationId: string | undefined, startDateStr?: string, endDateStr?: string) {
        let dateFilter: any = {};
        if (startDateStr && endDateStr) {
            const start = new Date(startDateStr);
            const end = new Date(endDateStr);
            end.setHours(23, 59, 59, 999);
            dateFilter = { gte: start, lte: end };
        }

        const org = organizationId ? await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: { name: true },
        }) : null;

        const completedJobs = await this.prisma.job.findMany({
            where: {
                status: { in: ['COMPLETED', 'RETURN_OFFICE'] },
                ...(startDateStr && endDateStr ? { updatedAt: dateFilter } : {}),
                ...(organizationId ? { queue: { user: { organizationId } } } : {}),
                OR: [
                    { ratingScore: { not: null } },
                    { careuRatingScore: { not: null } },
                ],
            },
            select: {
                id: true,
                completedAt: true,
                updatedAt: true,
                ratingScore: true,
                ratingComment: true,
                careuRatingScore: true,
                careuRatingComment: true,
                vlt: { select: { id: true, firstName: true, lastName: true } },
                careu: { select: { id: true, firstName: true, lastName: true } },
                queue: { select: { user: { select: { firstName: true, lastName: true } } } },
            },
            orderBy: { updatedAt: 'desc' },
        });

        const driverMap = new Map<string, { id: string; name: string; ratings: number[]; jobs: any[] }>();
        const careuMap = new Map<string, { id: string; name: string; ratings: number[]; jobs: any[] }>();

        for (const job of completedJobs) {
            const patientName = job.queue.user ? `${job.queue.user.firstName || ''} ${job.queue.user.lastName || ''}`.trim() : 'ไม่ระบุ';

            if (job.ratingScore !== null && job.vlt) {
                const key = job.vlt.id;
                if (!driverMap.has(key)) {
                    driverMap.set(key, {
                        id: job.vlt.id,
                        name: `${job.vlt.firstName || ''} ${job.vlt.lastName || ''}`.trim(),
                        ratings: [],
                        jobs: [],
                    });
                }
                const d = driverMap.get(key)!;
                d.ratings.push(job.ratingScore);
                d.jobs.push({
                    jobId: job.id,
                    score: job.ratingScore,
                    comment: job.ratingComment,
                    patientName,
                    completedAt: job.completedAt || job.updatedAt,
                });
            }

            if (job.careuRatingScore !== null && job.careu) {
                const key = job.careu.id;
                if (!careuMap.has(key)) {
                    careuMap.set(key, {
                        id: job.careu.id,
                        name: `${job.careu.firstName || ''} ${job.careu.lastName || ''}`.trim(),
                        ratings: [],
                        jobs: [],
                    });
                }
                const c = careuMap.get(key)!;
                c.ratings.push(job.careuRatingScore);
                c.jobs.push({
                    jobId: job.id,
                    score: job.careuRatingScore,
                    comment: job.careuRatingComment,
                    patientName,
                    completedAt: job.completedAt || job.updatedAt,
                });
            }
        }

        const calcAvg = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;

        const drivers = Array.from(driverMap.values()).map(d => ({
            ...d,
            avgScore: calcAvg(d.ratings),
            totalRatings: d.ratings.length,
        })).sort((a, b) => b.avgScore - a.avgScore);

        const careus = Array.from(careuMap.values()).map(c => ({
            ...c,
            avgScore: calcAvg(c.ratings),
            totalRatings: c.ratings.length,
        })).sort((a, b) => b.avgScore - a.avgScore);

        const municipalRatings = await this.prisma.municipalRating.findMany({
            where: {
                ...(organizationId ? { organizationId } : {}),
                ...(startDateStr && endDateStr ? { createdAt: dateFilter } : {}),
            },
            select: {
                id: true,
                punctuality: true,
                bookingEase: true,
                vehicleClean: true,
                safety: true,
                staffAttitude: true,
                overallScore: true,
                comment: true,
                createdAt: true,
                user: { select: { firstName: true, lastName: true } },
                job: { select: { id: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        const municipalAvg = {
            punctuality: calcAvg(municipalRatings.map(r => r.punctuality)),
            bookingEase: calcAvg(municipalRatings.map(r => r.bookingEase)),
            vehicleClean: calcAvg(municipalRatings.map(r => r.vehicleClean)),
            safety: calcAvg(municipalRatings.map(r => r.safety)),
            staffAttitude: calcAvg(municipalRatings.map(r => r.staffAttitude)),
            overallScore: calcAvg(municipalRatings.map(r => r.overallScore)),
        };

        const allDriverRatings = drivers.flatMap(d => d.ratings);
        const allCareuRatings = careus.flatMap(c => c.ratings);

        return {
            organizationName: org?.name || (organizationId ? 'ไม่ระบุ' : 'ทุกองค์กร'),
            summary: {
                totalDriverRatings: allDriverRatings.length,
                avgDriverScore: calcAvg(allDriverRatings),
                totalCareuRatings: allCareuRatings.length,
                avgCareuScore: calcAvg(allCareuRatings),
                totalMunicipalRatings: municipalRatings.length,
                avgMunicipalScore: municipalAvg.overallScore,
            },
            drivers,
            careus,
            municipal: {
                averages: municipalAvg,
                ratings: municipalRatings.map(r => ({
                    id: r.id,
                    jobId: r.job.id,
                    userName: `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim(),
                    punctuality: r.punctuality,
                    bookingEase: r.bookingEase,
                    vehicleClean: r.vehicleClean,
                    safety: r.safety,
                    staffAttitude: r.staffAttitude,
                    overallScore: r.overallScore,
                    comment: r.comment,
                    createdAt: r.createdAt,
                })),
            },
        };
    }
}
