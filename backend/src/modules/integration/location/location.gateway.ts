import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
    LOCATION_LOG_STATUSES,
    jobStatusToLeg,
    type LocationLeg,
} from '../../../common/helpers/location-trail.helper';

const STAFF_ROLES = new Set(['STAFF', 'EXECUTIVE', 'ADMIN']);

type JobLatestLocation = {
    jobId: number;
    driverId: string;
    source: string;
    lat: number;
    lng: number;
    recordedAt: string;
};

@Injectable()
@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true,
    },
})
export class LocationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(LocationGateway.name);

    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) { }

    @WebSocketServer()
    server: Server;

    private locations: Map<string, { id: string; lat: number; lng: number }> = new Map();
    private authenticatedClients: Map<string, string> = new Map();
    private clientRoles: Map<string, string> = new Map();
    private clientVolunteers: Map<string, string> = new Map();
    private clientTrackers: Map<string, string> = new Map();
    private jobLatestLocations: Map<number, JobLatestLocation> = new Map();

    private jobRoom(jobId: number) {
        return `job:${jobId}`;
    }

    async handleConnection(client: Socket) {
        try {
            const cookies = client.handshake.headers.cookie;
            let token: string | undefined;

            if (cookies) {
                const accessTokenMatch = cookies.match(/access_token=([^;]+)/);
                if (accessTokenMatch) {
                    token = accessTokenMatch[1];
                }
            }

            if (!token) {
                const authHeader = client.handshake.headers.authorization;
                if (authHeader?.startsWith('Bearer ')) {
                    token = authHeader.substring(7);
                }
            }

            if (!token) {
                this.logger.warn(` WebSocket connection rejected: No token provided (${client.id})`);
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token);
            const userId = payload.sub;

            this.authenticatedClients.set(client.id, userId);

            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, role: true }
            });

            if (!user) {
                client.disconnect();
                return;
            }

            if (!user.role) {
                client.disconnect();
                return;
            }

            this.clientRoles.set(client.id, user.role);

            if (user.role === 'DRIVE') {
                this.clientVolunteers.set(client.id, user.id);
                this.clientTrackers.set(client.id, user.id);
                this.logger.log(`WebSocket authenticated: User ${userId} (DRIVE ${user.id}) (${client.id})`);
            } else if (user.role === 'CAREU') {
                this.clientTrackers.set(client.id, user.id);
                this.logger.log(`WebSocket authenticated: User ${userId} (CAREU ${user.id}) (${client.id})`);
            } else {
                this.logger.log(`WebSocket authenticated: User ${userId} (${client.id})`);
            }

            const allLocations = Array.from(this.locations.values());
            client.emit('initialLocations', allLocations);
        } catch (error) {
            this.logger.warn(` WebSocket connection rejected: Invalid token (${client.id})`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.locations.delete(client.id);
        this.authenticatedClients.delete(client.id);
        this.clientRoles.delete(client.id);
        this.clientVolunteers.delete(client.id);
        this.clientTrackers.delete(client.id);
        this.server.emit('userDisconnected', client.id);
    }

    @SubscribeMessage('updateLocation')
    async handleUpdateLocation(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { lat: number; lng: number }
    ) {
        const vltId = this.clientVolunteers.get(client.id);

        if (!vltId) {
            return;
        }

        const locationData = {
            id: String(vltId),
            lat: data.lat,
            lng: data.lng
        };

        this.locations.set(locationData.id, locationData);

        try {
            await this.prisma.user.update({
                where: { id: vltId },
                data: {
                    lat: data.lat,
                    lng: data.lng,
                },
            });
            this.logger.debug(`Updated location for volunteer ${vltId}: ${data.lat}, ${data.lng}`);
        } catch (error) {
            this.logger.error(`Failed to save location for volunteer ${vltId}:`, error);
        }

        this.server.emit('locationUpdated', locationData);
    }

    private parseRecordedAt(value?: string): Date {
        if (!value) return new Date();
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return new Date();
        const now = Date.now();
        const ts = parsed.getTime();
        if (ts > now + 60_000) return new Date();
        if (ts < now - 24 * 60 * 60 * 1000) return new Date();
        return parsed;
    }

    private haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6_371_000;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private isPlausibleLocation(
        lat: number,
        lng: number,
        last?: { lat: number; lng: number },
    ): boolean {
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
        if (Math.abs(lat) < 1e-6 && Math.abs(lng) < 1e-6) return false;
        if (lat < 5 || lat > 21 || lng < 97 || lng > 106) return false;
        if (last && this.haversineMeters(last.lat, last.lng, lat, lng) > 20_000) return false;
        return true;
    }

    private async persistJobLocation(
        trackerId: string,
        source: 'DRIVE' | 'CAREU',
        data: { jobId: number; lat: number; lng: number; recordedAt?: string },
        job: { id: number; vltId: string | null; careuId: string | null; status: string },
    ) {
        if (!LOCATION_LOG_STATUSES.has(job.status)) {
            return;
        }

        const leg = jobStatusToLeg(job.status);

        const last = this.jobLatestLocations.get(job.id);
        if (!this.isPlausibleLocation(data.lat, data.lng, last)) {
            this.logger.warn(
                `Rejected implausible location for job ${job.id}: ${data.lat}, ${data.lng}`,
            );
            return;
        }

        const recordedAt = this.parseRecordedAt(data.recordedAt);
        const movedMeters = last
            ? this.haversineMeters(last.lat, last.lng, data.lat, data.lng)
            : Number.POSITIVE_INFINITY;

        const payload: JobLatestLocation & { leg: LocationLeg } = {
            jobId: job.id,
            driverId: trackerId,
            source,
            leg,
            lat: data.lat,
            lng: data.lng,
            recordedAt: recordedAt.toISOString(),
        };

        this.jobLatestLocations.set(job.id, payload);
        this.locations.set(String(trackerId), { id: String(trackerId), lat: data.lat, lng: data.lng });
        this.server.to(this.jobRoom(job.id)).emit('location:updated', payload);

        if (last && movedMeters < 12) {
            return;
        }

        await this.prisma.jobLocationLog.create({
            data: {
                jobId: job.id,
                driverId: trackerId,
                source,
                leg,
                lat: data.lat,
                lng: data.lng,
                recordedAt,
            },
        });

        await this.prisma.user.update({
            where: { id: trackerId },
            data: { lat: data.lat, lng: data.lng },
        });
    }

    @SubscribeMessage('driver:update_location')
    async handleDriverUpdateLocation(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { jobId: number; lat: number; lng: number; recordedAt?: string },
    ) {
        const trackerId = this.clientTrackers.get(client.id);
        if (!trackerId || !data?.jobId || data.lat == null || data.lng == null) {
            return;
        }

        const job = await this.prisma.job.findUnique({
            where: { id: Number(data.jobId) },
            select: { id: true, vltId: true, careuId: true, status: true },
        });

        if (!job || job.vltId !== trackerId) {
            return;
        }

        try {
            await this.persistJobLocation(trackerId, 'DRIVE', data, job);
        } catch (error) {
            this.logger.error(`Failed to persist job location for job ${job.id}:`, error);
        }
    }

    @SubscribeMessage('careu:update_location')
    async handleCareuUpdateLocation(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { jobId: number; lat: number; lng: number; recordedAt?: string },
    ) {
        const trackerId = this.clientTrackers.get(client.id);
        if (!trackerId || !data?.jobId || data.lat == null || data.lng == null) {
            return;
        }

        const job = await this.prisma.job.findUnique({
            where: { id: Number(data.jobId) },
            select: { id: true, vltId: true, careuId: true, status: true },
        });

        if (!job || job.careuId !== trackerId) {
            return;
        }

        try {
            await this.persistJobLocation(trackerId, 'CAREU', data, job);
        } catch (error) {
            this.logger.error(`Failed to persist careu job location for job ${job.id}:`, error);
        }
    }

    @SubscribeMessage('join_job')
    async handleJoinJob(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { jobId: number },
    ) {
        const userId = this.authenticatedClients.get(client.id);
        const role = this.clientRoles.get(client.id);
        if (!userId || !role || !data?.jobId) {
            return { error: 'Unauthorized' };
        }

        const jobId = Number(data.jobId);
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                queue: {
                    include: {
                        user: { select: { organizationId: true } },
                    },
                },
            },
        });

        if (!job) {
            return { error: 'Job not found' };
        }

        if (!STAFF_ROLES.has(role)) {
            return { error: 'Forbidden' };
        }

        if (role === 'STAFF' || role === 'EXECUTIVE') {
            const staff = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { organizationId: true },
            });
            if (staff?.organizationId && job.queue.user.organizationId !== staff.organizationId) {
                return { error: 'Forbidden' };
            }
        }

        await client.join(this.jobRoom(jobId));

        const points = await this.prisma.jobLocationLog.findMany({
            where: { jobId },
            orderBy: { recordedAt: 'asc' },
            select: { lat: true, lng: true, recordedAt: true, source: true, leg: true },
        });

        const trailPoints = points
            .map((p) => ({
                lat: p.lat,
                lng: p.lng,
                recordedAt: p.recordedAt.toISOString(),
                source: p.source,
                leg: p.leg || jobStatusToLeg(job.status),
            }))
            .filter((p) => this.isPlausibleLocation(p.lat, p.lng));

        if (trailPoints.length > 0) {
            const latest = trailPoints[trailPoints.length - 1];
            this.jobLatestLocations.set(jobId, {
                jobId,
                driverId: job.vltId || job.careuId || '',
                source: 'DRIVE',
                lat: latest.lat,
                lng: latest.lng,
                recordedAt: latest.recordedAt,
            });
        }

        client.emit('location:trail', { jobId, points: trailPoints });

        const cached = this.jobLatestLocations.get(jobId);
        if (cached) {
            client.emit('location:updated', cached);
        }

        return { success: true };
    }

    @SubscribeMessage('leave_job')
    async handleLeaveJob(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { jobId: number },
    ) {
        if (!data?.jobId) return;
        await client.leave(this.jobRoom(Number(data.jobId)));
    }

    @SubscribeMessage('getInitialLocations')
    handleGetInitialLocations(@ConnectedSocket() client: Socket) {
        const allLocations = Array.from(this.locations.values());
        client.emit('initialLocations', allLocations);
    }
}
