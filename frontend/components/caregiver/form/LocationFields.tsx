'use client';

interface LocationFieldsProps {
    coordinates: string;
    villageName: string;
    subdistrictName: string;
    districtName: string;
    provinceName: string;
    addressDetail: string;
    onMapSelect: () => void;
    onAddressDetailChange: (value: string) => void;
}

export function LocationFields({
    coordinates,
    villageName,
    subdistrictName,
    districtName,
    provinceName,
    addressDetail,
    onMapSelect,
    onAddressDetailChange
}: LocationFieldsProps) {
    const hasAddress = !!coordinates;

    const buildFullAddress = () => {
        const parts: string[] = [];
        if (villageName) parts.push(villageName);
        if (districtName) parts.push(districtName);
        if (subdistrictName) parts.push(`ต.${subdistrictName}`);
        if (provinceName) parts.push(`จ.${provinceName}`);
        return parts.join(', ');
    };

    const fullAddress = buildFullAddress();

    return (
        <div className="space-y-2x">
            <div>
                <label className="typo-body text-text-tertiary mb-1x block">
                    ปักหมุดตำแหน่งที่อยู่ <span className="text-status-danger">*</span>
                </label>
                <button
                    type="button"
                    onClick={onMapSelect}
                    className={`w-full p-2x typo-body border rounded-square flex items-start gap-2x transition-all bg-white text-left ${
                        hasAddress
                            ? 'border-brand-primary'
                            : 'border-border-neutral hover:border-brand-primary'
                    }`}
                >
                    <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${hasAddress ? 'text-brand-primary' : 'text-text-tertiary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className={`flex-1 min-w-0 leading-relaxed ${hasAddress ? 'text-brand-primary' : 'text-text-tertiary'}`}>
                        {hasAddress && fullAddress
                            ? fullAddress
                            : hasAddress
                                ? `พิกัด: ${coordinates}`
                                : 'ค้นหาที่อยู่ในแผนที่'
                        }
                    </span>
                    {!hasAddress && (
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    )}
                </button>
            </div>

            <div>
                <label className="typo-body text-text-tertiary mb-1x block">
                    รายละเอียดที่อยู่เพิ่มเติม (เช่น บ้านเลขที่, ซอย)
                </label>
                <textarea
                    value={addressDetail}
                    onChange={(e) => onAddressDetailChange(e.target.value)}
                    className="w-full p-2x typo-body text-text-primary bg-white border border-border-neutral rounded-square focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all resize-none"
                    rows={2}
                    maxLength={255}
                    placeholder="เช่น บ้านเลขที่ 123 ซอย 5"
                />
            </div>
        </div>
    );
}
