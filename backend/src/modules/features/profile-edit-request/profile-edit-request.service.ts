import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateProfileEditRequestDto, ReviewProfileEditRequestDto } from './dto/profile-edit-request.dto';
import { NotificationService, NotificationType } from '@/modules/system/notification/notification.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class ProfileEditRequestService {
    private readonly logger = new Logger(ProfileEditRequestService.name);

    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService,
        private uploadService: UploadService,
    ) { }

    async create(userId: string, dto: CreateProfileEditRequestDto) {
        if (!userId) {
            throw new BadRequestException('ไม่พบข้อมูลผู้ใช้');
        }

        const existingRequest = await this.prisma.profileEditRequest.findFirst({
            where: {
                userId,
                status: 'PENDING',
            },
        });

        if (existingRequest) {
            throw new BadRequestException('คุณมีคำร้องที่รอตรวจสอบอยู่แล้ว กรุณารอจนกว่าจะได้รับการตรวจสอบ');
        }

        const request = await this.prisma.profileEditRequest.create({
            data: {
                user: {
                    connect: { id: userId },
                },
                requestedChanges: dto.requestedChanges,
                newPictureUrl: dto.newPictureUrl,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        pictureUrl: true,
                    },
                },
            },
        });

        const userName = request.user.firstName && request.user.lastName
            ? `${request.user.firstName} ${request.user.lastName}`
            : (request.user.firstName || request.user.lastName || 'ผู้ใช้');

        await this.notificationService.sendToRole('STAFF', {
            type: NotificationType.EDIT_REQUEST_NEW,
            title: 'คำร้องขอแก้ไขข้อมูลใหม่',
            message: `${userName} ส่งคำร้องขอแก้ไขข้อมูลส่วนตัว`,
            data: {
                requestId: request.id,
                userId: request.userId,
                userName: userName,
            },
        });

        return request;
    }

    async findAll(query: { page?: number; limit?: number; status?: string; organizationId?: string }) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.status) {
            where.status = query.status;
        }

        if (query.organizationId) {
            where.user = {
                organizationId: query.organizationId
            };
        }

        const [data, total] = await Promise.all([
            this.prisma.profileEditRequest.findMany({
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
                            pictureUrl: true,
                            idCard: true,
                            addressDetail: true,
                            placeName: true,
                            houseNo: true,
                            road: true,
                            neighbourhood: true,
                            villageName: true,
                            subdistrictName: true,
                            districtName: true,
                            provinceName: true,
                            postalCode: true,
                            country: true,
                            birthDate: true,
                            mobilityStatus: true,
                            gender: true,
                            lat: true,
                            lng: true,
                            relativePhone: true,
                            customDiseases: true,
                            diseases: {
                                include: {
                                    disease: {
                                        select: {
                                            id: true,
                                            name: true,
                                        },
                                    },
                                },
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
            }),
            this.prisma.profileEditRequest.count({ where }),
        ]);

        const mappedData = data.map((req: any) => ({
            ...req,
            user: {
                ...req.user,
                allDiseases: [
                    ...(req.user.diseases || []).map((d: any) => ({ type: 'db', id: d.diseaseId, name: d.disease.name })),
                    ...(req.user.customDiseases || []).map((name: string) => ({ type: 'custom', name })),
                ],
            },
        }));

        return {
            data: mappedData,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1,
            },
        };
    }

    async findOne(id: number) {
        const request = await this.prisma.profileEditRequest.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        pictureUrl: true,
                        idCard: true,
                        gender: true,
                        addressDetail: true,
                        placeName: true,
                        houseNo: true,
                        road: true,
                        neighbourhood: true,
                        villageName: true,
                        subdistrictName: true,
                        districtName: true,
                        provinceName: true,
                        postalCode: true,
                        country: true,
                        mobilityStatus: true,
                        birthDate: true,
                        organizationId: true,
                        relativePhone: true,
                        customDiseases: true,
                        diseases: {
                            include: {
                                disease: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
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
        });

        if (!request) {
            throw new NotFoundException('ไม่พบคำร้อง');
        }

        return {
            ...request,
            user: {
                ...request.user,
                allDiseases: [
                    ...(request.user.diseases || []).map((d: any) => ({ type: 'db', id: d.diseaseId, name: d.disease.name })),
                    ...(request.user.customDiseases || []).map((name: string) => ({ type: 'custom', name })),
                ],
            },
        };
    }

    async findByUserId(userId: string) {
        return this.prisma.profileEditRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async review(id: number, staffId: string, dto: ReviewProfileEditRequestDto) {
        const request = await this.prisma.profileEditRequest.findUnique({
            where: { id },
            include: {
                user: true,
            },
        });

        if (!request) {
            throw new NotFoundException('ไม่พบคำร้อง');
        }

        if (request.status !== 'PENDING') {
            throw new BadRequestException('คำร้องนี้ได้รับการตรวจสอบแล้ว');
        }

        if (dto.action === 'approve') {

            const ALLOWED_FIELDS = [
                'firstName', 'lastName', 'phone', 'idCard', 'relativeName', 'relativePhone',
                'birthDate', 'gender', 'villageName', 'subdistrictName', 'districtName',
                'provinceName', 'country', 'addressDetail', 'lat', 'lng',
                'mobilityStatus', 'specialNeeds', 'diseaseIds', 'customDiseases',
                'placeName', 'houseNo', 'road', 'neighbourhood', 'postalCode',
            ];

            const changes = request.requestedChanges as Record<string, any>;
            const invalidFields = Object.keys(changes).filter(key => !ALLOWED_FIELDS.includes(key));

            if (invalidFields.length > 0) {
                this.logger.warn(`Invalid fields in profile edit request ${id}: ${invalidFields.join(', ')}`);
                throw new BadRequestException(`มีฟิลด์ที่ไม่อนุญาตในการแก้ไข: ${invalidFields.join(', ')}`);
            }

            const updateData: any = { ...changes };
            delete updateData.medicalConditions;
            if (request.newPictureUrl) {
                updateData.pictureUrl = request.newPictureUrl;

                if (request.user.pictureUrl && request.user.pictureUrl !== request.newPictureUrl) {
                    try {
                        await this.uploadService.deleteImage(request.user.pictureUrl);
                        this.logger.log(`Deleted old profile picture for user ${request.userId}: ${request.user.pictureUrl}`);
                    } catch (error) {
                        this.logger.warn(`Failed to delete old profile picture for user ${request.userId}: ${error?.message || error}`);
                    }
                }
            }

            if (updateData.birthDate && typeof updateData.birthDate === 'string') {
                updateData.birthDate = new Date(updateData.birthDate);
            }

            if (updateData.lat && typeof updateData.lat === 'string') {
                updateData.lat = parseFloat(updateData.lat);
            }
            if (updateData.lng && typeof updateData.lng === 'string') {
                updateData.lng = parseFloat(updateData.lng);
            }

            const addressFields = [
                'placeName', 'houseNo', 'road', 'neighbourhood', 'villageName',
                'subdistrictName', 'districtName', 'provinceName', 'postalCode', 'country',
            ];

            const hasAnyAddressField = addressFields.some((field) => {
                return updateData[field] !== undefined && updateData[field] !== null && updateData[field] !== '';
            });

            if (!hasAnyAddressField && typeof updateData.lat === 'number' && typeof updateData.lng === 'number') {
                const components = await this.reverseGeocodeAddress(updateData.lat, updateData.lng);
                if (components) {
                    addressFields.forEach((field) => {
                        if ((updateData[field] === undefined || updateData[field] === null || updateData[field] === '') && components[field]) {
                            updateData[field] = components[field];
                        }
                    });
                }
            }

            if (updateData.diseaseIds) {
                updateData.diseases = {
                    deleteMany: {},
                    create: updateData.diseaseIds.map((id: number) => ({ diseaseId: id })),
                };
                delete updateData.diseaseIds;
            }

            await this.prisma.user.update({
                where: { id: request.userId },
                data: updateData,
            });

            const updatedRequest = await this.prisma.profileEditRequest.update({
                where: { id },
                data: {
                    status: 'APPROVED',
                    reviewedBy: staffId,
                    reviewedAt: new Date(),
                },
            });

            await this.notificationService.sendToUser(request.userId, {
                type: NotificationType.EDIT_REQUEST_APPROVED,
                title: 'คำร้องได้รับการอนุมัติ',
                message: 'คำร้องขอแก้ไขข้อมูลของคุณได้รับการอนุมัติแล้ว ข้อมูลโปรไฟล์ของคุณได้รับการอัปเดตเรียบร้อย',
                data: {
                    requestId: id,
                },
            });

            return updatedRequest;
        } else {
            if (!dto.rejectReason) {
                throw new BadRequestException('กรุณาระบุเหตุผลในการปฏิเสธ');
            }

            if (request.newPictureUrl) {
                try {
                    await this.uploadService.deleteImage(request.newPictureUrl);
                    this.logger.log(`Deleted rejected new picture for request ${id}: ${request.newPictureUrl}`);
                } catch (error) {
                    this.logger.warn(`Failed to delete rejected new picture for request ${id}: ${error?.message || error}`);
                }
            }

            const updatedRequest = await this.prisma.profileEditRequest.update({
                where: { id },
                data: {
                    status: 'REJECTED',
                    reviewedBy: staffId,
                    reviewedAt: new Date(),
                    rejectReason: dto.rejectReason,
                },
            });

            await this.notificationService.sendToUser(request.userId, {
                type: NotificationType.EDIT_REQUEST_REJECTED,
                title: 'คำร้องไม่ได้รับการอนุมัติ',
                message: `คำร้องขอแก้ไขข้อมูลของคุณไม่ได้รับการอนุมัติ เหตุผล: ${dto.rejectReason}`,
                data: {
                    requestId: id,
                    rejectReason: dto.rejectReason,
                },
            });

            return updatedRequest;
        }
    }

    private async reverseGeocodeAddress(lat: number, lng: number) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'VolunteerSmartApp/1.0 (contact@volunteersmart.com)',
                        'Accept-Language': 'th',
                        'Referer': 'https://volunteersmart.com',
                    },
                }
            );

            if (!response.ok) {
                this.logger.warn(`Reverse geocode failed: ${response.status}`);
                return null;
            }

            const data = await response.json();
            if (!data || !data.address) return null;

            const addr = data.address;
            const components: Record<string, string> = {};

            if (addr.house_number) components.houseNo = addr.house_number;
            if (addr.road) components.road = addr.road;
            if (addr.villageName) components.villageName = addr.villageName;
            else if (addr.suburb) components.villageName = addr.suburb;
            if (addr.neighbourhood) components.neighbourhood = addr.neighbourhood;

            if (addr.city) components.subdistrictName = addr.city;
            else if (addr.town) components.subdistrictName = addr.town;
            else if (addr.suburb && !components.villageName) components.subdistrictName = addr.suburb;

            if (addr.county) components.districtName = addr.county;
            else if (addr.city_district) components.districtName = addr.city_district;

            if (addr.province) {
                components.provinceName = addr.province;
            } else if (addr.state) {
                if (addr.state.includes('กรุงเทพ') || addr.state.includes('Bangkok')) {
                    components.provinceName = 'กรุงเทพมหานคร';
                } else {
                    components.provinceName = addr.state;
                }
            } else if (addr.city && (addr.city.includes('กรุงเทพ') || addr.city.includes('Bangkok'))) {
                components.provinceName = 'กรุงเทพมหานคร';
            }

            if (addr.postalCode) components.postalCode = addr.postalCode;
            if (addr.country) components.country = addr.country;

            if (data.name && data.name !== components.road) {
                components.placeName = data.name;
            }

            return components;
        } catch (error: any) {
            this.logger.warn(`Reverse geocode error: ${error?.message || error}`);
            return null;
        }
    }
}
