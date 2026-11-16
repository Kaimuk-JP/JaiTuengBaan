'use client';

import ThaiAddressAutocomplete, { ThaiAddress } from '@/components/shared/ThaiAddressAutocomplete';

interface VolunteerInfoFormProps {
    formData: any;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onFormDataChange?: (updates: Record<string, string>) => void;
    isEditing: boolean;
    isSaving: boolean;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onSave: () => void;
}

export default function VolunteerInfoForm({
    formData,
    handleChange,
    onFormDataChange,
    isEditing,
    isSaving,
    onStartEdit,
    onCancelEdit,
    onSave
}: VolunteerInfoFormProps) {
    const inputClass = (editing: boolean) => `w-full px-4 py-3 ${editing ? 'bg-white' : 'bg-slate-100'} border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary disabled:text-text-primary`;

    const handleAddressSelect = (addr: ThaiAddress) => {
        if (onFormDataChange) {
            onFormDataChange({
                provinceName: addr.provinceName,
                districtName: addr.amphoe,
                subdistrictName: addr.districtName,
            });
        }
    };
    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-text-primary">ข้อมูลสมาชิกจิตอาสา</h2>
                <button
                    onClick={onStartEdit}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">ชื่อ</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={`w-full px-4 py-3 ${isEditing ? 'bg-white' : 'bg-slate-100'} border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary disabled:text-text-primary`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">นามสกุล</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={`w-full px-4 py-3 ${isEditing ? 'bg-white' : 'bg-slate-100'} border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary disabled:text-text-primary`}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">เพศ</label>
                    <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 ${isEditing ? 'bg-white' : 'bg-slate-100'} border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary disabled:text-text-primary appearance-none`}
                        style={isEditing ? {
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23666' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 1rem center',
                            paddingRight: '2.5rem'
                        } : {}}
                    >
                        <option value="">เลือกเพศ</option>
                        <option value="male">ชาย</option>
                        <option value="female">หญิง</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">เบอร์โทร</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="088 - 772 - 8563"
                        className={`w-full px-4 py-3 ${isEditing ? 'bg-white' : 'bg-slate-100'} border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary disabled:text-text-primary`}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">วันเดือนปีเกิด</label>
                    <input
                        type="date"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 ${isEditing ? 'bg-white' : 'bg-slate-100'} border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary disabled:text-text-primary`}
                    />
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-lg font-bold text-text-primary mb-4">ข้อมูลที่อยู่</h3>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">บ้านเลขที่</label>
                            <input
                                type="text"
                                name="houseNo"
                                value={formData.houseNo}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className={`w-full px-4 py-3 ${isEditing ? 'bg-white' : 'bg-slate-100'} border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary disabled:text-text-primary`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">หมู่ที่</label>
                            <input
                                type="text"
                                name="moo"
                                value={formData.moo}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className={`w-full px-4 py-3 ${isEditing ? 'bg-white' : 'bg-slate-100'} border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary disabled:text-text-primary`}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">หมู่บ้าน</label>
                            <input
                                type="text"
                                name="villageName"
                                value={formData.villageName}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className={inputClass(isEditing)}
                            />
                        </div>
                        <ThaiAddressAutocomplete
                            field="provinceName"
                            label="จังหวัด"
                            value={formData.provinceName || ''}
                            placeholder="พิมพ์ชื่อจังหวัด"
                            isEditing={isEditing}
                            onInputChange={(val) => {
                                handleChange({ target: { name: 'provinceName', value: val } } as any);
                            }}
                            onAddressSelect={handleAddressSelect}
                            className={inputClass(isEditing)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <ThaiAddressAutocomplete
                            field="districtName"
                            label="อำเภอ / เขต"
                            value={formData.districtName || ''}
                            placeholder="พิมพ์ชื่ออำเภอ/เขต"
                            isEditing={isEditing}
                            onInputChange={(val) => {
                                handleChange({ target: { name: 'districtName', value: val } } as any);
                            }}
                            onAddressSelect={handleAddressSelect}
                            className={inputClass(isEditing)}
                        />
                        <ThaiAddressAutocomplete
                            field="subdistrictName"
                            label="ตำบล / แขวง"
                            value={formData.subdistrictName || ''}
                            placeholder="พิมพ์ชื่อตำบล/แขวง"
                            isEditing={isEditing}
                            onInputChange={(val) => {
                                handleChange({ target: { name: 'subdistrictName', value: val } } as any);
                            }}
                            onAddressSelect={handleAddressSelect}
                            className={inputClass(isEditing)}
                        />
                    </div>
                </div>

                {isEditing && (
                    <div className="flex justify-center gap-4 pt-6">
                        <button
                            type="button"
                            onClick={onCancelEdit}
                            className="px-8 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={isSaving}
                            className="px-8 py-2.5 bg-brand-primary text-white rounded-lg hover:bg-brand-hover font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
