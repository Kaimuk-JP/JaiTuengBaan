import { useState, useEffect } from 'react';
import { Users, X, Search } from 'lucide-react';
import { Volunteer } from './types';

interface VolunteerSelectorModalProps {
    volunteers: Volunteer[];
    selectedVolunteer: string | null;
    onSelectVolunteer: (id: string) => void;
    onClose: () => void;
    busyDriverIds?: string[];
}

export default function VolunteerSelectorModal({
    volunteers,
    selectedVolunteer,
    onSelectVolunteer,
    onClose,
    busyDriverIds = []
}: VolunteerSelectorModalProps) {
    const [searchVolunteer, setSearchVolunteer] = useState('');
    const [visibleVolunteers, setVisibleVolunteers] = useState(20);

    useEffect(() => { setVisibleVolunteers(20); }, [searchVolunteer]);

    const filteredVolunteers = volunteers
        .filter(v => {
            const isBusy = busyDriverIds.includes(v.id);
            const isCurrentSelected = selectedVolunteer === v.id;
            return !isBusy || isCurrentSelected;
        })
        .filter(v => {
            const searchText = searchVolunteer.toLowerCase();
            const fname = v.firstName?.toLowerCase() || '';
            const lname = v.lastName?.toLowerCase() || '';
            const dname = v.displayName?.toLowerCase() || '';
            const ph = v.phone || '';
            return fname.includes(searchText) || lname.includes(searchText) || dname.includes(searchText) || ph.includes(searchText);
        });

    const paginatedVolunteers = filteredVolunteers.slice(0, visibleVolunteers);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Users className="w-5 h-5 text-gray-400" /> 2. เลือกเจ้าหน้าที่ขับรถ</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4 border-b border-gray-100 bg-white">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-sm focus:ring-brand-primary focus:border-brand-primary shadow-sm"
                            placeholder="ค้นหาชื่อ หรือ เบอร์โทร..."
                            value={searchVolunteer}
                            onChange={(e) => setSearchVolunteer(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>
                <div
                    className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/50 rounded-b-2xl"
                    onScroll={(e) => {
                        const target = e.target as HTMLDivElement;
                        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 20) {
                            if (visibleVolunteers < filteredVolunteers.length) {
                                setVisibleVolunteers(prev => prev + 20);
                            }
                        }
                    }}
                >
                    <div className="flex flex-col gap-3">
                        {paginatedVolunteers.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">ไม่พบคนขับที่ตรงกับการค้นหา</div>
                        ) : paginatedVolunteers.map(v => {
                            const isSelected = selectedVolunteer === v.id;
                            const isBusy = busyDriverIds.includes(v.id);
                            return (
                                <div
                                    key={v.id}
                                    onClick={() => { if (!isBusy) onSelectVolunteer(v.id); }}
                                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all shadow-sm ${isBusy
                                        ? 'border-red-200 bg-red-50/40 opacity-60 cursor-not-allowed'
                                        : isSelected ? 'border-brand-primary bg-green-50 ring-2 ring-brand-primary cursor-pointer' : 'border-gray-200 bg-white hover:border-brand-primary hover:shadow-md cursor-pointer'
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
                                    {v.distance !== undefined && v.distance !== Infinity && (
                                        <div className="text-right">
                                            <p className="text-[11px] text-gray-500">ระยะห่าง</p>
                                            <p className="text-sm font-bold text-blue-600">
                                                {v.distance < 1 ? `${(v.distance * 1000).toFixed(0)} ม.` : `${v.distance.toFixed(1)} กม.`}
                                            </p>
                                        </div>
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
