export const ACTION_REQUIRED_TYPES = [
    'QUEUE_EDITED',
    'FEEDBACK_REQUEST',
    'CAREGIVER_REQUEST_SUBMITTED',
    'EDIT_REQUEST_NEW',
];

const ROLE_ACTION_TYPES: Record<string, string[]> = {
    STAFF: ['NEW_QUEUE_REQUEST', 'QUEUE_EXECUTIVE_REJECTED'],
    EXECUTIVE: ['QUEUE_PENDING_EXECUTIVE', 'QUEUE_CONFIRMED'],
};

export const DRIVER_NOTIFICATION_TYPES = [
    'VOLUNTEER_ASSIGNED',
    'QUEUE_CANCELLED',
    'JOB_STATUS_UPDATED',
    'APPOINTMENT_REMINDER',
];

export function filterNotificationsByRole<T extends { type: string }>(
    notifications: T[],
    role?: string
): T[] {
    if (role === 'DRIVE' || role === 'CAREU') {
        return notifications.filter((n) => DRIVER_NOTIFICATION_TYPES.includes(n.type));
    }
    return notifications;
}

export const INFO_ONLY_TYPES = [
    'QUEUE_REJECTED',
    'QUEUE_CONFIRMED',
    'QUEUE_CANCELLED',
    'JOB_ACCEPTED',
    'JOB_COMPLETED',
    'JOB_STATUS_UPDATED',
    'EDIT_REQUEST_APPROVED',
    'EDIT_REQUEST_REJECTED',
    'REWARD_REDEMPTION_SUBMITTED',
    'REWARD_REDEMPTION_APPROVED',
    'REWARD_REDEMPTION_REJECTED',
    'REWARD_REDEMPTION_COMPLETED',
    'CAREGIVER_REQUEST_APPROVED',
    'CAREGIVER_REQUEST_REJECTED',
    'APPOINTMENT_REMINDER',
    'VOLUNTEER_ASSIGNED',
    'NEW_QUEUE_REQUEST',
    'QUEUE_APPROVED',
    'QUEUE_EXECUTIVE_APPROVED',
];

export function isActionRequired(
    type: string,
    role?: string,
    data?: Record<string, unknown>,
): boolean {
    if (ACTION_REQUIRED_TYPES.includes(type)) {
        return true;
    }

    if (role && ROLE_ACTION_TYPES[role]?.includes(type)) {
        return true;
    }

    if (
        type === 'JOB_STATUS_UPDATED' &&
        data?.returnPickupRequested &&
        (role === 'DRIVE' || role === 'CAREU')
    ) {
        return true;
    }

    return false;
}

export function getNotificationTitle(type: string): string {
    const titles: Record<string, string> = {
        QUEUE_APPROVED: 'การจองได้รับการอนุมัติ',
        QUEUE_PENDING_EXECUTIVE: 'มีคิวรอผู้บริหารอนุมัติ',
        QUEUE_EXECUTIVE_APPROVED: 'ผู้บริหารอนุมัติคิวแล้ว',
        QUEUE_EXECUTIVE_REJECTED: 'ผู้บริหารส่งกลับให้แก้ไข',
        QUEUE_REJECTED: 'การจองถูกปฏิเสธ',
        VOLUNTEER_ASSIGNED: 'มีจิตอาสารับงาน',
        SERVICE_COMPLETED: 'บริการเสร็จสิ้น',
        FEEDBACK_REQUEST: 'กรุณาให้คะแนน',
        JOB_STATUS_UPDATED: 'อัพเดทสถานะงาน',
        JOB_ACCEPTED: 'อาสาสมัครรับงานแล้ว',
        JOB_COMPLETED: 'บริการเสร็จสิ้น',
        APPOINTMENT_REMINDER: 'แจ้งเตือนงานพรุ่งนี้',
        EDIT_REQUEST_APPROVED: 'อนุมัติการแก้ไขคำร้อง',
        EDIT_REQUEST_REJECTED: 'ปฏิเสธการแก้ไขคำร้อง',
        NEW_QUEUE_REQUEST: 'คำร้องใหม่รอตรวจสอบ',
        QUEUE_EDITED: 'ข้อมูลการจองถูกแก้ไข',
    };
    return titles[type] || 'การแจ้งเตือน';
}

export function getNotificationType(type: string): 'info' | 'success' | 'warning' | 'error' | 'reminder' {
    const types: Record<string, 'info' | 'success' | 'warning' | 'error' | 'reminder'> = {
        QUEUE_APPROVED: 'success',
        QUEUE_PENDING_EXECUTIVE: 'warning',
        QUEUE_EXECUTIVE_APPROVED: 'success',
        QUEUE_EXECUTIVE_REJECTED: 'warning',
        QUEUE_REJECTED: 'warning',
        VOLUNTEER_ASSIGNED: 'info',
        SERVICE_COMPLETED: 'success',
        FEEDBACK_REQUEST: 'reminder',
        JOB_STATUS_UPDATED: 'info',
        JOB_ACCEPTED: 'success',
        JOB_COMPLETED: 'success',
        APPOINTMENT_REMINDER: 'reminder',
        EDIT_REQUEST_APPROVED: 'success',
        EDIT_REQUEST_REJECTED: 'warning',
        NEW_QUEUE_REQUEST: 'info',
    };
    return types[type] || 'info';
}

export function formatNotificationDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'เมื่อสักครู่';
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    if (hours < 24) return `${hours} ชม. ที่แล้ว`;
    if (days === 1) return 'เมื่อวาน';
    if (days < 7) return `${days} วันที่แล้ว`;
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getNotificationCategory(
    type: string,
    isRead: boolean,
    role?: string,
    data?: Record<string, unknown>,
): 'action' | 'general' {
    if (isActionRequired(type, role, data)) {
        return 'action';
    }

    if (!isRead && !INFO_ONLY_TYPES.includes(type)) {
        return 'action';
    }

    return 'general';
}
