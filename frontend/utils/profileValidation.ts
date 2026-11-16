import { User } from "@/components/elderly/types";

export const getMissingProfileFields = (user: any): string[] => {
    if (!user) return ["ข้อมูลผู้ใช้"];

    const missingFields: string[] = [];

    if (!user.firstName || !user.lastName) missingFields.push("ชื่อและนามสกุล");
    if (!user.idCard || user.idCard.length !== 13) missingFields.push("เลขบัตรประชาชน (13 หลัก)");
    if (!user.phone || user.phone.length !== 10) missingFields.push("เบอร์โทรศัพท์ (10 หลัก)");

    if (['USERS', 'CAREGIVER', 'DRIVE', 'CAREU'].includes(user.role)) {
        if (!user.birthDate) missingFields.push("วันเกิด");
        if (!user.gender) missingFields.push("เพศ");
    }

    if (user.role === 'USERS') {
        if (!user.lat || !user.lng) missingFields.push("ที่อยู่ (พิกัดแผนที่)");
    }

    return missingFields;
};
