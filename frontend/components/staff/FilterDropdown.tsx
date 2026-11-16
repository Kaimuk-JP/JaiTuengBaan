'use client';

import { useState } from 'react';

interface FilterOption {
    value: string;
    label: string;
}

interface FilterGroup {
    title: string;
    options: FilterOption[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
}

interface FilterDropdownProps {
    groups: FilterGroup[];
    onClearAll: () => void;
    className?: string;
}

export default function FilterDropdown({
    groups,
    onClearAll,
    className = '',
}: FilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    const totalSelected = groups.reduce((sum, group) => sum + group.selectedValues.length, 0);

    const toggleFilter = (group: FilterGroup, value: string) => {
        const newValues = group.selectedValues.includes(value)
            ? group.selectedValues.filter(v => v !== value)
            : [...group.selectedValues, value];
        group.onChange(newValues);
    };

    const handleClearAll = () => {
        onClearAll();
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`}>
            {}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${isOpen || totalSelected > 0
                    ? 'border-brand-primary bg-apple-soft text-brand-primary'
                    : 'border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
            >
                <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.49786 10.9962C5.49781 11.1098 5.52939 11.221 5.58906 11.3176C5.64873 11.4142 5.73414 11.4922 5.83569 11.543L7.0575 12.1539C7.15066 12.2004 7.25418 12.2224 7.35822 12.2177C7.46225 12.213 7.56336 12.1818 7.65193 12.127C7.7405 12.0722 7.8136 11.9957 7.86428 11.9047C7.91495 11.8137 7.94153 11.7113 7.94148 11.6071V7.3308C7.94162 7.02802 8.05417 6.73608 8.25732 6.51157L12.6699 1.63105C12.749 1.54342 12.801 1.43476 12.8196 1.3182C12.8383 1.20164 12.8227 1.08217 12.7749 0.974252C12.7271 0.866331 12.649 0.774576 12.5502 0.710082C12.4513 0.645589 12.3359 0.611118 12.2178 0.61084H1.22152C1.10338 0.610882 0.987782 0.645182 0.888734 0.709584C0.789686 0.773986 0.711437 0.865727 0.663466 0.973695C0.615495 1.08166 0.599859 1.20122 0.618454 1.3179C0.637049 1.43457 0.689076 1.54335 0.768233 1.63105L5.18202 6.51157C5.38517 6.73608 5.49772 7.02802 5.49786 7.3308V10.9962Z" stroke="currentColor" strokeWidth="1.22181" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-medium">กรอง</span>
                {totalSelected > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-brand-primary text-white text-xs rounded-full">
                        {totalSelected}
                    </span>
                )}
            </button>

            {}
            {isOpen && (
                <>
                    {}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {}
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-20 overflow-hidden">
                        <div className="p-4">
                            {}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-slate-900">ตัวกรอง</h3>
                                {totalSelected > 0 && (
                                    <button
                                        onClick={handleClearAll}
                                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                                    >
                                        ล้างทั้งหมด
                                    </button>
                                )}
                            </div>

                            {}
                            {groups.map((group, groupIndex) => (
                                <div key={groupIndex} className={groupIndex > 0 ? 'mt-4 pt-4 border-t border-slate-200' : ''}>
                                    <h4 className="text-sm font-medium text-slate-700 mb-2">{group.title}</h4>
                                    <div className="space-y-2">
                                        {group.options.map(option => (
                                            <label
                                                key={option.value}
                                                className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={group.selectedValues.includes(option.value)}
                                                    onChange={() => toggleFilter(group, option.value)}
                                                    className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500"
                                                />
                                                <span className="text-sm text-slate-700">{option.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

interface ActiveFiltersProps {
    groups: FilterGroup[];
    onRemove: (groupIndex: number, value: string) => void;
}

export function ActiveFilters({ groups, onRemove }: ActiveFiltersProps) {
    const hasActiveFilters = groups.some(g => g.selectedValues.length > 0);

    if (!hasActiveFilters) return null;

    return (
        <div className="mt-3 flex flex-wrap gap-2">
            {groups.map((group, groupIndex) =>
                group.selectedValues.map(value => {
                    const option = group.options.find(o => o.value === value);
                    return (
                        <span
                            key={`${groupIndex}-${value}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm"
                        >
                            <span>{option?.label || value}</span>
                            <button
                                onClick={() => onRemove(groupIndex, value)}
                                className="hover:bg-blue-200 rounded-full p-0.5"
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </span>
                    );
                })
            )}
        </div>
    );
}
