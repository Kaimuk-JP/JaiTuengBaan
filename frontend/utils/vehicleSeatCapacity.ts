export function hasSpecialSeatRequirement(mobilityStatus: string | null | undefined, requiredEquipment?: string | null): boolean {
    const equipment = requiredEquipment ?? '';
    return (
        mobilityStatus === 'WHEELCHAIR' ||
        mobilityStatus === 'BEDRIDDEN' ||
        equipment.includes('เข็น') ||
        equipment.includes('เปล')
    );
}

export function getSeatSlotsForPatient(_mobilityStatus?: string | null, _requiredEquipment?: string | null): number {
    return 1;
}

export function getSeatRequirementReason(mobilityStatus: string | null | undefined, requiredEquipment?: string | null): string {
    if (mobilityStatus === 'BEDRIDDEN') return 'ติดเตียง/เปล';
    if (mobilityStatus === 'WHEELCHAIR') return 'รถเข็น';
    const equipment = requiredEquipment ?? '';
    if (equipment.includes('เปล')) return 'เปลหาม';
    if (equipment.includes('เข็น')) return 'อุปกรณ์เข็น';
    return 'ทั่วไป';
}
