'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { fetchWithAuth } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import Swal from '@/lib/swal';
import Image from 'next/image';
import CareUSidebar from '@/components/careu/Sidebar/CareUSidebar';
import CareUHeader from '@/components/careu/Header/CareUHeader';

interface Reward {
    id: number;
    name: string;
    description: string | null;
    imageUrl: string | null;
    pointsCost: number;
    stock: number;
    isActive: boolean;
}

const GiftIcon = ({ size = 32 }: { size?: number }) => (
    <svg fill="#f59e0b" height={size} width={size} version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 510.738 510.738" xmlSpace="preserve">
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
            <g>
                <g>
                    <g>
                        <path d="M423.285,259.422c-0.272-0.895-0.666-1.684-1.139-2.383c5.29-16.467,8.157-34.019,8.157-52.243 c0-94.253-76.414-170.667-170.667-170.667S88.969,110.543,88.969,204.796c0,18.427,2.932,36.167,8.336,52.793 c-0.322,0.563-0.61,1.161-0.814,1.834l-57.566,189.73c-5.705,18.781,16.041,33.642,32.065,22.475l55.072-38.356 c8.995-6.265,21.719-2.663,25.718,7.122l23.057,56.439c7.947,19.453,36.547,18.202,42.647-1.911l36.284-119.571 c1.949,0.066,3.904,0.111,5.869,0.111c2.132,0,4.252-0.053,6.365-0.13l36.282,119.59c6.114,20.111,34.687,21.361,42.645,1.915 l23.067-56.443c3.999-9.788,16.717-13.388,25.72-7.122l55.072,38.356c16.023,11.165,37.769-3.695,32.063-22.479L423.285,259.422z M201.152,489.967c-1.427,4.705-8.633,5.02-10.516,0.411l-23.057-56.44c-8.17-19.994-33.383-27.131-51.271-14.672l-55.074,38.357 c-3.005,2.094-6.878-0.552-5.979-3.514l51.365-169.291c6.617,11.266,14.599,21.795,23.758,31.419 c26.517,30.728,63.807,51.89,106.001,57.64L201.152,489.967z M249.705,358.068c-0.48-0.122-0.973-0.217-1.488-0.255 c-39.731-2.932-76.149-21.062-102.513-50.268c-0.838-0.84-1.662-1.688-2.477-2.542c-23.176-26.899-37.191-61.915-37.191-100.207 c0-84.827,68.773-153.6,153.6-153.6s153.6,68.773,153.6,153.6c0,40.982-16.052,78.213-42.208,105.755 c-0.363,0.342-0.719,0.691-1.085,1.031c-26.212,26.898-60.84,43.327-98.417,46.207c-0.496,0.038-0.97,0.13-1.434,0.246 c-3.456,0.232-6.941,0.362-10.456,0.362C256.299,358.396,252.99,358.277,249.705,358.068z M458.543,457.625l-55.076-38.359 c-17.896-12.457-43.101-5.322-51.27,14.672l-23.065,56.439c-1.887,4.612-9.086,4.297-10.518-0.414l-35.239-116.152 c39.132-5.446,74.02-24.15,99.967-51.443c11.63-11.017,21.716-23.669,29.821-37.523l51.356,169.263 C465.419,457.071,461.546,459.718,458.543,457.625z"></path>
                        <path d="M46.302,76.8c0,11.378,17.067,11.378,17.067,0c0-14.154,11.446-25.6,25.6-25.6c11.378,0,11.378-17.067,0-17.067 c-14.154,0-25.6-11.446-25.6-25.6c0-11.378-17.067-11.378-17.067,0c0,14.154-11.446,25.6-25.6,25.6 c-11.378,0-11.378,17.067,0,17.067C34.857,51.2,46.302,62.646,46.302,76.8z M54.836,34.151c2.423,3.224,5.292,6.093,8.516,8.516 c-3.224,2.423-6.093,5.292-8.516,8.516c-2.423-3.224-5.292-6.093-8.516-8.516C49.544,40.244,52.413,37.375,54.836,34.151z"></path>
                        <path d="M490.036,136.533h-8.533V128c0-4.713-3.82-8.533-8.533-8.533s-8.533,3.82-8.533,8.533v8.533h-8.533 c-4.713,0-8.533,3.82-8.533,8.533s3.82,8.533,8.533,8.533h8.533v8.533c0,4.713,3.821,8.533,8.533,8.533s8.533-3.82,8.533-8.533 V153.6h8.533c4.713,0,8.533-3.821,8.533-8.533S494.749,136.533,490.036,136.533z"></path>
                        <path d="M29.236,213.333c-4.719,0-8.533,3.823-8.533,8.533c0,4.71,3.814,8.533,8.533,8.533s8.533-3.823,8.533-8.533 C37.769,217.156,33.955,213.333,29.236,213.333z"></path>
                        <path d="M387.636,204.796c0-70.684-57.316-128-128-128s-128,57.316-128,128c0,70.69,57.313,128,128,128 S387.636,275.485,387.636,204.796z M148.702,204.796c0-61.258,49.675-110.933,110.933-110.933s110.933,49.675,110.933,110.933 c0,61.264-49.672,110.933-110.933,110.933S148.702,266.06,148.702,204.796z"></path>
                        <path d="M268.169,281.648l0.05-8.826c9.456-1.877,17.99-6.894,24.249-14.288c11.054-13.072,8.549-32.914-5.029-43.473 l-19.107-14.866l-0.105-46.506c10.042,3.459,17.259,12.983,17.259,24.203c0,4.713,3.82,8.533,8.533,8.533s8.533-3.82,8.533-8.533 c0-20.727-14.775-37.99-34.365-41.853l-0.018-8.067c-0.011-4.713-3.84-8.525-8.553-8.514c-4.713,0.011-8.525,3.84-8.514,8.553 l0.018,8.13c-9.288,1.94-17.655,6.918-23.825,14.205c-11.05,13.07-8.545,32.913,5.04,43.468l18.949,14.742l0.066,29.092 l-0.098,17.443c-9.889-3.543-16.966-12.996-16.966-24.103c0-4.713-3.82-8.533-8.533-8.533s-8.533,3.82-8.533,8.533 c0,20.569,14.559,37.738,33.933,41.769l-0.05,8.796c-0.026,4.713,3.772,8.555,8.485,8.581 C264.3,290.16,268.142,286.361,268.169,281.648z M242.811,180.34c-6.055-4.705-7.159-13.444-2.487-18.971 c2.925-3.454,6.658-6.035,10.836-7.546l0.075,33.071L242.811,180.34z M276.96,228.532c6.052,4.706,7.155,13.448,2.479,18.979 c-2.988,3.53-6.827,6.155-11.121,7.652l0.098-17.486l-0.036-15.819L276.96,228.532z"></path>
                    </g>
                </g>
            </g>
        </g>
    </svg>
);

export default function CareURewardsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [redeeming, setRedeeming] = useState<number | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'rewards' | 'history'>('rewards');

    const [redemptions, setRedemptions] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        fetchRewards();
    }, []);

    useEffect(() => {
        if (activeTab === 'history' && redemptions.length === 0) {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchRewards = async () => {
        try {
            const response = await fetchWithAuth('/rewards');
            if (response.ok) {
                const result = await response.json();
                setRewards(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching rewards:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const response = await fetchWithAuth('/rewards/history');
            if (response.ok) {
                const result = await response.json();
                setRedemptions(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleRedeem = async (reward: Reward) => {
        const result = await Swal.fire({
            title: 'ยืนยันการแลกแต้ม',
            html: `
                <div class="text-left">
                    <p><strong>รางวัล:</strong> ${reward.name}</p>
                    <p><strong>แต้มที่ใช้:</strong> ${reward.pointsCost} แต้ม</p>
                    <p><strong>แต้มคงเหลือหลังแลก:</strong> ${(user?.pointsBalance || 0) - reward.pointsCost} แต้ม</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#1E7D55',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'ยืนยันแลก',
            cancelButtonText: 'ยกเลิก',
        });

        if (!result.isConfirmed) return;

        try {
            setRedeeming(reward.id);
            const response = await fetchWithAuth('/rewards/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rewardId: reward.id }),
            });

            const data = await response.json();

            if (response.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'แลกแต้มสำเร็จ!',
                    text: 'รอเจ้าหน้าที่อนุมัติ',
                    confirmButtonColor: '#1E7D55',
                });
                fetchRewards();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'ไม่สามารถแลกได้',
                    text: data.message || 'เกิดข้อผิดพลาด',
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'กรุณาลองใหม่อีกครั้ง',
            });
        } finally {
            setRedeeming(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const statusLabels: Record<string, string> = {
        PENDING: 'รออนุมัติ',
        APPROVED: 'อนุมัติแล้ว',
        REJECTED: 'ไม่อนุมัติ',
        COMPLETED: 'รับรางวัลแล้ว',
    };

    const statusColors: Record<string, string> = {
        PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
        APPROVED: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        REJECTED: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        COMPLETED: 'bg-brand-primary/10 text-brand-primary',
    };

    return (
        <ProtectedRoute allowedRoles={['CAREU', 'ADMIN']}>
            <div className="min-h-[100dvh] h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#F5F5F5] dark:bg-gray-900 font-sans pb-24">
                <CareUSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                {}
                <div className="bg-gradient-to-bl from-[#3AAE7D] to-[#346D55] dark:from-slate-800 dark:to-slate-900 text-white">
                    <CareUHeader user={null} onToggleSidebar={() => setSidebarOpen(true)} iconColor="white" />
                </div>

                <div className="px-4 mt-4 max-w-md mx-auto space-y-4">
                    {}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <GiftIcon size={28} />
                            <h1 className="text-lg font-bold text-gray-800 dark:text-white">แลกแต้มรับรางวัล</h1>
                        </div>
                        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 rounded-xl">
                            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>
                            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">แต้มของคุณ:</span>
                            <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                                {user?.pointsBalance || 0}
                            </span>
                            <span className="text-sm text-amber-600 dark:text-amber-500">แต้ม</span>
                        </div>
                    </div>

                    {}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('rewards')}
                            className={`flex-1 py-2.5 text-sm rounded-xl font-semibold transition-all ${
                                activeTab === 'rewards'
                                    ? 'bg-brand-primary text-white shadow-sm'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            รางวัลทั้งหมด
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 py-2.5 text-sm rounded-xl font-semibold transition-all ${
                                activeTab === 'history'
                                    ? 'bg-brand-primary text-white shadow-sm'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            ประวัติการแลก
                        </button>
                    </div>

                    {}
                    {activeTab === 'rewards' && (
                        <>
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-primary" />
                                </div>
                            ) : rewards.length === 0 ? (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-700">
                                    <div className="flex justify-center mb-4">
                                        <GiftIcon size={48} />
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">ยังไม่มีรางวัลให้แลกในขณะนี้</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {rewards.map((reward) => {
                                        const canAfford = (user?.pointsBalance || 0) >= reward.pointsCost;
                                        const isOutOfStock = reward.stock === 0;

                                        return (
                                            <div
                                                key={reward.id}
                                                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm"
                                            >
                                                <div className="flex">
                                                    {}
                                                    <div className="w-28 h-28 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 flex items-center justify-center relative shrink-0">
                                                        {reward.imageUrl ? (
                                                            <Image
                                                                src={reward.imageUrl}
                                                                alt={reward.name}
                                                                fill
                                                                className="object-contain p-2"
                                                                unoptimized
                                                            />
                                                        ) : (
                                                            <GiftIcon size={36} />
                                                        )}
                                                        {isOutOfStock && (
                                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                <span className="text-white font-bold text-xs">หมดแล้ว</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {}
                                                    <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                                                        <div>
                                                            <h3 className="font-semibold text-sm text-gray-800 dark:text-white truncate">
                                                                {reward.name}
                                                            </h3>
                                                            {reward.description && (
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                                                    {reward.description}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center justify-between mt-2">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-base font-bold text-brand-primary">
                                                                    {reward.pointsCost}
                                                                </span>
                                                                <span className="text-xs text-gray-500">แต้ม</span>
                                                                {reward.stock > 0 && reward.stock < 10 && (
                                                                    <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-full ml-1">
                                                                        เหลือ {reward.stock}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <button
                                                                onClick={() => handleRedeem(reward)}
                                                                disabled={!canAfford || isOutOfStock || redeeming === reward.id}
                                                                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all active:scale-95 ${canAfford && !isOutOfStock
                                                                    ? 'bg-brand-primary text-white'
                                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                                                    }`}
                                                            >
                                                                {redeeming === reward.id ? (
                                                                    <span className="flex items-center gap-1">
                                                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                                                                        แลก...
                                                                    </span>
                                                                ) : isOutOfStock ? (
                                                                    'หมด'
                                                                ) : !canAfford ? (
                                                                    'แต้มไม่พอ'
                                                                ) : (
                                                                    'แลกเลย'
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {}
                    {activeTab === 'history' && (
                        <>
                            {historyLoading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-primary" />
                                </div>
                            ) : redemptions.length === 0 ? (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-700">
                                    <div className="flex justify-center mb-4">
                                        <GiftIcon size={48} />
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">ยังไม่มีประวัติการแลกแต้ม</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {redemptions.map((redemption: any) => (
                                        <div
                                            key={redemption.id}
                                            className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                                                    <GiftIcon size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h3 className="font-semibold text-sm text-gray-800 dark:text-white truncate">
                                                            {redemption.reward?.name || 'รางวัล'}
                                                        </h3>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap font-semibold ${statusColors[redemption.status] || ''}`}>
                                                            {statusLabels[redemption.status] || redemption.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        ใช้ {redemption.pointsUsed} แต้ม
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                                                        {formatDate(redemption.createdAt)}
                                                    </p>
                                                    {redemption.status === 'REJECTED' && redemption.rejectReason && (
                                                        <p className="text-xs text-red-600 dark:text-red-400 mt-2 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg">
                                                            เหตุผล: {redemption.rejectReason}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
