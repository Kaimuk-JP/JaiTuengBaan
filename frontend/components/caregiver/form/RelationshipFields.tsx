'use client';

interface RelationshipFieldsProps {
    formData: {
        relationship: string;
        additionalDetails: string;
        documentPreview: string | null;
        documentFile: File | null;
    };
    onChange: (field: string, value: string) => void;
    onDocumentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDocumentRemove: () => void;
}

const relationshipOptions = [
    { value: '', label: 'เลือกความสัมพันธ์' },
    { value: 'FAMILY', label: 'ครอบครัว' },
    { value: 'RELATIVE', label: 'ญาติ' },
    { value: 'CLOSE_PERSON', label: 'คนใกล้ชิด' },
];

export function RelationshipFields({
    formData,
    onChange,
    onDocumentChange,
    onDocumentRemove
}: RelationshipFieldsProps) {
    return (
        <div className="space-y-2x">
            { }
            <div>
                <label className="typo-body text-text-tertiary mb-1x block">
                    เลือกความสัมพันธ์ <span className="text-status-danger">*</span>
                </label>
                <div className="relative">
                    <select
                        value={formData.relationship}
                        onChange={(e) => onChange('relationship', e.target.value)}
                        className="w-full p-2x typo-body text-text-primary bg-white border border-border-neutral rounded-square focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all appearance-none"
                    >
                        {relationshipOptions.map(opt => (
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
                    ระบุรายละเอียดเพิ่มเติม
                </label>
                <input
                    type="text"
                    value={formData.additionalDetails}
                    onChange={(e) => onChange('additionalDetails', e.target.value)}
                    placeholder="เช่น บุตร, คู่สมรส"
                    className="w-full p-2x typo-body text-text-primary bg-white border border-border-neutral rounded-square focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                    maxLength={500}
                />
            </div>

            { }
            <div>
                <label className="typo-body text-text-tertiary mb-1x block">
                    แนบหลักฐานยืนยันความสัมพันธ์ <span className="text-status-danger">*</span>
                </label>
                <div
                    className="border-2 border-dashed border-border-neutral rounded-square p-3x flex flex-col items-center justify-center cursor-pointer hover:border-brand-primary transition-colors bg-white"
                    onClick={() => document.getElementById('document-upload')?.click()}
                >
                    {formData.documentPreview ? (
                        <div className="w-full flex flex-col items-center">
                            <img
                                src={formData.documentPreview}
                                alt="Document"
                                className="max-w-full max-h-48 object-contain rounded border border-border-neutral mb-2x"
                            />
                            <span className="typo-menu text-text-tertiary text-center truncate max-w-full px-2x">
                                {formData.documentFile?.name}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDocumentRemove();
                                }}
                                className="mt-1x text-status-danger typo-menu hover:underline"
                            >
                                ลบ
                            </button>
                        </div>
                    ) : (
                        <div className="py-4x flex flex-col items-center">
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 29.0973C19.6787 29.0973 19.3796 29.046 19.1027 28.9433C18.8258 28.8411 18.5624 28.6651 18.3127 28.4153L10.0207 20.1233C9.62422 19.7264 9.42845 19.2622 9.43333 18.7307C9.43867 18.1991 9.63445 17.7264 10.0207 17.3127C10.4344 16.8993 10.9096 16.6858 11.446 16.672C11.9829 16.6582 12.4582 16.8582 12.872 17.272L18 22.4V2C18 1.43244 18.1916 0.957333 18.5747 0.574666C18.9573 0.191555 19.4324 0 20 0C20.5676 0 21.0427 0.191555 21.4253 0.574666C21.8084 0.957333 22 1.43244 22 2V22.4L27.128 17.272C27.5249 16.8756 27.9958 16.6798 28.5407 16.6847C29.086 16.69 29.5656 16.8993 29.9793 17.3127C30.3656 17.7264 30.5656 18.1949 30.5793 18.718C30.5931 19.2411 30.3931 19.7096 29.9793 20.1233L21.6873 28.4153C21.4376 28.6651 21.1742 28.8411 20.8973 28.9433C20.6204 29.046 20.3213 29.0973 20 29.0973ZM4.82067 40C3.47356 40 2.33333 39.5333 1.4 38.6C0.466667 37.6667 0 36.5264 0 35.1793V29.9487C0 29.3811 0.191555 28.906 0.574666 28.5233C0.957333 28.1402 1.43244 27.9487 2 27.9487C2.56756 27.9487 3.04267 28.1402 3.42533 28.5233C3.80844 28.906 4 29.3811 4 29.9487V35.1793C4 35.3847 4.08556 35.5727 4.25667 35.7433C4.42733 35.9144 4.61533 36 4.82067 36H35.1793C35.3847 36 35.5727 35.9144 35.7433 35.7433C35.9144 35.5727 36 35.3847 36 35.1793V29.9487C36 29.3811 36.1916 28.906 36.5747 28.5233C36.9573 28.1402 37.4324 27.9487 38 27.9487C38.5676 27.9487 39.0427 28.1402 39.4253 28.5233C39.8084 28.906 40 29.3811 40 29.9487V35.1793C40 36.5264 39.5333 37.6667 38.6 38.6C37.6667 39.5333 36.5264 40 35.1793 40H4.82067Z" fill="#C8CEDD" />
                            </svg>
                            <p className="typo-menu text-text-placeholder text-center mt-2x">
                                ภาพถ่าย บัตรประจำตัวประชาชนของผู้ดูแลประชาชนและประชาชน ถ่ายร่วมกันในภาพเดียว
                            </p>
                        </div>
                    )}
                    <input
                        id="document-upload"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={onDocumentChange}
                        className="hidden"
                    />
                </div>
            </div>
        </div>
    );
}
