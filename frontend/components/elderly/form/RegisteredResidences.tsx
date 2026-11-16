"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/auth";
import dynamic from "next/dynamic";

const ResidencePickerModal = dynamic(() => import("@/components/shared/residence/ResidencePickerModal"), { ssr: false });

interface ResidenceItem {
    id: string;
    membershipId: string;
    residenceId: string;
    residenceCode?: string | null;
    role?: string | null;
    status?: string | null;
    verifiedAt?: string | null;
    formattedAddress?: string | null;
    houseNo?: string | null;
    moo?: string | null;
    villageName?: string | null;
    buildingName?: string | null;
    floor?: string | null;
    roomNo?: string | null;
    soi?: string | null;
    road?: string | null;
    postalCode?: string | null;
    provinceNameTh?: string | null;
    districtNameTh?: string | null;
    subdistrictNameTh?: string | null;
    municipalityName?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}

export interface SelectedResidence {
    coordinates: string;
    houseNo?: string;
    road?: string;
    villageName?: string;
    subdistrictName?: string;
    districtName?: string;
    provinceName?: string;
    postalCode?: string;
    addressDetail?: string;
}

interface Props {
    onSelect: (data: SelectedResidence) => void;
    selectedCoordinates?: string;
}

export function RegisteredResidences({ onSelect, selectedCoordinates }: Props) {
    const [residences, setResidences] = useState<ResidenceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    useEffect(() => {
        fetchWithAuth('/users/me/residences')
            .then(async (res) => {
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) setResidences(data);
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handlePickerSelect = async (residenceId: string, _title: string, rawData?: any) => {
        setIsPickerOpen(false);

        if (residenceId.startsWith('claim_')) {
            const d = rawData;
            if (!d) return;
            const coords = (d.latitude != null && d.longitude != null) ? `${d.latitude},${d.longitude}` : '';
            const detailParts: string[] = [];
            if (d.buildingName && d.buildingName !== '-') detailParts.push(`อาคาร ${d.buildingName}`);
            if (d.floor && d.floor !== '-') detailParts.push(`ชั้น ${d.floor}`);
            if (d.roomNo && d.roomNo !== '-') detailParts.push(`ห้อง ${d.roomNo}`);
            if (d.soi && d.soi !== '-') detailParts.push(`ซ.${d.soi}`);
            if (d.moo) detailParts.push(`หมู่ ${d.moo}`);

            onSelect({
                coordinates: coords,
                houseNo: d.houseNo && d.houseNo !== '-' ? d.houseNo : undefined,
                road: d.road && d.road !== '-' ? d.road : undefined,
                villageName: d.villageName && d.villageName !== '-' ? d.villageName : undefined,
                subdistrictName: d.subdistrictName || undefined,
                districtName: d.districtName || undefined,
                provinceName: d.provinceName || undefined,
                postalCode: d.postalCode && d.postalCode !== '-' ? d.postalCode : undefined,
                addressDetail: detailParts.join(' '),
            });
            return;
        }

        try {
            const res = await fetchWithAuth(`/residences/${residenceId}`);
            if (!res.ok) return;
            const data = await res.json();
            const a = data.addressSnapshot || data;
            const coords = (a.latitude != null && a.longitude != null) ? `${a.latitude},${a.longitude}` : '';
            const detailParts: string[] = [];
            if (a.buildingName && a.buildingName !== '-') detailParts.push(`อาคาร ${a.buildingName}`);
            if (a.floor && a.floor !== '-') detailParts.push(`ชั้น ${a.floor}`);
            if (a.roomNo && a.roomNo !== '-') detailParts.push(`ห้อง ${a.roomNo}`);
            if (a.soi && a.soi !== '-') detailParts.push(`ซ.${a.soi}`);
            if (a.moo) detailParts.push(`หมู่ ${a.moo}`);

            onSelect({
                coordinates: coords,
                houseNo: a.houseNo && a.houseNo !== '-' ? a.houseNo : undefined,
                road: a.road && a.road !== '-' ? a.road : undefined,
                villageName: a.villageName && a.villageName !== '-' ? a.villageName : undefined,
                subdistrictName: a.subdistrictNameTh || a.subdistrictName || undefined,
                districtName: a.districtNameTh || a.districtName || undefined,
                provinceName: a.provinceNameTh || a.provinceName || undefined,
                postalCode: a.postalCode && a.postalCode !== '-' ? a.postalCode : undefined,
                addressDetail: detailParts.join(' '),
            });
        } catch {}
    };

    if (loading) return null;

    if (residences.length === 0) {
        return (
            <div className="space-y-2x mt-2x">
                <label className="typo-body text-text-tertiary mb-1x block">
                    บ้านที่ลงทะเบียนไว้กับ Gov Center
                </label>
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4x text-center">
                    <div className="w-20 h-20 mx-auto mb-3x rounded-full bg-brand-primary/10 flex items-center justify-center">
                        <svg className="w-11 h-11 text-brand-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                        </svg>
                    </div>
                    <p className="text-xl font-bold text-text-primary mb-1x">
                        ไม่มีบ้านที่ลงทะเบียน
                    </p>
                    <p className="typo-menu text-text-secondary mb-3x">
                        ค้นหาบ้านของคุณหรือลงทะเบียนใหม่
                    </p>
                    <button
                        type="button"
                        onClick={() => setIsPickerOpen(true)}
                        className="w-full bg-gradient-to-r from-brand-primary to-btn-hover text-white typo-menu font-semibold py-2x px-3x rounded-xl hover:shadow-lg active:scale-[0.98] transition-all"
                    >
                        ค้นหา / ลงทะเบียน
                    </button>
                </div>
                {isPickerOpen && (
                    <ResidencePickerModal
                        onSelect={handlePickerSelect}
                        onClose={() => setIsPickerOpen(false)}
                    />
                )}
            </div>
        );
    }

    const handleSelect = (r: ResidenceItem) => {
        const coords = (r.latitude != null && r.longitude != null) ? `${r.latitude},${r.longitude}` : '';
        const detailParts: string[] = [];
        if (r.buildingName && r.buildingName !== '-') detailParts.push(`อาคาร ${r.buildingName}`);
        if (r.floor && r.floor !== '-') detailParts.push(`ชั้น ${r.floor}`);
        if (r.roomNo && r.roomNo !== '-') detailParts.push(`ห้อง ${r.roomNo}`);
        if (r.soi && r.soi !== '-') detailParts.push(`ซ.${r.soi}`);
        if (r.moo) detailParts.push(`หมู่ ${r.moo}`);

        onSelect({
            coordinates: coords,
            houseNo: r.houseNo && r.houseNo !== '-' ? r.houseNo : undefined,
            road: r.road && r.road !== '-' ? r.road : undefined,
            villageName: r.villageName && r.villageName !== '-' ? r.villageName : undefined,
            subdistrictName: r.subdistrictNameTh || undefined,
            districtName: r.districtNameTh || undefined,
            provinceName: r.provinceNameTh || undefined,
            postalCode: r.postalCode && r.postalCode !== '-' ? r.postalCode : undefined,
            addressDetail: detailParts.join(' '),
        });
    };

    const statusColor = (s?: string | null) => {
        if (s === 'VERIFIED') return 'bg-green-50 text-green-700 border-green-200';
        if (s === 'PENDING' || s === 'PENDING_REVIEW') return 'bg-amber-50 text-amber-700 border-amber-200';
        return 'bg-gray-50 text-gray-700 border-gray-200';
    };

    return (
        <div className="space-y-2x mt-2x">
            <div>
                <label className="typo-body text-text-tertiary mb-1x block">
                    บ้านที่ลงทะเบียนไว้กับ Gov Center
                </label>
                <p className="typo-menu text-text-tertiary mb-2x">
                    เลือกใช้ที่อยู่ที่ยืนยันแล้ว — ระบบจะปักหมุดให้อัตโนมัติ
                </p>
            </div>
            <div className="space-y-2x">
                {residences.map((r) => {
                    const coords = (r.latitude != null && r.longitude != null) ? `${r.latitude},${r.longitude}` : '';
                    const isSelected = !!coords && coords === selectedCoordinates;
                    return (
                        <div
                            key={r.membershipId}
                            className={`border rounded-square p-2x transition-all ${isSelected ? 'border-brand-primary ring-1 ring-brand-primary bg-brand-primary/5' : 'border-border-neutral bg-white'}`}
                        >
                            <div className="flex items-start justify-between gap-2x mb-1x">
                                <div className="flex items-center gap-2x flex-wrap">
                                    {r.residenceCode && (
                                        <span className="typo-menu font-mono text-text-secondary">{r.residenceCode}</span>
                                    )}
                                    {r.status && (
                                        <span className={`typo-menu px-1x py-0.5 border rounded ${statusColor(r.status)}`}>
                                            {r.status === 'VERIFIED' ? 'ยืนยันแล้ว' : r.status}
                                        </span>
                                    )}
                                </div>
                                {isSelected && (
                                    <span className="typo-menu text-brand-primary font-medium">✓ เลือกแล้ว</span>
                                )}
                            </div>
                            <p className="typo-body text-text-primary mb-1x">
                                {r.formattedAddress || `${r.houseNo || ''} ${r.road || ''}`}
                            </p>
                            {r.latitude != null && r.longitude != null && (
                                <p className="typo-menu text-text-tertiary mb-2x">
                                    📍 {r.latitude.toFixed(6)}, {r.longitude.toFixed(6)}
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={() => handleSelect(r)}
                                disabled={isSelected || !coords}
                                className={`w-full typo-menu py-1x px-2x rounded-square transition-all ${
                                    isSelected
                                        ? 'bg-brand-primary/10 text-brand-primary cursor-default'
                                        : !coords
                                            ? 'bg-gray-100 text-text-disable cursor-not-allowed'
                                            : 'bg-brand-primary text-white hover:bg-btn-hover'
                                }`}
                            >
                                {isSelected ? 'ใช้ที่อยู่นี้แล้ว' : !coords ? 'ไม่มีพิกัด' : 'ใช้ที่อยู่นี้'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
