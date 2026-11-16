"use client";

import ThaiDatePicker from '@/components/shared/ThaiDatePicker';

interface PersonalInfoFieldsProps {
    formData: {
        idCard: string;
        firstName: string;
        lastName: string;
        phone: string;
        birthDate: string;
        gender: "male" | "female";
    };
    onChange: (field: string, value: string) => void;
}

export function PersonalInfoFields({ formData, onChange }: PersonalInfoFieldsProps) {
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
                    className="w-full p-2x typo-body text-text-primary bg-white border border-border-neutral rounded-square outline-none transition-all"
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
                    onChange={(e) => onChange('firstName', e.target.value)}
                    className="w-full p-2x typo-body text-text-primary bg-white border border-border-neutral rounded-square outline-none transition-all"
                    placeholder="กรอกชื่อจริง (สูงสุด 50 ตัวอักษร)"
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
                    onChange={(e) => onChange('lastName', e.target.value)}
                    className="w-full p-2x typo-body text-text-primary bg-white border border-border-neutral rounded-square outline-none transition-all"
                    placeholder="กรอกนามสกุล (สูงสุด 50 ตัวอักษร)"
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
                    เบอร์โทรศัพท์ <span className="text-semantic-critical">*</span>
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
                    className="w-full p-2x typo-body text-text-primary bg-white border border-border-neutral rounded-square outline-none transition-all"
                    placeholder="เบอร์โทรศัพท์ 10 หลัก (เช่น 0812345678)"
                    maxLength={10}
                />
            </div>



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
