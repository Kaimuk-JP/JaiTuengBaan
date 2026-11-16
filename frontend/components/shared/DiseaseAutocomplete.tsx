"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { getApiUrl } from '@/lib/api';

interface Disease {
    id: number;
    name: string;
    isActive: boolean;
}

export interface DiseaseOption {
    id?: number;
    name: string;
}

interface DiseaseAutocompleteProps {
    value: DiseaseOption[];
    onChange: (values: DiseaseOption[]) => void;
    placeholder?: string;
}

export default function DiseaseAutocomplete({
    value = [],
    onChange,
    placeholder = "เลือกหรือพิมพ์โรคประจำตัว"
}: DiseaseAutocompleteProps) {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<DiseaseOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const searchDiseases = useCallback(async (query: string) => {
        if (query.trim().length < 1) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(
                `${getApiUrl()}/diseases?search=${encodeURIComponent(query)}&activeOnly=true`
            );
            if (response.ok) {
                const data: Disease[] = await response.json();
                const diseaseOptions: DiseaseOption[] = data
                    .map(d => ({ id: d.id, name: d.name }))
                    .filter(opt => !value.some(v => (v.id !== undefined && opt.id !== undefined && v.id === opt.id) || v.name === opt.name))
                    .slice(0, 15);
                setSuggestions(diseaseOptions);
            }
        } catch (error) {
            console.error('Error searching diseases:', error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, [value]);

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (inputValue.trim().length > 0) {
            debounceRef.current = setTimeout(() => {
                searchDiseases(inputValue);
            }, 300);
        } else {
            setSuggestions([]);
        }

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [inputValue, searchDiseases]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    const addDisease = (disease: DiseaseOption | string) => {
        let option: DiseaseOption;
        if (typeof disease === 'string') {
            const trimmed = disease.trim();
            if (!trimmed) return;
            option = { name: trimmed };
        } else {
            option = disease;
        }

        const isDuplicate = value.some(v =>
            (v.id !== undefined && option.id !== undefined && v.id === option.id) ||
            (v.name === option.name)
        );

        if (!isDuplicate) {
            onChange([...value, option]);
        }
        setInputValue('');
        setSuggestions([]);
    };

    const removeDisease = (diseaseToRemove: DiseaseOption) => {
        onChange(value.filter(d => d.name !== diseaseToRemove.name));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            addDisease(inputValue);
        }
    };

    const handleFocus = () => {
        setShowSuggestions(true);
        setTimeout(() => {
            inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 350);
    };

    const isCustomDisease = inputValue.trim().length > 0 &&
        !suggestions.some(s => s.name === inputValue.trim()) &&
        !value.some(v => v.name === inputValue.trim());

    const hasDropdownContent = showSuggestions && (
        inputValue.trim().length > 0 || suggestions.length > 0 ||
        inputValue.trim().length === 0
    );

    return (
        <div ref={containerRef} className="space-y-2x">
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {value.map((disease, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-take-soft text-take-dark rounded-circle text-base"
                        >
                            {disease.name}
                            <button
                                type="button"
                                onClick={() => removeDisease(disease)}
                                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-fuan-light active:bg-fuan-medium text-lg font-bold"
                                aria-label={`ลบ ${disease.name}`}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full p-3 pr-12 text-base text-text-primary bg-white border border-border-neutral rounded-square focus:outline-none focus:ring-2 focus:ring-btn-primary focus:border-transparent"
                    style={{ fontSize: '1rem' }}
                />

                {isLoading && (
                    <div className="absolute right-12 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-btn-primary"></div>
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-text-tertiary active:bg-fuji-light rounded-square"
                    aria-label="ค้นหาโรค"
                >
                    <svg width="16" height="16" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.7588 11.4615L6.57167 7.27417C6.23833 7.54939 5.855 7.76478 5.42167 7.92033C4.98833 8.07589 4.54006 8.15367 4.07683 8.15367C2.93739 8.15367 1.97306 7.75917 1.18383 6.97017C0.394611 6.18117 0 5.21706 0 4.07783C0 2.93872 0.3945 1.97428 1.1835 1.1845C1.9725 0.394834 2.93661 0 4.07583 0C5.21494 0 6.17939 0.394611 6.96917 1.18383C7.75883 1.97306 8.15367 2.93739 8.15367 4.07683C8.15367 4.55294 8.07378 5.00767 7.914 5.441C7.75411 5.87433 7.54083 6.25122 7.27417 6.57167L11.4613 10.7588L10.7588 11.4615ZM4.07683 7.15383C4.93583 7.15383 5.66339 6.85572 6.2595 6.2595C6.85572 5.66339 7.15383 4.93583 7.15383 4.07683C7.15383 3.21783 6.85572 2.49028 6.2595 1.89417C5.66339 1.29794 4.93583 0.999833 4.07683 0.999833C3.21783 0.999833 2.49028 1.29794 1.89417 1.89417C1.29794 2.49028 0.999833 3.21783 0.999833 4.07683C0.999833 4.93583 1.29794 5.66339 1.89417 6.2595C2.49028 6.85572 3.21783 7.15383 4.07683 7.15383Z" fill="currentColor" />
                    </svg>
                </button>

                {hasDropdownContent && (
                    <div className="absolute left-0 right-0 bottom-full mb-1 bg-white border border-border-neutral rounded-square shadow-smooth-medium max-h-64 overflow-y-auto z-50">
                        {inputValue.trim().length === 0 && (
                            <div className="px-4 py-4 text-text-tertiary text-base">
                                พิมพ์เพื่อค้นหาโรค
                            </div>
                        )}

                        {inputValue.trim().length > 0 && !isLoading && isCustomDisease && (
                            <button
                                type="button"
                                onClick={() => {
                                    addDisease(inputValue);
                                    setShowSuggestions(false);
                                }}
                                className="w-full px-4 py-4 text-left text-base active:bg-take-soft text-btn-primary border-b border-border-neutral flex items-center gap-2"
                            >
                                <span className="text-xl">+</span>
                                <span>เพิ่ม &quot;{inputValue.trim()}&quot;</span>
                            </button>
                        )}

                        {inputValue.trim().length > 0 && !isLoading && suggestions.map((disease, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => {
                                    addDisease(disease);
                                }}
                                className="w-full px-4 py-4 text-left text-base active:bg-fuji-light text-text-primary border-b border-border-neutral last:border-b-0"
                            >
                                {disease.name}
                            </button>
                        ))}

                        {isLoading && (
                            <div className="px-4 py-4 text-center text-text-tertiary text-base">
                                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-btn-primary mr-2"></div>
                                กำลังค้นหา...
                            </div>
                        )}

                        {inputValue.trim().length > 0 && !isLoading && suggestions.length === 0 && !isCustomDisease && (
                            <div className="px-4 py-4 text-text-tertiary text-base">
                                ไม่พบโรคที่ค้นหา
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
}
