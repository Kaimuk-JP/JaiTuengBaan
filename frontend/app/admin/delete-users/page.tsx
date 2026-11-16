'use client';

import { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import {
    Shield,
    UserX,
    Search,
    Trash2,
    AlertTriangle,
    User,
    Phone,
    ChevronLeft,
    ChevronRight,
    Filter
} from 'lucide-react';
import Swal from '@/lib/swal';
import Image from 'next/image';

interface UserData {
    id: number;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    phone?: string;
    pictureUrl?: string;
    role: string;
    createdAt: string;
}

function DeleteUsersContent() {
    const router = useRouter();
    const { user } = useAuth();

    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '10',
            });
            if (searchQuery) params.append('search', searchQuery);
            if (roleFilter !== 'ALL') params.append('role', roleFilter);

            const response = await fetch(`${getApiUrl()}/users?${params}`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || data.data || []);
                setTotalPages(data.totalPages || 1);
                setTotalCount(data.total || data.users?.length || 0);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery, roleFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchUsers();
    };

    const toggleSelectUser = (userId: number) => {
        const targetUser = users.find(u => u.id === userId);
        if (targetUser?.role === 'ADMIN' || userId === user?.id) return;

        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const toggleSelectAll = () => {
        const selectableUsers = users.filter(u => u.role !== 'ADMIN' && u.id !== user?.id);
        const allSelected = selectableUsers.every(u => selectedUsers.includes(u.id));

        if (allSelected) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(selectableUsers.map(u => u.id));
        }
    };

    const deleteUser = async (userId: number) => {
        const targetUser = users.find(u => u.id === userId);
        const displayName = targetUser?.firstName && targetUser?.lastName
            ? `${targetUser.firstName} ${targetUser.lastName}`
            : targetUser?.firstName || targetUser?.displayName || `ID: ${userId}`;

        const result = await Swal.fire({
            icon: 'warning',
            title: 'ยืนยันการลบ?',
            html: `คุณต้องการลบบัญชี <strong>${displayName}</strong> หรือไม่?<br><br><span class="text-red-500">การดำเนินการนี้ไม่สามารถย้อนกลับได้!</span>`,
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ลบบัญชี',
            cancelButtonText: 'ยกเลิก',
        });

        if (result.isConfirmed) {
            setIsDeleting(true);
            try {
                const response = await fetch(`${getApiUrl()}/users/${userId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });

                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'ลบบัญชีสำเร็จ',
                        timer: 1500,
                        showConfirmButton: false,
                    });
                    fetchUsers();
                    setSelectedUsers(prev => prev.filter(id => id !== userId));
                } else {
                    const error = await response.json();
                    Swal.fire({
                        icon: 'error',
                        title: 'เกิดข้อผิดพลาด',
                        text: error.message || 'ไม่สามารถลบบัญชีได้',
                    });
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
                });
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const deleteSelectedUsers = async () => {
        if (selectedUsers.length === 0) return;

        const result = await Swal.fire({
            icon: 'warning',
            title: 'ยืนยันการลบหลายบัญชี?',
            html: `คุณต้องการลบบัญชีที่เลือกทั้งหมด <strong>${selectedUsers.length}</strong> บัญชี หรือไม่?<br><br><span class="text-red-500">การดำเนินการนี้ไม่สามารถย้อนกลับได้!</span>`,
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ลบทั้งหมด',
            cancelButtonText: 'ยกเลิก',
        });

        if (result.isConfirmed) {
            setIsDeleting(true);
            let successCount = 0;
            let failCount = 0;

            for (const userId of selectedUsers) {
                try {
                    const response = await fetch(`${getApiUrl()}/users/${userId}`, {
                        method: 'DELETE',
                        credentials: 'include',
                    });
                    if (response.ok) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch {
                    failCount++;
                }
            }

            if (failCount === 0) {
                Swal.fire({
                    icon: 'success',
                    title: 'ลบบัญชีสำเร็จ',
                    text: `ลบทั้งหมด ${successCount} บัญชี`,
                    timer: 2000,
                    showConfirmButton: false,
                });
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'ลบบัญชีบางส่วน',
                    text: `สำเร็จ ${successCount} / ล้มเหลว ${failCount}`,
                });
            }

            setSelectedUsers([]);
            fetchUsers();
            setIsDeleting(false);
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'bg-purple-100 text-purple-700';
            case 'STAFF': return 'bg-blue-100 text-blue-700';
            case 'DRIVE': return 'bg-green-100 text-green-700';
            case 'CAREU': return 'bg-emerald-100 text-emerald-700';
            case 'USERS': return 'bg-orange-100 text-orange-700';
            case 'CAREGIVER': return 'bg-teal-100 text-teal-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'ผู้ดูแลระบบ';
            case 'STAFF': return 'เจ้าหน้าที่';
            case 'DRIVE': return 'เจ้าหน้าที่รถ';
            case 'CAREU': return 'จิตอาสาแคร์ยู';
            case 'USERS': return 'ผู้ใช้บริการ';
            case 'CAREGIVER': return 'ผู้ดูแลประชาชน / ญาติ';
            default: return role;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            { }
            <div className="p-4 max-w-5xl mx-auto">
                { }
                <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ค้นหาชื่อ หรือเบอร์โทร..."
                                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <select
                                value={roleFilter}
                                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                                className="pl-12 pr-8 py-3 border border-slate-200 rounded-xl appearance-none bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                            >
                                <option value="ALL">ทุก Role</option>
                                <option value="USERS">ผู้ใช้บริการ</option>
                                <option value="DRIVE">เจ้าหน้าที่รถ</option>
                                <option value="CAREU">จิตอาสาแคร์ยู</option>
                                <option value="CAREGIVER">ผู้ดูแลประชาชน / ญาติ</option>
                                <option value="STAFF">เจ้าหน้าที่</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
                        >
                            ค้นหา
                        </button>
                    </form>
                </div>

                { }
                {selectedUsers.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700 font-medium">
                                เลือกแล้ว {selectedUsers.length} บัญชี
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSelectedUsers([])}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                ยกเลิกการเลือก
                            </button>
                            <button
                                onClick={deleteSelectedUsers}
                                disabled={isDeleting}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                ลบที่เลือก
                            </button>
                        </div>
                    </div>
                )}

                { }
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    { }
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
                        <div className="col-span-1 flex items-center">
                            <input
                                type="checkbox"
                                checked={users.filter(u => u.role !== 'ADMIN' && u.id !== user?.id).every(u => selectedUsers.includes(u.id)) && users.length > 0}
                                onChange={toggleSelectAll}
                                className="w-4 h-4 rounded border-slate-300"
                            />
                        </div>
                        <div className="col-span-4">ผู้ใช้</div>
                        <div className="col-span-2">เบอร์โทร</div>
                        <div className="col-span-2">Role</div>
                        <div className="col-span-2">วันที่สร้าง</div>
                        <div className="col-span-1 text-center">จัดการ</div>
                    </div>

                    { }
                    {loading && (
                        <div className="p-8 text-center text-slate-400">
                            <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-red-500 rounded-full mx-auto mb-3"></div>
                            กำลังโหลด...
                        </div>
                    )}

                    { }
                    {!loading && users.map((u) => {
                        const isAdmin = u.role === 'ADMIN';
                        const isSelf = u.id === user?.id;
                        const isSelectable = !isAdmin && !isSelf;
                        const displayName = u.firstName && u.lastName
                            ? `${u.firstName} ${u.lastName}`
                            : u.firstName || u.displayName || 'ไม่ระบุชื่อ';

                        return (
                            <div
                                key={u.id}
                                className={`grid grid-cols-12 gap-4 px-4 py-4 border-b border-slate-100 items-center transition-colors ${selectedUsers.includes(u.id) ? 'bg-red-50' : 'hover:bg-slate-50'
                                    } ${!isSelectable ? 'opacity-60' : ''}`}
                            >
                                <div className="col-span-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(u.id)}
                                        onChange={() => toggleSelectUser(u.id)}
                                        disabled={!isSelectable}
                                        className="w-4 h-4 rounded border-slate-300 disabled:opacity-30"
                                    />
                                </div>
                                <div className="col-span-4 flex items-center gap-3">
                                    {u.pictureUrl ? (
                                        <Image
                                            src={u.pictureUrl}
                                            alt={displayName}
                                            width={40}
                                            height={40}
                                            className="rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-slate-400" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium text-slate-800">{displayName}</p>
                                        <p className="text-xs text-slate-400">ID: {u.id}</p>
                                    </div>
                                    {isSelf && (
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">คุณ</span>
                                    )}
                                </div>
                                <div className="col-span-2 flex items-center gap-2 text-slate-600">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    {u.phone || '-'}
                                </div>
                                <div className="col-span-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(u.role)}`}>
                                        {getRoleLabel(u.role)}
                                    </span>
                                </div>
                                <div className="col-span-2 text-slate-500 text-sm">
                                    {new Date(u.createdAt).toLocaleDateString('th-TH', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </div>
                                <div className="col-span-1 flex justify-center">
                                    {isSelectable && (
                                        <button
                                            onClick={() => deleteUser(u.id)}
                                            disabled={isDeleting}
                                            className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                            title="ลบบัญชี"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                    {isAdmin && (
                                        <span className="text-xs text-slate-400">ลบไม่ได้</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    { }
                    {!loading && users.length === 0 && (
                        <div className="p-12 text-center text-slate-400">
                            <UserX className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>ไม่พบผู้ใช้</p>
                        </div>
                    )}

                    { }
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
                            <span className="text-sm text-slate-500">
                                หน้า {currentPage} จาก {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 hover:bg-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 hover:bg-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                { }
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">คำเตือน</p>
                        <ul className="list-disc list-inside space-y-1 text-yellow-700">
                            <li>การลบบัญชีจะลบข้อมูลทั้งหมดของผู้ใช้และไม่สามารถกู้คืนได้</li>
                            <li>ไม่สามารถลบบัญชี Admin หรือบัญชีตัวเองได้</li>
                            <li>แนะนำให้สำรองข้อมูลก่อนทำการลบ</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminDeleteUsersPage() {
    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <DeleteUsersContent />
        </ProtectedRoute>
    );
}
