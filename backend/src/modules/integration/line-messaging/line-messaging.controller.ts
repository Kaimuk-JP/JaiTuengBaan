import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    Param,
    Headers,
    Req,
    Query,
    UseGuards,
    Logger,
    BadRequestException,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import * as express from 'express';
import { LineMessagingService } from './line-messaging.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import type { RichMenuConfig, LineMessage } from './line-messaging.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { Role } from '@prisma/client';
import {
    SendMessageDto,
    SendFlexMessageDto,
    BroadcastMessageDto,
    MulticastMessageDto,
    CreateRichMenuDto,
    LinkLineOauthDto,
    LinkLineLiffDto,
} from './dto/line-messaging.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('LINE Messaging')
@Controller('line-messaging')
export class LineMessagingController {
    private readonly logger = new Logger(LineMessagingController.name);

    constructor(
        private readonly lineMessagingService: LineMessagingService,
        private readonly prisma: PrismaService,
    ) { }

    @Post('webhook')
    @Public()
    @SkipThrottle()
    @HttpCode(HttpStatus.OK)
    async handleWebhook(
        @Req() req: RawBodyRequest<express.Request>,
        @Headers('x-line-signature') signature: string,
        @Body() body: any,
    ) {
        if (!signature) {
            this.logger.warn('Webhook request rejected: Missing X-Line-Signature header');
            throw new BadRequestException('ลายเซ็นไม่ถูกต้อง');
        }

        const rawBody = req.rawBody?.toString() || JSON.stringify(body);

        if (!this.lineMessagingService.validateSignature(rawBody, signature)) {
            this.logger.warn('Webhook request rejected: Invalid signature');
            throw new BadRequestException('ลายเซ็นไม่ถูกต้อง');
        }

        if (!body || typeof body !== 'object') {
            this.logger.warn('Webhook request rejected: Invalid body');
            throw new BadRequestException('ข้อมูลคำขอไม่ถูกต้อง');
        }

        const events = body.events || [];

        const maxEvents = 100;
        if (events.length > maxEvents) {
            this.logger.warn(`Webhook request has too many events: ${events.length}`);
            events.splice(maxEvents);
        }

        for (const event of events) {
            try {
                this.logger.log(`Received LINE event: ${event.type}`);

                switch (event.type) {
                    case 'message':
                        await this.handleMessageEvent(event);
                        break;
                    case 'follow':
                        await this.handleFollowEvent(event);
                        break;
                    case 'unfollow':
                        await this.handleUnfollowEvent(event);
                        break;
                    case 'postback':
                        await this.handlePostbackEvent(event);
                        break;
                    default:
                        this.logger.log(`Unhandled event type: ${event.type}`);
                }
            } catch (eventError) {
                this.logger.error(`Error processing event ${event.type}:`, eventError);
            }
        }

        return { status: 'ok' };
    }

    private async handleMessageEvent(event: any) {
        const { replyToken, source, message } = event;
        const userId = source?.userId;

        if (message.type === 'text') {
            this.logger.log(`Message from ${userId}: ${message.text}`);

            const text = message.text.toLowerCase();

            if (text.includes('จองคิว') || text.includes('booking')) {
                await this.lineMessagingService.replyMessage(replyToken, [{
                    type: 'text',
                    text: ` คุณสามารถจองคิวได้ที่เมนูด้านล่าง หรือกดที่ลิงก์นี้: ${process.env.FRONTEND_URL || 'https://volunteer-eservice.govcenter.co'}`,
                }]);
            } else if (text.includes('สถานะ') || text.includes('status')) {
                await this.lineMessagingService.replyMessage(replyToken, [{
                    type: 'text',
                    text: ' คุณสามารถตรวจสอบสถานะการจองได้ที่เมนู "ประวัติการจอง" ด้านล่าง',
                }]);
            } else if (text.includes('ช่วยเหลือ') || text.includes('help')) {
                await this.lineMessagingService.replyMessage(replyToken, [{
                    type: 'text',
                    text: ' หากต้องการความช่วยเหลือ กรุณาติดต่อเจ้าหน้าที่ผ่านเมนูด้านล่าง หรือโทร xxx-xxx-xxxx',
                }]);
            }
        }
    }

    private async handleFollowEvent(event: any) {
        const { replyToken, source } = event;
        const userId = source?.userId;

        this.logger.log(`New follower: ${userId}`);

        await this.lineMessagingService.replyMessage(replyToken, [{
            type: 'text',
            text: '🙏 สวัสดีครับ/ค่ะ ยินดีต้อนรับสู่ระบบ ใจส่งถึงบ้าน',
        }]);
    }

    private async handleUnfollowEvent(event: any) {
        const userId = event.source?.userId;
        this.logger.log(`User unfollowed: ${userId}`);
    }

    private async handlePostbackEvent(event: any) {
        const { replyToken, postback, source } = event;
        const userId = source?.userId;
        this.logger.log(`Postback data: ${postback.data}`);

        const params = new URLSearchParams(postback.data);
        const action = params.get('action');
        const queueId = params.get('queueId');

        if ((action === 'confirm_queue' || action === 'cancel_queue') && queueId) {
            const parsedQueueId = parseInt(queueId);
            if (isNaN(parsedQueueId)) {
                return;
            }

            const queue = await this.prisma.queue.findUnique({
                where: { id: parsedQueueId },
                select: {
                    id: true,
                    status: true,
                    userId: true,
                    createdBy: true,
                    user: { select: { iamUserId: true, lineUserId: true } },
                    creator: { select: { iamUserId: true, lineUserId: true } },
                },
            });

            if (!queue) {
                await this.lineMessagingService.replyMessage(replyToken, [{
                    type: 'text',
                    text: 'ไม่พบคิวที่ระบุ',
                }]);
                return;
            }

            let isAuthorized = (queue.user?.lineUserId === userId || queue.user?.iamUserId === userId) ||
                               (queue.creator?.lineUserId === userId || queue.creator?.iamUserId === userId);

            if (!isAuthorized && queue.userId) {
                const caregiver = await this.prisma.caregiverPatient.findFirst({
                    where: {
                        patientId: queue.userId,
                        status: 'APPROVED',
                        caregiver: {
                            OR: [
                                { lineUserId: userId },
                                { iamUserId: userId },
                            ],
                        },
                    },
                });
                if (caregiver) {
                    isAuthorized = true;
                }
            }

            if (!isAuthorized) {
                this.logger.warn(`Unauthorized LINE postback attempt by ${userId} on queue ${queueId}`);
                await this.lineMessagingService.replyMessage(replyToken, [{
                    type: 'text',
                    text: 'คุณไม่มีสิทธิ์ในการจัดการคิวนี้',
                }]);
                return;
            }

            if (queue.status === 'CONFIRMED') {
                await this.lineMessagingService.replyMessage(replyToken, [{
                    type: 'text',
                    text: 'คิวนี้ได้รับการยืนยันแล้ว',
                }]);
                return;
            }

            if (queue.status === 'CANCELLED_BY_USER') {
                await this.lineMessagingService.replyMessage(replyToken, [{
                    type: 'text',
                    text: 'คิวนี้ถูกยกเลิกแล้ว',
                }]);
                return;
            }

            if (action === 'confirm_queue') {
                await this.prisma.queue.update({
                    where: { id: parsedQueueId },
                    data: {
                        status: 'CONFIRMED',
                        confirmedByUser: true,
                        confirmedAt: new Date(),
                    },
                });

                this.logger.log(`User ${userId} confirmed queue ${queueId}`);
                await this.lineMessagingService.replyMessage(replyToken, [{
                    type: 'text',
                    text: 'ยืนยันคิวเรียบร้อยแล้ว!',
                }]);
            } else if (action === 'cancel_queue') {
                await this.prisma.queue.update({
                    where: { id: parsedQueueId },
                    data: { status: 'CANCELLED_BY_USER' },
                });

                this.logger.log(`User ${userId} cancelled queue ${queueId}`);
                await this.lineMessagingService.replyMessage(replyToken, [{
                    type: 'text',
                    text: 'ยกเลิกคิวเรียบร้อยแล้ว',
                }]);
            }
        }
    }


    @Post('send')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    async sendMessage(@Body() dto: SendMessageDto) {
        if (dto.iamUserId) {
            await this.lineMessagingService.pushTextMessage(dto.iamUserId, dto.message);
        } else if (dto.userId) {
            await this.lineMessagingService.sendNotificationToUser(dto.userId, dto.message);
        } else {
            throw new BadRequestException('กรุณาระบุ iamUserId หรือ userId');
        }
        return { success: true, message: 'ส่งข้อความสำเร็จ' };
    }

    @Post('send-flex')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    async sendFlexMessage(@Body() dto: SendFlexMessageDto) {
        const message: LineMessage = {
            type: 'flex',
            altText: dto.altText,
            contents: dto.flexMessage,
        };

        if (dto.iamUserId) {
            await this.lineMessagingService.pushMessage(dto.iamUserId, [message]);
        } else {
            throw new BadRequestException('กรุณาระบุ iamUserId');
        }
        return { success: true, message: 'ส่งข้อความสำเร็จ' };
    }

    @Post('broadcast')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async broadcastMessage(@Body() dto: BroadcastMessageDto) {
        await this.lineMessagingService.broadcastMessage([{
            type: 'text',
            text: dto.message,
        }]);
        return { success: true, message: 'ส่งข้อความถึงทุกคนสำเร็จ' };
    }

    @Post('multicast')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    async multicastMessage(@Body() dto: MulticastMessageDto) {
        await this.lineMessagingService.sendNotificationToUsers(dto.userIds, dto.message);
        return { success: true, message: 'ส่งข้อความสำเร็จ' };
    }


    @Get('rich-menu')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async getRichMenus() {
        const richmenus = await this.lineMessagingService.getRichMenuList();
        const defaultId = await this.lineMessagingService.getDefaultRichMenuId();
        return { richmenus, defaultRichMenuId: defaultId };
    }

    @Post('rich-menu')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async createRichMenu(@Body() config: RichMenuConfig) {
        const richMenuId = await this.lineMessagingService.createRichMenu(config);
        return { richMenuId };
    }

    @Post('rich-menu/:id/default')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async setDefaultRichMenu(@Param('id') richMenuId: string) {
        await this.lineMessagingService.setDefaultRichMenu(richMenuId);
        return { success: true, message: 'ตั้งค่าเมนูหลักสำเร็จ' };
    }

    @Delete('rich-menu/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async deleteRichMenu(@Param('id') richMenuId: string) {
        await this.lineMessagingService.deleteRichMenu(richMenuId);
        return { success: true, message: 'ลบเมนูสำเร็จ' };
    }

    @Post('rich-menu/:id/user/:iamUserId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async linkRichMenuToUser(
        @Param('id') richMenuId: string,
        @Param('iamUserId') iamUserId: string,
    ) {
        await this.lineMessagingService.linkRichMenuToUser(iamUserId, richMenuId);
        return { success: true, message: 'เชื่อมโยงเมนูกับผู้ใช้สำเร็จ' };
    }

    @Get('auth-url')
    @Public()
    async getAuthUrl(
        @Query('redirectUri') redirectUri: string,
        @Query('state') state?: string,
        @Query('orgId') orgId?: string,
    ) {
        if (!redirectUri) {
            throw new BadRequestException('redirectUri is required');
        }
        const authUrl = await this.lineMessagingService.getLineAuthUrl(redirectUri, state, orgId);
        return { authUrl };
    }

    @Get('status')
    @UseGuards(JwtAuthGuard)
    async getLineStatus(@Req() req: any) {
        return this.lineMessagingService.getUserLineStatus(req.user.userId);
    }

    @Post('link-oauth')
    @UseGuards(JwtAuthGuard)
    async linkAccountWithOauth(
        @Req() req: any,
        @Body() dto: LinkLineOauthDto,
    ) {
        if (!dto.code || !dto.redirectUri) {
            throw new BadRequestException('รหัสยืนยันและ redirectUri จำเป็นต้องระบุ');
        }
        const profile = await this.lineMessagingService.exchangeCodeForProfile(
            dto.code,
            dto.redirectUri,
            req.user.userId,
        );
        return this.lineMessagingService.linkUserLineAccount(req.user.userId, profile);
    }

    @Post('link-liff')
    @UseGuards(JwtAuthGuard)
    async linkAccountWithLiff(
        @Req() req: any,
        @Body() dto: LinkLineLiffDto,
    ) {
        let profile: { lineUserId: string; displayName?: string; pictureUrl?: string };

        if (dto.idToken) {
            profile = await this.lineMessagingService.verifyLiffIdToken(dto.idToken, req.user.userId);
        } else if (dto.lineUserId) {
            profile = {
                lineUserId: dto.lineUserId,
                displayName: dto.displayName,
                pictureUrl: dto.pictureUrl,
            };
        } else {
            throw new BadRequestException('idToken หรือ lineUserId จำเป็นต้องระบุ');
        }

        return this.lineMessagingService.linkUserLineAccount(req.user.userId, profile);
    }

    @Post('unlink')
    @UseGuards(JwtAuthGuard)
    async unlinkAccount(@Req() req: any) {
        return this.lineMessagingService.unlinkUserLineAccount(req.user.userId);
    }
}
