'use client';

import DiseaseAutocomplete from '@/components/shared/DiseaseAutocomplete';
import ThaiDatePicker from '@/components/shared/ThaiDatePicker';
import type { NamedItem } from '@/types/common';

interface ElderlyInfoFieldsProps {
    formData: {
        idCard: string;
        firstName: string;
        lastName: string;
        gender: 'male' | 'female';
        phone: string;
        patientStatus: 'WALKING' | 'WHEELCHAIR' | 'BEDRIDDEN';
        disease: NamedItem[];
        birthDate: string;
    };
    onChange: (field: string, value: any) => void;
}

const patientStatusOptions = [
    { value: 'WALKING', label: 'ทั่วไป' },
    { value: 'WHEELCHAIR', label: 'ต้องดูแลเพิ่ม' },
    { value: 'BEDRIDDEN', label: 'ต้องดูแลใกล้ชิด' },
];

export function ElderlyInfoFields({ formData, onChange }: ElderlyInfoFieldsProps) {
    const diseaseArray = formData.disease || [];

    const handleDiseaseChange = (diseases: NamedItem[]) => {
        onChange('disease', diseases);
    };

    return (
        <div className="space-y-2x">
            { }
            <div>
                <label className="typo-body text-text-tertiary mb-1x block">
                    เลขบัตรประชาชน <span className="text-status-danger">*</span>
                </label>
                <input
                    type="text"
                    inputMode="numeric"
                    value={formData.idCard}
                    onChange={(e) => onChange('idCard', e.target.value.replace(/\D/g, ''))}
                    className="w-full p-2x typo-body text-text-primary bg-white border border-border-neutral rounded-square focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                    maxLength={13}
                    placeholder="ระบุเลขบัตรประชาชน 13 หลัก"
                />
            </div>

            { }
            <div>
                <label className="typo-body text-text-tertiary mb-1x block">
                    ชื่อ <span className="text-status-danger">*</span>
                </label>
                <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => onChange('firstName', e.target.value)}
                    className="w-full p-2x typo-body text-text-primary bg-white border border-border-neutral rounded-square focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                    maxLength={50}
                    placeholder="ระบุชื่อจริงของประชาชน"
                />
            </div>

            { }
            <div>
                <label className="typo-body text-text-tertiary mb-1x block">
                    นามสกุล <span className="text-status-danger">*</span>
                </label>
                <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => onChange('lastName', e.target.value)}
                    className="w-full p-2x typo-body text-text-primary bg-white border border-border-neutral rounded-square focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                    maxLength={50}
                    placeholder="ระบุนามสกุลของประชาชน"
                />
            </div>

            { }
            <div>
                <label className="typo-body text-text-tertiary mb-1x block">
                    เพศ <span className="text-status-danger">*</span>
                </label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="gender"
                            value="male"
                            checked={formData.gender === 'male'}
                            onChange={(e) => onChange('gender', e.target.value)}
                            className="w-5 h-5 text-brand-primary border-border-neutral focus:ring-2 focus:ring-brand-primary cursor-pointer"
                        />
                        <span className="typo-body text-text-primary">ชาย</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="gender"
                            value="female"
                            checked={formData.gender === 'female'}
                            onChange={(e) => onChange('gender', e.target.value)}
                            className="w-5 h-5 text-brand-primary border-border-neutral focus:ring-2 focus:ring-brand-primary cursor-pointer"
                        />
                        <span className="typo-body text-text-primary">หญิง</span>
                    </label>
                </div>
            </div>

            { }
            <div>
                <label className="typo-body text-text-tertiary mb-1x block">
                    เบอร์โทรศัพท์ <span className="text-status-danger">*</span>
                </label>
                <input
                    type="tel"
                    inputMode="numeric"
                    value={formData.phone}
                    onChange={(e) => onChange('phone', e.target.value.replace(/\D/g, ''))}
                    className="w-full p-2x typo-body text-text-primary bg-white border border-border-neutral rounded-square focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                    maxLength={10}
                    placeholder="ระบุเบอร์โทรศัพท์มือถือ 10 หลัก (เช่น 0812345678)"
                />
            </div>

            { }
            <div>
                <label className="typo-body text-text-tertiary mb-1x block">
                    สถานะประชาชน <span className="text-status-danger">*</span>
                </label>
                <div className="relative">
                    <select
                        value={formData.patientStatus}
                        onChange={(e) => onChange('patientStatus', e.target.value)}
                        className="w-full p-2x typo-body text-text-primary bg-white border border-border-neutral rounded-square focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all appearance-none"
                    >
                        {patientStatusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            { }
            <div>
                <label className="typo-body text-text-tertiary mb-1x block">
                    โรค
                </label>
                <DiseaseAutocomplete
                    value={diseaseArray}
                    onChange={handleDiseaseChange}
                    placeholder="พิมพ์เพื่อค้นหาโรค"
                />
            </div>

            { }
            <div>
                <label className="typo-body text-text-tertiary mb-1x block">
                    วันเดือนปีเกิด <span className="text-status-danger">*</span>
                </label>
                <ThaiDatePicker
                    value={formData.birthDate}
                    onChange={(val) => onChange('birthDate', val)}
                    max={new Date().toISOString().split('T')[0]}
                    placeholder="เลือกวันเดือนปีเกิด"
                />
            </div>
        </div>
    );
}
