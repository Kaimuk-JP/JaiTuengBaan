import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';

@Injectable()
export class VehicleService {
    constructor(private prisma: PrismaService) {}

    async create(createVehicleDto: CreateVehicleDto, orgId?: string | null) {
        const status = createVehicleDto.status ?? 'READY';
        return this.prisma.vehicle.create({
            data: {
                licensePlate: createVehicleDto.licensePlate,
                name: createVehicleDto.name,
                type: createVehicleDto.type,
                brand: createVehicleDto.brand,
                model: createVehicleDto.model,
                color: createVehicleDto.color,
                fuelType: createVehicleDto.fuelType,
                capacity: createVehicleDto.capacity ?? 4,
                totalMileageKm: createVehicleDto.totalMileageKm ?? 0,
                imageUrl: createVehicleDto.imageUrl,
                status,
                isActive: status !== 'INACTIVE',
                organizationId: orgId,
            },
        });
    }

    async findAll(params: { page: number; limit: number; search?: string; orgId?: string | null }) {
        const { page, limit, search, orgId } = params;
        const skip = (page - 1) * limit;

        const where: any = { deletedAt: null };
        if (orgId) {
            where.organizationId = orgId;
        }
        if (search) {
            where.OR = [
                { licensePlate: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.vehicle.findMany({
                where,
                orderBy: { name: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.vehicle.count({ where }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: number, orgId?: string | null) {
        const vehicle = await this.prisma.vehicle.findUnique({
            where: { id },
        });

        if (!vehicle || (orgId && vehicle.organizationId !== orgId)) {
            throw new NotFoundException('ไม่พบข้อมูลยานพาหนะที่ระบุ');
        }

        return vehicle;
    }

    async update(id: number, updateVehicleDto: UpdateVehicleDto, orgId?: string | null) {
        await this.findOne(id, orgId);

        const data: any = { ...updateVehicleDto };
        if (updateVehicleDto.status) {
            data.isActive = updateVehicleDto.status !== 'INACTIVE';
        }

        return this.prisma.vehicle.update({
            where: { id },
            data,
        });
    }

    async remove(id: number, orgId?: string | null) {
        await this.findOne(id, orgId);

        return this.prisma.vehicle.update({
            where: { id },
            data: {
                isActive: false,
                status: 'INACTIVE',
                deletedAt: new Date()
            },
        });
    }

    async getMileageLogs(id: number, limit: number = 20, orgId?: string | null) {
        await this.findOne(id, orgId);

        return this.prisma.vehicleMileageLog.findMany({
            where: { vehicleId: id },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                job: {
                    select: {
                        id: true,
                        queue: {
                            select: {
                                id: true,
                                hospital: { select: { name: true } },
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                    }
                                }
                            }
                        },
                        vlt: {
                            select: {
                                firstName: true,
                                lastName: true,
                            }
                        }
                    }
                }
            }
        });
    }
}
