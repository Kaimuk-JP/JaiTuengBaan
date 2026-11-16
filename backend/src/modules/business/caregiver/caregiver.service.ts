import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { NotificationService } from '@/modules/system/notification/notification.service';
import { CreateCaregiverPatientDto, RegisterElderlyDto, StaffRegisterCaregiverDto } from './dto';

@Injectable()
export class CaregiverService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService,
    ) { }

    async searchPatients(query: string) {
        if (!query || query.length < 2) {
            return [];
        }

        const patients = await this.prisma.user.findMany({
            where: {
                role: 'USERS',
                OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                idCard: true,
            },
            take: 10,
        });

        return patients.map(patient => ({
            id: patient.id.toString(),
            fullName: patient.firstName && patient.lastName
                ? `${patient.firstName} ${patient.lastName}`
                : (patient.firstName || patient.lastName || 'ไม่ระบุชื่อ'),
            lastFourDigits: patient.idCard ? patient.idCard.slice(-4) : '****',
        }));
    }

    async addPatient(caregiverId: string, dto: CreateCaregiverPatientDto) {
        const patient = await this.prisma.user.findUnique({
            where: { id: dto.patientId },
        });

        if (!patient) {
            throw new NotFoundException('ไม่พบประชาชนที่ต้องการเพิ่ม');
        }

        if (patient.role !== 'USERS') {
            throw new ForbiddenException('สามารถเพิ่มเฉพาะผู้ใช้บริการเท่านั้น');
        }

        if (caregiverId === dto.patientId) {
            throw new ForbiddenException('ไม่สามารถเพิ่มตัวเองเป็นประชาชนได้');
        }

        const existing = await this.prisma.caregiverPatient.findUnique({
            where: {
                caregiverId_patientId: {
                    caregiverId,
                    patientId: dto.patientId,
                },
            },
        });

        if (existing) {
            if (existing.status === 'REJECTED') {
                const updated = await this.prisma.caregiverPatient.update({
                    where: { id: existing.id },
                    data: {
                        relationship: dto.relationship,
                        additionalDetails: dto.additionalDetails,
                        documentUrl: dto.documentUrl,
                        status: 'PENDING',
                        rejectReason: null,
                        reviewedBy: null,
                        reviewedAt: null,
                    },
                    include: {
                        patient: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                pictureUrl: true,
                            },
                        },
                    },
                });

                await this.notificationService.notifyCaregiverRequestSubmitted(updated.id);

                return {
                    message: 'ส่งคำร้องใหม่สำเร็จ รอการอนุมัติจากเจ้าหน้าที่',
                    data: updated,
                };
            }
            throw new ConflictException('ประชาชนนี้อยู่ในรายชื่อที่ดูแลอยู่แล้ว หรือมีคำร้องที่รอตรวจสอบ');
        }

        const caregiverPatient = await this.prisma.caregiverPatient.create({
            data: {
                caregiverId,
                patientId: dto.patientId,
                relationship: dto.relationship,
                additionalDetails: dto.additionalDetails,
                documentUrl: dto.documentUrl,
                status: 'PENDING',
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        pictureUrl: true,
                    },
                },
            },
        });

        await this.notificationService.notifyCaregiverRequestSubmitted(caregiverPatient.id);

        return {
            message: 'เพิ่มประชาชนสำเร็จ รอการอนุมัติจากเจ้าหน้าที่',
            data: caregiverPatient,
        };
    }

    async getMyPatients(caregiverId: string, page?: number, limit?: number) {
        const skip = page && limit ? (page - 1) * limit : undefined;
        const take = limit;

        const [patients, total] = await Promise.all([
            this.prisma.caregiverPatient.findMany({
                where: {
                    caregiverId,
                },
                include: {
                    patient: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            pictureUrl: true,
                            phone: true,
                            mobilityStatus: true,
                            organization: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take,
            }),
            this.prisma.caregiverPatient.count({
                where: { caregiverId },
            }),
        ]);

        const data = patients.map(cp => ({
            id: cp.id,
            patientId: cp.patient.id,
            patientName: cp.patient.firstName && cp.patient.lastName
                ? `${cp.patient.firstName} ${cp.patient.lastName}`
                : (cp.patient.firstName || cp.patient.lastName),
            patientPictureUrl: cp.patient.pictureUrl,
            patientPhone: cp.patient.phone,
            mobilityStatus: cp.patient.mobilityStatus,
            relationship: cp.relationship,
            status: cp.status,
            createdAt: cp.createdAt,
            organizationName: cp.patient.organization?.name || null,
        }));

        return {
            data,
            pagination: {
                total,
                page: page || 1,
                limit: limit || total,
                totalPages: limit ? Math.ceil(total / limit) : 1,
            },
        };
    }

    async getPatientBookings(caregiverId: string) {
        const approvedPatients = await this.prisma.caregiverPatient.findMany({
            where: {
                caregiverId,
                status: 'APPROVED',
            },
            select: {
                patientId: true,
                relationship: true,
                patient: {
                    select: {
                        firstName: true,
                        lastName: true,
                        pictureUrl: true,
                        phone: true,
                        mobilityStatus: true,
                    },
                },
            },
        });

        const patientIds = approvedPatients.map(p => p.patientId);

        const allUserIds = [...new Set([caregiverId, ...patientIds])];

        const queues = await this.prisma.queue.findMany({
            where: {
                OR: [
                    { userId: { in: allUserIds } },
                    { createdBy: caregiverId },
                ],
            },
            include: {
                hospital: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        pictureUrl: true,
                        phone: true,
                        mobilityStatus: true,
                    },
                },
                job: {
                    include: {
                        vlt: {
                            select: {
                                firstName: true,
                                lastName: true,
                                phone: true,
                                pictureUrl: true,
                            },
                        },
                        careu: {
                            select: {
                                firstName: true,
                                lastName: true,
                                phone: true,
                                pictureUrl: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                requestDate: 'desc',
            },
        });

        const relationshipMap = new Map(
            approvedPatients.map(p => [p.patientId, p.relationship])
        );

        return queues.map(queue => {
            const dateKey = this.toBangkokDateKey(queue.requestDate);
            const isSelf = queue.userId === caregiverId;
            const bookedOnBehalf = queue.createdBy === caregiverId && !isSelf;
            const relationship = isSelf
                ? 'ตัวเอง'
                : (relationshipMap.get(queue.userId) || (bookedOnBehalf ? 'จองแทน' : undefined));
            return {
            id: queue.id.toString(),
            userId: queue.userId,
            patientName: queue.user.firstName && queue.user.lastName
                ? `${queue.user.firstName} ${queue.user.lastName}`
                : (queue.user.firstName || queue.user.lastName),
            patientPhone: queue.user.phone,
            patientPictureUrl: queue.user.pictureUrl,
            patientRelationship: relationship,
            bookedOnBehalf,
            requestDate: dateKey,
            bookingDate: dateKey,
            bookingTime: queue.bookingTime || '09:00',
            status: queue.job ? queue.job.status : this.mapQueueStatusToBookingStatus(queue.status),
            rawStatus: queue.job ? queue.job.status : queue.status,
            hasAppointment: queue.hasAppointment,
            mobilityStatus: queue.user.mobilityStatus || 'WALKING',
            bookingType: queue.hasAppointment ? 'มีใบนัด' : 'ไม่มีใบนัด',
            hospitalName: queue.hospital?.name || 'โรงพยาบาล',
            hospital: queue.hospital ? { name: queue.hospital.name } : undefined,
            user: {
                firstName: queue.user.firstName,
                lastName: queue.user.lastName,
                pictureUrl: queue.user.pictureUrl,
                mobilityStatus: queue.user.mobilityStatus || 'WALKING',
            },
            job: queue.job ? {
                id: queue.job.id,
                status: queue.job.status,
                returnPickupRequestedAt: queue.job.returnPickupRequestedAt,
                returnEvidenceUrl: queue.job.returnEvidenceUrl,
                vlt: queue.job.vlt,
                careu: queue.job.careu,
            } : undefined,
            requiredEquipment: queue.requiredEquipment ? queue.requiredEquipment.split(',') : [],
            appointmentImage: queue.appointmentImage,
            returnEvidenceUrl: queue.job?.returnEvidenceUrl,
            wantCareU: queue.wantCareU,
            adminNote: queue.adminNote,
            volunteer: queue.job?.vlt ? {
                name: queue.job.vlt.firstName && queue.job.vlt.lastName
                    ? `${queue.job.vlt.firstName} ${queue.job.vlt.lastName}`
                    : (queue.job.vlt.firstName || queue.job.vlt.lastName),
                role: 'จิตอาสา',
                phone: queue.job.vlt.phone,
                pictureUrl: queue.job.vlt.pictureUrl,
            } : undefined,
            careUVolunteer: queue.job?.careu ? {
                name: queue.job.careu.firstName && queue.job.careu.lastName
                    ? `${queue.job.careu.firstName} ${queue.job.careu.lastName}`
                    : (queue.job.careu.firstName || queue.job.careu.lastName),
                phone: queue.job.careu.phone,
                pictureUrl: queue.job.careu.pictureUrl,
            } : undefined,
        };
        });
    }

    private toBangkokDateKey(date: Date): string {
        return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
    }

    private mapQueueStatusToBookingStatus(status: string): string {
        const statusMap: Record<string, string> = {
            'PENDING_MUNICIPAL': 'PENDING',
            'APPROVED': 'AI_MATCHING',
            'CONFIRMED': 'ACCEPTED',
            'REJECTED': 'CANCELLED',
            'CANCELLED_BY_USER': 'CANCELLED',
        };
        return statusMap[status] || 'PENDING';
    }


    async getAllRequests(status?: string, organizationId?: string, page?: number, limit?: number, startDate?: string, endDate?: string) {
        const skip = page && limit ? (page - 1) * limit : undefined;
        const take = limit;

        const where: any = {};
        if (status) {
            where.status = status;
        }
        if (organizationId) {
            where.patient = {
                organizationId
            };
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                where.createdAt.gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        const [requests, total] = await Promise.all([
            this.prisma.caregiverPatient.findMany({
                where,
                include: {
                    caregiver: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            pictureUrl: true,
                            idCard: true,
                        },
                    },
                    patient: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            pictureUrl: true,
                            mobilityStatus: true,
                            idCard: true,
                            gender: true,
                            birthDate: true,
                            villageName: true,
                            subdistrictName: true,
                            districtName: true,
                            provinceName: true,
                            addressDetail: true,
                            diseases: {
                                include: {
                                    disease: true
                                }
                            },
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
                skip,
                take,
            }),
            this.prisma.caregiverPatient.count({ where }),
        ]);

        return {
            data: requests,
            pagination: {
                total,
                page: page || 1,
                limit: limit || total,
                totalPages: limit ? Math.ceil(total / limit) : 1,
            },
        };
    }

    async approveRequest(requestId: number, staffId: string) {
        const request = await this.prisma.caregiverPatient.findUnique({
            where: { id: requestId },
        });

        if (!request) {
            throw new NotFoundException('ไม่พบคำร้อง');
        }

        if (request.status !== 'PENDING') {
            throw new ForbiddenException('คำร้องนี้ได้รับการตรวจสอบแล้ว');
        }

        const updated = await this.prisma.caregiverPatient.update({
            where: { id: requestId },
            data: {
                status: 'APPROVED',
                reviewedBy: staffId,
                reviewedAt: new Date(),
            },
            include: {
                caregiver: { select: { firstName: true, lastName: true } },
                patient: { select: { firstName: true, lastName: true } },
            },
        });

        await this.notificationService.notifyCaregiverRequestApproved(requestId);

        return {
            message: 'อนุมัติคำร้องสำเร็จ',
            data: updated,
        };
    }

    async rejectRequest(requestId: number, staffId: string, rejectReason: string) {
        const request = await this.prisma.caregiverPatient.findUnique({
            where: { id: requestId },
            include: {
                caregiver: { select: { id: true, firstName: true, lastName: true } },
                patient: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        if (!request) {
            throw new NotFoundException('ไม่พบคำร้อง');
        }

        if (request.status !== 'PENDING') {
            throw new ForbiddenException('คำร้องนี้ได้รับการตรวจสอบแล้ว');
        }

        await this.notificationService.notifyCaregiverRequestRejected(requestId, rejectReason);

        const updated = await this.prisma.caregiverPatient.update({
            where: { id: requestId },
            data: {
                status: 'REJECTED',
                rejectReason: rejectReason,
                reviewedBy: staffId,
                reviewedAt: new Date(),
            },
        });

        return {
            message: 'ปฏิเสธคำร้องเรียบร้อย ผู้ดูแลประชาชนสามารถส่งคำร้องใหม่ได้',
            data: updated,
        };
    }

    async registerElderly(caregiverId: string, dto: RegisterElderlyDto) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                idCard: dto.idCard,
            },
        });

        if (existingUser) {
            throw new ConflictException('ประชาชนที่มีเลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว');
        }

        const existingPhone = await this.prisma.user.findFirst({
            where: {
                phone: dto.phone,
            },
        });

        if (existingPhone) {
            throw new ConflictException('เบอร์โทรศัพท์นี้มีอยู่ในระบบแล้ว');
        }

        const result = await this.prisma.$transaction(async (tx) => {
            if (dto.organizationId && dto.organizationName) {
                await tx.organization.upsert({
                    where: { id: dto.organizationId },
                    update: { name: dto.organizationName },
                    create: {
                        id: dto.organizationId,
                        name: dto.organizationName,
                    },
                });
            }

            const newElderly = await tx.user.create({
                data: {
                    iamUserId: `pending_${dto.idCard}`,
                    role: 'USERS',
                    idCard: dto.idCard,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    gender: dto.gender,
                    phone: dto.phone,
                    mobilityStatus: dto.mobilityStatus,
                    customDiseases: dto.customDiseases,
                    diseases: dto.diseaseIds ? {
                        create: dto.diseaseIds.map(id => ({ diseaseId: id })),
                    } : undefined,
                    birthDate: new Date(dto.birthDate),
                    lat: dto.lat,
                    lng: dto.lng,
                    villageName: dto.villageName,
                    subdistrictName: dto.subdistrictName,
                    districtName: dto.districtName,
                    provinceName: dto.provinceName,
                    country: dto.country || 'ไทย',
                    addressDetail: dto.addressDetail,
                    pictureUrl: dto.pictureUrl,
                    organizationId: dto.organizationId,
                },
            });

            const caregiverPatient = await tx.caregiverPatient.create({
                data: {
                    caregiverId: caregiverId,
                    patientId: newElderly.id,
                    relationship: dto.relationship,
                    additionalDetails: dto.additionalDetails,
                    documentUrl: dto.documentUrl,
                    status: 'PENDING',
                },
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
                },
            });

            return { newElderly, caregiverPatient };
        });

        try {
            const caregiverName = result.caregiverPatient.caregiver.firstName && result.caregiverPatient.caregiver.lastName
                ? `${result.caregiverPatient.caregiver.firstName} ${result.caregiverPatient.caregiver.lastName}`
                : 'ผู้ดูแลประชาชน';
            const patientName = `${dto.firstName} ${dto.lastName}`;

            const notificationPayload = {
                type: 'CAREGIVER_REQUEST_SUBMITTED' as any,
                title: 'คำร้องเพิ่มประชาชนใหม่',
                message: `${caregiverName} ส่งคำร้องขอเพิ่ม ${patientName} (ลงทะเบียนใหม่) ในความดูแล`,
                data: {
                    relatedId: result.caregiverPatient.id,
                    relatedType: 'CaregiverPatient',
                },
            };

            await this.notificationService.sendToUser(caregiverId, notificationPayload);
        } catch (error) {
            console.error('Failed to notify staff:', error);
        }

        return {
            message: 'ลงทะเบียนประชาชนสำเร็จ รอเจ้าหน้าที่อนุมัติ',
            data: {
                elderlyId: result.newElderly.id,
                requestId: result.caregiverPatient.id,
                status: 'PENDING',
            },
        };
    }

    async staffRegisterCaregiver(staffId: string, dto: StaffRegisterCaregiverDto) {
        const caregiver = await this.prisma.user.findUnique({
            where: { id: dto.patientId },
        });

        if (!caregiver) {
            throw new NotFoundException('ไม่พบผู้ดูแลประชาชน');
        }

        if (caregiver.role !== 'CAREGIVER') {
            throw new ForbiddenException('สามารถเพิ่มประชาชนให้ผู้ดูแลประชาชนเท่านั้น');
        }

        const existingByIdCard = await this.prisma.user.findFirst({
            where: { idCard: dto.idCard },
        });

        if (existingByIdCard) {
            throw new ConflictException('ประชาชนที่มีเลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว');
        }

        const existingByPhone = await this.prisma.user.findFirst({
            where: { phone: dto.phone },
        });

        if (existingByPhone) {
            throw new ConflictException('เบอร์โทรศัพท์นี้มีอยู่ในระบบแล้ว');
        }

        const result = await this.prisma.$transaction(async (tx) => {
            const newElderly = await tx.user.create({
                data: {
                    iamUserId: `pending_${dto.idCard}`,
                    role: 'USERS',
                    idCard: dto.idCard,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    gender: dto.gender,
                    phone: dto.phone,
                    birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
                    pictureUrl: dto.pictureUrl,
                },
            });

            const caregiverPatient = await tx.caregiverPatient.create({
                data: {
                    caregiverId: dto.patientId,
                    patientId: newElderly.id,
                    relationship: dto.relationship,
                    additionalDetails: dto.additionalDetails,
                    documentUrl: dto.documentUrl,
                    status: 'APPROVED',
                    reviewedBy: staffId,
                    reviewedAt: new Date(),
                },
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
                },
            });

            return { newElderly, caregiverPatient };
        });

        try {
            await this.notificationService.sendToUser(dto.patientId, {
                type: 'CAREGIVER_REQUEST_APPROVED' as any,
                title: 'มีประชาชนใหม่ในความดูแล',
                message: `เจ้าหน้าที่ได้เพิ่ม ${dto.firstName} ${dto.lastName} ให้อยู่ในความดูแลของคุณแล้ว`,
                data: {
                    requestId: result.caregiverPatient.id,
                    patientId: result.newElderly.id,
                },
            });
        } catch (error) {
            console.error('Failed to notify caregiver:', error);
        }

        return {
            message: 'เพิ่มประชาชนในความดูแลสำเร็จ',
            data: {
                elderlyId: result.newElderly.id,
                elderlyName: `${dto.firstName} ${dto.lastName}`,
                requestId: result.caregiverPatient.id,
                status: 'APPROVED',
            },
        };
    }

    async staffAddExistingPatient(staffId: string, caregiverId: string, patientId: string, relationship: string, additionalDetails?: string) {
        const caregiver = await this.prisma.user.findUnique({
            where: { id: caregiverId },
        });
        if (!caregiver) {
            throw new NotFoundException('ไม่พบผู้ดูแลประชาชน');
        }
        if (caregiver.role !== 'CAREGIVER') {
            throw new ForbiddenException('สามารถเพิ่มประชาชนให้ผู้ดูแลประชาชนเท่านั้น');
        }

        const patient = await this.prisma.user.findUnique({
            where: { id: patientId },
        });
        if (!patient) {
            throw new NotFoundException('ไม่พบประชาชน');
        }
        if (patient.role !== 'USERS') {
            throw new ForbiddenException('สามารถเพิ่มเฉพาะผู้ใช้บริการเท่านั้น');
        }

        if (caregiverId === patientId) {
            throw new ForbiddenException('ไม่สามารถเพิ่มตัวเองได้');
        }

        const existing = await this.prisma.caregiverPatient.findUnique({
            where: {
                caregiverId_patientId: { caregiverId, patientId },
            },
        });

        if (existing) {
            if (existing.status === 'REJECTED') {
                const updated = await this.prisma.caregiverPatient.update({
                    where: { id: existing.id },
                    data: {
                        relationship: relationship as any,
                        additionalDetails,
                        status: 'APPROVED',
                        rejectReason: null,
                        reviewedBy: staffId,
                        reviewedAt: new Date(),
                    },
                    include: {
                        patient: { select: { id: true, firstName: true, lastName: true } },
                        caregiver: { select: { id: true, firstName: true, lastName: true } },
                    },
                });

                try {
                    await this.notificationService.sendToUser(caregiverId, {
                        type: 'CAREGIVER_REQUEST_APPROVED' as any,
                        title: 'มีประชาชนใหม่ในความดูแล',
                        message: `เจ้าหน้าที่ได้เพิ่ม ${updated.patient.firstName} ${updated.patient.lastName} ให้อยู่ในความดูแลของคุณแล้ว`,
                        data: {
                            requestId: updated.id,
                            patientId: updated.patient.id,
                        },
                    });

                    await this.notificationService.sendToUser(patientId, {
                        type: 'GENERAL' as any,
                        title: 'คุณมีผู้ดูแลใหม่',
                        message: `เจ้าหน้าที่ได้เพิ่ม ${updated.caregiver.firstName} ${updated.caregiver.lastName} เป็นผู้ดูแลของคุณแล้ว`,
                        data: {
                            requestId: updated.id,
                            caregiverId: updated.caregiver.id,
                        },
                    });
                } catch (error) {
                    console.error('Failed to notify users:', error);
                }

                return {
                    message: 'เพิ่มประชาชนในความดูแลสำเร็จ',
                    data: updated,
                };
            }
            throw new ConflictException('ประชาชนนี้อยู่ในรายชื่อที่ดูแลอยู่แล้ว หรือมีคำร้องที่รอตรวจสอบ');
        }

        const caregiverPatient = await this.prisma.caregiverPatient.create({
            data: {
                caregiverId,
                patientId,
                relationship: relationship as any,
                additionalDetails,
                status: 'APPROVED',
                reviewedBy: staffId,
                reviewedAt: new Date(),
            },
            include: {
                patient: { select: { id: true, firstName: true, lastName: true } },
                caregiver: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        try {
            await this.notificationService.sendToUser(caregiverId, {
                type: 'CAREGIVER_REQUEST_APPROVED' as any,
                title: 'มีประชาชนใหม่ในความดูแล',
                message: `เจ้าหน้าที่ได้เพิ่ม ${caregiverPatient.patient.firstName} ${caregiverPatient.patient.lastName} ให้อยู่ในความดูแลของคุณแล้ว`,
                data: {
                    requestId: caregiverPatient.id,
                    patientId: caregiverPatient.patient.id,
                },
            });

            await this.notificationService.sendToUser(patientId, {
                type: 'GENERAL' as any,
                title: 'คุณมีผู้ดูแลใหม่',
                message: `เจ้าหน้าที่ได้เพิ่ม ${caregiverPatient.caregiver.firstName} ${caregiverPatient.caregiver.lastName} เป็นผู้ดูแลของคุณแล้ว`,
                data: {
                    requestId: caregiverPatient.id,
                    caregiverId: caregiverPatient.caregiver.id,
                },
            });
        } catch (error) {
            console.error('Failed to notify users:', error);
        }

        return {
            message: 'เพิ่มประชาชนในความดูแลสำเร็จ',
            data: caregiverPatient,
        };
    }

    async removePatient(caregiverId: string, patientId: string) {
        const record = await this.prisma.caregiverPatient.findFirst({
            where: {
                caregiverId,
                patientId,
            },
        });

        if (!record) {
            throw new NotFoundException('ไม่พบข้อมูลประชาชนในความดูแล');
        }

        await this.prisma.caregiverPatient.delete({
            where: { id: record.id },
        });

        return {
            message: 'ลบประชาชนออกจากความดูแลสำเร็จ',
        };
    }
}
