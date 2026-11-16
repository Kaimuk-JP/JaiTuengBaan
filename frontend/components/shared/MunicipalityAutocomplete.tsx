'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';

export interface Municipality {
    id: string;
    name: string;
    slug: string;
    code: string;
    type: string;
    provinceId: number;
    districtId: number;
    province?: {
        id: number;
        nameTh: string;
        nameEn: string;
    };
    district?: {
        id: number;
        nameTh: string;
        nameEn: string;
    };
}

interface MunicipalityAutocompleteProps {
    value: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    onSelect: (id: string, name: string) => void;
    className?: string;
}

export default function MunicipalityAutocomplete({
    value,
    label = 'เลือกเทศบาล/อบต.',
    placeholder = 'พิมพ์ชื่อเพื่อค้นหาเทศบาล...',
    required = false,
    onSelect,
    className,
}: MunicipalityAutocompleteProps) {
    const [query, setQuery] = useState('');
    const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const searchMunicipalities = async (searchQuery: string) => {
        if (!searchQuery || searchQuery.trim().length < 1) {
            setMunicipalities([]);
            return;
        }
        
        setLoading(true);
        try {
            const res = await fetch(`/api/municipalities?name=${encodeURIComponent(searchQuery)}`);
            if (!res.ok) throw new Error('Failed to fetch municipalities');
            const json = await res.json();
            if (Array.isArray(json)) {
                setMunicipalities(json);
            } else if (json && json.data && Array.isArray(json.data)) {
                setMunicipalities(json.data);
            }
        } catch (err) {
            console.error('Error fetching municipalities:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        setIsOpen(true);
        
        if (val === '') {
            onSelect('', '');
            setMunicipalities([]);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchMunicipalities(val), 2000);
    };

    const getTypeFullName = (type: string) => {
        switch (type) {
            case 'CITY': return 'เทศบาลนคร';
            case 'TOWN': return 'เทศบาลเมือง';
            case 'SUBDISTRICT': return 'องค์การบริหารส่วนตำบล';
            case 'SAO': return 'องค์การบริหารส่วนตำบล';
            case 'PAO': return 'องค์การบริหารส่วนจังหวัด';
            case 'BMA': return 'กรุงเทพมหานคร';
            case 'PATTAYA': return 'เมืองพัทยา';
            default: return 'เทศบาล';
        }
    };

    const formatName = (m: Municipality) => {
        let namePart = m.name.trim();
        
        const knownPrefixes = [
            'องค์การบริหารส่วนจังหวัด', 'องค์การบริหารส่วนตำบล',
            'เทศบาลนคร', 'เทศบาลเมือง', 'เทศบาลตำบล', 'เทศบาล',
            'อบจ.', 'อบต.', 'ทน.', 'ทม.', 'ทต.', 'อบจ', 'อบต', 'ทน', 'ทม', 'ทต'
        ];
        
        let hasPrefix = false;
        for (const p of knownPrefixes) {
            if (namePart.startsWith(p)) {
                hasPrefix = true;
                break;
            }
        }
        
        const prefix = hasPrefix ? '' : getTypeFullName(m.type);
        
        const dist = m.district?.nameTh ? ` อ.${m.district.nameTh}` : '';
        const prov = m.province?.nameTh ? ` จ.${m.province.nameTh}` : '';
        return `${prefix}${namePart}${dist}${prov}`.trim();
    };

    useEffect(() => {
        if (value && municipalities.length > 0) {
            const selected = municipalities.find(m => m.id === value);
            if (selected) {
                const formattedName = formatName(selected);
                if (query !== formattedName) {
                    setQuery(formattedName);
                }
            }
        }
    }, [value, municipalities, query]);

    const filtered = useMemo(() => {
        return municipalities.slice(0, 50);
    }, [municipalities]);

    const handleSelect = (m: Municipality) => {
        const name = formatName(m);
        setQuery(name);
        onSelect(m.id, name);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                if (value && municipalities.length > 0) {
                    const selected = municipalities.find(m => m.id === value);
                    if (selected) {
                        setQuery(formatName(selected));
                    }
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [value, municipalities]);

    return (
        <div className="flex flex-col gap-1" ref={wrapperRef}>
            <span className="typo-body text-text-tertiary mb-1x block">
                {label}
                {required && <span className="text-status-danger ml-1">*</span>}
            </span>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (query && municipalities.length === 0) {
                            searchMunicipalities(query);
                        }
                        setIsOpen(true);
                    }}
                    placeholder={placeholder}
                    className={className || "w-full p-2x typo-body text-text-primary bg-white border border-border-neutral rounded-square focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"}
                    autoComplete="off"
                />

                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {isOpen && filtered.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                        {filtered.map((m) => (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => handleSelect(m)}
                                className="w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-slate-50 last:border-b-0 hover:bg-slate-50"
                            >
                                <div className="text-slate-800 font-medium">
                                    {formatName(m)}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
                {isOpen && filtered.length === 0 && query && !loading && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-center text-sm text-slate-500">
                        ไม่พบข้อมูลเทศบาลที่ค้นหา
                    </div>
                )}
            </div>
        </div>
    );
}
