'use client';

import ThaiAddressAutocomplete, { ThaiAddress } from '@/components/shared/ThaiAddressAutocomplete';

interface VolunteerFormProps {
    formData: any;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onFormDataChange?: (updates: Record<string, string>) => void;
    onSubmit: (e: React.FormEvent) => void;
    loading: boolean;
    onCancel: () => void;
}

export default function VolunteerForm({
    formData,
    handleChange,
    onFormDataChange,
    onSubmit,
    loading,
    onCancel
}: VolunteerFormProps) {
    const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary";

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
        <form onSubmit={onSubmit} className="space-y-6">
            {}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">ชื่อ</label>
                    <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="สมพงษ์"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">นามสกุล</label>
                    <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="ช่วยด้วย"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    />
                </div>
            </div>

            {}
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">เพศ</label>
                <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                >
                    <option value="">เลือกเพศ</option>
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                </select>
            </div>

            {}
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">เบอร์โทร</label>
                <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0XX-XXX-XXXX"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
            </div>

            {}
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">วันเดือนปีเกิด</label>
                <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
            </div>

            {}
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
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">หมู่ที่</label>
                        <input
                            type="text"
                            name="moo"
                            value={formData.moo}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
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
                            className={inputClass}
                        />
                    </div>
                    <ThaiAddressAutocomplete
                        field="provinceName"
                        label="จังหวัด"
                        value={formData.provinceName || ''}
                        placeholder="พิมพ์ชื่อจังหวัด"
                        isEditing={true}
                        onInputChange={(val) => {
                            handleChange({ target: { name: 'provinceName', value: val } } as any);
                        }}
                        onAddressSelect={handleAddressSelect}
                        className={inputClass}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <ThaiAddressAutocomplete
                        field="districtName"
                        label="อำเภอ / เขต"
                        value={formData.districtName || ''}
                        placeholder="พิมพ์ชื่ออำเภอ/เขต"
                        isEditing={true}
                        onInputChange={(val) => {
                            handleChange({ target: { name: 'districtName', value: val } } as any);
                        }}
                        onAddressSelect={handleAddressSelect}
                        className={inputClass}
                    />
                    <ThaiAddressAutocomplete
                        field="subdistrictName"
                        label="ตำบล / แขวง"
                        value={formData.subdistrictName || ''}
                        placeholder="พิมพ์ชื่อตำบล/แขวง"
                        isEditing={true}
                        onInputChange={(val) => {
                            handleChange({ target: { name: 'subdistrictName', value: val } } as any);
                        }}
                        onAddressSelect={handleAddressSelect}
                        className={inputClass}
                    />
                </div>
            </div>

            {}
            <div className="flex justify-center gap-4 pt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2.5 border border-slate-300 text-text-secondary rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
                >
                    ยกเลิก
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-brand-primary text-white rounded-lg hover:bg-btn-hover text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            กำลังบันทึก...
                        </>
                    ) : (
                        <>
                            บันทึก
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
