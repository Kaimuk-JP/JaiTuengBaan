import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class HospitalService {
    constructor(private readonly prisma: PrismaService) { }

    async getHospitals(search?: string, limit = 20, page?: number) {
        const where: any = {};

        if (search && search.length >= 2) {
            where.name = {
                contains: search,
                mode: 'insensitive',
            };
        }

        if (page) {
            const skip = (page - 1) * limit;
            const [data, total] = await Promise.all([
                this.prisma.hospital.findMany({
                    where,
                    select: { id: true, name: true, lat: true, lng: true },
                    orderBy: { name: 'asc' },
                    skip,
                    take: limit,
                }),
                this.prisma.hospital.count({ where }),
            ]);
            return { data, total, page, limit, hasMore: skip + data.length < total };
        }

        const hospitals = await this.prisma.hospital.findMany({
            where,
            select: {
                id: true,
                name: true,
                lat: true,
                lng: true,
            },
            orderBy: {
                name: 'asc',
            },
            take: limit,
        });

        return hospitals;
    }

    async getAllHospitals() {
        return this.prisma.hospital.findMany({
            select: {
                id: true,
                name: true,
                lat: true,
                lng: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
    }

    async seedHospitals(hospitalNames: string[]) {
        const created = await Promise.all(
            hospitalNames.map((name) =>
                this.prisma.hospital.upsert({
                    where: { name },
                    update: {},
                    create: { name },
                })
            )
        );
        return { count: created.length };
    }

    async createHospital(name: string) {
        return this.prisma.hospital.create({
            data: { name },
        });
    }

    async updateHospital(id: number, name: string) {
        return this.prisma.hospital.update({
            where: { id },
            data: { name },
        });
    }

    async deleteHospital(id: number) {
        return this.prisma.hospital.delete({
            where: { id },
        });
    }
}
