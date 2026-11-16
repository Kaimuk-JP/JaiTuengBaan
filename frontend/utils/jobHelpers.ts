
export const normalizeBookingTime = (timeStr?: string | null): string => {
    if (!timeStr) return '';
    return timeStr.replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
};

export const getRoundGroup = (timeStr?: string | null): string => {
    if (!timeStr) return 'none';
    return normalizeBookingTime(timeStr);
};

export const getDateKey = (dateStr?: string | null): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getLocalDateKey = (dateInput?: string | Date | null): string => {
    if (!dateInput) return '';
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
    }
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getBangkokDateKey = (dateInput?: string | Date | null): string => {
    if (!dateInput) return '';
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
    }
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
};

export const getHosp = (q: any): string => q.hospital?.name || q.hospitalName || '-';

export const getVehicleTypeName = (type: string) => {
    return type || '-';
};

export const formatVehicleInfo = (
    vehicle?: { brand?: string | null; model?: string | null; licensePlate?: string | null } | null
): string | null => {
    if (!vehicle) return null;
    const name = [vehicle.brand, vehicle.model].filter(Boolean).join(' ');
    const plate = vehicle.licensePlate ? `ทะเบียน ${vehicle.licensePlate}` : '';
    return [name, plate].filter(Boolean).join(' ') || null;
};

export const getFuelTypeName = (type: string | null) => {
        if (!type) return '-';
        switch (type) {
            case 'BENZENE': return 'เบนซิน';
            case 'GASOHOL_91': return 'แก๊สโซฮอล์ 91';
            case 'GASOHOL_95': return 'แก๊สโซฮอล์ 95';
            case 'GASOHOL_E20': return 'แก๊สโซฮอล์ E20';
            case 'GASOHOL_E85': return 'แก๊สโซฮอล์ E85';
            case 'DIESEL': return 'ดีเซล';
            case 'ELECTRIC': return 'ไฟฟ้า (EV)';
            default: return type;
        }
    };

export const formatReturningToMunicipality = (
    organizationName?: string | null,
    fallbackName?: string | null
): string => {
    const name = organizationName?.trim() || fallbackName?.trim();
    if (!name) return 'กำลังกลับเทศบาล';
    return `กำลังกลับเทศบาล ${name}`;
};

export const getRoleCalendarPath = (role?: string | null): string => {
    if (role === 'CAREU') return '/volunteer/careu/jobs';
    return '/volunteer/driver';
};

export function getVolunteerJobStatusDisplay(
    status: string,
    returnPickupRequestedAt?: string | null
): { label: string; color: string } {
    if (status === 'AT_HOSPITAL') {
        if (returnPickupRequestedAt) {
            return { label: 'เรียกรถกลับแล้ว — รอรับที่รพ.', color: 'bg-amber-50 text-amber-700' };
        }
        return { label: 'อยู่ที่รพ. — รอเรียกรถกลับ', color: 'bg-cyan-50 text-cyan-700' };
    }
    const map: Record<string, { label: string; color: string }> = {
        ASSIGNED: { label: 'รอตอบรับ', color: 'bg-fuji-light text-text-tertiary' },
        ACCEPTED: { label: 'รับงานแล้ว', color: 'bg-blue-50 text-blue-700' },
        PICKING_UP: { label: 'กำลังเดินทางไปรับ', color: 'bg-blue-50 text-blue-700' },
        IN_TRANSIT: { label: 'กำลังเดินทางไปโรงพยาบาล', color: 'bg-blue-50 text-blue-700' },
        AT_PATIENT_HOME: { label: 'ส่งถึงบ้าน รอคนขับยืนยัน', color: 'bg-teal-50 text-teal-700' },
        RETURN_HOME: { label: 'กำลังพาประชาชนกลับบ้าน', color: 'bg-purple-50 text-purple-700' },
        RETURN_OFFICE: { label: 'ส่งถึงบ้านแล้ว', color: 'bg-indigo-50 text-indigo-700' },
        COMPLETED: { label: 'เสร็จสิ้น', color: 'bg-apple-soft text-brand-primary' },
        CANCELLED: { label: 'ยกเลิก', color: 'bg-gray-100 text-gray-600' },
        REJECTED: { label: 'ปฏิเสธ', color: 'bg-red-50 text-red-600' },
    };
    return map[status] ?? { label: status, color: 'bg-fuji-light text-text-tertiary' };
}

type TripJobRef = {
    job?: { status?: string; careuId?: string | null };
    careu?: { id?: string } | null;
};

export function hasDriverAwaitingPhotoConfirmation(requests: TripJobRef[]): boolean {
    return requests.some((r) => r.job?.status === 'AT_PATIENT_HOME');
}

export const hasCareUAwaitingPhotoConfirmation = hasDriverAwaitingPhotoConfirmation;

export function allPassengersReadyForReturnToOffice(requests: TripJobRef[]): boolean {
    return (
        requests.length > 0 &&
        requests.every((r) => ['RETURN_OFFICE', 'COMPLETED'].includes(r.job?.status || ''))
    );
}

export function canDriverCompleteTrip(requests: TripJobRef[]): boolean {
    if (hasDriverAwaitingPhotoConfirmation(requests)) return false;
    return allPassengersReadyForReturnToOffice(requests);
}

export function canDriverStartJob(dateInput?: string | Date | null, bookingTime?: string | null): boolean {
    if (!dateInput) return true;
    try {
        let year: number, month: number, day: number;

        if (dateInput instanceof Date) {
            year = dateInput.getFullYear();
            month = dateInput.getMonth() + 1;
            day = dateInput.getDate();
        } else if (typeof dateInput === 'string') {
            if (/^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
                const parts = dateInput.split('T')[0].split('-').map(Number);
                year = parts[0];
                month = parts[1];
                day = parts[2];
            } else {
                const thaiMonths: Record<string, number> = {
                    'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4, 'พ.ค.': 5, 'มิ.ย.': 6,
                    'ก.ค.': 7, 'ส.ค.': 8, 'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12
                };
                const dMatch = dateInput.match(/(\d{1,2})\s+([^\s]+)\s+(\d{2,4})/);
                if (dMatch) {
                    day = parseInt(dMatch[1], 10);
                    month = thaiMonths[dMatch[2]] || 1;
                    let y = parseInt(dMatch[3], 10);
                    if (y < 100) y += 2500;
                    if (y > 2400) y -= 543;
                    year = y;
                } else {
                    const parsedDate = new Date(dateInput);
                    if (!Number.isNaN(parsedDate.getTime())) {
                        year = parsedDate.getFullYear();
                        month = parsedDate.getMonth() + 1;
                        day = parsedDate.getDate();
                    } else {
                        const now = new Date();
                        year = now.getFullYear();
                        month = now.getMonth() + 1;
                        day = now.getDate();
                    }
                }
            }
        } else {
            const now = new Date();
            year = now.getFullYear();
            month = now.getMonth() + 1;
            day = now.getDate();
        }

        let hours = 8;
        let minutes = 0;
        if (bookingTime) {
            const match = bookingTime.match(/(\d{1,2})[:.](\d{2})/);
            if (match) {
                hours = parseInt(match[1], 10);
                minutes = parseInt(match[2], 10);
            }
        }

        const scheduledStart = new Date(year, month - 1, day, hours, minutes, 0, 0);
        const threeHoursBefore = new Date(scheduledStart.getTime() - 3 * 60 * 60 * 1000);
        const now = new Date();

        return now >= threeHoursBefore;
    } catch {
        return true;
    }
}
