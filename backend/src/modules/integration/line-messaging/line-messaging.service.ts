import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../../../core/config/config';
import { PrismaService } from '../../../core/prisma/prisma.service';
import * as crypto from 'crypto';

export interface LineTextMessage {
    type: 'text';
    text: string;
}

export interface LineFlexMessage {
    type: 'flex';
    altText: string;
    contents: any;
}

export interface LineStickerMessage {
    type: 'sticker';
    packageId: string;
    stickerId: string;
}

export type LineMessage = LineTextMessage | LineFlexMessage | LineStickerMessage;

export interface RichMenuArea {
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    action: {
        type: 'uri' | 'message' | 'postback' | 'richmenuswitch';
        uri?: string;
        text?: string;
        data?: string;
        label?: string;
        richMenuAliasId?: string;
    };
}

export interface RichMenuConfig {
    size: {
        width: 2500 | 1200;
        height: number;
    };
    selected: boolean;
    name: string;
    chatBarText: string;
    areas: RichMenuArea[];
}

@Injectable()
export class LineMessagingService implements OnModuleInit {
    private readonly logger = new Logger(LineMessagingService.name);
    private readonly baseUrl = 'https://api.line.me/v2/bot';
    private accessToken: string;
    private channelSecret: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        this.accessToken = this.configService.lineMessagingAccessToken;
        this.channelSecret = this.configService.lineMessagingChannelSecret;
    }

    async onModuleInit() {
        if (!this.accessToken) {
            this.logger.warn('LINE Messaging Access Token is not configured. LINE messaging will be disabled.');
            return;
        }
        this.logger.log('LINE Messaging Service initialized');
    }

        validateSignature(body: string, signature: string): boolean {
        const hash = crypto
            .createHmac('SHA256', this.channelSecret)
            .update(body)
            .digest('base64');

        const hashBuffer = Buffer.from(hash);
        const sigBuffer = Buffer.from(signature);
        if (hashBuffer.length !== sigBuffer.length) {
            return false;
        }
        return crypto.timingSafeEqual(hashBuffer, sigBuffer);
    }

    private async lineRequest(endpoint: string, method: string = 'POST', body?: any, tokenOverride?: string): Promise<any> {
        const token = tokenOverride || this.accessToken;
        if (!token) {
            this.logger.warn('LINE Messaging is not configured. Skipping request.');
            return null;
        }

        const url = `${this.baseUrl}${endpoint}`;
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };

        try {
            const response = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });

            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`LINE API Error: ${response.status} - ${errorText}`);
                throw new Error('ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง');
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return null;
        } catch (error) {
            this.logger.error(`Failed to make LINE API request: ${error.message}`);
            throw error;
        }
    }

    async pushMessage(iamUserId: string, messages: LineMessage[], tokenOverride?: string): Promise<void> {
        try {
            await this.lineRequest('/message/push', 'POST', {
                to: iamUserId,
                messages: messages.slice(0, 5),
            }, tokenOverride);
            this.logger.log(`Push message sent to user: ${iamUserId}`);
        } catch (error) {
            this.logger.error(`Failed to push message to ${iamUserId}: ${error.message}`);
            throw error;
        }
    }

    async pushTextMessage(iamUserId: string, text: string, tokenOverride?: string): Promise<void> {
        await this.pushMessage(iamUserId, [{ type: 'text', text }], tokenOverride);
    }

        async replyMessage(replyToken: string, messages: LineMessage[]): Promise<void> {
        try {
            await this.lineRequest('/message/reply', 'POST', {
                replyToken,
                messages: messages.slice(0, 5),
            });
            this.logger.log(`Reply message sent with token: ${replyToken.substring(0, 10)}...`);
        } catch (error) {
            this.logger.error(`Failed to reply message: ${error.message}`);
            throw error;
        }
    }

        async multicastMessage(iamUserIds: string[], messages: LineMessage[]): Promise<void> {
        const chunks = this.chunkArray(iamUserIds, 500);

        for (const chunk of chunks) {
            try {
                await this.lineRequest('/message/multicast', 'POST', {
                    to: chunk,
                    messages: messages.slice(0, 5),
                });
                this.logger.log(`Multicast message sent to ${chunk.length} users`);
            } catch (error) {
                this.logger.error(`Failed to multicast message: ${error.message}`);
            }
        }
    }

        async broadcastMessage(messages: LineMessage[]): Promise<void> {
        try {
            await this.lineRequest('/message/broadcast', 'POST', {
                messages: messages.slice(0, 5),
            });
            this.logger.log('Broadcast message sent');
        } catch (error) {
            this.logger.error(`Failed to broadcast message: ${error.message}`);
            throw error;
        }
    }

        async getUserProfile(iamUserId: string): Promise<any> {
        try {
            return await this.lineRequest(`/profile/${iamUserId}`, 'GET');
        } catch (error) {
            this.logger.error(`Failed to get profile for ${iamUserId}: ${error.message}`);
            return null;
        }
    }


    async isLineNotificationEnabledForIamOrLineId(targetId: string): Promise<boolean> {
        try {
            const user = await this.prisma.user.findFirst({
                where: {
                    OR: [
                        { lineUserId: targetId },
                        { iamUserId: targetId },
                    ],
                },
                select: {
                    organizationId: true,
                    organization: {
                        select: { lineNotificationEnabled: true },
                    },
                },
            });
            if (user?.organization) {
                return user.organization.lineNotificationEnabled;
            }
            const firstOrg = await this.prisma.organization.findFirst({
                select: { lineNotificationEnabled: true },
            });
            return firstOrg?.lineNotificationEnabled ?? true;
        } catch {
            return true;
        }
    }

    async isLineNotificationEnabledForUser(userId: string): Promise<boolean> {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    organizationId: true,
                    organization: {
                        select: { lineNotificationEnabled: true },
                    },
                },
            });
            if (user?.organization) {
                return user.organization.lineNotificationEnabled;
            }
            const firstOrg = await this.prisma.organization.findFirst({
                select: { lineNotificationEnabled: true },
            });
            return firstOrg?.lineNotificationEnabled ?? true;
        } catch {
            return true;
        }
    }

    async sendQueueConfirmationMessage(
        iamUserId: string,
        queueData: {
            queueId: number;
            hospitalName: string;
            appointmentDate: string;
            appointmentTime: string;
            patientName: string;
        }
    ): Promise<void> {
        const isEnabled = await this.isLineNotificationEnabledForIamOrLineId(iamUserId);
        if (!isEnabled) {
            this.logger.log(`LINE notification is disabled by organization for ${iamUserId}. Skipping queue confirmation.`);
            return;
        }

        const flexMessage: LineFlexMessage = {
            type: 'flex',
            altText: 'กรุณายืนยันการจองคิว',
            contents: {
                type: 'bubble',
                header: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [{ type: 'text', text: 'กรุณายืนยันการจองคิว', color: '#1e7d55', weight: 'bold', size: 'xl' }],
                    backgroundColor: '#f0fdf4',
                    paddingAll: '20px',
                },
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        { type: 'separator', margin: 'lg' },
                        { type: 'text', text: queueData.hospitalName, size: 'sm', margin: 'lg', weight: 'bold' },
                        { type: 'text', text: queueData.appointmentDate, size: 'sm', margin: 'sm', color: '#666666' },
                        { type: 'text', text: queueData.appointmentTime, size: 'sm', margin: 'sm', color: '#666666' },
                    ],
                    paddingAll: '20px',
                },
                footer: {
                    type: 'box',
                    layout: 'horizontal',
                    spacing: 'sm',
                    contents: [
                        { type: 'button', style: 'secondary', action: { type: 'postback', label: 'ยกเลิก', data: `action=cancel_queue&queueId=${queueData.queueId}` } },
                        { type: 'button', style: 'primary', color: '#1e7d55', action: { type: 'postback', label: 'ยืนยัน', data: `action=confirm_queue&queueId=${queueData.queueId}` } },
                    ],
                    paddingAll: '15px',
                },
            },
        };
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { lineUserId: iamUserId },
                    { iamUserId: iamUserId },
                ],
            },
            select: {
                organization: {
                    select: {
                        lineUseCustomOa: true,
                        lineChannelAccessToken: true,
                    },
                },
            },
        });
        const customToken = (user?.organization?.lineUseCustomOa && user.organization.lineChannelAccessToken)
            ? user.organization.lineChannelAccessToken
            : undefined;

        await this.pushMessage(iamUserId, [flexMessage], customToken);
        this.logger.log(`Queue confirmation sent to ${iamUserId}`);
    }

    async sendQueueApprovedMessage(
        iamUserId: string,
        queueData: {
            queueId: number;
            hospitalName: string;
            appointmentDate: string;
            appointmentTime: string;
            patientName: string;
        }
    ): Promise<void> {
        const isEnabled = await this.isLineNotificationEnabledForIamOrLineId(iamUserId);
        if (!isEnabled) {
            this.logger.log(`LINE notification is disabled by organization for ${iamUserId}. Skipping queue approved notification.`);
            return;
        }

        const flexMessage: LineFlexMessage = {
            type: 'flex',
            altText: 'การจองได้รับการยืนยันแล้ว',
            contents: {
                type: 'bubble',
                header: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [{ type: 'text', text: 'การจองได้รับการยืนยันแล้ว', color: '#1e7d55', weight: 'bold', size: 'xl' }],
                    backgroundColor: '#f0fdf4',
                    paddingAll: '20px',
                },
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        { type: 'text', text: queueData.patientName, size: 'sm', weight: 'bold' },
                        { type: 'separator', margin: 'lg' },
                        { type: 'text', text: queueData.hospitalName, size: 'sm', margin: 'lg', weight: 'bold' },
                        { type: 'text', text: queueData.appointmentDate, size: 'sm', margin: 'sm', color: '#666666' },
                        { type: 'text', text: queueData.appointmentTime, size: 'sm', margin: 'sm', color: '#666666' },
                        { type: 'text', text: 'ระบบยืนยันการจองให้แล้ว', size: 'sm', margin: 'lg', color: '#1e7d55', wrap: true },
                    ],
                    paddingAll: '20px',
                },
            },
        };

        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { lineUserId: iamUserId },
                    { iamUserId: iamUserId },
                ],
            },
            select: {
                organization: {
                    select: {
                        lineUseCustomOa: true,
                        lineChannelAccessToken: true,
                    },
                },
            },
        });
        const customToken = (user?.organization?.lineUseCustomOa && user.organization.lineChannelAccessToken)
            ? user.organization.lineChannelAccessToken
            : undefined;

        await this.pushMessage(iamUserId, [flexMessage], customToken);
        this.logger.log(`Queue approved notification sent to ${iamUserId}`);
    }



        async createRichMenu(config: RichMenuConfig): Promise<string | null> {
        try {
            const result = await this.lineRequest('/richmenu', 'POST', config);
            this.logger.log(`Rich Menu created with ID: ${result?.richMenuId}`);
            return result?.richMenuId || null;
        } catch (error) {
            this.logger.error(`Failed to create Rich Menu: ${error.message}`);
            throw error;
        }
    }

        async uploadRichMenuImage(richMenuId: string, imageBuffer: Uint8Array, contentType: string = 'image/png'): Promise<void> {
        if (!this.accessToken) {
            this.logger.warn('LINE Messaging is not configured. Skipping upload.');
            return;
        }

        const url = `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': contentType,
                },
                body: imageBuffer as unknown as BodyInit,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error('ไม่สามารถอัพโหลดรูปเมนูได้ กรุณาลองใหม่อีกครั้ง');
            }

            this.logger.log(`Rich Menu image uploaded for: ${richMenuId}`);
        } catch (error) {
            this.logger.error(`Failed to upload Rich Menu image: ${error.message}`);
            throw error;
        }
    }

        async setDefaultRichMenu(richMenuId: string): Promise<void> {
        await this.lineRequest(`/user/all/richmenu/${richMenuId}`, 'POST');
        this.logger.log(`Default Rich Menu set to: ${richMenuId}`);
    }

        async linkRichMenuToUser(iamUserId: string, richMenuId: string): Promise<void> {
        await this.lineRequest(`/user/${iamUserId}/richmenu/${richMenuId}`, 'POST');
        this.logger.log(`Rich Menu ${richMenuId} linked to user: ${iamUserId}`);
    }

        async unlinkRichMenuFromUser(iamUserId: string): Promise<void> {
        await this.lineRequest(`/user/${iamUserId}/richmenu`, 'DELETE');
        this.logger.log(`Rich Menu unlinked from user: ${iamUserId}`);
    }

        async getRichMenuList(): Promise<any[]> {
        const result = await this.lineRequest('/richmenu/list', 'GET');
        return result?.richmenus || [];
    }

    async deleteRichMenu(richMenuId: string): Promise<void> {
        await this.lineRequest(`/richmenu/${richMenuId}`, 'DELETE');
        this.logger.log(`Rich Menu deleted: ${richMenuId}`);
    }

    async getDefaultRichMenuId(): Promise<string | null> {
        try {
            const result = await this.lineRequest('/user/all/richmenu', 'GET');
            return result?.richMenuId || null;
        } catch (error) {
            return null;
        }
    }

    async sendNotificationToUser(userId: string, message: string): Promise<boolean> {
        try {
            const isEnabled = await this.isLineNotificationEnabledForUser(userId);
            if (!isEnabled) {
                this.logger.log(`LINE notification is disabled by organization for user: ${userId}. Skipping.`);
                return false;
            }

            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    iamUserId: true,
                    lineUserId: true,
                    organization: {
                        select: {
                            lineUseCustomOa: true,
                            lineChannelAccessToken: true,
                        },
                    },
                },
            });

            const targetId = user?.lineUserId || user?.iamUserId;
            if (!targetId) {
                this.logger.warn(`User ${userId} does not have a LINE user ID or IAM ID`);
                return false;
            }

            const customToken = (user?.organization?.lineUseCustomOa && user.organization.lineChannelAccessToken)
                ? user.organization.lineChannelAccessToken
                : undefined;

            await this.pushTextMessage(targetId, message, customToken);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send notification to user ${userId}: ${error.message}`);
            return false;
        }
    }

    async sendNotificationToUsers(userIds: string[], message: string): Promise<void> {
        const users = await this.prisma.user.findMany({
            where: {
                id: { in: userIds },
                OR: [
                    { organization: { lineNotificationEnabled: true } },
                    { organizationId: null },
                ],
            },
            select: { iamUserId: true, lineUserId: true },
        });

        const targetIds = users
            .map(u => u.lineUserId || u.iamUserId)
            .filter((id): id is string => !!id);

        if (targetIds.length > 0) {
            await this.multicastMessage(targetIds, [{ type: 'text', text: message }]);
        }
    }

    async sendNotificationToRole(role: string, message: string): Promise<void> {
        const users = await this.prisma.user.findMany({
            where: {
                role: role as any,
                OR: [
                    { organization: { lineNotificationEnabled: true } },
                    { organizationId: null },
                ],
            },
            select: { iamUserId: true, lineUserId: true },
        });

        const targetIds = users
            .map(u => u.lineUserId || u.iamUserId)
            .filter((id): id is string => !!id);

        if (targetIds.length > 0) {
            await this.multicastMessage(targetIds, [{ type: 'text', text: message }]);
        }
    }

    async getLineAuthUrl(redirectUri: string, state: string = '', orgId?: string): Promise<string> {
        let channelId = this.configService.lineChannelId;
        if (orgId) {
            const org = await this.prisma.organization.findUnique({
                where: { id: orgId },
                select: { lineUseCustomOa: true, lineChannelId: true },
            });
            if (org?.lineUseCustomOa && org.lineChannelId) {
                channelId = org.lineChannelId;
            }
        }
        if (!channelId) {
            throw new Error('LINE Channel ID is not configured');
        }
        const encodedRedirect = encodeURIComponent(redirectUri);
        const encodedState = encodeURIComponent(state);
        return `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${encodedRedirect}&state=${encodedState}&scope=profile%20openid&bot_prompt=normal`;
    }

    async exchangeCodeForProfile(
        code: string,
        redirectUri: string,
        userId?: string,
    ): Promise<{ lineUserId: string; displayName: string; pictureUrl?: string }> {
        let channelId = this.configService.lineChannelId;
        let channelSecret = this.configService.lineChannelSecret;

        if (userId) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    organization: {
                        select: {
                            lineUseCustomOa: true,
                            lineChannelId: true,
                            lineChannelSecret: true,
                        },
                    },
                },
            });
            if (user?.organization?.lineUseCustomOa && user.organization.lineChannelId && user.organization.lineChannelSecret) {
                channelId = user.organization.lineChannelId;
                channelSecret = user.organization.lineChannelSecret;
            }
        }

        if (!channelId || !channelSecret) {
            throw new Error('LINE Channel configuration is incomplete');
        }

        const tokenUrl = 'https://api.line.me/oauth2/v2.1/token';
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: channelId,
            client_secret: channelSecret,
        });

        const tokenRes = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        if (!tokenRes.ok) {
            const err = await tokenRes.text();
            this.logger.error(`Failed to exchange LINE code for token: ${tokenRes.status} ${err}`);
            throw new Error('ไม่สามารถเชื่อมต่อกับ LINE ได้ กรุณาลองใหม่อีกครั้ง');
        }

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        const profileRes = await fetch('https://api.line.me/v2/profile', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!profileRes.ok) {
            const err = await profileRes.text();
            this.logger.error(`Failed to get LINE profile: ${profileRes.status} ${err}`);
            throw new Error('ไม่สามารถดึงข้อมูลโปรไฟล์ LINE ได้');
        }

        const profileData = await profileRes.json();
        return {
            lineUserId: profileData.userId,
            displayName: profileData.displayName,
            pictureUrl: profileData.pictureUrl,
        };
    }

    async verifyLiffIdToken(idToken: string, userId?: string): Promise<{ lineUserId: string; displayName: string; pictureUrl?: string }> {
        let channelId = this.configService.lineChannelId;

        if (userId) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    organization: {
                        select: {
                            lineUseCustomOa: true,
                            lineChannelId: true,
                        },
                    },
                },
            });
            if (user?.organization?.lineUseCustomOa && user.organization.lineChannelId) {
                channelId = user.organization.lineChannelId;
            }
        }

        const res = await fetch('https://api.line.me/oauth2/v2.1/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                id_token: idToken,
                client_id: channelId || '',
            }).toString(),
        });

        if (!res.ok) {
            const err = await res.text();
            this.logger.error(`Failed to verify LIFF id_token: ${res.status} ${err}`);
            throw new Error('การยืนยันตัวตนผ่าน LIFF ไม่ถูกต้อง');
        }

        const data = await res.json();
        return {
            lineUserId: data.sub,
            displayName: data.name || '',
            pictureUrl: data.picture,
        };
    }

    async linkUserLineAccount(
        userId: string,
        lineProfile: { lineUserId: string; displayName?: string; pictureUrl?: string },
    ): Promise<{ success: boolean; message: string; user: any }> {
        await this.prisma.user.updateMany({
            where: {
                lineUserId: lineProfile.lineUserId,
                id: { not: userId },
            },
            data: {
                lineUserId: null,
                lineDisplayName: null,
                linePictureUrl: null,
                lineConnectedAt: null,
            },
        });

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                lineUserId: lineProfile.lineUserId,
                lineDisplayName: lineProfile.displayName,
                linePictureUrl: lineProfile.pictureUrl,
                lineConnectedAt: new Date(),
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                lineUserId: true,
                lineDisplayName: true,
                linePictureUrl: true,
                lineConnectedAt: true,
            },
        });

        try {
            const userWithOrg = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    organization: {
                        select: {
                            lineUseCustomOa: true,
                            lineChannelAccessToken: true,
                        },
                    },
                },
            });
            const customToken = (userWithOrg?.organization?.lineUseCustomOa && userWithOrg.organization.lineChannelAccessToken)
                ? userWithOrg.organization.lineChannelAccessToken
                : undefined;

            const fullName = updatedUser.firstName ? `${updatedUser.firstName} ${updatedUser.lastName || ''}`.trim() : '';
            const displayName = fullName || lineProfile.displayName || '';

            const welcomeMessage = displayName
                ? `🎉 ยินดีต้อนรับคุณ ${displayName}\nผูกบัญชี ใจส่งถึงบ้าน สำเร็จเรียบร้อยแล้ว!\n\nคุณจะได้รับการแจ้งเตือนคิวรถรับ-ส่ง และข้อมูลสถานะการเดินทางผ่าน LINE นี้อัตโนมัติ ขอบคุณที่ร่วมเป็นส่วนหนึ่งของชุมชนเราค่ะ/ครับ`
                : `🎉 ผูกบัญชี ใจส่งถึงบ้าน สำเร็จเรียบร้อยแล้ว!\n\nคุณจะได้รับการแจ้งเตือนคิวรถรับ-ส่ง และข่าวสารสำคัญผ่าน LINE นี้อัตโนมัติ ขอบคุณที่ร่วมเป็นส่วนหนึ่งของชุมชนเราค่ะ/ครับ`;

            await this.pushTextMessage(
                lineProfile.lineUserId,
                welcomeMessage,
                customToken,
            );
        } catch (e: any) {
            this.logger.warn(`Could not send welcome LINE message: ${e.message}`);
        }

        return {
            success: true,
            message: 'ผูกบัญชี LINE เรียบร้อยแล้ว',
            user: updatedUser,
        };
    }

    async unlinkUserLineAccount(userId: string): Promise<{ success: boolean; message: string }> {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                lineUserId: null,
                lineDisplayName: null,
                linePictureUrl: null,
                lineConnectedAt: null,
            },
        });

        return {
            success: true,
            message: 'ยกเลิกการผูกบัญชี LINE เรียบร้อยแล้ว',
        };
    }

    async getUserLineStatus(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                organizationId: true,
                organization: {
                    select: {
                        name: true,
                        lineNotificationEnabled: true,
                        lineUseCustomOa: true,
                        lineBotBasicId: true,
                        lineLiffId: true,
                    },
                },
                lineUserId: true,
                lineDisplayName: true,
                linePictureUrl: true,
                lineConnectedAt: true,
            },
        });

        let lineNotificationEnabled = true;
        let lineUseCustomOa = false;
        let lineBotBasicId: string | null = null;
        let customLiffId: string | null = null;
        let organizationName: string | null = null;

        if (user?.organization) {
            lineNotificationEnabled = user.organization.lineNotificationEnabled;
            lineUseCustomOa = user.organization.lineUseCustomOa;
            lineBotBasicId = user.organization.lineBotBasicId || null;
            customLiffId = user.organization.lineLiffId || null;
            organizationName = user.organization.name || null;
        } else {
            const firstOrg = await this.prisma.organization.findFirst({ select: { lineNotificationEnabled: true } });
            if (firstOrg) lineNotificationEnabled = firstOrg.lineNotificationEnabled;
        }

        return {
            isLinked: !!user?.lineUserId,
            lineUserId: user?.lineUserId || null,
            lineDisplayName: user?.lineDisplayName || null,
            linePictureUrl: user?.linePictureUrl || null,
            pictureUrl: user?.linePictureUrl || null,
            lineConnectedAt: user?.lineConnectedAt || null,
            connectedAt: user?.lineConnectedAt || null,
            lineNotificationEnabled,
            lineUseCustomOa,
            lineBotBasicId,
            customLiffId,
            organizationName,
            organizationId: user?.organizationId || null,
        };
    }

        createBookingConfirmationMessage(params: {
        hospitalName: string;
        date: string;
        time: string;
        queueId: number;
        liffUrl: string;
    }): LineFlexMessage {
        return {
            type: 'flex',
            altText: `การจองคิว ${params.hospitalName} ได้รับการอนุมัติ`,
            contents: {
                type: 'bubble',
                header: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: ' การจองได้รับการอนุมัติ',
                            weight: 'bold',
                            size: 'lg',
                            color: '#1DB446',
                        },
                    ],
                    backgroundColor: '#E8F5E9',
                    paddingAll: '15px',
                },
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: params.hospitalName,
                            weight: 'bold',
                            size: 'xl',
                            wrap: true,
                        },
                        {
                            type: 'separator',
                            margin: 'lg',
                        },
                        {
                            type: 'box',
                            layout: 'vertical',
                            margin: 'lg',
                            spacing: 'sm',
                            contents: [
                                {
                                    type: 'box',
                                    layout: 'horizontal',
                                    contents: [
                                        { type: 'text', text: ' วันที่', size: 'sm', color: '#666666', flex: 2 },
                                        { type: 'text', text: params.date, size: 'sm', color: '#333333', flex: 4 },
                                    ],
                                },
                                {
                                    type: 'box',
                                    layout: 'horizontal',
                                    contents: [
                                        { type: 'text', text: ' เวลา', size: 'sm', color: '#666666', flex: 2 },
                                        { type: 'text', text: params.time, size: 'sm', color: '#333333', flex: 4 },
                                    ],
                                },
                            ],
                        },
                    ],
                    paddingAll: '15px',
                },
                footer: {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'sm',
                    contents: [
                        {
                            type: 'button',
                            style: 'primary',
                            height: 'sm',
                            action: {
                                type: 'uri',
                                label: 'ยืนยันการจอง',
                                uri: `${params.liffUrl}/elderly/bookings`,
                            },
                        },
                    ],
                    paddingAll: '15px',
                },
            },
        };
    }

        createJobAssignmentMessage(params: {
        patientName: string;
        hospitalName: string;
        date: string;
        time: string;
        jobId: number;
        liffUrl: string;
    }): LineFlexMessage {
        return {
            type: 'flex',
            altText: `คุณได้รับมอบหมายงานใหม่`,
            contents: {
                type: 'bubble',
                header: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: 'งานใหม่สำหรับคุณ',
                            weight: 'bold',
                            size: 'lg',
                            color: '#1976D2',
                        },
                    ],
                    backgroundColor: '#E3F2FD',
                    paddingAll: '15px',
                },
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: `ช่วยเหลือ: ${params.patientName}`,
                            weight: 'bold',
                            size: 'md',
                            wrap: true,
                        },
                        {
                            type: 'text',
                            text: `ไปที่: ${params.hospitalName}`,
                            size: 'sm',
                            wrap: true,
                            margin: 'md',
                            color: '#666666',
                        },
                        {
                            type: 'separator',
                            margin: 'lg',
                        },
                        {
                            type: 'box',
                            layout: 'vertical',
                            margin: 'lg',
                            spacing: 'sm',
                            contents: [
                                {
                                    type: 'box',
                                    layout: 'horizontal',
                                    contents: [
                                        { type: 'text', text: '📅 วันที่', size: 'sm', color: '#666666', flex: 2 },
                                        { type: 'text', text: params.date, size: 'sm', color: '#333333', flex: 4 },
                                    ],
                                },
                                {
                                    type: 'box',
                                    layout: 'horizontal',
                                    contents: [
                                        { type: 'text', text: ' เวลา', size: 'sm', color: '#666666', flex: 2 },
                                        { type: 'text', text: params.time, size: 'sm', color: '#333333', flex: 4 },
                                    ],
                                },
                            ],
                        },
                    ],
                    paddingAll: '15px',
                },
                footer: {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'sm',
                    contents: [
                        {
                            type: 'button',
                            style: 'primary',
                            height: 'sm',
                            action: {
                                type: 'uri',
                                label: 'ดูรายละเอียดงาน',
                                uri: `${params.liffUrl}/volunteer/work-calendar`,
                            },
                        },
                    ],
                    paddingAll: '15px',
                },
            },
        };
    }

    private chunkArray<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
}
