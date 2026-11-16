"use client";

interface PatientStatusSelectorProps {
    patientStatus: "normal" | "special" | "urgent";
    onPatientStatusChange: (value: "normal" | "special" | "urgent") => void;
}

export function PatientStatusSelector({
    patientStatus,
    onPatientStatusChange
}: PatientStatusSelectorProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
                สถานะประชาชน
            </label>
            <select
                value={patientStatus}
                onChange={(e) => onPatientStatusChange(e.target.value as "normal" | "special" | "urgent")}
                className="w-full px-3.5 py-2.5 text-sm text-text-primary border border-border-neutral rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
            >
                <option value="normal">ทั่วไป</option>
                <option value="special">ต้องดูแลเพิ่ม</option>
                <option value="urgent">ต้องดูแลใกล้ชิด</option>
            </select>
        </div>
    );
}
