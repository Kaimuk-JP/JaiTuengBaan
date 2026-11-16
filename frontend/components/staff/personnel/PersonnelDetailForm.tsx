import React, { useState } from 'react';
import { User } from '@/types/user';
import DiseaseAutocomplete, { DiseaseOption } from '@/components/shared/DiseaseAutocomplete';
import ThaiAddressAutocomplete, { ThaiAddress } from '@/components/shared/ThaiAddressAutocomplete';
import ThaiAddressStepperModal from '@/components/shared/ThaiAddressStepperModal';
import ThaiDatePicker from '@/components/shared/ThaiDatePicker';
import type { SelectOption } from '@/types/common';

interface PersonnelDetailFormProps {
    user: User;
    isEditing: boolean;
    formData: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onFormDataChange?: (updates: Record<string, string>) => void;
    onDiseaseChange?: (diseases: DiseaseOption[]) => void;
    onSave: () => void;
    onCancel: () => void;
}

export default function PersonnelDetailForm({
    user,
    isEditing,
    formData,
    onChange,
    onFormDataChange,
    onDiseaseChange,
    onSave,
    onCancel
}: PersonnelDetailFormProps) {
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

    const renderField = (name: string, label: string, value: string | undefined | null, type: string = 'text', options?: SelectOption[], maxLength?: number, required: boolean = false) => {
        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const val = e.target.value;
            if ((name === 'phone' || name === 'idCard')) {
                if (val && !/^\d*$/.test(val)) return;
            }
            onChange(e);
        };

        return (
            <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-text-primary">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </span>
                {isEditing ? (
                    type === 'select' && options ? (
                        <select
                            name={name}
                            value={value || ''}
                            onChange={onChange}
                            className="px-4 py-2 bg-white border border-brand-primary rounded-lg text-text-primary min-h-[40px] focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        >
                            <option value="">เลือก{label}</option>
                            {options.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    ) : type === 'textarea' ? (
                        <textarea
                            name={name}
                            value={value || ''}
                            onChange={onChange}
                            rows={4}
                            className="px-4 py-2 bg-white border border-brand-primary rounded-lg text-text-primary min-h-[100px] focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none"
                        />
                    ) : (
                        <input
                            type={type}
                            name={name}
                            value={value || ''}
                            onChange={handleInputChange}
                            maxLength={maxLength}
                            className="px-4 py-2 bg-white border border-brand-primary rounded-lg text-text-primary min-h-[40px] focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                    )
                ) : (
                    <div className={`px-4 py-${type === 'textarea' ? '3' : '2'} bg-[#EBEDF5] border border-[#C8CEDD] rounded-lg text-text-primary min-h-[${type === 'textarea' ? '100px' : '40px'}] flex ${type === 'textarea' ? 'items-start' : 'items-center'} ${type === 'textarea' ? 'whitespace-pre-wrap' : ''}`}>
                        {type === 'select' && options
                            ? options.find(opt => opt.value === value)?.label || value || '-'
                            : value || '-'}
                    </div>
                )}
            </div>
        );
    };

    const caregiver = (user as any).caregiver || null;

    const mobilityOptions = [
        { value: 'WALKING', label: 'ทั่วไป' },
        { value: 'WHEELCHAIR', label: 'ต้องดูแลเพิ่ม' },
        { value: 'BEDRIDDEN', label: 'ต้องดูแลใกล้ชิด' },
    ];

    const genderOptions = [
        { value: 'male', label: 'ชาย' },
        { value: 'female', label: 'หญิง' },
    ];

    const showActions = isEditing;

    return (
        <div className="space-y-8 relative">
            { }

            { }
            <section className="space-y-4">
                <h3 className="text-[1.75rem] font-normal text-text-primary leading-[140%]">ข้อมูลประชาชน</h3>

                <div className="grid grid-cols-1 gap-4">
                    { }
                    { }
                    {renderField('idCard', 'เลขบัตรประชาชน', isEditing ? formData.idCard : user.idCard, 'text', undefined, 13, true)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField('firstName', 'ชื่อ', isEditing ? formData.firstName : (user.firstName || user.displayName?.split(' ')[0]), 'text', undefined, undefined, true)}
                    {renderField('lastName', 'นามสกุล', isEditing ? formData.lastName : (user.lastName || user.displayName?.split(' ').slice(1).join(' ')), 'text', undefined, undefined, true)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField('gender', 'เพศ', isEditing ? formData.gender : user.gender, 'select', genderOptions, undefined, true)}
                    {renderField('phone', 'เบอร์โทร', isEditing ? formData.phone : user.phone, 'text', undefined, 10, true)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField('mobilityStatus', 'สถานะประชาชน', isEditing ? formData.mobilityStatus : user.mobilityStatus, 'select', mobilityOptions, undefined, true)}
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-text-primary">
                            วันเดือนปีเกิด<span className="text-red-500 ml-1">*</span>
                        </span>
                        {isEditing ? (
                            <ThaiDatePicker
                                value={formData.birthDate ? new Date(formData.birthDate).toISOString().split('T')[0] : ''}
                                onChange={(val) => {
                                    const syntheticEvent = {
                                        target: { name: 'birthDate', value: val },
                                    } as React.ChangeEvent<HTMLInputElement>;
                                    onChange(syntheticEvent);
                                }}
                                max={new Date().toISOString().split('T')[0]}
                                placeholder="เลือกวันเกิด (ปี → เดือน → วัน)"
                                className="!border-brand-primary !rounded-lg !px-4 !py-2 min-h-[40px]"
                            />
                        ) : (
                            <div className="px-4 py-2 bg-[#EBEDF5] border border-[#C8CEDD] rounded-lg text-text-primary min-h-[40px] flex items-center">
                                {user.birthDate ? (() => {
                                    const d = new Date(user.birthDate);
                                    const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
                                    return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
                                })() : '-'}
                            </div>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <label className="text-sm font-medium text-text-primary">โรคประจำตัว</label>
                    {isEditing ? (
                        <DiseaseAutocomplete
                            value={formData.diseases || []}
                            onChange={(val) => onDiseaseChange && onDiseaseChange(val)}
                            placeholder="พิมพ์เพื่อค้นหาโรค"
                        />
                    ) : (
                        <div className="px-4 py-3 bg-[#EBEDF5] border border-[#C8CEDD] rounded-lg text-text-primary min-h-[40px] flex flex-wrap gap-2 items-center">
                            {(user.diseases && user.diseases.length > 0) || (user.customDiseases && user.customDiseases.length > 0) ? (
                                <>
                                    {user.diseases?.map((d: any) => (
                                        <span key={d.diseaseId} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded-full text-sm shadow-sm">
                                            {d.disease.name}
                                        </span>
                                    ))}
                                    {user.customDiseases?.map((d: string, i: number) => (
                                        <span key={`custom-${i}`} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded-full text-sm shadow-sm">
                                            {d}
                                        </span>
                                    ))}
                                </>
                            ) : (
                                '-'
                            )}
                        </div>
                    )}
                </div>
            </section>

            { }
            <section className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-[1.75rem] font-normal text-text-primary leading-[140%]">ข้อมูลที่อยู่</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField('villageName', 'หมู่บ้าน', isEditing ? formData.villageName : user.villageName, 'text', undefined, undefined, true)}
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-text-primary">
                            จังหวัด<span className="text-red-500 ml-1">*</span>
                        </span>
                        {isEditing ? (
                            <button
                                type="button"
                                onClick={() => setIsAddressModalOpen(true)}
                                className="px-4 py-2 bg-white border border-brand-primary rounded-lg text-left text-text-primary min-h-[40px] focus:outline-none transition-colors"
                            >
                                {formData.provinceName || 'เลือกจังหวัด'}
                            </button>
                        ) : (
                            <div className="px-4 py-2 bg-[#EBEDF5] border border-[#C8CEDD] rounded-lg text-text-primary min-h-[40px] flex items-center">
                                {user.provinceName || '-'}
                            </div>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-text-primary">
                            อำเภอ / เขต<span className="text-red-500 ml-1">*</span>
                        </span>
                        {isEditing ? (
                            <button
                                type="button"
                                onClick={() => setIsAddressModalOpen(true)}
                                className="px-4 py-2 bg-white border border-brand-primary rounded-lg text-left text-text-primary min-h-[40px] focus:outline-none transition-colors"
                            >
                                {formData.districtName || 'เลือกอำเภอ/เขต'}
                            </button>
                        ) : (
                            <div className="px-4 py-2 bg-[#EBEDF5] border border-[#C8CEDD] rounded-lg text-text-primary min-h-[40px] flex items-center">
                                {user.districtName || '-'}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-text-primary">
                            ตำบล / แขวง<span className="text-red-500 ml-1">*</span>
                        </span>
                        {isEditing ? (
                            <button
                                type="button"
                                onClick={() => setIsAddressModalOpen(true)}
                                className="px-4 py-2 bg-white border border-brand-primary rounded-lg text-left text-text-primary min-h-[40px] focus:outline-none transition-colors"
                            >
                                {formData.subdistrictName || 'เลือกตำบล/แขวง'}
                            </button>
                        ) : (
                            <div className="px-4 py-2 bg-[#EBEDF5] border border-[#C8CEDD] rounded-lg text-text-primary min-h-[40px] flex items-center">
                                {user.subdistrictName || '-'}
                            </div>
                        )}
                    </div>
                </div>

                {isEditing && (
                    <ThaiAddressStepperModal
                        isOpen={isAddressModalOpen}
                        onClose={() => setIsAddressModalOpen(false)}
                        initialAddress={{
                            provinceName: formData.provinceName,
                            amphoe: formData.districtName,
                            districtName: formData.subdistrictName
                        }}
                        onAddressSelect={(addr) => {
                            if (onFormDataChange) {
                                onFormDataChange({
                                    provinceName: addr.provinceName,
                                    districtName: addr.amphoe,
                                    subdistrictName: addr.districtName,
                                });
                            }
                        }}
                    />
                )}
                <div className="w-full">
                    {renderField('addressDetail', 'รายละเอียด', isEditing ? formData.addressDetail : user.addressDetail, 'textarea', undefined, undefined, true)}
                </div>
            </section>

            {user.role === 'USERS' && (
                <section className="space-y-4">
                    <h3 className="text-[1.75rem] font-normal text-text-primary leading-[140%]">ข้อมูลผู้ดูแลประชาชน</h3>
                    <div className="flex flex-col items-center justify-center gap-4 mb-6">
                        { }
                        <div className="w-32 h-32 rounded-full bg-[#EFF6FF] flex items-center justify-center overflow-hidden">
                            {caregiver?.pictureUrl ? (
                                <img src={caregiver.pictureUrl} alt="Caregiver" className="w-full h-full object-cover" />
                            ) : (
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-text-primary">ชื่อผู้ดูแลประชาชน</span>
                            <div className="px-4 py-2 bg-[#EBEDF5] border border-[#C8CEDD] rounded-lg text-text-primary min-h-[40px] flex items-center">
                                {caregiver?.displayName || `${caregiver?.firstName || ''} ${caregiver?.lastName || ''}`.trim() || '-'}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-text-primary">เบอร์โทร</span>
                            <div className="px-4 py-2 bg-[#EBEDF5] border border-[#C8CEDD] rounded-lg text-text-primary min-h-[40px] flex items-center">
                                {caregiver?.phone || '-'}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {(user.role === 'USERS' || user.role === 'CAREGIVER') && (
                <section className="space-y-4">
                    <h3 className="text-[1.75rem] font-normal text-text-primary leading-[140%]">ข้อมูลญาติที่ติดต่อได้</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderField('relativeName', 'ชื่อญาติ', isEditing ? formData.relativeName : user.relativeName)}
                        {renderField('relativePhone', 'เบอร์โทรญาติ', isEditing ? formData.relativePhone : user.relativePhone, 'text', undefined, 10)}
                    </div>
                </section>
            )}

            { }
            {isEditing && (
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={onSave}
                        className="px-6 py-2.5 rounded-lg bg-brand-primary text-white font-medium hover:bg-brand-primary/90 transition-colors shadow-sm"
                    >
                        บันทึก
                    </button>
                </div>
            )}

        </div>
    );
}
