import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { PointsService } from '@/modules/features/points/points.service';
import { NotificationService } from '@/modules/system/notification/notification.service';
import { sumTrailDistanceByLeg, sumTrailDistanceKm } from '../../../common/helpers/location-trail.helper';

@Injectable()
export class JobLifecycleService {
    private readonly logger = new Logger(JobLifecycleService.name);

    constructor(
        private prisma: PrismaService,
        private pointsService: PointsService,
        private notificationService: NotificationService,
    ) { }

    async updateJobStatus(
        jobId: number,
        status: 'OPEN' | 'ASSIGNED' | 'ACCEPTED' | 'REJECTED' | 'PICKING_UP' | 'IN_TRANSIT' | 'AT_HOSPITAL' | 'RETURN_HOME' | 'AT_PATIENT_HOME' | 'RETURN_OFFICE' | 'COMPLETED' | 'CANCELLED',
        vltId: string,
        location?: { lat?: number; lng?: number },
        returnEvidenceUrl?: string
    ) {
        this.logger.log(`Volunteer ${vltId} updating Job ${jobId} status to ${status}`);

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
                            },
                        },
                        hospital: {
                            select: { lat: true, lng: true }
                        }
                    },
                },
            },
        });

        if (!job) {
            throw new NotFoundException('ไม่พบงานที่ระบุ');
        }

        if (job.vltId !== vltId) {
            throw new ForbiddenException('เฉพาะเจ้าหน้าที่ขับรถเท่านั้นที่สามารถอัพเดทสถานะได้');
        }

        if (status === 'PICKING_UP' && job.queue?.requestDate) {
            const dateStr = job.queue.requestDate instanceof Date
                ? job.queue.requestDate.toISOString().split('T')[0]
                : String(job.queue.requestDate).split('T')[0];
            const [year, month, day] = dateStr.split('-').map(Number);

            let hours = 8;
            let minutes = 0;
            if (job.queue.bookingTime) {
                const match = job.queue.bookingTime.match(/(\d{1,2})[:.](\d{2})/);
                if (match) {
                    hours = parseInt(match[1], 10);
                    minutes = parseInt(match[2], 10);
                }
            }

            const scheduledStart = new Date(Date.UTC(year, month - 1, day, hours - 7, minutes, 0, 0));
            const threeHoursBefore = new Date(scheduledStart.getTime() - 3 * 60 * 60 * 1000);
            if (new Date() < threeHoursBefore) {
                throw new BadRequestException('ยังไม่ถึงเวลาเริ่มปฏิบัติงาน (สามารถเริ่มได้ก่อนเวลาคิว 3 ชั่วโมง)');
            }
        }

        if (status === 'RETURN_OFFICE' && !returnEvidenceUrl) {
            throw new BadRequestException('กรุณาถ่ายรูปหลักฐานก่อนยืนยันส่งถึงบ้าน');
        }

        const updateData: any = {
            status,
        };

        if (returnEvidenceUrl) {
            updateData.returnEvidenceUrl = returnEvidenceUrl;
        }

        if (status === 'AT_PATIENT_HOME') {
            updateData.driverDeliveredAt = new Date();
            this.logger.log(`Job ${jobId}: Driver delivered patient at home at ${updateData.driverDeliveredAt}`);
        }

        if (location?.lat && location?.lng) {
            await this.prisma.user.update({
                where: { id: vltId },
                data: {
                    lat: location.lat,
                    lng: location.lng
                }
            });
        }

        if (status === 'RETURN_OFFICE') {
            updateData.patientDroppedOffAt = new Date();
            updateData.driverDeliveredAt = new Date();
            this.logger.log(`Job ${jobId}: Patient dropped off at home tracked at ${updateData.patientDroppedOffAt}`);
        }

        if (status === 'COMPLETED') {
            const volunteerUser = await this.prisma.user.findUnique({
                where: { id: vltId },
                select: { organizationId: true, lat: true, lng: true }
            });
            const orgId = volunteerUser?.organizationId || (job.queue?.user as any)?.organizationId;
            if (orgId) {
                const org = await this.prisma.organization.findUnique({
                    where: { id: orgId },
                    select: { lat: true, lng: true, lockReturnOfficeEnabled: true, returnOfficeRadiusMeters: true }
                });
                if (org?.lockReturnOfficeEnabled && org.lat && org.lng) {
                    const currentLat = location?.lat || volunteerUser?.lat;
                    const currentLng = location?.lng || volunteerUser?.lng;
                    if (currentLat && currentLng) {
                        const distMeters = this.calculateDistanceMeters(currentLat, currentLng, org.lat, org.lng);
                        const allowedRadius = org.returnOfficeRadiusMeters || 200;
                        if (distMeters > allowedRadius) {
                            throw new BadRequestException(`คุณยังอยู่ห่างจากเทศบาล ${Math.round(distMeters)} เมตร (ต้องอยู่ในรัศมี ${allowedRadius} เมตร จึงจะกดนำรถกลับถึงเทศบาลได้)`);
                        }
                    }
                }
            }

            updateData.completedAt = new Date();
            if (!job.patientDroppedOffAt) {
                updateData.patientDroppedOffAt = new Date();
            }

            let totalDistanceKm: number | undefined;

            const trailPoints = await this.prisma.jobLocationLog.findMany({
                where: { jobId },
                orderBy: { recordedAt: 'asc' },
                select: { lat: true, lng: true, leg: true },
            });

            const gpsDistanceKm = sumTrailDistanceKm(trailPoints);
            if (gpsDistanceKm != null) {
                totalDistanceKm = gpsDistanceKm;
                const byLeg = sumTrailDistanceByLeg(trailPoints);
                this.logger.log(
                    `GPS trail distance for job ${jobId}: ${totalDistanceKm.toFixed(2)} km ` +
                        `(${trailPoints.length} points, by leg: ${JSON.stringify(byLeg)})`,
                );
            } else {
                const officeLat = 13.736717;
                const officeLng = 100.523186;
                const pUser = { lat: job.queue.user?.lat, lng: job.queue.user?.lng };
                const pHospital = { lat: job.queue.hospital?.lat, lng: job.queue.hospital?.lng };

                if (pUser.lat && pUser.lng && pHospital.lat && pHospital.lng) {
                    const leg1 = this.pointsService.calculateDistance(officeLat, officeLng, pUser.lat, pUser.lng);
                    const leg2 = this.pointsService.calculateDistance(pUser.lat, pUser.lng, pHospital.lat, pHospital.lng);
                    const leg3 = this.pointsService.calculateDistance(pHospital.lat, pHospital.lng, pUser.lat, pUser.lng);
                    const leg4 = this.pointsService.calculateDistance(pUser.lat, pUser.lng, officeLat, officeLng);

                    totalDistanceKm = leg1 + leg2 + leg3 + leg4;
                    this.logger.debug(
                        `Fallback 4-leg estimate: ${totalDistanceKm.toFixed(2)} km ` +
                            `(Legs: ${leg1.toFixed(1)}, ${leg2.toFixed(1)}, ${leg3.toFixed(1)}, ${leg4.toFixed(1)})`,
                    );
                } else if (location?.lat && location?.lng && job.queue.user?.lat && job.queue.user?.lng) {
                    totalDistanceKm = this.pointsService.calculateDistance(
                        job.queue.user.lat,
                        job.queue.user.lng,
                        location.lat,
                        location.lng,
                    );
                    this.logger.debug(`Fallback simple distance (no hospital): ${totalDistanceKm} km`);
                }
            }

            const pUser = { lat: job.queue.user?.lat, lng: job.queue.user?.lng };
            const pHospital = { lat: job.queue.hospital?.lat, lng: job.queue.hospital?.lng };
            if (totalDistanceKm !== undefined) {
                updateData.distanceKm = totalDistanceKm;
            }

            this.logger.log(`[Mileage Debug] Job ${jobId}: vehicleId=${job.vehicleId}, totalDistanceKm=${totalDistanceKm}, userLat=${pUser.lat}, userLng=${pUser.lng}, hospitalLat=${pHospital.lat}, hospitalLng=${pHospital.lng}`);
            if (job.vehicleId && totalDistanceKm !== undefined) {
                const vehicle = await this.prisma.vehicle.findUnique({ where: { id: job.vehicleId } });
                if (vehicle) {
                    const mileageBefore = vehicle.totalMileageKm;
                    const mileageAfter = mileageBefore + totalDistanceKm;

                    await this.prisma.vehicleMileageLog.create({
                        data: {
                            vehicleId: vehicle.id,
                            jobId: job.id,
                            mileageBefore,
                            mileageAfter,
                        }
                    });

                    await this.prisma.vehicle.update({
                        where: { id: vehicle.id },
                        data: { totalMileageKm: mileageAfter }
                    });
                    this.logger.log(`Mileage Logged: Vehicle ${vehicle.id} (+${totalDistanceKm.toFixed(2)}km)`);
                }
            }

            let duration: number | undefined;
            if (job.acceptedAt) {
                duration = this.pointsService.calculateDuration(
                    job.acceptedAt,
                    new Date()
                );
                this.logger.debug(`Job duration: ${duration} minutes`);
            }

            const earnedPoints = this.pointsService.calculatePoints();
            updateData.earnedPoints = earnedPoints;
            this.logger.log(`Earned points: ${earnedPoints} for Job ${jobId}`);

            if (job.vltId) {
                const volunteer = await this.prisma.user.findUnique({
                    where: { id: job.vltId },
                });
                if (volunteer) {
                    await this.prisma.user.update({
                        where: { id: job.vltId },
                        data: {
                            pointsBalance: (volunteer.pointsBalance || 0) + earnedPoints,
                        },
                    });
                    this.logger.log(`Added ${earnedPoints} points to driver ${job.vltId} (total: ${(volunteer.pointsBalance || 0) + earnedPoints})`);
                }
            }

            if (job.careuId) {
                const careu = await this.prisma.user.findUnique({
                    where: { id: job.careuId },
                });
                if (careu) {
                    await this.prisma.user.update({
                        where: { id: job.careuId },
                        data: {
                            pointsBalance: (careu.pointsBalance || 0) + earnedPoints,
                        },
                    });
                    this.logger.log(`Added ${earnedPoints} points to CareU ${job.careuId} (total: ${(careu.pointsBalance || 0) + earnedPoints})`);
                }
            }
        }

        const updatedJob = await this.prisma.job.update({
            where: { id: jobId },
            data: updateData,
            include: {
                queue: {
                    include: {
                        user: true,
                    },
                },
                vlt: true,
            },
        });

        if (status === 'COMPLETED' || status === 'CANCELLED') {
            await this.prisma.resourceTimeSlot.deleteMany({
                where: { jobId },
            });
        }

        this.logger.log(`Job ${jobId} status updated to ${status}`);

        if (status === 'COMPLETED') {
            await this.notificationService.notifyJobCompleted(jobId);
        } else if (status === 'RETURN_OFFICE') {
            await this.notificationService.notifyFeedbackRequest(jobId);
            await this.notificationService.notifyJobStatusUpdated(jobId, status);
        } else {
            await this.notificationService.notifyJobStatusUpdated(jobId, status);
        }

        return updatedJob;
    }

    async requestReturnPickup(jobId: number, userId: string) {
        this.logger.log(`User ${userId} requesting return pickup for Job ${jobId}`);

        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                queue: { include: { user: true, hospital: true } },
                vlt: true,
            },
        });

        if (!job) {
            throw new NotFoundException('ไม่พบงานที่ระบุ');
        }

        const isPatient = job.queue.userId === userId;
        const isBookedByCaregiver = job.queue.createdBy === userId;
        let isApprovedCaregiver = false;
        if (!isPatient && !isBookedByCaregiver) {
            const link = await this.prisma.caregiverPatient.findFirst({
                where: {
                    caregiverId: userId,
                    patientId: job.queue.userId,
                    status: 'APPROVED',
                },
            });
            isApprovedCaregiver = !!link;
        }

        if (!isPatient && !isBookedByCaregiver && !isApprovedCaregiver) {
            throw new ForbiddenException('คุณไม่มีสิทธิ์เรียกรถสำหรับงานนี้');
        }

        const allowedStatuses = ['AT_HOSPITAL'];
        if (!allowedStatuses.includes(job.status)) {
            throw new BadRequestException('ยังไม่ถึงขั้นที่สามารถเรียกรถกลับได้');
        }

        if (job.returnPickupRequestedAt) {
            throw new BadRequestException('เรียกรถกลับแล้ว กรุณารอคนขับมารับ');
        }

        const updatedJob = await this.prisma.job.update({
            where: { id: jobId },
            data: {
                status: 'AT_HOSPITAL',
                returnPickupRequestedAt: new Date(),
                returnPickupRequestedBy: userId,
            },
            include: {
                queue: { include: { user: true, hospital: true } },
                vlt: true,
                careu: true,
            },
        });

        await this.notificationService.notifyReturnPickupRequested(jobId);

        return updatedJob;
    }

    async confirmHomeDelivery(jobId: number, userId: string, returnEvidenceUrl: string) {
        this.logger.log(`User ${userId} confirming home delivery for Job ${jobId}`);

        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                queue: { include: { user: true } },
            },
        });

        if (!job) {
            throw new NotFoundException('ไม่พบงานที่ระบุ');
        }

        const isDriver = job.vltId === userId;
        if (!isDriver) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });
            if (user?.role !== 'ADMIN') {
                throw new ForbiddenException('เฉพาะคนขับรถเท่านั้นที่สามารถยืนยันส่งถึงบ้านได้');
            }
        }

        if (!['AT_PATIENT_HOME', 'RETURN_HOME'].includes(job.status)) {
            throw new BadRequestException('งานยังไม่ถึงขั้นส่งถึงบ้าน ไม่สามารถยืนยันได้');
        }

        const updatedJob = await this.prisma.job.update({
            where: { id: jobId },
            data: {
                status: 'RETURN_OFFICE',
                returnEvidenceUrl,
                driverDeliveredAt: new Date(),
                patientDroppedOffAt: new Date(),
            },
            include: {
                queue: { include: { user: true } },
                vlt: true,
                careu: true,
            },
        });

        await this.notificationService.notifyFeedbackRequest(jobId);
        await this.notificationService.notifyJobStatusUpdated(jobId, 'RETURN_OFFICE');

        return updatedJob;
    }

    async rateJob(
        jobId: number,
        userId: string,
        driverRatingScore?: number,
        driverComment?: string,
        careuRatingScore?: number,
        careuComment?: string,
    ) {
        this.logger.log(`User ${userId} rating Job ${jobId} (driver: ${driverRatingScore}, careu: ${careuRatingScore})`);

        if (driverRatingScore !== undefined && (driverRatingScore < 1 || driverRatingScore > 5)) {
            throw new BadRequestException('คะแนนคนขับต้องอยู่ระหว่าง 1 ถึง 5');
        }
        if (careuRatingScore !== undefined && (careuRatingScore < 1 || careuRatingScore > 5)) {
            throw new BadRequestException('คะแนน CareU ต้องอยู่ระหว่าง 1 ถึง 5');
        }

        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                queue: true,
            },
        });

        if (!job) {
            throw new NotFoundException('ไม่พบงานที่ระบุ');
        }

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const isOwner = job.queue.userId === userId;

        if (job.queue.createdBy && job.queue.createdBy !== job.queue.userId) {
            if (isOwner) {
                throw new ForbiddenException('คิวนี้จองโดยผู้ดูแล ผู้ดูแลเท่านั้นที่สามารถประเมินได้');
            }
            if (userId !== job.queue.createdBy && user?.role !== 'CAREGIVER') {
                throw new ForbiddenException('คุณไม่มีสิทธิ์ให้คะแนนงานนี้');
            }
        } else {
            if (!isOwner && user?.role !== 'CAREGIVER') {
                throw new ForbiddenException('คุณไม่มีสิทธิ์ให้คะแนนงานนี้');
            }
        }

        if (job.status !== 'COMPLETED' && job.status !== 'RETURN_OFFICE') {
            throw new BadRequestException('งานยังไม่เสร็จสิ้น ไม่สามารถให้คะแนนได้');
        }

        const updateData: any = {};

        if (driverRatingScore !== undefined) {
            updateData.ratingScore = driverRatingScore;
            updateData.ratingComment = driverComment || null;
            this.logger.log(`Driver rating saved: ${driverRatingScore} for Job ${jobId}`);
        }

        if (careuRatingScore !== undefined) {
            updateData.careuRatingScore = careuRatingScore;
            updateData.careuRatingComment = careuComment || null;
            this.logger.log(`CareU rating saved: ${careuRatingScore} for Job ${jobId}`);
        }

        const updatedJob = await this.prisma.job.update({
            where: { id: jobId },
            data: updateData,
            include: {
                vlt: true,
                careu: true,
            },
        });

        this.logger.log(`Job ${jobId} rated successfully`);

        return updatedJob;
    }

    async rateMunicipal(
        jobId: number,
        userId: string,
        data: {
            punctuality: number;
            bookingEase: number;
            vehicleClean: number;
            safety: number;
            staffAttitude: number;
            overallScore: number;
            comment?: string;
        },
    ) {
        this.logger.log(`User ${userId} rating municipal for Job ${jobId}`);

        const scores = [data.punctuality, data.bookingEase, data.vehicleClean, data.safety, data.staffAttitude, data.overallScore];
        for (const score of scores) {
            if (score < 1 || score > 5) {
                throw new BadRequestException('คะแนนต้องอยู่ระหว่าง 1 ถึง 5');
            }
        }

        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                queue: {
                    include: { user: true },
                },
                municipalRating: true,
            },
        });

        if (!job) {
            throw new NotFoundException('ไม่พบงานที่ระบุ');
        }

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const isOwner = job.queue.userId === userId;

        if (job.queue.createdBy && job.queue.createdBy !== job.queue.userId) {
            if (isOwner) {
                throw new ForbiddenException('คิวนี้จองโดยผู้ดูแล ผู้ดูแลเท่านั้นที่สามารถประเมินได้');
            }
            if (userId !== job.queue.createdBy && user?.role !== 'CAREGIVER') {
                throw new ForbiddenException('คุณไม่มีสิทธิ์ประเมินงานนี้');
            }
        } else {
            if (!isOwner && user?.role !== 'CAREGIVER') {
                throw new ForbiddenException('คุณไม่มีสิทธิ์ประเมินงานนี้');
            }
        }

        if (job.status !== 'COMPLETED' && job.status !== 'RETURN_OFFICE') {
            throw new BadRequestException('งานยังไม่เสร็จสิ้น ไม่สามารถประเมินได้');
        }

        if (job.municipalRating) {
            throw new BadRequestException('คุณได้ประเมินเทศบาลสำหรับงานนี้แล้ว');
        }

        const organizationId = job.queue.user?.organizationId;
        if (!organizationId) {
            throw new BadRequestException('ไม่พบข้อมูลเทศบาลสำหรับผู้ใช้นี้');
        }

        const rating = await this.prisma.municipalRating.create({
            data: {
                jobId,
                userId,
                organizationId,
                punctuality: data.punctuality,
                bookingEase: data.bookingEase,
                vehicleClean: data.vehicleClean,
                safety: data.safety,
                staffAttitude: data.staffAttitude,
                overallScore: data.overallScore,
                comment: data.comment || null,
            },
        });

        this.logger.log(`Municipal rating saved for Job ${jobId} (overall: ${data.overallScore})`);

        return rating;
    }

    private calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371e3;
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }
}
