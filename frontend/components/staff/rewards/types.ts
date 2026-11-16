'use client';

export interface Reward {
    id: number;
    name: string;
    description: string | null;
    imageUrl: string | null;
    pointsCost: number;
    stock: number;
    isActive: boolean;
    createdAt: string;
}

export interface StockHistory {
    id: number;
    rewardId: number;
    action: string;
    quantityBefore: number;
    quantityAfter: number;
    quantityChange: number;
    note: string | null;
    evidenceUrl: string | null;
    createdAt: string;
    staff: {
        id?: string;
        firstName: string;
        lastName: string;
        pictureUrl?: string | null;
        role?: string;
    };
    reward: {
        id?: number;
        name: string;
        imageUrl?: string | null;
        stock?: number;
    };
}
