'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

let searchAddressByDistrict: any = null;
let searchAddressByAmphoe: any = null;
let searchAddressByProvince: any = null;

if (typeof window !== 'undefined') {
    try {
        const thaiAddr = require('thai-address-database');
        searchAddressByDistrict = thaiAddr.searchAddressByDistrict;
        searchAddressByAmphoe = thaiAddr.searchAddressByAmphoe;
        searchAddressByProvince = thaiAddr.searchAddressByProvince;
    } catch (e) {
        console.warn('thai-address-database not available');
    }
}

export interface ThaiAddress {
    districtName: string;
    amphoe: string;
    provinceName: string;
    zipcode: string;
}

interface ThaiAddressAutocompleteProps {
        field: 'subdistrictName' | 'districtName' | 'provinceName';
        value: string;
        label: string;
        placeholder?: string;
        required?: boolean;
        isEditing: boolean;
        onInputChange: (value: string) => void;
        onAddressSelect: (address: ThaiAddress) => void;
        className?: string;
}

export default function ThaiAddressAutocomplete({
    field,
    value,
    label,
    placeholder,
    required = false,
    isEditing,
    onInputChange,
    onAddressSelect,
    className,
}: ThaiAddressAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<ThaiAddress[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const searchAddress = useCallback((query: string) => {
        if (!query || query.length < 1) {
            setSuggestions([]);
            return;
        }

        let rawResults: any[] = [];
        try {
            if (field === 'subdistrictName' && searchAddressByDistrict) {
                rawResults = searchAddressByDistrict(query, 10);
            } else if (field === 'districtName' && searchAddressByAmphoe) {
                rawResults = searchAddressByAmphoe(query, 10);
            } else if (field === 'provinceName' && searchAddressByProvince) {
                rawResults = searchAddressByProvince(query, 10);
            }
        } catch (e) {
            rawResults = [];
        }

        const results: ThaiAddress[] = rawResults.map(r => ({
            districtName: r.district || r.districtName || '',
            amphoe: r.amphoe || '',
            provinceName: r.province || r.provinceName || '',
            zipcode: r.zipcode || ''
        }));

        const seen = new Set<string>();
        const unique = results.filter(r => {
            const key = `${r.districtName}-${r.amphoe}-${r.provinceName}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        setSuggestions(unique);
        setShowSuggestions(unique.length > 0);
        setHighlightIndex(-1);
    }, [field]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onInputChange(val);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchAddress(val), 200);
    };

    const handleSelect = (address: ThaiAddress) => {
        onAddressSelect(address);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && highlightIndex >= 0) {
            e.preventDefault();
            handleSelect(suggestions[highlightIndex]);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const highlightMatch = (text: string, query: string) => {
        if (!text) return '';
        if (!query) return text;
        const idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return text;
        return (
            <>
                {text.slice(0, idx)}
                <span className="font-bold text-brand-primary">{text.slice(idx, idx + query.length)}</span>
                {text.slice(idx + query.length)}
            </>
        );
    };

    if (!isEditing) {
        return (
            <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-text-primary">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </span>
                <div className="px-4 py-2 bg-[#EBEDF5] border border-[#C8CEDD] rounded-lg text-text-primary min-h-[40px] flex items-center">
                    {value || '-'}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1" ref={wrapperRef}>
            <span className="text-sm font-medium text-text-primary">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </span>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                    placeholder={placeholder}
                    className={className || "px-4 py-2 bg-white border border-brand-primary rounded-lg text-text-primary min-h-[40px] focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-full"}
                    autoComplete="off"
                />

                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                        {suggestions.map((addr, idx) => (
                            <button
                                key={`${addr.districtName}-${addr.amphoe}-${addr.provinceName}-${idx}`}
                                type="button"
                                onClick={() => handleSelect(addr)}
                                onMouseEnter={() => setHighlightIndex(idx)}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-slate-50 last:border-b-0 ${
                                    idx === highlightIndex ? 'bg-blue-50' : 'hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-slate-800">
                                        {field === 'provinceName' ? highlightMatch(addr.provinceName, value) : addr.provinceName}
                                    </span>
                                    <span className="text-slate-400">-</span>
                                    <span className="text-slate-700">
                                        {field === 'districtName' ? highlightMatch(addr.amphoe, value) : addr.amphoe}
                                    </span>
                                    <span className="text-slate-400">-</span>
                                    <span className="text-slate-600">
                                        {field === 'subdistrictName' ? highlightMatch(addr.districtName, value) : addr.districtName}
                                    </span>
                                    <span className="text-slate-400">-</span>
                                    <span className="text-slate-600 font-mono">
                                        {addr.zipcode}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
