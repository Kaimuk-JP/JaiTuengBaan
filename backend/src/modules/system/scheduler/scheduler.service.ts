import { Injectable, OnModuleInit } from '@nestjs/common';
import * as cron from 'node-cron';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { NotificationService, NotificationType } from '@/modules/system/notification/notification.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService,
    ) { }

    onModuleInit() {
        cron.schedule('0 9 * * *', () => {
            this.checkUpcomingAppointments();
        });

        cron.schedule('5 0 * * *', () => {
            this.cancelOverdueQueues();
        });
    }

    async checkUpcomingAppointments() {
        try {

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const dayAfterTomorrow = new Date(tomorrow);
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

            const upcomingQueues = await this.prisma.queue.findMany({
                where: {
                    requestDate: {
                        gte: tomorrow,
                        lt: dayAfterTomorrow,
                    },
                    status: {
                        in: ['CONFIRMED', 'APPROVED'],
                    },
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            iamUserId: true,
                            phone: true,
                        },
                    },
                    job: {
                        include: {
                            vlt: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    phone: true,
                                    iamUserId: true,
                                },
                            },
                            careu: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    phone: true,
                                    iamUserId: true,
                                },
                            },
                        },
                    },
                    hospital: {
                        select: {
                            name: true,
                        },
                    },
                },
            });


            for (const queue of upcomingQueues) {
                await this.sendReminderNotification(queue);
            }

        } catch (error) {
            console.error('Error checking upcoming appointments:', error);
        }
    }

    private async sendReminderNotification(queue: any) {
        const appointmentDate = new Date(queue.requestDate);
        const dateStr = appointmentDate.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
        });

        const hospitalName = queue.hospital?.name || 'ไม่ระบุโรงพยาบาล';
        const message = this.buildReminderMessage(queue, dateStr, hospitalName);

        await this.notificationService.sendToUser(queue.userId, {
            type: NotificationType.APPOINTMENT_REMINDER,
            title: 'แจ้งเตือนนัดหมายพรุ่งนี้',
            message: message,
            data: {
                queueId: queue.id,
                hospitalName: hospitalName,
                bookingTime: queue.bookingTime,
                requestDate: queue.requestDate,
            },
        });

    }

    private buildReminderMessage(queue: any, dateStr: string, hospitalName: string): string {
        let message = `${dateStr} ${hospitalName} `;

        if (queue.bookingTime) {
            message += `${queue.bookingTime}\n`;
        }

        if (queue.job && queue.job.length > 0) {
            message += `\n👥 อาสาสมัคร:\n`;
            queue.job.forEach((job: any) => {
                const vltName = job.vlt.firstName && job.vlt.lastName
                    ? `${job.vlt.firstName} ${job.vlt.lastName}`
                    : (job.vlt.firstName || job.vlt.lastName || 'ไม่ระบุชื่อ');
                message += `  • ${vltName}\n`;
                message += `    📞 ${job.vlt.phone || 'ไม่ระบุ'}\n`;
            });
        } else {
            message += `\n รอเทศบาลยืนยันและจัดคิวหากยังไม่มีคิวให้ติดต่อเทศบาล\n`;
        }

        message += `\nขอให้เดินทางปลอดภัย! 🙏`;

        return message;
    }

    async triggerReminderCheck() {
        await this.checkUpcomingAppointments();
        await this.cancelOverdueQueues();
    }

    async cancelOverdueQueues() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const overdueQueues = await this.prisma.queue.findMany({
                where: {
                    requestDate: {
                        lt: today,
                    },
                    status: {
                        in: ['PENDING_MUNICIPAL', 'APPROVED', 'PENDING_EXECUTIVE', 'CONFIRMED'],
                    },
                },
                include: {
                    job: true,
                }
            });

            let cancelledCount = 0;

            for (const queue of overdueQueues) {
                if (queue.job && ['COMPLETED', 'CANCELLED'].includes(queue.job.status)) {
                    continue;
                }

                await this.prisma.queue.update({
                    where: { id: queue.id },
                    data: {
                        status: 'CANCELLED_BY_MUNICIPAL',
                        rejectReason: 'ระบบยกเลิกอัตโนมัติเนื่องจากเลยวันนัดหมาย',
                    }
                });

                if (queue.job && ['OPEN', 'ASSIGNED', 'ACCEPTED', 'PICKING_UP', 'IN_TRANSIT', 'RETURN_HOME', 'RETURN_OFFICE'].includes(queue.job.status)) {
                    await this.prisma.job.update({
                        where: { id: queue.job.id },
                        data: {
                            status: 'CANCELLED',
                        }
                    });

                    await this.prisma.resourceTimeSlot.deleteMany({
                        where: { jobId: queue.job.id },
                    });
                }

                await this.notificationService.sendToUser(queue.userId, {
                    type: NotificationType.QUEUE_CANCELLED,
                    title: 'คำร้องถูกยกเลิก',
                    message: `คำร้องวันที่ ${new Date(queue.requestDate).toLocaleDateString('th-TH')} ถูกยกเลิกอัตโนมัติเนื่องจากเลยวันนัดหมาย`,
                    data: { queueId: queue.id, status: 'CANCELLED_BY_MUNICIPAL' }
                });

                const caregivers = await this.notificationService.getPatientCaregivers(queue.userId);
                for (const cgId of caregivers) {
                    await this.notificationService.sendToUser(cgId, {
                        type: NotificationType.QUEUE_CANCELLED,
                        title: 'คำร้องถูกยกเลิก (ผู้ดูแล)',
                        message: `คำร้องวันที่ ${new Date(queue.requestDate).toLocaleDateString('th-TH')} ของประชาชนถูกยกเลิกอัตโนมัติเนื่องจากเลยวันนัดหมาย`,
                        data: { queueId: queue.id, status: 'CANCELLED_BY_MUNICIPAL' }
                    });
                }

                cancelledCount++;
            }

            if (cancelledCount > 0) {
                console.log(`Automatically cancelled ${cancelledCount} overdue queues.`);
            }
        } catch (error) {
            console.error('Error cancelling overdue queues:', error);
        }
    }
}
