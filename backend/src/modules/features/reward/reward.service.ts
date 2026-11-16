import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateRewardDto, UpdateRewardDto, RedeemRewardDto } from './dto';
import { NotificationService, NotificationType } from '@/modules/system/notification/notification.service';

@Injectable()
export class RewardService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService,
    ) { }


        async getActiveRewards(page = 1, limit = 20, orgId?: string | null) {
        const skip = (page - 1) * limit;

        const where: any = { isActive: true };
        if (orgId) {
            where.organizationId = orgId;
        }

        const [data, total] = await Promise.all([
            this.prisma.reward.findMany({
                where,
                orderBy: { pointsCost: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.reward.count({ where }),
        ]);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

        async redeemReward(userId: string, dto: RedeemRewardDto) {
        const reward = await this.prisma.reward.findUnique({
            where: { id: dto.rewardId },
        });

        if (!reward) {
            throw new NotFoundException('ไม่พบรางวัลนี้');
        }

        if (!reward.isActive) {
            throw new BadRequestException('รางวัลนี้ไม่พร้อมให้แลก');
        }

        if (reward.stock === 0) {
            throw new BadRequestException('รางวัลนี้หมดแล้ว');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { pointsBalance: true, role: true, organizationId: true },
        });

        if (reward.organizationId && reward.organizationId !== user?.organizationId) {
            throw new BadRequestException('ไม่สามารถแลกรางวัลข้ามเขตเทศบาลได้');
        }

        if (!user) {
            throw new NotFoundException('ไม่พบผู้ใช้');
        }

        if (user.role !== 'DRIVE' && user.role !== 'CAREU') {
            throw new ForbiddenException('เฉพาะจิตอาสาเท่านั้นที่สามารถแลกแต้มได้');
        }

        if (user.pointsBalance < reward.pointsCost) {
            throw new BadRequestException(`แต้มไม่เพียงพอ (ต้องการ ${reward.pointsCost} แต้ม, มี ${user.pointsBalance} แต้ม)`);
        }

        const [redemption] = await this.prisma.$transaction([
            this.prisma.redemption.create({
                data: {
                    userId,
                    rewardId: dto.rewardId,
                    pointsUsed: reward.pointsCost,
                    status: 'PENDING',
                },
                include: {
                    reward: true,
                },
            }),
            this.prisma.user.update({
                where: { id: userId },
                data: {
                    pointsBalance: { decrement: reward.pointsCost },
                },
            }),
            ...(reward.stock > 0
                ? [
                    this.prisma.reward.update({
                        where: { id: dto.rewardId },
                        data: { stock: { decrement: 1 } },
                    }),
                ]
                : []),
        ]);

        await this.notificationService.sendToUser(userId, {
            type: NotificationType.REWARD_REDEMPTION_SUBMITTED,
            title: 'ส่งคำขอแลกแต้มสำเร็จ',
            message: `ส่งคำขอแลกรางวัล "${reward.name}" สำเร็จ กรุณารอการอนุมัติ`,
            data: { redemptionId: redemption.id, rewardId: reward.id },
        });

        return {
            message: 'แลกแต้มสำเร็จ รอเจ้าหน้าที่อนุมัติ',
            redemption,
        };
    }

        async getRedemptionHistory(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.redemption.findMany({
                where: { userId },
                include: {
                    reward: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.redemption.count({ where: { userId } }),
        ]);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }


        async getAllRewards(page = 1, limit = 20, orgId?: string | null) {
        const skip = (page - 1) * limit;

        const where: any = {};
        if (orgId) {
            where.organizationId = orgId;
        }

        const [data, total] = await Promise.all([
            this.prisma.reward.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.reward.count({ where }),
        ]);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

        async createReward(dto: CreateRewardDto, staffId: string, orgId?: string | null) {
        const stock = dto.stock ?? -1;

        const reward = await this.prisma.reward.create({
            data: {
                name: dto.name,
                description: dto.description,
                imageUrl: dto.imageUrl,
                pointsCost: dto.pointsCost,
                stock,
                isActive: dto.isActive ?? true,
                organizationId: orgId,
            },
        });

        await this.prisma.rewardStockHistory.create({
            data: {
                rewardId: reward.id,
                action: 'CREATE',
                quantityBefore: 0,
                quantityAfter: stock,
                quantityChange: stock,
                note: dto.note || `สร้างรางวัล "${reward.name}"`,
                evidenceUrl: dto.evidenceUrl || null,
                staffId,
            },
        });

        return reward;
    }

    async updateReward(id: number, dto: UpdateRewardDto, staffId: string, orgId?: string | null) {
        const reward = await this.prisma.reward.findUnique({ where: { id } });
        if (!reward || (orgId && reward.organizationId !== orgId)) {
            throw new NotFoundException('ไม่พบรางวัลนี้ หรืออยู่นอกเขตเทศบาล');
        }

        const oldStock = reward.stock;
        const newStock = dto.stock !== undefined ? dto.stock : oldStock;

        const { evidenceUrl, note, ...updateFields } = dto;

        const updated = await this.prisma.reward.update({
            where: { id },
            data: updateFields,
        });

        const changes: string[] = [];
        if (dto.name !== undefined && dto.name !== reward.name) changes.push(`ชื่อ: ${reward.name} → ${dto.name}`);
        if (dto.description !== undefined && dto.description !== reward.description) changes.push(`รายละเอียด`);
        if (dto.pointsCost !== undefined && dto.pointsCost !== reward.pointsCost) changes.push(`แต้ม: ${reward.pointsCost} → ${dto.pointsCost}`);
        if (dto.stock !== undefined && dto.stock !== oldStock) changes.push(`จำนวน: ${oldStock} → ${newStock}`);
        if (dto.isActive !== undefined && dto.isActive !== reward.isActive) changes.push(dto.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน');
        if (dto.imageUrl !== undefined && dto.imageUrl !== reward.imageUrl) changes.push(`อัปเดตรูปภาพ`);

        if (changes.length > 0 || evidenceUrl || note) {
            await this.prisma.rewardStockHistory.create({
                data: {
                    rewardId: id,
                    action: 'UPDATE',
                    quantityBefore: oldStock,
                    quantityAfter: newStock,
                    quantityChange: newStock - oldStock,
                    note: note || (changes.length > 0 ? `แก้ไข "${reward.name}": ${changes.join(', ')}` : `อัปเดตข้อมูลรางวัล`),
                    evidenceUrl: evidenceUrl || null,
                    staffId,
                },
            });
        }

        return updated;
    }

    async adjustStock(id: number, dto: import('./dto').AdjustStockDto, staffId: string, orgId?: string | null) {
        const reward = await this.prisma.reward.findUnique({ where: { id } });
        if (!reward || (orgId && reward.organizationId !== orgId)) {
            throw new NotFoundException('ไม่พบรางวัลนี้ หรืออยู่นอกเขตเทศบาล');
        }

        const oldStock = reward.stock;
        let newStock = oldStock;
        let qtyChange = 0;
        let defaultNote = '';

        if (dto.action === 'ADD_STOCK') {
            if (dto.quantity <= 0) throw new BadRequestException('จำนวนที่เพิ่มต้องมากกว่า 0');
            const baseStock = oldStock < 0 ? 0 : oldStock;
            newStock = baseStock + dto.quantity;
            qtyChange = dto.quantity;
            defaultNote = `นำเข้าสต๊อก +${dto.quantity} ชิ้น`;
        } else if (dto.action === 'DEDUCT_STOCK') {
            if (dto.quantity <= 0) throw new BadRequestException('จำนวนที่ลดต้องมากกว่า 0');
            if (oldStock >= 0 && oldStock < dto.quantity) {
                throw new BadRequestException(`จำนวนคงเหลือไม่พอ (${oldStock} ชิ้น) สำหรับการตัดสต๊อก ${dto.quantity} ชิ้น`);
            }
            const baseStock = oldStock < 0 ? 0 : oldStock;
            newStock = Math.max(0, baseStock - dto.quantity);
            qtyChange = -dto.quantity;
            defaultNote = `ตัดสต๊อก/ตัดชำรุด -${dto.quantity} ชิ้น`;
        } else if (dto.action === 'SET_STOCK') {
            if (dto.quantity < -1) throw new BadRequestException('จำนวนคงเหลือไม่ถูกต้อง');
            newStock = dto.quantity;
            qtyChange = newStock - (oldStock < 0 ? 0 : oldStock);
            defaultNote = `ปรับยอดสต๊อกคงเหลือจริงเป็น ${newStock < 0 ? 'ไม่จำกัด' : `${newStock} ชิ้น`}`;
        }

        const [updatedReward, history] = await this.prisma.$transaction([
            this.prisma.reward.update({
                where: { id },
                data: { stock: newStock },
            }),
            this.prisma.rewardStockHistory.create({
                data: {
                    rewardId: id,
                    action: dto.action,
                    quantityBefore: oldStock,
                    quantityAfter: newStock,
                    quantityChange: qtyChange,
                    note: dto.note ? `${dto.note}` : defaultNote,
                    evidenceUrl: dto.evidenceUrl || null,
                    staffId,
                },
                include: {
                    staff: { select: { id: true, firstName: true, lastName: true, pictureUrl: true } },
                    reward: { select: { id: true, name: true, imageUrl: true } },
                },
            }),
        ]);

        return {
            reward: updatedReward,
            history,
            message: `ปรับปรุงสต๊อกรางวัล "${reward.name}" สำเร็จ`,
        };
    }

        async deleteReward(id: number, orgId?: string | null) {
        const reward = await this.prisma.reward.findUnique({ where: { id } });
        if (!reward || (orgId && reward.organizationId !== orgId)) {
            throw new NotFoundException('ไม่พบรางวัลนี้ หรืออยู่นอกเขตเทศบาล');
        }

        const pendingCount = await this.prisma.redemption.count({
            where: { rewardId: id, status: 'PENDING' },
        });

        if (pendingCount > 0) {
            throw new BadRequestException('ไม่สามารถลบได้ มีคำขอแลกที่รออนุมัติอยู่');
        }

        await this.prisma.$transaction([
            this.prisma.rewardStockHistory.deleteMany({ where: { rewardId: id } }),
            this.prisma.redemption.deleteMany({ where: { rewardId: id } }),
            this.prisma.reward.delete({ where: { id } }),
        ]);

        return { message: `ลบรางวัล "${reward.name}" สำเร็จ` };
    }

    async getStockHistory(rewardId: number, page = 1, limit = 20, orgId?: string | null) {
        const skip = (page - 1) * limit;

        const where: any = { rewardId };
        if (orgId) {
            where.reward = { organizationId: orgId };
        }

        const [data, total] = await Promise.all([
            this.prisma.rewardStockHistory.findMany({
                where,
                include: {
                    staff: { select: { id: true, firstName: true, lastName: true, pictureUrl: true, role: true } },
                    reward: { select: { id: true, name: true, imageUrl: true, stock: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.rewardStockHistory.count({ where }),
        ]);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getAllStockHistory(page = 1, limit = 50, orgId?: string | null, action?: string) {
        const skip = (page - 1) * limit;

        const where: any = {};
        if (orgId) {
            where.reward = { organizationId: orgId };
        }
        if (action) {
            where.action = action;
        }

        const [data, total] = await Promise.all([
            this.prisma.rewardStockHistory.findMany({
                where,
                include: {
                    staff: { select: { id: true, firstName: true, lastName: true, pictureUrl: true, role: true } },
                    reward: { select: { id: true, name: true, imageUrl: true, stock: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.rewardStockHistory.count({ where }),
        ]);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

        async getAllRedemptions(status?: string, page = 1, limit = 20, organizationId?: string) {
        const skip = (page - 1) * limit;
        const where: any = {};
        if (status) {
            where.status = status as any;
        }
        if (organizationId) {
            where.user = { organizationId };
        }

        const [data, total] = await Promise.all([
            this.prisma.redemption.findMany({
                where,
                include: {
                    reward: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            pictureUrl: true,
                            phone: true,
                            pointsBalance: true,
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
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.redemption.count({ where }),
        ]);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

        async approveRedemption(id: number, staffId: string, orgId?: string) {
        const redemption = await this.prisma.redemption.findUnique({
            where: { id },
            include: { reward: true, user: true },
        });

        if (!redemption) {
            throw new NotFoundException('ไม่พบคำขอแลกนี้');
        }

        if (orgId && redemption.user.organizationId !== orgId) {
            throw new ForbiddenException('คนละเขตเทศบาล');
        }

        if (redemption.status !== 'PENDING') {
            throw new BadRequestException('คำขอนี้ถูกดำเนินการแล้ว');
        }

        const updated = await this.prisma.redemption.update({
            where: { id },
            data: {
                status: 'APPROVED',
                reviewedBy: staffId,
                reviewedAt: new Date(),
            },
            include: { reward: true, user: { select: { firstName: true, lastName: true } } },
        });

        await this.notificationService.sendToUser(redemption.userId, {
            type: NotificationType.REWARD_REDEMPTION_APPROVED,
            title: 'คำขอแลกแต้มได้รับอนุมัติ',
            message: `คำขอแลกรางวัล "${redemption.reward.name}" ได้รับการอนุมัติแล้ว กรุณาติดต่อรับรางวัลได้เลย`,
            data: { redemptionId: id, rewardId: redemption.rewardId },
        });

        return updated;
    }

        async rejectRedemption(id: number, staffId: string, reason?: string, orgId?: string) {
        const redemption = await this.prisma.redemption.findUnique({
            where: { id },
            include: { reward: true, user: true },
        });

        if (!redemption) {
            throw new NotFoundException('ไม่พบคำขอแลกนี้');
        }

        if (orgId && redemption.user.organizationId !== orgId) {
            throw new ForbiddenException('คนละเขตเทศบาล');
        }

        if (redemption.status !== 'PENDING') {
            throw new BadRequestException('คำขอนี้ถูกดำเนินการแล้ว');
        }

        await this.prisma.$transaction([
            this.prisma.redemption.update({
                where: { id },
                data: {
                    status: 'REJECTED',
                    reviewedBy: staffId,
                    reviewedAt: new Date(),
                    rejectReason: reason,
                },
            }),
            this.prisma.user.update({
                where: { id: redemption.userId },
                data: {
                    pointsBalance: { increment: redemption.pointsUsed },
                },
            }),
            ...(redemption.reward.stock >= 0
                ? [
                    this.prisma.reward.update({
                        where: { id: redemption.rewardId },
                        data: { stock: { increment: 1 } },
                    }),
                ]
                : []),
        ]);

        const updatedUser = await this.prisma.user.findUnique({
            where: { id: redemption.userId },
            select: { pointsBalance: true },
        });

        const reasonText = reason ? ` (เหตุผล: ${reason})` : '';
        await this.notificationService.sendToUser(redemption.userId, {
            type: NotificationType.REWARD_REDEMPTION_REJECTED,
            title: 'คำขอแลกแต้มถูกปฏิเสธ',
            message: `คำขอแลกรางวัล "${redemption.reward.name}" ถูกปฏิเสธ${reasonText} คืนแต้ม ${redemption.pointsUsed} แต้มแล้ว คงเหลือ ${updatedUser?.pointsBalance || 0} แต้ม`,
            data: { redemptionId: id, rewardId: redemption.rewardId, refundedPoints: redemption.pointsUsed },
        });

        return { message: 'ปฏิเสธคำขอแลกสำเร็จ' };
    }

        async completeRedemption(id: number, staffId: string, orgId?: string) {
        const redemption = await this.prisma.redemption.findUnique({
            where: { id },
            include: { reward: true, user: true },
        });

        if (!redemption) {
            throw new NotFoundException('ไม่พบคำขอแลกนี้');
        }

        if (orgId && redemption.user.organizationId !== orgId) {
            throw new ForbiddenException('คนละเขตเทศบาล');
        }

        if (redemption.status !== 'APPROVED') {
            throw new BadRequestException('ต้องอนุมัติก่อนจึงจะมอบรางวัลได้');
        }

        const updated = await this.prisma.redemption.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                reviewedBy: staffId,
                reviewedAt: new Date(),
            },
        });

        await this.notificationService.sendToUser(redemption.userId, {
            type: NotificationType.REWARD_REDEMPTION_COMPLETED,
            title: 'ได้รับรางวัลเรียบร้อย',
            message: `ได้รับรางวัล "${redemption.reward.name}" เรียบร้อยแล้ว ขอบคุณที่เป็นจิตอาสา!`,
            data: { redemptionId: id, rewardId: redemption.rewardId },
        });

        return updated;
    }
}
