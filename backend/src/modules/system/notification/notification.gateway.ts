import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface UserSocket {
    userId: string;
    role: string;
    socketId: string;
}

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true,
    },
})
export class NotificationGateway
    implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationGateway.name);
    private connectedUsers: Map<string, UserSocket[]> = new Map();
    private authenticatedClients: Map<string, { userId: string; role: string }> = new Map();

    constructor(private readonly jwtService: JwtService) { }

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
                this.logger.warn(`WebSocket connection rejected: No token provided (${client.id})`);
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token);
            const userId = payload.sub;
            const role = payload.role;
            const organizationId = payload.organizationId;

            this.authenticatedClients.set(client.id, { userId, role });

            const userSocket: UserSocket = {
                userId,
                role,
                socketId: client.id,
            };

            const existingSockets = this.connectedUsers.get(userId) || [];
            this.connectedUsers.set(userId, [...existingSockets, userSocket]);

            client.join(`user:${userId}`);

            this.logger.log(`WebSocket authenticated: userId=${userId}, role=${role}, org=${organizationId}, socketId=${client.id}`);
            this.broadcastOnlineCount();
        } catch (error) {
            this.logger.warn(`WebSocket connection rejected: Invalid token (${client.id})`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.connectedUsers.forEach((sockets, userId) => {
            const filtered = sockets.filter((s) => s.socketId !== client.id);
            if (filtered.length === 0) {
                this.connectedUsers.delete(userId);
            } else {
                this.connectedUsers.set(userId, filtered);
            }
        });
        this.authenticatedClients.delete(client.id);
        this.broadcastOnlineCount();
    }

    @SubscribeMessage('register')
    handleRegister(
        @ConnectedSocket() client: Socket,
        @MessageBody() _data: { userId: string; role: string },
    ) {
        const authInfo = this.authenticatedClients.get(client.id);
        if (!authInfo) {
            return { success: false, message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' };
        }

        return { success: true, message: 'ลงทะเบียนสำเร็จ' };
    }

    emitToUser(userId: string, event: string, data: any) {
        this.server.to(`user:${userId}`).emit(event, data);
        this.logger.log(`Emitted ${event} to user ${userId}`);
    }

    getConnectedUsersCount(): number {
        return this.connectedUsers.size;
    }

    getOnlineUsersSummary(): { total: number; userIds: string[]; socketCount: number } {
        let socketCount = 0;
        this.connectedUsers.forEach((sockets) => {
            socketCount += sockets.length;
        });
        return {
            total: this.connectedUsers.size,
            userIds: Array.from(this.connectedUsers.keys()),
            socketCount,
        };
    }

    isUserOnline(userId: string): boolean {
        return this.connectedUsers.has(userId);
    }

    private broadcastOnlineCount() {
        try {
            if (this.server) {
                const count = this.getConnectedUsersCount();
                this.server.emit('online_users_count', { count, timestamp: new Date().toISOString() });
            }
        } catch (err) {
            this.logger.warn('Failed to broadcast online count:', err);
        }
    }
}
