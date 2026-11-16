'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';

interface EquipmentItem {
    id: number;
    name: string;
    isActive: boolean;
}

interface EquipmentSelectorProps {
    selectedEquipment: string[];
    onSelectionChange: (selected: string[]) => void;
}

export function EquipmentSelector({ selectedEquipment, onSelectionChange }: EquipmentSelectorProps) {
    const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
    const [otherText, setOtherText] = useState('');

    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                const response = await fetchWithAuth('/equipment?activeOnly=true');
                if (response.ok) {
                    const result = await response.json();
                    let data = Array.isArray(result) ? result : (result.data || []);
                    data.push({ id: 9999, name: 'อื่นๆ', isActive: true });
                    setEquipmentList(data);
                }
            } catch (error) {
                console.error('Error fetching equipment:', error);
            }
        };
        fetchEquipment();
    }, []);

    useEffect(() => {
        const otherItem = selectedEquipment.find(e => e.startsWith('อื่นๆ: '));
        if (otherItem) {
            setOtherText(otherItem.replace('อื่นๆ: ', ''));
        }
    }, []);

    const handleToggle = (name: string) => {
        if (name === 'อื่นๆ') {
            const hasOther = selectedEquipment.some(e => e === 'อื่นๆ' || e.startsWith('อื่นๆ:'));
            if (hasOther) {
                onSelectionChange(selectedEquipment.filter(e => e !== 'อื่นๆ' && !e.startsWith('อื่นๆ:')));
                setOtherText('');
            } else {
                onSelectionChange([...selectedEquipment, 'อื่นๆ']);
            }
            return;
        }

        if (selectedEquipment.includes(name)) {
            onSelectionChange(selectedEquipment.filter(e => e !== name));
        } else {
            onSelectionChange([...selectedEquipment, name]);
        }
    };

    const handleOtherTextChange = (text: string) => {
        setOtherText(text);
        const filtered = selectedEquipment.filter(e => e !== 'อื่นๆ' && !e.startsWith('อื่นๆ:'));
        if (text.trim() === '') {
            onSelectionChange([...filtered, 'อื่นๆ']);
        } else {
            onSelectionChange([...filtered, `อื่นๆ: ${text}`]);
        }
    };

    if (equipmentList.length === 0) return null;

    const hasOtherSelected = selectedEquipment.some(e => e === 'อื่นๆ' || e.startsWith('อื่นๆ:'));

    return (
        <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                เลือกอุปกรณ์ที่ต้องใช้
            </label>

            <div className="grid grid-cols-2 gap-3">
                {equipmentList.map((item) => {
                    const isOtherItem = item.name === 'อื่นๆ';
                    const isSelected = isOtherItem ? hasOtherSelected : selectedEquipment.includes(item.name);
                    
                    return (
                        <label
                            key={item.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                                isSelected
                                    ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-primary/30'
                            }`}
                        >
                            <div className="relative flex items-center justify-center w-5 h-5 flex-shrink-0 mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggle(item.name)}
                                    className="absolute w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className={`w-full h-full rounded border-2 flex items-center justify-center transition-colors ${
                                    isSelected ? 'bg-brand-primary border-brand-primary' : 'bg-white border-gray-300 dark:border-gray-600 dark:bg-gray-700'
                                }`}>
                                    {isSelected && (
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                            <span className="text-sm font-medium leading-snug">
                                {item.name}
                            </span>
                        </label>
                    );
                })}
            </div>

            {hasOtherSelected && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <input
                        type="text"
                        value={otherText}
                        onChange={(e) => handleOtherTextChange(e.target.value)}
                        placeholder="โปรดระบุอุปกรณ์ที่ต้องการ"
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-brand-primary/30 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all text-gray-800 dark:text-white"
                        autoFocus
                    />
                </div>
            )}
        </div>
    );
}
