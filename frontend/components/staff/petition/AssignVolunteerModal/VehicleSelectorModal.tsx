import { useState, useEffect } from 'react';
import { Car, X, Search } from 'lucide-react';
import { Vehicle } from './types';

interface VehicleSelectorModalProps {
    vehicles: Vehicle[];
    selectedVehicle: number | null;
    onSelectVehicle: (id: number) => void;
    onClose: () => void;
    needsSpecialVehicle: boolean;
    totalCapacityNeeded: number;
    busyVehicleIds?: number[];
}

export default function VehicleSelectorModal({
    vehicles,
    selectedVehicle,
    onSelectVehicle,
    onClose,
    needsSpecialVehicle,
    totalCapacityNeeded,
    busyVehicleIds = []
}: VehicleSelectorModalProps) {
    const [searchVehicle, setSearchVehicle] = useState('');
    const [visibleVehicles, setVisibleVehicles] = useState(20);

    useEffect(() => { setVisibleVehicles(20); }, [searchVehicle]);

    const isVehicleReady = (v: Vehicle) => {
        const status = v.status || (v.isActive ? 'READY' : 'INACTIVE');
        return v.isActive && status === 'READY';
    };

    const filteredVehicles = vehicles
        .filter(v => {
            const isReady = isVehicleReady(v);
            const isBusy = busyVehicleIds.includes(v.id);
            const isCurrentSelected = selectedVehicle === v.id;
            const hasEnoughCapacity = (v.capacity || 0) >= totalCapacityNeeded;
            return ((isReady && !isBusy) || isCurrentSelected) && hasEnoughCapacity;
        })
        .filter(v => {
            const searchText = searchVehicle.toLowerCase();
            return (v.licensePlate || '').toLowerCase().includes(searchText) ||
                (v.name || '').toLowerCase().includes(searchText) ||
                (v.brand || '').toLowerCase().includes(searchText) ||
                (v.model || '').toLowerCase().includes(searchText);
        });

    const paginatedVehicles = filteredVehicles.slice(0, visibleVehicles);

    const getVehicleTypeText = (type: string) => {
        switch (type) {
            case 'STANDARD_VAN': return 'รถตู้มาตรฐาน';
            case 'WHEELCHAIR_VAN': return 'รถรองรับวีลแชร์/ผู้พิการ';
            case 'AMBULANCE': return 'รถพยาบาลฉุกเฉิน';
            default: return '';
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Car className="w-5 h-5 text-gray-400" /> 1. เลือกรถที่จะใช้งาน</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 flex flex-wrap items-center justify-between text-xs text-blue-800 gap-1">
                    <span>
                        จำนวนที่นั่งที่ต้องการ: <strong className="text-blue-950 font-bold">{totalCapacityNeeded} ที่นั่ง</strong>
                    </span>
                    <span className="text-blue-600">
                        (แสดงเฉพาะรถที่มีความจุตั้งแต่ {totalCapacityNeeded} ที่นั่งขึ้นไป)
                    </span>
                </div>
                <div className="p-4 border-b border-gray-100 bg-white">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-sm focus:ring-brand-primary focus:border-brand-primary shadow-sm"
                            placeholder="ค้นหาทะเบียน, ยี่ห้อ..."
                            value={searchVehicle}
                            onChange={(e) => setSearchVehicle(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>
                <div
                    className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/50 rounded-b-2xl"
                    onScroll={(e) => {
                        const target = e.target as HTMLDivElement;
                        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 20) {
                            if (visibleVehicles < filteredVehicles.length) {
                                setVisibleVehicles(prev => prev + 20);
                            }
                        }
                    }}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {paginatedVehicles.length === 0 ? (
                            <div className="col-span-1 sm:col-span-2 text-center text-gray-500 py-10">
                                <Car className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                                <p className="font-semibold text-gray-700">ไม่พบรถที่มีที่นั่งเพียงพอ</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {totalCapacityNeeded > 0
                                        ? `ต้องการรถที่มีความจุอย่างน้อย ${totalCapacityNeeded} ที่นั่งขึ้นไป หรือรถในระบบไม่ว่างในรอบเวลานี้`
                                        : 'ไม่พบรถที่ตรงตามเงื่อนไขการค้นหา'}
                                </p>
                            </div>
                        ) : paginatedVehicles.map(v => {
                            const isSelected = selectedVehicle === v.id;
                            const isBusy = busyVehicleIds.includes(v.id);
                            const isInsufficientCapacity = (v.capacity || 0) < totalCapacityNeeded;
                            const isUnsuitable = (needsSpecialVehicle && v.type === 'STANDARD_VAN') || isInsufficientCapacity;

                            return (
                                <div
                                    key={v.id}
                                    onClick={() => {
                                        if (!isBusy && !isInsufficientCapacity) {
                                            onSelectVehicle(v.id);
                                        }
                                    }}
                                    className={`p-4 border rounded-xl transition-all shadow-sm ${isBusy || isInsufficientCapacity
                                        ? 'border-red-200 bg-red-50/40 opacity-60 cursor-not-allowed'
                                        : isSelected
                                            ? 'border-brand-primary bg-green-50 ring-2 ring-brand-primary cursor-pointer'
                                            : isUnsuitable
                                                ? 'border-orange-200 bg-orange-50/30 hover:border-orange-300 cursor-pointer'
                                                : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white cursor-pointer'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-bold text-gray-900 border-b-2 border-slate-900 inline-block text-lg">{v.licensePlate}</p>
                                        <div className="flex items-center gap-2">
                                            {isBusy && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                                    ไม่ว่าง
                                                </span>
                                            )}
                                            {isSelected && (
                                                <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center text-white text-sm">✓</div>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700 mb-1">{v.name || '-'}</p>
                                    {getVehicleTypeText(v.type) && (
                                        <p className="text-xs text-gray-500 mb-0.5">{getVehicleTypeText(v.type)}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mb-1">{v.brand || ''} {v.model || ''}</p>
                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                                        <span className={`text-[11px] px-2 py-1 rounded font-medium ${isUnsuitable ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                                            ความจุ {v.capacity} ที่นั่ง
                                            {totalCapacityNeeded > v.capacity && ` (ต้องการ ${totalCapacityNeeded})`}
                                        </span>
                                        {isBusy && <span className="text-[10px] text-red-500">มีงานในรอบเวลานี้แล้ว</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
