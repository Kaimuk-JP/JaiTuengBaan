import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ConfigService } from '../../../core/config/config';

@Injectable()
export class SettingsService {
    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) { }

    async getSetting(key: string): Promise<string | null> {
        const setting = await this.prisma.settings.findUnique({
            where: { key },
        });
        return setting?.value ?? null;
    }

    async setSetting(key: string, value: string): Promise<void> {
        await this.prisma.settings.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    }

    async deleteSetting(key: string): Promise<void> {
        await this.prisma.settings.deleteMany({
            where: { key },
        });
    }

    async getExecutiveApprovalEnabled(organizationId: string): Promise<boolean> {
        const org = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: { executiveApprovalEnabled: true },
        });
        return org?.executiveApprovalEnabled ?? true;
    }

    async setExecutiveApprovalEnabled(organizationId: string, enabled: boolean): Promise<void> {
        await this.prisma.organization.update({
            where: { id: organizationId },
            data: { executiveApprovalEnabled: enabled },
        });
    }

    async getLineNotificationEnabled(organizationId: string): Promise<boolean> {
        const org = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: { lineNotificationEnabled: true },
        });
        return org?.lineNotificationEnabled ?? true;
    }

    async setLineNotificationEnabled(organizationId: string, enabled: boolean, applyToAll?: boolean): Promise<void> {
        if (applyToAll) {
            await this.prisma.organization.updateMany({
                data: { lineNotificationEnabled: enabled },
            });
        } else {
            await this.prisma.organization.update({
                where: { id: organizationId },
                data: { lineNotificationEnabled: enabled },
            });
        }
    }

    async getOrganizationLineOa(organizationId: string) {
        const org = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                id: true,
                name: true,
                lineNotificationEnabled: true,
                lineUseCustomOa: true,
                lineChannelId: true,
                lineChannelSecret: true,
                lineChannelAccessToken: true,
                lineLiffId: true,
                lineBotBasicId: true,
            },
        });

        const defaultChannelId = this.configService.lineChannelId || '';
        const defaultLiffId = process.env.NEXT_PUBLIC_LIFF_ID || '';

        return {
            lineNotificationEnabled: org?.lineNotificationEnabled ?? true,
            lineUseCustomOa: org?.lineUseCustomOa ?? false,
            lineChannelId: org?.lineChannelId || '',
            lineLiffId: org?.lineLiffId || '',
            lineBotBasicId: org?.lineBotBasicId || '',
            hasChannelSecret: !!org?.lineChannelSecret,
            hasChannelAccessToken: !!org?.lineChannelAccessToken,
            systemDefaults: {
                channelId: defaultChannelId,
                liffId: defaultLiffId,
                botBasicId: '',
            },
        };
    }

    async updateOrganizationLineOa(organizationId: string, data: {
        lineUseCustomOa: boolean;
        lineChannelId?: string;
        lineChannelSecret?: string;
        lineChannelAccessToken?: string;
        lineLiffId?: string;
        lineBotBasicId?: string;
    }) {
        const updateData: any = {
            lineUseCustomOa: data.lineUseCustomOa,
        };

        if (data.lineChannelId !== undefined) {
            updateData.lineChannelId = data.lineChannelId?.trim() || null;
        }
        if (data.lineLiffId !== undefined) {
            const cleanLiff = data.lineLiffId?.replace('https://liff.line.me/', '').trim() || null;
            updateData.lineLiffId = cleanLiff;
            if (!updateData.lineChannelId && cleanLiff && cleanLiff.includes('-')) {
                updateData.lineChannelId = cleanLiff.split('-')[0];
            }
        }
        if (data.lineBotBasicId !== undefined) {
            updateData.lineBotBasicId = data.lineBotBasicId?.trim() || null;
        }

        if (data.lineChannelSecret && !data.lineChannelSecret.includes('••••')) {
            updateData.lineChannelSecret = data.lineChannelSecret.trim();
        } else if (data.lineChannelSecret === '') {
            updateData.lineChannelSecret = null;
        }

        if (data.lineChannelAccessToken && !data.lineChannelAccessToken.includes('••••')) {
            updateData.lineChannelAccessToken = data.lineChannelAccessToken.trim();
        } else if (data.lineChannelAccessToken === '') {
            updateData.lineChannelAccessToken = null;
        }

        const org = await this.prisma.organization.update({
            where: { id: organizationId },
            data: updateData,
            select: {
                id: true,
                name: true,
                lineNotificationEnabled: true,
                lineUseCustomOa: true,
                lineChannelId: true,
                lineLiffId: true,
                lineBotBasicId: true,
                lineChannelSecret: true,
                lineChannelAccessToken: true,
            },
        });

        const defaultChannelId = this.configService.lineChannelId || '';
        const defaultLiffId = process.env.NEXT_PUBLIC_LIFF_ID || '';

        return {
            success: true,
            lineUseCustomOa: org.lineUseCustomOa,
            lineChannelId: org.lineChannelId || '',
            lineLiffId: org.lineLiffId || '',
            lineBotBasicId: org.lineBotBasicId || '',
            hasChannelSecret: !!org.lineChannelSecret,
            hasChannelAccessToken: !!org.lineChannelAccessToken,
            systemDefaults: {
                channelId: defaultChannelId,
                liffId: defaultLiffId,
                botBasicId: '',
            },
        };
    }

    async testLineBotToken(token?: string, organizationId?: string): Promise<{
        success: boolean;
        bot?: { displayName: string; basicId: string; pictureUrl?: string };
        botName?: string;
        basicId?: string;
        pictureUrl?: string;
        error?: string;
    }> {
        try {
            let cleanToken = token?.trim();
            if (!cleanToken && organizationId) {
                const org = await this.prisma.organization.findUnique({
                    where: { id: organizationId },
                    select: { lineChannelAccessToken: true },
                });
                cleanToken = org?.lineChannelAccessToken || undefined;
            }

            if (!cleanToken) {
                return { success: false, error: 'กรุณาระบุ Channel Access Token' };
            }

            const res = await fetch('https://api.line.me/v2/bot/info', {
                headers: {
                    Authorization: `Bearer ${cleanToken}`,
                },
            });
            if (!res.ok) {
                return { success: false, error: 'Token ไม่ถูกต้อง หรือ LINE API ปฏิเสธคำขอ' };
            }
            const data = await res.json();
            const basicId = data.basicId || data.premiumId || '';
            return {
                success: true,
                bot: {
                    displayName: data.displayName,
                    basicId,
                    pictureUrl: data.pictureUrl,
                },
                botName: data.displayName,
                basicId,
                pictureUrl: data.pictureUrl,
            };
        } catch (e: any) {
            return { success: false, error: e.message || 'ไม่สามารถเชื่อมต่อกับ LINE API ได้' };
        }
    }

    async getLockReturnOfficeSettings(organizationId: string): Promise<{ lockReturnOfficeEnabled: boolean; returnOfficeRadiusMeters: number; lat: number | null; lng: number | null }> {
        const org = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: { lockReturnOfficeEnabled: true, returnOfficeRadiusMeters: true, lat: true, lng: true },
        });
        return {
            lockReturnOfficeEnabled: org?.lockReturnOfficeEnabled ?? false,
            returnOfficeRadiusMeters: org?.returnOfficeRadiusMeters ?? 200,
            lat: org?.lat ?? null,
            lng: org?.lng ?? null,
        };
    }

    async setLockReturnOfficeSettings(organizationId: string, enabled: boolean, radiusMeters?: number, applyToAll?: boolean): Promise<void> {
        const data: any = { lockReturnOfficeEnabled: enabled };
        if (typeof radiusMeters === 'number' && radiusMeters > 0) {
            data.returnOfficeRadiusMeters = radiusMeters;
        }
        if (applyToAll) {
            await this.prisma.organization.updateMany({
                data,
            });
        } else {
            await this.prisma.organization.update({
                where: { id: organizationId },
                data,
            });
        }
    }

    async getQueueCancellationSettings(organizationId: string): Promise<{
        allowUserCancelQueue: boolean;
        cancelQueueUnit: string;
        cancelQueueValue: number;
        minCancelHoursBefore: number;
    }> {
        const org = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                allowUserCancelQueue: true,
                cancelQueueUnit: true,
                cancelQueueValue: true,
                minCancelHoursBefore: true,
            },
        });
        const unit = org?.cancelQueueUnit || 'DAYS';
        const value = typeof org?.cancelQueueValue === 'number' ? org.cancelQueueValue : (unit === 'DAYS' ? Math.max(1, Math.round((org?.minCancelHoursBefore ?? 24) / 24)) : (org?.minCancelHoursBefore ?? 24));
        return {
            allowUserCancelQueue: org?.allowUserCancelQueue ?? true,
            cancelQueueUnit: unit,
            cancelQueueValue: value,
            minCancelHoursBefore: org?.minCancelHoursBefore ?? (unit === 'HOURS' ? value : value * 24),
        };
    }

    async setQueueCancellationSettings(
        organizationId: string,
        allowUserCancelQueue: boolean,
        options?: {
            cancelQueueUnit?: string;
            cancelQueueValue?: number;
            minCancelHoursBefore?: number;
        } | number,
        applyToAll?: boolean,
    ): Promise<void> {
        const data: any = { allowUserCancelQueue };

        if (typeof options === 'number') {
            data.minCancelHoursBefore = options;
            data.cancelQueueValue = options;
            data.cancelQueueUnit = options >= 24 && options % 24 === 0 ? 'DAYS' : 'HOURS';
            if (data.cancelQueueUnit === 'DAYS') {
                data.cancelQueueValue = options / 24;
            }
        } else if (options) {
            if (options.cancelQueueUnit && ['DAYS', 'HOURS'].includes(options.cancelQueueUnit.toUpperCase())) {
                data.cancelQueueUnit = options.cancelQueueUnit.toUpperCase();
            }
            if (typeof options.cancelQueueValue === 'number' && options.cancelQueueValue >= 0) {
                data.cancelQueueValue = options.cancelQueueValue;
                data.minCancelHoursBefore = data.cancelQueueUnit === 'DAYS' ? options.cancelQueueValue * 24 : options.cancelQueueValue;
            } else if (typeof options.minCancelHoursBefore === 'number' && options.minCancelHoursBefore >= 0) {
                data.minCancelHoursBefore = options.minCancelHoursBefore;
                data.cancelQueueValue = options.minCancelHoursBefore;
            }
        }

        if (applyToAll) {
            await this.prisma.organization.updateMany({
                data,
            });
        } else {
            await this.prisma.organization.update({
                where: { id: organizationId },
                data,
            });
        }
    }

    async getVolunteerCancellationSettings(organizationId: string): Promise<{
        allowVolunteerCancelJob: boolean;
        volunteerCancelUnit: string;
        volunteerCancelValue: number;
        minVolunteerCancelHoursBefore: number;
    }> {
        const org = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                allowVolunteerCancelJob: true,
                volunteerCancelUnit: true,
                volunteerCancelValue: true,
                minVolunteerCancelHoursBefore: true,
            },
        });
        const unit = org?.volunteerCancelUnit || 'DAYS';
        const value = typeof org?.volunteerCancelValue === 'number' ? org.volunteerCancelValue : (unit === 'DAYS' ? Math.max(1, Math.round((org?.minVolunteerCancelHoursBefore ?? 24) / 24)) : (org?.minVolunteerCancelHoursBefore ?? 24));
        return {
            allowVolunteerCancelJob: org?.allowVolunteerCancelJob ?? true,
            volunteerCancelUnit: unit,
            volunteerCancelValue: value,
            minVolunteerCancelHoursBefore: org?.minVolunteerCancelHoursBefore ?? (unit === 'HOURS' ? value : value * 24),
        };
    }

    async setVolunteerCancellationSettings(
        organizationId: string,
        allowVolunteerCancelJob: boolean,
        options?: {
            volunteerCancelUnit?: string;
            volunteerCancelValue?: number;
            minVolunteerCancelHoursBefore?: number;
        } | number,
        applyToAll?: boolean,
    ): Promise<void> {
        const data: any = { allowVolunteerCancelJob };

        if (typeof options === 'number') {
            data.minVolunteerCancelHoursBefore = options;
            data.volunteerCancelValue = options;
            data.volunteerCancelUnit = options >= 24 && options % 24 === 0 ? 'DAYS' : 'HOURS';
            if (data.volunteerCancelUnit === 'DAYS') {
                data.volunteerCancelValue = options / 24;
            }
        } else if (options) {
            if (options.volunteerCancelUnit && ['DAYS', 'HOURS'].includes(options.volunteerCancelUnit.toUpperCase())) {
                data.volunteerCancelUnit = options.volunteerCancelUnit.toUpperCase();
            }
            if (typeof options.volunteerCancelValue === 'number' && options.volunteerCancelValue >= 0) {
                data.volunteerCancelValue = options.volunteerCancelValue;
                data.minVolunteerCancelHoursBefore = data.volunteerCancelUnit === 'DAYS' ? options.volunteerCancelValue * 24 : options.volunteerCancelValue;
            } else if (typeof options.minVolunteerCancelHoursBefore === 'number' && options.minVolunteerCancelHoursBefore >= 0) {
                data.minVolunteerCancelHoursBefore = options.minVolunteerCancelHoursBefore;
                data.volunteerCancelValue = options.minVolunteerCancelHoursBefore;
            }
        }

        if (applyToAll) {
            await this.prisma.organization.updateMany({
                data,
            });
        } else {
            await this.prisma.organization.update({
                where: { id: organizationId },
                data,
            });
        }
    }

    async getAdvanceBookingSettings(organizationId: string): Promise<{
        advanceBookingLimitEnabled: boolean;
        advanceBookingUnit: string;
        advanceBookingValue: number;
        minAdvanceBookingDays: number;
    }> {
        const org = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                advanceBookingLimitEnabled: true,
                advanceBookingUnit: true,
                advanceBookingValue: true,
                minAdvanceBookingDays: true,
            },
        });
        const unit = org?.advanceBookingUnit || 'DAYS';
        const value = typeof org?.advanceBookingValue === 'number' ? org.advanceBookingValue : (org?.minAdvanceBookingDays ?? 1);
        return {
            advanceBookingLimitEnabled: org?.advanceBookingLimitEnabled ?? true,
            advanceBookingUnit: unit,
            advanceBookingValue: value,
            minAdvanceBookingDays: org?.minAdvanceBookingDays ?? (unit === 'DAYS' ? value : 1),
        };
    }

    async setAdvanceBookingSettings(
        organizationId: string,
        advanceBookingLimitEnabled: boolean,
        options?: {
            advanceBookingUnit?: string;
            advanceBookingValue?: number;
            minAdvanceBookingDays?: number;
        },
        applyToAll?: boolean,
    ): Promise<void> {
        const data: any = { advanceBookingLimitEnabled };

        if (options?.advanceBookingUnit && ['DAYS', 'HOURS'].includes(options.advanceBookingUnit.toUpperCase())) {
            data.advanceBookingUnit = options.advanceBookingUnit.toUpperCase();
        }

        if (typeof options?.advanceBookingValue === 'number' && options.advanceBookingValue >= 0) {
            data.advanceBookingValue = options.advanceBookingValue;
            if (data.advanceBookingUnit === 'DAYS' || (!data.advanceBookingUnit && options?.advanceBookingUnit !== 'HOURS')) {
                data.minAdvanceBookingDays = options.advanceBookingValue;
            }
        } else if (typeof options?.minAdvanceBookingDays === 'number' && options.minAdvanceBookingDays >= 0) {
            data.minAdvanceBookingDays = options.minAdvanceBookingDays;
            data.advanceBookingValue = options.minAdvanceBookingDays;
            data.advanceBookingUnit = 'DAYS';
        }

        if (applyToAll) {
            await this.prisma.organization.updateMany({
                data,
            });
        } else {
            await this.prisma.organization.update({
                where: { id: organizationId },
                data,
            });
        }
    }

    async getDailyBookingLimit(): Promise<number> {
        const value = await this.getSetting('dailyBookingLimit');
        return value ? parseInt(value, 10) : 1000;
    }

    async setDailyBookingLimit(limit: number): Promise<void> {
        await this.setSetting('dailyBookingLimit', limit.toString());
    }

    async getDateSpecificLimit(dateStr: string): Promise<number | null> {
        const value = await this.getSetting(`dailyLimit_${dateStr}`);
        return value ? parseInt(value, 10) : null;
    }

    async setDateSpecificLimit(dateStr: string, limit: number): Promise<void> {
        await this.setSetting(`dailyLimit_${dateStr}`, limit.toString());
    }

    async deleteDateSpecificLimit(dateStr: string): Promise<void> {
        await this.deleteSetting(`dailyLimit_${dateStr}`);
    }

    async getLimitForDate(dateStr: string): Promise<number> {
        const dateLimit = await this.getDateSpecificLimit(dateStr);
        if (dateLimit !== null) {
            return dateLimit;
        }
        return this.getDailyBookingLimit();
    }

    async getAllDateSpecificLimits(): Promise<{ date: string; limit: number }[]> {
        const settings = await this.prisma.settings.findMany({
            where: {
                key: {
                    startsWith: 'dailyLimit_',
                },
            },
        });
        return settings.map(s => ({
            date: s.key.replace('dailyLimit_', ''),
            limit: parseInt(s.value, 10),
        }));
    }

    async getAllSettings(): Promise<{ key: string; value: string }[]> {
        return this.prisma.settings.findMany({
            select: { key: true, value: true },
        });
    }

    async getOrganization(id: string) {
        const org = await this.prisma.organization.findUnique({
            where: { id },
        });

        if (!org) {
            return {
                id,
                name: 'ไม่ระบุชื่อหน่วยงาน',
                lat: null,
                lng: null,
                phone: null,
                logoUrl: null,
            };
        }

        return org;
    }

    async updateOrganizationLogo(id: string, logoUrl: string) {
        let name = 'ไม่ระบุชื่อหน่วยงาน';
        let lat: number | null = null;
        let lng: number | null = null;

        return this.prisma.organization.upsert({
            where: { id },
            update: { logoUrl },
            create: { id, name, lat, lng, logoUrl },
        });
    }

    async updateOrganizationData(id: string, updateData: { lat: number; lng: number; phone?: string }) {
        let name = 'ไม่ระบุชื่อหน่วยงาน';

        const dataToUpdate: any = { lat: updateData.lat, lng: updateData.lng };
        if (updateData.phone !== undefined) {
            dataToUpdate.phone = updateData.phone || null;
        }

        const org = await this.prisma.organization.upsert({
            where: { id },
            update: dataToUpdate,
            create: { id, name, logoUrl: null, lat: updateData.lat, lng: updateData.lng, phone: updateData.phone || null },
        });


        return org;
    }
}
