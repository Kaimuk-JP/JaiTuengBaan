import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class DiseaseService {
    constructor(private prisma: PrismaService) { }

    async findAll(filters?: { search?: string; activeOnly?: boolean; page?: number; limit?: number }) {
        const where: any = {};

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
                this.prisma.disease.findMany({
                    where,
                    orderBy: { name: 'asc' },
                    skip,
                    take: filters.limit,
                }),
                this.prisma.disease.count({ where }),
            ]);
            return { data, total, page: filters.page, limit: filters.limit, hasMore: skip + data.length < total };
        }

        return this.prisma.disease.findMany({
            where,
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: number) {
        const disease = await this.prisma.disease.findUnique({
            where: { id },
        });

        if (!disease) {
            throw new NotFoundException('ไม่พบข้อมูลโรคที่ระบุ');
        }

        return disease;
    }

    async create(name: string) {
        const existing = await this.prisma.disease.findUnique({
            where: { name },
        });

        if (existing) {
            throw new ConflictException('ชื่อโรคนี้มีอยู่แล้วในระบบ');
        }

        return this.prisma.disease.create({
            data: { name, isActive: true },
        });
    }

    async update(id: number, data: { name?: string; isActive?: boolean }) {
        const disease = await this.prisma.disease.findUnique({
            where: { id },
        });

        if (!disease) {
            throw new NotFoundException('ไม่พบข้อมูลโรคที่ระบุ');
        }

        if (data.name && data.name !== disease.name) {
            const existing = await this.prisma.disease.findUnique({
                where: { name: data.name },
            });

            if (existing) {
                throw new ConflictException('ชื่อโรคนี้มีอยู่แล้วในระบบ');
            }
        }

        return this.prisma.disease.update({
            where: { id },
            data,
        });
    }

    async delete(id: number) {
        const disease = await this.prisma.disease.findUnique({
            where: { id },
        });

        if (!disease) {
            throw new NotFoundException('ไม่พบข้อมูลโรคที่ระบุ');
        }

        await this.prisma.disease.delete({
            where: { id },
        });

        return { message: `Disease "${disease.name}" deleted successfully` };
    }
}
