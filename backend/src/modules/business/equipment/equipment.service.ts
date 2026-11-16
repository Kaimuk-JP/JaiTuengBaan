import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class EquipmentService {
    constructor(private prisma: PrismaService) { }

    async findAll(filters?: {
        search?: string;
        activeOnly?: boolean;
        organizationId?: string;
        page?: number;
        limit?: number;
    }) {
        const where: any = {};

        if (filters?.organizationId) {
            where.organizationId = filters.organizationId;
        }

        if (filters?.search) {
            where.name = {
                contains: filters.search,
                mode: 'insensitive',
            };
        }

        if (filters?.activeOnly) {
            where.isActive = true;
        }

        if (filters?.page && filters?.limit) {
            const skip = (filters.page - 1) * filters.limit;
            const [data, total] = await Promise.all([
                this.prisma.equipment.findMany({
                    where,
                    orderBy: { name: 'asc' },
                    skip,
                    take: filters.limit,
                }),
                this.prisma.equipment.count({ where }),
            ]);
            return { data, total, page: filters.page, limit: filters.limit, hasMore: skip + data.length < total };
        }

        return this.prisma.equipment.findMany({
            where,
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: number) {
        const equipment = await this.prisma.equipment.findUnique({
            where: { id },
        });

        if (!equipment) {
            throw new NotFoundException('ไม่พบข้อมูลอุปกรณ์ที่ระบุ');
        }

        return equipment;
    }

    async create(name: string, organizationId?: string) {
        const existing = await this.prisma.equipment.findFirst({
            where: { name, organizationId: organizationId || null },
        });

        if (existing) {
            throw new ConflictException('ชื่ออุปกรณ์นี้มีอยู่แล้วในระบบ');
        }

        return this.prisma.equipment.create({
            data: { name, isActive: true, organizationId: organizationId || null },
        });
    }

    async update(id: number, data: { name?: string; isActive?: boolean }) {
        const equipment = await this.prisma.equipment.findUnique({
            where: { id },
        });

        if (!equipment) {
            throw new NotFoundException('ไม่พบข้อมูลอุปกรณ์ที่ระบุ');
        }

        if (data.name && data.name !== equipment.name) {
            const existing = await this.prisma.equipment.findFirst({
                where: { name: data.name, organizationId: equipment.organizationId },
            });

            if (existing) {
                throw new ConflictException('ชื่ออุปกรณ์นี้มีอยู่แล้วในระบบ');
            }
        }

        return this.prisma.equipment.update({
            where: { id },
            data,
        });
    }

    async delete(id: number) {
        const equipment = await this.prisma.equipment.findUnique({
            where: { id },
        });

        if (!equipment) {
            throw new NotFoundException('ไม่พบข้อมูลอุปกรณ์ที่ระบุ');
        }

        await this.prisma.equipment.delete({
            where: { id },
        });

        return { message: `อุปกรณ์ "${equipment.name}" ถูกลบเรียบร้อยแล้ว` };
    }
}
