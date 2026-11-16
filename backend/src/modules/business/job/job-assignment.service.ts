import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { NotificationService } from '@/modules/system/notification/notification.service';

@Injectable()
export class JobAssignmentService {
    private readonly logger = new Logger(JobAssignmentService.name);

    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService,
    ) { }

    private buildBookingDate(date: Date) {
        const bookingDate = new Date(date);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate;
    }

    async getBusyResources(
        date: string,
        bookingTime: string,
        orgId?: string | null,
        hospitalId?: number | null,
        excludeJobId?: number | null,
    ) {
        const bookingDate = new Date(date);
        bookingDate.setHours(0, 0, 0, 0);

        const activeJobs = await this.prisma.job.findMany({
            where: {
                status: {
                    in: ['OPEN', 'ASSIGNED', 'ACCEPTED', 'PICKING_UP', 'IN_TRANSIT', 'AT_HOSPITAL', 'AT_PATIENT_HOME', 'RETURN_HOME', 'RETURN_OFFICE'],
                },
                queue: {
                    requestDate: bookingDate,
                    bookingTime: bookingTime,
                    status: {
                        notIn: ['CANCELLED_BY_USER', 'CANCELLED_BY_MUNICIPAL', 'REJECTED'],
                    },
                    ...(orgId ? { user: { organizationId: orgId } } : {}),
                },
                ...(excludeJobId ? { id: { not: excludeJobId } } : {}),
            },
            include: {
                queue: true,
                vehicle: true,
            },
        });

        const busyVehicleIds = new Set<number>();
        const busyDriverIds = new Set<string>();
        const busyCareuIds = new Set<string>();
        const vehiclePassengerCounts = new Map<number, number>();

        for (const job of activeJobs) {
            const jobHospitalId = job.queue?.hospitalId;
            const isDifferentHospital = Boolean(hospitalId && jobHospitalId && jobHospitalId !== hospitalId);

            if (job.careuId) {
                busyCareuIds.add(job.careuId);
            }

            if (job.vltId) {
                if (isDifferentHospital) {
                    busyDriverIds.add(job.vltId);
                } else if (job.vehicleId) {
                    const needed = 1 + (job.queue?.wantCareU ? 1 : 0);
                    const currentCount = (vehiclePassengerCounts.get(job.vehicleId) || 0) + needed;
                    const cap = job.vehicle?.capacity ?? 4;
                    if (currentCount >= cap) {
                        busyDriverIds.add(job.vltId);
                    }
                }
            }

            if (job.vehicleId) {
                if (isDifferentHospital) {
                    busyVehicleIds.add(job.vehicleId);
                } else {
                    const needed = 1 + (job.queue?.wantCareU ? 1 : 0);
                    const currentCount = (vehiclePassengerCounts.get(job.vehicleId) || 0) + needed;
                    vehiclePassengerCounts.set(job.vehicleId, currentCount);
                    const cap = job.vehicle?.capacity ?? 4;
                    if (currentCount >= cap) {
                        busyVehicleIds.add(job.vehicleId);
                    }
                }
            }
        }

        return {
            busyVehicleIds: Array.from(busyVehicleIds),
            busyDriverIds: Array.from(busyDriverIds),
            busyCareuIds: Array.from(busyCareuIds),
        };
    }

    private async validateResourceAvailability(params: {
        bookingDate: Date;
        bookingTime: string;
        hospitalId?: number | null;
        wantCareU?: boolean;
        vehicleId?: number | null;
        vltId?: string | null;
        careuId?: string | null;
        excludeJobId?: number;
    }) {
        const { bookingDate, bookingTime, hospitalId, wantCareU, vehicleId, vltId, careuId, excludeJobId } = params;

        const conflictingJobs = await this.prisma.job.findMany({
            where: {
                status: {
                    in: ['OPEN', 'ASSIGNED', 'ACCEPTED', 'PICKING_UP', 'IN_TRANSIT', 'AT_HOSPITAL', 'AT_PATIENT_HOME', 'RETURN_HOME', 'RETURN_OFFICE'],
                },
                queue: {
                    requestDate: bookingDate,
                    bookingTime: bookingTime,
                    status: {
                        notIn: ['CANCELLED_BY_USER', 'CANCELLED_BY_MUNICIPAL', 'REJECTED'],
                    },
                },
                ...(excludeJobId ? { id: { not: excludeJobId } } : {}),
            },
            include: {
                queue: true,
                vehicle: true,
            },
        });

        if (vehicleId) {
            const vehicle = await this.prisma.vehicle.findUnique({
                where: { id: vehicleId },
                select: { id: true, capacity: true, licensePlate: true },
            });
            if (!vehicle) throw new NotFoundException('ไม่พบข้อมูลยานพาหนะ');

            const vehicleJobs = conflictingJobs.filter(j => j.vehicleId === vehicleId);

            const diffHospitalJob = vehicleJobs.find(j => hospitalId && j.queue?.hospitalId && j.queue.hospitalId !== hospitalId);
            if (diffHospitalJob) {
                throw new BadRequestException(
                    `ไม่สามารถเลือกรถทะเบียน ${vehicle.licensePlate} ได้ เนื่องจากมีภารกิจไปโรงพยาบาลอื่นในรอบเวลาเดียวกันแล้ว`
                );
            }

            const currentTripCount = vehicleJobs.reduce((acc, j) => acc + 1 + (j.queue?.wantCareU ? 1 : 0), 0);
            const neededSeats = 1 + (wantCareU ? 1 : 0);
            const capacity = vehicle.capacity ?? 4;
            if (currentTripCount + neededSeats > capacity) {
                throw new BadRequestException(
                    `ไม่สามารถเลือกรถทะเบียน ${vehicle.licensePlate} ได้ เนื่องจากที่นั่งเต็มแล้ว (${currentTripCount}/${capacity} ที่นั่ง) ในรอบเวลาที่เลือก`
                );
            }
        }

        if (vltId) {
            const driverJobs = conflictingJobs.filter(j => j.vltId === vltId);

            const diffHospitalJob = driverJobs.find(j => hospitalId && j.queue?.hospitalId && j.queue.hospitalId !== hospitalId);
            if (diffHospitalJob) {
                throw new BadRequestException(
                    'ไม่สามารถเลือกเจ้าหน้าที่ขับรถนี้ได้ เนื่องจากมีภารกิจไปโรงพยาบาลอื่นในรอบเวลาเดียวกันแล้ว'
                );
            }

            if (vehicleId && driverJobs.some(j => j.vehicleId && j.vehicleId !== vehicleId)) {
                throw new BadRequestException(
                    'ไม่สามารถเลือกเจ้าหน้าที่ขับรถนี้ได้ เนื่องจากได้รับมอบหมายขับรถคันอื่นในรอบเวลาเดียวกันแล้ว'
                );
            }
        }

        if (careuId) {
            const careuJobs = conflictingJobs.filter(j => j.careuId === careuId);

            if (careuJobs.length > 0) {
                const diffHospital = careuJobs.find(j => hospitalId && j.queue?.hospitalId && j.queue.hospitalId !== hospitalId);
                if (diffHospital) {
                    throw new BadRequestException(
                        'ไม่สามารถเลือกจิตอาสาแคร์ยูนี้ได้ เนื่องจากมีภารกิจไปโรงพยาบาลอื่นในรอบเวลาเดียวกันแล้ว'
                    );
                }
                throw new BadRequestException(
                    'ไม่สามารถเลือกจิตอาสาแคร์ยูนี้ได้ เนื่องจากได้รับมอบหมายดูแลผู้ป่วยท่านอื่นในรอบเวลาเดียวกันแล้ว'
                );
            }
        }
    }

    private async syncResourceTimeSlots(params: {
        jobId: number;
        queueId: number;
        bookingDate: Date;
        bookingTime: string;
        organizationId?: string | null;
        vltId?: string | null;
        vehicleId?: number | null;
        careuId?: string | null;
    }) {
        const entries: Array<{ resourceType: 'VEHICLE' | 'DRIVER' | 'CAREU'; resourceId: string }> = [];

        if (params.vehicleId) {
            entries.push({ resourceType: 'VEHICLE', resourceId: String(params.vehicleId) });
        }
        if (params.vltId) {
            entries.push({ resourceType: 'DRIVER', resourceId: params.vltId });
        }
        if (params.careuId) {
            entries.push({ resourceType: 'CAREU', resourceId: params.careuId });
        }

        await this.prisma.resourceTimeSlot.deleteMany({
            where: { jobId: params.jobId },
        });

        if (entries.length === 0) return;

        await this.prisma.resourceTimeSlot.createMany({
            data: entries.map(entry => ({
                resourceType: entry.resourceType,
                resourceId: entry.resourceId,
                bookingDate: params.bookingDate,
                bookingTime: params.bookingTime,
                jobId: params.jobId,
                queueId: params.queueId,
                organizationId: params.organizationId ?? null,
            })),
        });
    }

    async assignJobToVolunteer(jobId: number, vltId: string, assignedBy: string, vehicleId?: number, careuId?: string) {
        this.logger.log(`Staff ${assignedBy} assigning Job ${jobId} to Volunteer ${vltId} (Vehicle: ${vehicleId || 'none'}) (CareU: ${careuId || 'none'})`);

        const volunteer = await this.prisma.user.findUnique({
            where: { id: vltId },
        });

        if (!volunteer) {
            throw new NotFoundException('ไม่พบข้อมูลจิตอาสา(คนขับ)ที่ระบุ');
        }

        if (volunteer.role !== 'DRIVE') {
            throw new BadRequestException('ผู้ใช้ที่ระบุไม่ใช่เจ้าหน้าที่รถ');
        }

        if (careuId) {
            const careuVolunteer = await this.prisma.user.findUnique({
                where: { id: careuId }
            });
            if (!careuVolunteer) {
                throw new NotFoundException('ไม่พบข้อมูลจิตอาสาแคร์ยู(CareU)ที่ระบุ');
            }
            if (careuVolunteer.role !== 'CAREU') {
                throw new BadRequestException('ผู้ใช้ที่ระบุไม่ใช่จิตอาสาแคร์ยู');
            }
        }

        if (vehicleId) {
            const vehicle = await this.prisma.vehicle.findUnique({
                where: { id: vehicleId },
            });
            if (!vehicle) {
                throw new NotFoundException('ไม่พบข้อมูลยานพาหนะที่ระบุ');
            }
            if (!vehicle.isActive) {
                throw new BadRequestException('ยานพาหนะนี้ไม่พร้อมใช้งาน');
            }
        }

        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                queue: {
                    select: {
                        id: true,
                        status: true,
                        requestDate: true,
                        bookingTime: true,
                        hospitalId: true,
                        wantCareU: true,
                        user: { select: { organizationId: true } },
                    },
                },
            },
        });

        if (!job) {
            throw new NotFoundException('ไม่พบงานที่ระบุ');
        }

        if (job.status !== 'OPEN') {
            throw new BadRequestException('งานนี้ไม่พร้อมรับมอบหมาย');
        }

        if (job.queue.status !== 'CONFIRMED') {
            const message = job.queue.status === 'PENDING_EXECUTIVE'
                ? 'ไม่สามารถมอบหมายงานได้เนื่องจากงานยังรอผู้บริหารอนุมัติ'
                : `ไม่สามารถมอบหมายงานได้เนื่องจากประชาชนยังไม่ได้ยืนยันนัดหมาย (สถานะปัจจุบัน: ${job.queue.status})`;
            throw new BadRequestException(message);
        }

        if (job.queue.bookingTime) {
            await this.validateResourceAvailability({
                bookingDate: this.buildBookingDate(job.queue.requestDate),
                bookingTime: job.queue.bookingTime,
                hospitalId: job.queue.hospitalId,
                wantCareU: job.queue.wantCareU,
                vehicleId: vehicleId ?? null,
                vltId,
                careuId: careuId ?? null,
            });
        }

        const updatedJob = await this.prisma.job.update({
            where: { id: jobId },
            data: {
                vltId,
                careuId: careuId || null,
                vehicleId: vehicleId || null,
                status: 'ASSIGNED',
            },
            include: {
                queue: {
                    include: {
                        user: true,
                    },
                },
                vlt: true,
                careu: true,
            },
        });

        if (job.queue?.bookingTime) {
            await this.syncResourceTimeSlots({
                jobId: updatedJob.id,
                queueId: job.queue.id,
                bookingDate: this.buildBookingDate(job.queue.requestDate),
                bookingTime: job.queue.bookingTime,
                organizationId: job.queue.user?.organizationId,
                vltId,
                vehicleId: vehicleId ?? null,
                careuId: careuId ?? null,
            });
        }

        this.logger.log(`Job ${jobId} assigned to ${volunteer.firstName} ${volunteer.lastName} (${vltId})`);

        if (updatedJob.queue.status === 'CONFIRMED') {
            await this.notificationService.notifyVolunteerAssigned(jobId);
        }

        return updatedJob;
    }

    async reassignJob(jobId: number, vltId: string, assignedBy: string, vehicleId?: number, careuId?: string) {
        this.logger.log(`Staff ${assignedBy} RE-assigning Job ${jobId} to Volunteer ${vltId} (Vehicle: ${vehicleId || 'none'}) (CareU: ${careuId || 'none'})`);

        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                queue: {
                    select: {
                        id: true,
                        status: true,
                        requestDate: true,
                        bookingTime: true,
                        hospitalId: true,
                        wantCareU: true,
                        user: { select: { organizationId: true } },
                    },
                },
            },
        });

        if (!job) {
            throw new NotFoundException('ไม่พบงานที่ระบุ');
        }

        if (!['ASSIGNED', 'ACCEPTED'].includes(job.status)) {
            throw new BadRequestException(`ไม่สามารถแก้ไขการมอบหมายได้ เนื่องจากสถานะงานคือ "${job.status}" — ต้องเป็น ASSIGNED หรือ ACCEPTED เท่านั้น`);
        }

        if (job.queue?.bookingTime) {
            await this.validateResourceAvailability({
                bookingDate: this.buildBookingDate(job.queue.requestDate),
                bookingTime: job.queue.bookingTime,
                hospitalId: job.queue.hospitalId,
                wantCareU: job.queue.wantCareU,
                vehicleId: vehicleId ?? null,
                vltId,
                careuId: careuId ?? null,
                excludeJobId: jobId,
            });
        }

        const volunteer = await this.prisma.user.findUnique({
            where: { id: vltId },
        });
        if (!volunteer) {
            throw new NotFoundException('ไม่พบข้อมูลจิตอาสา(คนขับ)ที่ระบุ');
        }
        if (volunteer.role !== 'DRIVE') {
            throw new BadRequestException('ผู้ใช้ที่ระบุไม่ใช่เจ้าหน้าที่รถ');
        }

        if (careuId) {
            const careuVolunteer = await this.prisma.user.findUnique({
                where: { id: careuId }
            });
            if (!careuVolunteer) {
                throw new NotFoundException('ไม่พบข้อมูลจิตอาสาแคร์ยู(CareU)ที่ระบุ');
            }
            if (careuVolunteer.role !== 'CAREU') {
                throw new BadRequestException('ผู้ใช้ที่ระบุไม่ใช่จิตอาสาแคร์ยู');
            }
        }

        if (vehicleId) {
            const vehicle = await this.prisma.vehicle.findUnique({
                where: { id: vehicleId },
            });
            if (!vehicle) {
                throw new NotFoundException('ไม่พบข้อมูลยานพาหนะที่ระบุ');
            }
            if (!vehicle.isActive) {
                throw new BadRequestException('ยานพาหนะนี้ไม่พร้อมใช้งาน');
            }
        }

        const updatedJob = await this.prisma.job.update({
            where: { id: jobId },
            data: {
                vltId,
                careuId: careuId || null,
                vehicleId: vehicleId || null,
            },
            include: {
                queue: {
                    include: {
                        user: true,
                    },
                },
                vlt: true,
                careu: true,
            },
        });

        if (job.queue?.bookingTime) {
            await this.syncResourceTimeSlots({
                jobId: updatedJob.id,
                queueId: job.queue.id,
                bookingDate: this.buildBookingDate(job.queue.requestDate),
                bookingTime: job.queue.bookingTime,
                organizationId: job.queue.user?.organizationId,
                vltId,
                vehicleId: vehicleId ?? null,
                careuId: careuId ?? null,
            });
        }

        this.logger.log(`Job ${jobId} RE-assigned to ${volunteer.firstName} ${volunteer.lastName} (${vltId})`);

        await this.notificationService.notifyVolunteerAssigned(jobId);

        return updatedJob;
    }

    async acceptJobByVolunteer(jobId: number, vltId: string, lat?: number, lng?: number) {
        this.logger.log(`Volunteer ${vltId} accepting Job ${jobId}`);

        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                queue: true,
            },
        });

        if (!job) {
            throw new NotFoundException('ไม่พบงานที่ระบุ');
        }

        if (job.vltId !== vltId && job.careuId !== vltId) {
            throw new ForbiddenException('งานนี้ไม่ได้มอบหมายให้คุณ');
        }

        if (job.queue?.requestDate) {
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

        if (job.status !== 'ASSIGNED') {
            if (job.status === 'ACCEPTED') {
                const existingJob = await this.prisma.job.findUnique({
                    where: { id: jobId },
                    include: {
                        queue: {
                            include: {
                                user: true,
                            },
                        },
                        vlt: true,
                        careu: true,
                    },
                });
                if (existingJob) {
                    return existingJob;
                }
            }

            throw new BadRequestException('ไม่สามารถรับงานนี้ได้ เนื่องจากสถานะงานไม่อนุญาต');
        }

        const updatedJob = await this.prisma.job.update({
            where: { id: jobId },
            data: {
                status: 'ACCEPTED',
                acceptedAt: new Date(),
                startedAt: new Date(),
                startLat: lat,
                startLng: lng,
            },
            include: {
                queue: {
                    include: {
                        user: true,
                    },
                },
                vlt: true,
                careu: true,
            },
        });

        if (lat && lng) {
            await this.prisma.user.update({
                where: { id: vltId },
                data: { lat, lng }
            });
        }

        this.logger.log(`Job ${jobId} accepted by volunteer ${vltId}`);

        await this.notificationService.notifyJobAccepted(jobId);

        return updatedJob;
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

    async rejectJobByVolunteer(jobId: number, vltId: string, reason?: string) {
        this.logger.warn(`Volunteer ${vltId} cancelling/rejecting Job ${jobId}: ${reason || 'No reason'}`);

        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                queue: {
                    include: {
                        user: {
                            include: {
                                organization: true,
                            },
                        },
                    },
                },
            },
        });

        if (!job) {
            throw new NotFoundException('ไม่พบงานที่ระบุ');
        }

        if (job.vltId !== vltId && job.careuId !== vltId) {
            throw new ForbiddenException('งานนี้ไม่ได้มอบหมายให้คุณ');
        }

        if (!['ASSIGNED', 'ACCEPTED', 'PICKING_UP'].includes(job.status)) {
            throw new BadRequestException('ไม่สามารถยกเลิกงานนี้ได้ เนื่องจากสถานะงานไม่อนุญาต');
        }

        const isDriver = job.vltId === vltId;
        const isCareU = job.careuId === vltId;
        const roleLabel = isDriver ? 'เจ้าหน้าที่ขับรถ' : 'จิตอาสาแคร์ยู';

        const org = job.queue?.user?.organization;
        if (org) {
            if (org.allowVolunteerCancelJob === false) {
                throw new BadRequestException(`เทศบาลไม่อนุญาตให้${roleLabel}ยกเลิกงานด้วยตนเอง กรุณาติดต่อเจ้าหน้าที่เทศบาล`);
            }

            const unit = org.volunteerCancelUnit || (org.minVolunteerCancelHoursBefore >= 24 && org.minVolunteerCancelHoursBefore % 24 === 0 ? 'DAYS' : 'HOURS');
            const value = typeof org.volunteerCancelValue === 'number'
                ? org.volunteerCancelValue
                : (unit === 'DAYS' ? Math.max(1, Math.round((org.minVolunteerCancelHoursBefore || 24) / 24)) : (org.minVolunteerCancelHoursBefore || 24));

            if (job.queue?.requestDate) {
                if (unit === 'DAYS' && value > 0) {
                    const now = new Date();
                    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                    const reqDate = new Date(job.queue.requestDate);
                    const reqDateStr = `${reqDate.getUTCFullYear()}-${String(reqDate.getUTCMonth() + 1).padStart(2, '0')}-${String(reqDate.getUTCDate()).padStart(2, '0')}`;

                    const todayDate = new Date(todayStr);
                    const jobDate = new Date(reqDateStr);
                    const diffDays = Math.round((jobDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

                    if (diffDays < value) {
                        const timeText = value === 1 ? '1 วันก่อนวันเริ่มงาน (ต้องยกเลิกก่อนถึงวันเริ่มงาน)' : `${value} วันก่อนวันเริ่มงาน`;
                        throw new BadRequestException(`ไม่สามารถยกเลิกงานได้ เนื่องจากต้องยกเลิกล่วงหน้าอย่างน้อย ${timeText}`);
                    }
                } else if (unit === 'HOURS' && value > 0) {
                    const appointmentDateTime = this.getAppointmentStartDateTime(job.queue.requestDate, job.queue.bookingTime);
                    const now = new Date();
                    const diffHours = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

                    if (diffHours < value) {
                        throw new BadRequestException(`ไม่สามารถยกเลิกงานได้ เนื่องจากต้องยกเลิกล่วงหน้าอย่างน้อย ${value} ชั่วโมงก่อนเวลานัดหมาย`);
                    }
                }
            }
        }

        const updateData: any = {};
        if (isDriver) {
            updateData.vlt = { disconnect: true };
            updateData.vehicle = { disconnect: true };
            updateData.status = 'OPEN';
            updateData.acceptedAt = null;
            updateData.startedAt = null;
            updateData.startLat = null;
            updateData.startLng = null;

            await this.prisma.resourceTimeSlot.deleteMany({
                where: {
                    jobId,
                    resourceType: { in: ['DRIVER', 'VEHICLE'] },
                },
            });
        } else if (isCareU) {
            updateData.careu = { disconnect: true };
            updateData.status = 'OPEN';
            await this.prisma.resourceTimeSlot.deleteMany({
                where: { jobId, resourceType: 'CAREU' },
            });
        }

        const volunteerUser = await this.prisma.user.findUnique({
            where: { id: vltId },
            select: { firstName: true, lastName: true, phone: true }
        });
        const volunteerName = volunteerUser
            ? `${volunteerUser.firstName} ${volunteerUser.lastName || ''}`.trim()
            : (isDriver ? 'คนขับ' : 'แคร์ยู');
        const rejectMsg = `${roleLabel} (${volunteerName}) ขอยกเลิก: ${reason || 'ไม่ระบุเหตุผล'}`;

        if (job.queueId) {
            await this.prisma.queue.update({
                where: { id: job.queueId },
                data: { rejectReason: rejectMsg },
            }).catch(() => {});
        }

        await this.prisma.activityLog.create({
            data: {
                userId: vltId,
                action: isDriver ? 'DRIVER_CANCELLED_JOB' : 'CAREU_CANCELLED_JOB',
                category: 'JOB',
                entityId: String(jobId),
                entityType: 'Job',
                note: rejectMsg,
            },
        }).catch(() => {});

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
                careu: true,
            },
        });

        this.logger.warn(`Job ${jobId} cancelled by volunteer ${vltId}, status set to ${updatedJob.status}`);

        await this.notificationService.notifyJobRejectedByVolunteer(jobId, vltId, reason);

        return updatedJob;
    }
}
