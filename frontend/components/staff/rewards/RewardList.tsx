'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { fetchWithAuth } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';
import { useSocket, Notification } from '@/contexts/SocketContext';
import Swal from '@/lib/swal';
import GiftIcon from '@/components/icons/GiftIcon';
import RewardCard from './RewardCard';
import RewardModal from './RewardModal';
import AdjustStockModal from './AdjustStockModal';
import type { Reward } from './types';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import InventoryIcon from '@mui/icons-material/Inventory';

export default function RewardList() {
    const { socket } = useSocket();
    const pathname = usePathname();

    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingReward, setEditingReward] = useState<Reward | null>(null);
    const [adjustingReward, setAdjustingReward] = useState<Reward | null>(null);
    const [uploading, setUploading] = useState(false);

    const fetchRewards = useCallback(async () => {
        try {
            const response = await fetchWithAuth('/rewards/all');
            if (response.ok) {
                const result = await response.json();
                setRewards(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching rewards:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRewards();
    }, [fetchRewards]);

    useEffect(() => {
        if (!socket) return;

        const handleNotification = (notification: Notification) => {
            fetchRewards();
        };

        const handleRefresh = () => {
            fetchRewards();
        };

        socket.on('notification', handleNotification);
        socket.on('refresh_rewards', handleRefresh);

        return () => {
            socket.off('notification', handleNotification);
            socket.off('refresh_rewards', handleRefresh);
        };
    }, [socket, fetchRewards]);

    const uploadImage = async (file: File): Promise<string | null> => {
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const response = await fetch(`${getApiUrl()}/upload/reward-image`, {
                method: 'POST',
                credentials: 'include',
                body: formDataUpload,
            });

            if (response.ok) {
                const data = await response.json();
                return data.url;
            }
            return null;
        } catch {
            return null;
        }
    };

    const handleCreate = () => {
        setEditingReward(null);
        setShowModal(true);
    };

    const handleEdit = (reward: Reward) => {
        setEditingReward(reward);
        setShowModal(true);
    };

    const handleAdjustStock = (reward: Reward) => {
        setAdjustingReward(reward);
    };

    const handleSubmit = async (formData: any, file: File | null, evidenceFile: File | null) => {
        if (!formData.name || formData.pointsCost < 1) {
            Swal.fire({
                icon: 'error',
                title: 'ข้อมูลไม่ครบ',
                text: 'กรุณากรอกชื่อรางวัลและจำนวนแต้ม',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        try {
            setUploading(true);

            let imageUrl = formData.imageUrl;
            if (file) {
                const uploadedUrl = await uploadImage(file);
                if (!uploadedUrl) {
                    Swal.fire({ icon: 'error', title: 'อัปโหลดรูปของรางวัลไม่สำเร็จ' });
                    setUploading(false);
                    return;
                }
                imageUrl = uploadedUrl;
            }

            let evidenceUrl: string | undefined = undefined;
            if (evidenceFile) {
                const uploadedEvidence = await uploadImage(evidenceFile);
                if (uploadedEvidence) {
                    evidenceUrl = uploadedEvidence;
                }
            }

            const submitData = { ...formData, imageUrl, evidenceUrl };

            let response;
            if (editingReward) {
                response = await fetchWithAuth(`/rewards/${editingReward.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(submitData),
                });
            } else {
                response = await fetchWithAuth('/rewards', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(submitData),
                });
            }

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: editingReward ? 'แก้ไขสำเร็จ' : 'สร้างรางวัลสำเร็จ',
                    timer: 1500,
                    showConfirmButton: false,
                    confirmButtonColor: '#1E7D55',
                });
                setShowModal(false);
                setUploading(false);
                fetchRewards();
            } else {
                const data = await response.json();
                Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    text: data.message || 'ไม่สามารถบันทึกได้',
                    confirmButtonColor: '#1E7D55',
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'กรุณาลองใหม่อีกครั้ง',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (reward: Reward) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบของรางวัล?',
            text: `ต้องการลบรางวัล "${reward.name}" หรือไม่? ข้อมูลสต๊อกที่เกี่ยวข้องจะถูกลบไปด้วย`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'ลบรางวัล',
            cancelButtonText: 'ยกเลิก',
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetchWithAuth(`/rewards/${reward.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'ลบสำเร็จ',
                    timer: 1500,
                    showConfirmButton: false,
                    confirmButtonColor: '#1E7D55',
                });
                fetchRewards();
            } else {
                const data = await response.json();
                Swal.fire({
                    icon: 'error',
                    title: 'ไม่สามารถลบได้',
                    text: data.message || 'เกิดข้อผิดพลาด',
                    confirmButtonColor: '#1E7D55',
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'กรุณาลองใหม่อีกครั้ง',
                confirmButtonColor: '#1E7D55',
            });
        }
    };

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-2xl border border-amber-100 dark:border-amber-900 shadow-sm">
                        <GiftIcon size={32} />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                            จัดการของรางวัล & สต๊อก
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400">
                            จัดการรายการของรางวัล ปรับปรุงสต๊อกพร้อมถ่ายรูปยืนยัน และดูประวัติ
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleCreate}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#1E7D55] to-[#146440] hover:from-[#196B49] hover:to-[#0F4E33] active:scale-95 text-white rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer"
                >
                    <AddIcon fontSize="small" />
                    <span>เพิ่มของรางวัลใหม่</span>
                </button>
            </div>

            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-gray-700 pb-2 overflow-x-auto scrollbar-none">
                <Link
                    href="/staff/rewards"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                        pathname === '/staff/rewards'
                            ? 'bg-brand-primary text-white shadow-sm'
                            : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800'
                    }`}
                >
                    <InventoryIcon style={{ fontSize: 18 }} />
                    <span>คลังของรางวัล</span>
                    <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-bold">
                        {rewards.length}
                    </span>
                </Link>

                <Link
                    href="/staff/rewards/redemptions"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                        pathname.startsWith('/staff/rewards/redemptions')
                            ? 'bg-brand-primary text-white shadow-sm'
                            : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800'
                    }`}
                >
                    <FactCheckIcon style={{ fontSize: 18 }} />
                    <span>คำขอแลกรางวัล</span>
                </Link>

                <Link
                    href="/staff/rewards/history"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                        pathname.startsWith('/staff/rewards/history')
                            ? 'bg-brand-primary text-white shadow-sm'
                            : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800'
                    }`}
                >
                    <HistoryIcon style={{ fontSize: 18 }} />
                    <span>ประวัติสต๊อก & รูปถ่าย</span>
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div>
                </div>
            ) : rewards.length === 0 ? (
                <div className="bg-white dark:bg-gray-800/80 rounded-3xl p-12 text-center border border-slate-200 dark:border-gray-700 shadow-sm space-y-4">
                    <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
                        <GiftIcon size={36} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-bold text-slate-800 dark:text-white text-base sm:text-lg">
                            ยังไม่มีรายการของรางวัลในระบบ
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400">
                            เริ่มต้นสร้างของรางวัลเพื่อให้จิตอาสาสามารถนำแต้มสะสมมาแลกได้
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleCreate}
                        className="px-6 py-2.5 bg-brand-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-brand-primary/90 transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                        <AddIcon fontSize="small" />
                        <span>สร้างรางวัลแรก</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {rewards.map((reward) => (
                        <RewardCard
                            key={reward.id}
                            reward={reward}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onAdjustStock={handleAdjustStock}
                        />
                    ))}
                </div>
            )}

            <RewardModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleSubmit}
                editingReward={editingReward}
                uploading={uploading}
            />

            <AdjustStockModal
                isOpen={!!adjustingReward}
                reward={adjustingReward}
                onClose={() => setAdjustingReward(null)}
                onSuccess={fetchRewards}
            />
        </div>
    );
}
