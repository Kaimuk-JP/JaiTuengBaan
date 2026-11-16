'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';

interface EquipmentCheckboxesProps {
    requiredEquipment: string | null;
    isEditMode: boolean;
    onToggle: (equipment: string) => void;
}

interface EquipmentItem {
    id: number;
    name: string;
    isActive: boolean;
}

export default function EquipmentCheckboxes({ requiredEquipment, isEditMode, onToggle }: EquipmentCheckboxesProps) {
    const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);

    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                const response = await fetchWithAuth('/equipment?activeOnly=true');
                if (response.ok) {
                    const result = await response.json();
                    const data = Array.isArray(result) ? result : (result.data || []);
                    setEquipmentList(data);
                }
            } catch (error) {
                console.error('Error fetching equipment:', error);
            }
        };
        fetchEquipment();
    }, []);

    const selectedArray = requiredEquipment ? requiredEquipment.split(',').map(s => s.trim()).filter(Boolean) : [];
    const allUniqueNames = Array.from(new Set([...equipmentList.map(e => e.name), ...selectedArray])).filter(Boolean);
    const optionsToShow = isEditMode ? allUniqueNames : selectedArray;

    return (
        <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
                {isEditMode ? 'เลือกอุปกรณ์ที่ต้องใช้' : 'อุปกรณ์ที่ต้องใช้'}
            </label>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-y-3 gap-x-4">
                {optionsToShow.map((equipment) => (
                    <label key={equipment} className="flex items-start gap-3">
                        <div className="pt-0.5 flex-shrink-0">
                            <input
                                type="checkbox"
                                checked={requiredEquipment?.includes(equipment) || false}
                                onChange={() => onToggle(equipment)}
                                disabled={!isEditMode}
                                className={`w-5 h-5 text-green-600 bg-white border-2 border-gray-400 rounded focus:ring-0 accent-green-600 ${isEditMode ? 'cursor-pointer' : 'cursor-default'
                                    }`}
                            />
                        </div>
                        <span className="text-sm text-gray-800 font-medium leading-snug">{equipment}</span>
                    </label>
                ))}
            </div>
            {allUniqueNames.length === 0 && (
                <div className="text-sm text-gray-500 italic">ไม่มีข้อมูลอุปกรณ์</div>
            )}
        </div>
    );
}
