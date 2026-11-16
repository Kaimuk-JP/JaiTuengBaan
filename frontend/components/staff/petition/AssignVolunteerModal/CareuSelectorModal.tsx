import { useState, useEffect } from 'react';
import { Users, X, Search } from 'lucide-react';
import { Volunteer } from './types';

interface CareuSelectorModalProps {
    careUs: Volunteer[];
    selectedCareU: string | null;
    onSelectCareU: (id: string | null) => void;
    onClose: () => void;
    busyCareuIds?: string[];
    patientLabel?: string;
}

export default function CareuSelectorModal({
    careUs,
    selectedCareU,
    onSelectCareU,
    onClose,
    busyCareuIds = [],
    patientLabel,
}: CareuSelectorModalProps) {
    const [searchCareU, setSearchCareU] = useState('');
    const [visibleCareUs, setVisibleCareUs] = useState(20);

    useEffect(() => { setVisibleCareUs(20); }, [searchCareU]);

    const unavailableIds = new Set(busyCareuIds);

    const filteredCareUs = careUs
        .filter(v => {
            const isBusy = unavailableIds.has(v.id);
            const isCurrentSelected = selectedCareU === v.id;
            return !isBusy || isCurrentSelected;
        })
        .filter(v => {
            const searchText = searchCareU.toLowerCase();
            const fname = v.firstName?.toLowerCase() || '';
            const lname = v.lastName?.toLowerCase() || '';
            const dname = v.displayName?.toLowerCase() || '';
            const ph = v.phone || '';
            return fname.includes(searchText) || lname.includes(searchText) || dname.includes(searchText) || ph.includes(searchText);
        });

    const paginatedCareUs = filteredCareUs.slice(0, visibleCareUs);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Users className="w-5 h-5 text-gray-400" /> เลือกจิตอาสาแคร์ยู
                        </h2>
                        {patientLabel && (
                            <p className="text-sm text-purple-700 mt-1 font-medium">สำหรับ {patientLabel}</p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4 border-b border-gray-100 bg-white">
                    <div className="relative mb-3">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-sm focus:ring-brand-primary focus:border-brand-primary shadow-sm"
                            placeholder="ค้นหาชื่อจิตอาสาแคร์ยู หรือ เบอร์โทร..."
                            value={searchCareU}
                            onChange={(e) => setSearchCareU(e.target.value)}
                            autoFocus
                        />
                    </div>
                    {selectedCareU && (
                        <button
                            onClick={() => { onSelectCareU(null); }}
                            className="w-full py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
                        >
                            ยกเลิกการเลือกแคร์ยูคนนี้
                        </button>
                    )}
                </div>
                <div
                    className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/50 rounded-b-2xl"
                    onScroll={(e) => {
                        const target = e.target as HTMLDivElement;
                        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 20) {
                            if (visibleCareUs < filteredCareUs.length) {
                                setVisibleCareUs(prev => prev + 20);
                            }
                        }
                    }}
                >
                    <div className="flex flex-col gap-3">
                        {paginatedCareUs.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">ไม่พบจิตอาสาแคร์ยูที่ตรงกับการค้นหา</div>
                        ) : paginatedCareUs.map(v => {
                            const isSelected = selectedCareU === v.id;
                            const isBusy = busyCareuIds.includes(v.id);
                            const isUnavailable = isBusy;
                            return (
                                <div
                                    key={v.id}
                                    onClick={() => { if (!isUnavailable) onSelectCareU(v.id); }}
                                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all shadow-sm ${isUnavailable
                                        ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                        : isSelected ? 'border-brand-primary bg-purple-50 ring-2 ring-brand-primary cursor-pointer' : 'border-gray-200 bg-white hover:border-brand-primary hover:shadow-md cursor-pointer'
                                        }`}
                                >
                                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                        {v.pictureUrl ? (
                                            <img
                                                src={v.pictureUrl}
                                                className="w-full h-full object-cover"
                                                alt=""
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    if (e.currentTarget.nextElementSibling) {
                                                        (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                                    }
                                                }}
                                            />
                                        ) : null}
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100" style={{ display: v.pictureUrl ? 'none' : 'flex' }}>
                                            <Users className="w-6 h-6 text-gray-400" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-bold text-gray-900 truncate">
                                            {v.displayName || `${v.firstName} ${v.lastName}`}
                                        </p>
                                        <p className="text-sm text-gray-500">{v.phone || 'ไม่มีเบอร์โทร'}</p>
                                    </div>
                                    {isBusy && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 whitespace-nowrap">
                                            ไม่ว่าง
                                        </span>
                                    )}
                                    {isSelected && (
                                        <div className="ml-2 w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center text-white">✓</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
