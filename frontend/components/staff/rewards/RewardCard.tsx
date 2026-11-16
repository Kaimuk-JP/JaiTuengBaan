'use client';

import Image from 'next/image';
import GiftIcon from '@/components/icons/GiftIcon';
import InventoryIcon from '@mui/icons-material/Inventory';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Reward } from './types';

interface RewardCardProps {
    reward: Reward;
    onEdit: (reward: Reward) => void;
    onDelete: (reward: Reward) => void;
    onAdjustStock: (reward: Reward) => void;
}

export default function RewardCard({ reward, onEdit, onDelete, onAdjustStock }: RewardCardProps) {
    return (
        <div
            className={`group relative bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 rounded-3xl overflow-hidden shadow-lg dark:shadow-black/20 hover:shadow-2xl transition-all duration-300 border border-transparent dark:border-slate-700 flex flex-col justify-between ${
                !reward.isActive && 'opacity-60'
            }`}
        >
            {!reward.isActive && (
                <div className="absolute top-4 right-4 z-10 bg-gray-600/90 dark:bg-slate-700 text-white text-xs px-3 py-1 rounded-full font-medium backdrop-blur-sm">
                    ปิดใช้งาน
                </div>
            )}

            <div>
                <div className="relative h-44 flex items-center justify-center p-6 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10">
                    {reward.imageUrl ? (
                        <Image
                            src={reward.imageUrl}
                            alt={reward.name}
                            fill
                            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                        />
                    ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/40 dark:to-orange-900/40 rounded-2xl flex items-center justify-center">
                            <GiftIcon size={44} />
                        </div>
                    )}
                </div>

                <div className="p-5 pt-3 space-y-3">
                    <h3 className="font-bold text-base sm:text-lg text-gray-800 dark:text-slate-100 truncate">
                        {reward.name}
                    </h3>

                    <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 line-clamp-2 min-h-[36px]">
                        {reward.description || 'ไม่มีรายละเอียด'}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-brand-primary">{reward.pointsCost}</span>
                            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">แต้ม</span>
                        </div>
                        <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                                reward.stock === 0
                                    ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:border-red-800'
                                    : reward.stock > 0 && reward.stock <= 5
                                    ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
                            }`}
                        >
                            {reward.stock === -1 ? 'ไม่จำกัด' : reward.stock === 0 ? 'หมดสต๊อก' : `คงเหลือ ${reward.stock} ชิ้น`}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-5 pt-0 space-y-2">
                <button
                    type="button"
                    onClick={() => onAdjustStock(reward)}
                    className="w-full py-2.5 px-3 text-xs sm:text-sm font-bold bg-gradient-to-r from-[#1E7D55] to-[#13603F] hover:from-[#196B49] hover:to-[#0F4E33] active:scale-[0.99] text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                    <InventoryIcon style={{ fontSize: 16 }} />
                    <span>จัดการสต๊อก (ถ่ายรูปยืนยัน)</span>
                </button>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => onEdit(reward)}
                        className="flex-1 py-2 px-3 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-200 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                        <EditIcon style={{ fontSize: 14 }} />
                        <span>แก้ไข</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(reward)}
                        className="py-2 px-3 text-xs font-bold border border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                        <DeleteIcon style={{ fontSize: 14 }} />
                        <span>ลบ</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
