'use client';

import { useRouter } from 'next/navigation';

interface VolunteerFilterProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
}

export default function VolunteerFilter({ searchTerm, onSearchChange }: VolunteerFilterProps) {
    const router = useRouter();

    return (
        <div className="p-4 border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between gap-4">
                {}
                <div className="relative flex-1 max-w-md">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="ค้นหาด้วยชื่อสมาชิกจิตอาสา"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
                    />
                </div>

                {}
                <button
                    onClick={() => router.push('/staff/volunteers/add')}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    title="เพิ่มสมาชิก"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M20 8V14" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M23 11H17" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
