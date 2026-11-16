'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { fetchWithAuth } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import {
    Users,
    Search,
    Edit3,
    Check,
    X,
    Shield,
    User,
    UserCog,
    Car,
    Heart,
    Crown,
} from 'lucide-react';
import Swal from '@/lib/swal';

interface UserItem {
    id: number;
    iamUserId: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    role: string;
    pictureUrl: string | null;
    createdAt: string;
}

const ROLES = [
    { value: 'USERS', label: 'ผู้ใช้บริการ', icon: Heart, color: 'text-rose-500' },
    { value: 'CAREGIVER', label: 'ผู้ดูแลประชาชน / ญาติ', icon: User, color: 'text-blue-500' },
    { value: 'DRIVE', label: 'เจ้าหน้าที่รถ', icon: Car, color: 'text-green-500' },
    { value: 'CAREU', label: 'จิตอาสาแคร์ยู', icon: User, color: 'text-emerald-500' },
    { value: 'STAFF', label: 'เจ้าหน้าที่', icon: UserCog, color: 'text-amber-500' },
    { value: 'EXECUTIVE', label: 'ผู้บริหาร / ผู้อนุมัติ', icon: Crown, color: 'text-yellow-500' },
    { value: 'ADMIN', label: 'แอดมิน', icon: Shield, color: 'text-purple-500' },
];

function RolesManagementContent() {
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async (query?: string) => {
        try {
            setLoading(true);
            const searchParam = query !== undefined ? query : searchQuery;
            const url = `/users/search?q=${encodeURIComponent(searchParam)}&limit=100`;
            const res = await fetchWithAuth(url);
            const data = await res.json();
            setUsers(data.data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchUsers(searchQuery);
    };

    const startEdit = (user: UserItem) => {
        setEditingUserId(user.id);
        setSelectedRole(user.role);
    };

    const cancelEdit = () => {
        setEditingUserId(null);
        setSelectedRole('');
    };

    const saveRole = async (user: UserItem) => {
        if (selectedRole === user.role) {
            cancelEdit();
            return;
        }

        if (user.id === currentUser?.id) {
            Swal.fire({
                icon: 'error',
                title: 'ไม่สามารถเปลี่ยน Role ตัวเองได้',
                text: 'กรุณาให้ Admin คนอื่นทำการเปลี่ยน Role ให้',
            });
            cancelEdit();
            return;
        }

        const result = await Swal.fire({
            title: 'ยืนยันการเปลี่ยน Role',
            html: `เปลี่ยน Role ของ <b>${user.displayName || user.firstName || 'ผู้ใช้'}</b><br/>จาก <b>${getRoleLabel(user.role)}</b> เป็น <b>${getRoleLabel(selectedRole)}</b>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#3b82f6',
        });

        if (!result.isConfirmed) {
            cancelEdit();
            return;
        }

        try {
            const res = await fetchWithAuth('/auth/user/update-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    iamUserId: user.iamUserId,
                    role: selectedRole,
                }),
            });

            const data = await res.json();

            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'เปลี่ยน Role สำเร็จ',
                    timer: 1500,
                    showConfirmButton: false,
                });
                fetchUsers();
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถเปลี่ยน Role ได้',
            });
        }

        cancelEdit();
    };

    const getRoleLabel = (role: string) => {
        return ROLES.find((r) => r.value === role)?.label || role;
    };

    const getRoleIcon = (role: string) => {
        const roleInfo = ROLES.find((r) => r.value === role);
        if (!roleInfo) return User;
        return roleInfo.icon;
    };

    const getRoleColor = (role: string) => {
        return ROLES.find((r) => r.value === role)?.color || 'text-slate-500';
    };

    return (
        <div className="min-h-screen bg-slate-100">
            { }
            <div className="p-4">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ค้นหาชื่อ..."
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                    >
                        ค้นหา
                    </button>
                </form>
            </div>

            { }
            <div className="px-4 pb-8">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500">ไม่พบผู้ใช้</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {users.map((user) => {
                            const RoleIcon = getRoleIcon(user.role);
                            const isEditing = editingUserId === user.id;

                            return (
                                <div
                                    key={user.id}
                                    className="bg-white rounded-xl p-4 shadow-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        { }
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                                            {user.pictureUrl ? (
                                                <img
                                                    src={user.pictureUrl}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <User className="w-6 h-6 text-slate-400" />
                                                </div>
                                            )}
                                        </div>

                                        { }
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-800 truncate">
                                                {user.displayName || user.firstName || 'ไม่ระบุชื่อ'}
                                            </p>
                                            <p className="text-sm text-slate-500 truncate">
                                                ID: {user.id}
                                            </p>
                                        </div>

                                        { }
                                        {isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={selectedRole}
                                                    onChange={(e) => setSelectedRole(e.target.value)}
                                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    {ROLES.map((role) => (
                                                        <option key={role.value} value={role.value}>
                                                            {role.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => saveRole(user)}
                                                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                                >
                                                    <Check className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className={`flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-full ${getRoleColor(user.role)}`}>
                                                    <RoleIcon className="w-4 h-4" />
                                                    <span className="text-sm font-medium">
                                                        {getRoleLabel(user.role)}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => startEdit(user)}
                                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                >
                                                    <Edit3 className="w-5 h-5 text-slate-400" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function RolesPage() {
    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <RolesManagementContent />
        </ProtectedRoute>
    );
}
