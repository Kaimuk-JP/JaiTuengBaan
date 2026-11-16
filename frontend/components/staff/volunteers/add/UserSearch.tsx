'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { fetchWithAuth } from '@/lib/auth';

interface UserSearchProps {
    onSelectUser: (user: any) => void;
    selectedUser: any | null;
    onClearSelection: () => void;
}

export default function UserSearch({ onSelectUser, selectedUser, onClearSelection }: UserSearchProps) {
    const [searching, setSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setSearching(true);
                try {
                    const res = await fetchWithAuth(`/users/search?q=${encodeURIComponent(searchQuery)}&page=1&limit=20`);
                    if (res.ok) {
                        const responseData = await res.json();
                        const users = Array.isArray(responseData) ? responseData : (responseData.data || []);
                        setSearchResults(users);
                        setShowResults(true);
                    }
                } catch (err) {
                    console.error("Error searching users:", err);
                } finally {
                    setSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSelect = (user: any) => {
        onSelectUser(user);
        setSearchQuery('');
        setShowResults(false);
    };

    if (selectedUser) {
        return (
            <div className="mb-6 flex items-center justify-between p-4 border border-brand-primary/30 bg-apple-soft rounded-lg">
                <div className="flex items-center gap-4">
                    {selectedUser.pictureUrl ? (
                        <Image src={selectedUser.pictureUrl} alt={selectedUser.firstName || 'User'} width={56} height={56} className="rounded-full object-cover" />
                    ) : (
                        <div className="w-14 h-14 bg-brand-primary/20 rounded-full flex items-center justify-center text-brand-primary">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    )}
                    <div>
                        <p className="text-text-primary font-bold text-lg">{selectedUser.firstName ? `${selectedUser.firstName} ${selectedUser.lastName || ''}`.trim() : 'ไม่มีชื่อ'}</p>
                        <p className="text-text-tertiary text-sm">IAM ID: {selectedUser.iamUserId?.substring(0, 10)}...</p>
                    </div>
                </div>
                <button type="button" onClick={onClearSelection} className="text-text-tertiary hover:text-fuan-dark p-2 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <div ref={searchRef} className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">
                ประชาชน (ค้นหาจากระบบ) <span className="text-fuan-dark">*</span>
            </label>
            <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาด้วยชื่อ หรือ เบอร์โทรศัพท์"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
                {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-primary"></div>
                    </div>
                )}
                {showResults && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.length > 0 ? (
                            <ul>
                                {searchResults.map((user) => (
                                    <li
                                        key={user.id}
                                        onClick={() => handleSelect(user)}
                                        className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b border-slate-50 last:border-0"
                                    >
                                        {user.pictureUrl ? (
                                            <Image src={user.pictureUrl} alt={user.firstName || 'User'} width={40} height={40} className="rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                                                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-text-primary">{user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'ไม่มีชื่อ'}</p>
                                            <p className="text-sm text-text-tertiary">เบอร์: {user.phone || '-'}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="px-4 py-3 text-text-tertiary text-center">ไม่พบประชาชน</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
