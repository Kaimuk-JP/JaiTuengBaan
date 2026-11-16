"use client";

import DiseaseAutocomplete from '@/components/shared/DiseaseAutocomplete';
import ThaiDatePicker from '@/components/shared/ThaiDatePicker';
import type { NamedItem } from '@/types/common';

interface PersonalInfoFieldsProps {
    formData: {
        idCard: string;
        firstName: string;
        lastName: string;
        phone: string;
        relativePhone: string;
        relativeName: string;
        disease: NamedItem[];
        birthDate: string;
        gender: "male" | "female";
    };
    onChange: (field: string, value: any) => void;
    patientStatus: "normal" | "special" | "urgent";
    onPatientStatusChange: (value: "normal" | "special" | "urgent") => void;
    showMobilityStatus?: boolean;
    showDisease?: boolean;
}

export function PersonalInfoFields({ formData, onChange, patientStatus, onPatientStatusChange, showMobilityStatus = true, showDisease = true }: PersonalInfoFieldsProps) {
    const diseaseArray = formData.disease || [];

    const handleDiseaseChange = (diseases: NamedItem[]) => {
        onChange('disease', diseases);
    };

    return (
        <div className="space-y-2x">
            <div>
                <label className="typo-body text-text-tertiary mb-1x block">
                    เลขบัตรประชาชน <span className="text-semantic-critical">*</span>
                </label>
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.idCard}
                    onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        onChange('idCard', value);
                    }}
                    className="w-full p-2x typo-body text-text-primary bg-white border border-border-neutral rounded-square focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                    placeholder="เลขบัตรประชาชน 13 หลัก"
                    maxLength={13}
                />
            </div>

            <div>
                <label className="typo-body text-text-tertiary mb-1x block">
                    ชื่อ <span className="text-semantic-critical">*</span>
                </label>
                <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => {
                        const value = e.target.value.replace(/[^ก-๙เแโใไ\s]/g, '');
                        onChange('firstName', value);
                    }}
                    className="w-full p-2x typo-body text-text-primary bg-white border border-border-neutral rounded-square focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                    placeholder="กรอกชื่อจริง (ภาษาไทยเท่านั้น)"
                    maxLength={50}
                />
            </div>

            <div>
                <label className="typo-body text-text-tertiary mb-1x block">
                    นามสกุล <span className="text-semantic-critical">*</span>
                </label>
                <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => {
                        const value = e.target.value.replace(/[^ก-๙เแโใไ\s]/g, '');
                        onChange('lastName', value);
                    }}
                    className="w-full p-2x typo-body text-text-primary bg-white border border-border-neutral rounded-square focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                    placeholder="กรอกนามสกุล (ภาษาไทยเท่านั้น)"
                    maxLength={50}
                />
            </div>

            <div>
                <label className="typo-body text-text-tertiary mb-1x block">
                    เพศ <span className="text-semantic-critical">*</span>
                </label>
                <div className="flex gap-3x">
                    <label className="flex items-center gap-1x cursor-pointer">
                        <input
                            type="radio"
                            name="gender"
                            value="male"
                            checked={formData.gender === "male"}
                            onChange={(e) => onChange('gender', e.target.value)}
                            className="w-4 h-4 accent-brand-primary border-border-neutral focus:ring-brand-primary"
                        />
                        <span className="typo-body text-text-primary">ชาย</span>
                    </label>
                    <label className="flex items-center gap-1x cursor-pointer">
                        <input
                            type="radio"
                            name="gender"
                            value="female"
                            checked={formData.gender === "female"}
                            onChange={(e) => onChange('gender', e.target.value)}
                            className="w-4 h-4 accent-brand-primary border-border-neutral focus:ring-brand-primary"
                        />
                        <span className="typo-body text-text-primary">หญิง</span>
                    </label>
                </div>
            </div>

            <div>
                <label className="typo-body text-text-tertiary mb-1x block">
                    เบอร์โทรศัพท์
                </label>
                <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.phone}
                    onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        onChange('phone', value);
                    }}
                    className="w-full p-2x typo-body text-text-primary bg-white border border-border-neutral rounded-square focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                    placeholder="เบอร์โทรศัพท์ 10 หลัก (เช่น 0812345678)"
                    maxLength={10}
                />
            </div>

            {showMobilityStatus && (
                <div>
                    <label className="typo-body text-text-tertiary mb-1x block">
                        สถานะประชาชน <span className="text-semantic-critical">*</span>
                    </label>
                    <div className="relative">
                        <select
                            value={patientStatus}
                            onChange={(e) => onPatientStatusChange(e.target.value as "normal" | "special" | "urgent")}
                            className="w-full p-2x pr-10 typo-body text-text-primary bg-white border border-border-neutral rounded-square focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option value="normal">ทั่วไป</option>
                            <option value="special">ต้องดูแลเพิ่ม</option>
                            <option value="urgent">ต้องดูแลใกล้ชิด</option>
                        </select>
                        <svg
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            )}

            {showDisease && (
                <div>
                    <label className="typo-body text-text-tertiary mb-1x block">
                        โรคประจำตัว
                    </label>
                    <DiseaseAutocomplete
                        value={diseaseArray}
                        onChange={handleDiseaseChange}
                        placeholder="พิมพ์เพื่อค้นหาโรค"
                    />
                </div>
            )}

            <div>
                <label className="typo-body text-text-tertiary mb-1x block">
                    วัน/เดือน/ปีเกิด <span className="text-semantic-critical">*</span>
                </label>
                <ThaiDatePicker
                    value={formData.birthDate ? new Date(formData.birthDate).toISOString().split('T')[0] : ''}
                    onChange={(val) => onChange('birthDate', val)}
                    max={new Date().toISOString().split('T')[0]}
                    placeholder="เลือกวันเกิด (ปี → เดือน → วัน)"
                />
            </div>
        </div>
    );
}
