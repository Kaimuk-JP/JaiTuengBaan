import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as cron from 'node-cron';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { NotificationService, NotificationType } from './notification.service';

@Injectable()
export class AppointmentReminderService implements OnModuleInit {
    private readonly logger = new Logger(AppointmentReminderService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService,
    ) { }

    onModuleInit() {
        this.logger.log('Initializing appointment reminder cron jobs...');

        cron.schedule('0 8 * * *', () => {
            this.sendDayBeforeReminders();
        }, {
            timezone: 'Asia/Bangkok'
        });

        cron.schedule('0 * * * *', () => {
            this.sendHourBeforeReminders();
        }, {
            timezone: 'Asia/Bangkok'
        });

        this.logger.log('Appointment reminder cron jobs initialized');
    }

        async sendDayBeforeReminders() {
        this.logger.log('Running day-before appointment reminders...');

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

        try {
            const queues = await this.prisma.queue.findMany({
                where: {
                    requestDate: {
                        gte: tomorrow,
                        lt: dayAfterTomorrow,
                    },
                    status: 'CONFIRMED',
                },
                include: {
                    user: true,
                    hospital: true,
                    job: {
                        include: {
                            vlt: true,
                            careu: true,
                        },
                    },
                },
            });

            this.logger.log(`Found ${queues.length} appointments for tomorrow`);

            for (const queue of queues) {
                await this.notificationService.sendToUser(queue.userId, {
                    type: NotificationType.APPOINTMENT_REMINDER,
                    title: 'แจ้งเตือนนัดหมายพรุ่งนี้',
                    message: `คุณมีนัดหมายพรุ่งนี้ไป ${queue.hospital?.name || 'โรงพยาบาล'} เวลา ${queue.bookingTime}`,
                    data: {
                        queueId: queue.id,
                        hospitalName: queue.hospital?.name || 'โรงพยาบาล',
                        requestDate: queue.requestDate,
                        bookingTime: queue.bookingTime,
                    },
                });

                const caregiverIds = await this.getPatientCaregivers(queue.userId);
                for (const caregiverId of caregiverIds) {
                    await this.notificationService.sendToUser(caregiverId, {
                        type: NotificationType.APPOINTMENT_REMINDER,
                        title: 'แจ้งเตือนนัดหมายพรุ่งนี้',
                        message: `${this.getFullName(queue.user)} มีนัดหมายพรุ่งนี้ที่ ${queue.hospital?.name || 'โรงพยาบาล'} เวลา ${queue.bookingTime}`,
                        data: {
                            queueId: queue.id,
                            patientName: this.getFullName(queue.user),
                            hospitalName: queue.hospital?.name || 'โรงพยาบาล',
                            requestDate: queue.requestDate,
                            bookingTime: queue.bookingTime,
                        },
                    });
                }

                if (queue.job?.vltId) {
                    await this.notificationService.sendToUser(queue.job.vltId, {
                        type: NotificationType.APPOINTMENT_REMINDER,
                        title: 'พรุ่งนี้คุณมีงาน',
                        message: `คุณมีงานพรุ่งนี้: พา ${this.getFullName(queue.user)} ไป ${queue.hospital?.name || 'โรงพยาบาล'} เวลา ${queue.bookingTime}`,
                        data: {
                            queueId: queue.id,
                            jobId: queue.job.id,
                            patientName: this.getFullName(queue.user),
                            hospitalName: queue.hospital?.name || 'โรงพยาบาล',
                            requestDate: queue.requestDate,
                            bookingTime: queue.bookingTime,
                            role: 'DRIVE',
                        },
                    });
                }

                if (queue.job?.careuId) {
                    await this.notificationService.sendToUser(queue.job.careuId, {
                        type: NotificationType.APPOINTMENT_REMINDER,
                        title: 'พรุ่งนี้คุณมีงาน',
                        message: `คุณมีงานพรุ่งนี้: ดูแล ${this.getFullName(queue.user)} ไป ${queue.hospital?.name || 'โรงพยาบาล'} เวลา ${queue.bookingTime}`,
                        data: {
                            queueId: queue.id,
                            jobId: queue.job.id,
                            patientName: this.getFullName(queue.user),
                            hospitalName: queue.hospital?.name || 'โรงพยาบาล',
                            requestDate: queue.requestDate,
                            bookingTime: queue.bookingTime,
                            role: 'CAREU',
                        },
                    });
                }
            }

            this.logger.log(`Sent day-before reminders for ${queues.length} appointments`);
        } catch (error) {
            this.logger.error('Error sending day-before reminders:', error);
        }
    }

        async sendHourBeforeReminders() {
        this.logger.log('Running hour-before appointment reminders...');

        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const currentHour = now.getHours();

        const timeSlots: Record<string, number> = {
            '04:00 – 06:00': 4,
            '06:00 – 08:00': 6,
            '08:00 – 10:00': 8,
            '10:00 – 12:00': 10,
            '12:00 – 14:00': 12,
        };

        try {
            const queues = await this.prisma.queue.findMany({
                where: {
                    requestDate: {
                        gte: today,
                        lt: tomorrow,
                    },
                    status: 'CONFIRMED',
                },
                include: {
                    user: true,
                    hospital: true,
                    job: {
                        include: {
                            vlt: true,
                            careu: true,
                        },
                    },
                },
            });

            for (const queue of queues) {
                const startHour = timeSlots[queue.bookingTime || ''] || 0;

                if (currentHour + 1 === startHour) {
                    this.logger.log(`Sending 1-hour reminder for queue ${queue.id}`);

                    await this.notificationService.sendToUser(queue.userId, {
                        type: NotificationType.APPOINTMENT_REMINDER,
                        title: 'แจ้งเตือน: อีก 1 ชั่วโมงถึงเวลานัดหมาย',
                        message: `เตรียมตัวให้พร้อม! จิตอาสาจะมารับคุณไป ${queue.hospital?.name || 'โรงพยาบาล'} ในช่วงเวลา ${queue.bookingTime}`,
                        data: {
                            queueId: queue.id,
                            hospitalName: queue.hospital?.name || 'โรงพยาบาล',
                            bookingTime: queue.bookingTime,
                            isUrgent: true,
                        },
                    });

                    const caregiverIds = await this.getPatientCaregivers(queue.userId);
                    for (const caregiverId of caregiverIds) {
                        await this.notificationService.sendToUser(caregiverId, {
                            type: NotificationType.APPOINTMENT_REMINDER,
                            title: 'แจ้งเตือน: อีก 1 ชั่วโมงถึงเวลานัดหมาย',
                            message: `${this.getFullName(queue.user)} มีนัดหมายในอีก 1 ชั่วโมง ที่ ${queue.hospital?.name || 'โรงพยาบาล'}`,
                            data: {
                                queueId: queue.id,
                                patientName: this.getFullName(queue.user),
                                hospitalName: queue.hospital?.name || 'โรงพยาบาล',
                                bookingTime: queue.bookingTime,
                                isUrgent: true,
                            },
                        });
                    }

                    if (queue.job?.vltId) {
                        await this.notificationService.sendToUser(queue.job.vltId, {
                            type: NotificationType.APPOINTMENT_REMINDER,
                            title: 'อีก 1 ชั่วโมงถึงเวลางาน',
                            message: `เตรียมตัวออกเดินทาง! ไปรับ ${this.getFullName(queue.user)} ไป ${queue.hospital?.name || 'โรงพยาบาล'}`,
                            data: {
                                queueId: queue.id,
                                jobId: queue.job.id,
                                patientName: this.getFullName(queue.user),
                                hospitalName: queue.hospital?.name || 'โรงพยาบาล',
                                bookingTime: queue.bookingTime,
                                isUrgent: true,
                                role: 'DRIVE',
                            },
                        });
                    }

                    if (queue.job?.careuId) {
                        await this.notificationService.sendToUser(queue.job.careuId, {
                            type: NotificationType.APPOINTMENT_REMINDER,
                            title: 'อีก 1 ชั่วโมงถึงเวลางาน',
                            message: `เตรียมตัวออกเดินทาง! ไปดูแล ${this.getFullName(queue.user)} ไป ${queue.hospital?.name || 'โรงพยาบาล'}`,
                            data: {
                                queueId: queue.id,
                                jobId: queue.job.id,
                                patientName: this.getFullName(queue.user),
                                hospitalName: queue.hospital?.name || 'โรงพยาบาล',
                                bookingTime: queue.bookingTime,
                                isUrgent: true,
                                role: 'CAREU',
                            },
                        });
                    }
                }
            }
        } catch (error) {
            this.logger.error('Error sending hour-before reminders:', error);
        }
    }

    private async getPatientCaregivers(patientId: string): Promise<string[]> {
        const caregiverPatients = await this.prisma.caregiverPatient.findMany({
            where: {
                patientId,
                status: 'APPROVED',
            },
            select: {
                caregiverId: true,
            },
        });
        return caregiverPatients.map(cp => cp.caregiverId);
    }

    private getFullName(user: { firstName?: string | null; lastName?: string | null; displayName?: string | null }): string {
        if (user.displayName) return user.displayName;
        return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'ไม่ระบุชื่อ';
    }
}
