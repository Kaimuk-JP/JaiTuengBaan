"use client";

import { useState } from "react";
import dynamic from 'next/dynamic';
import { AddressComponents } from '@/components/maps/MapPicker';

const MapPicker = dynamic(
    () => import('@/components/maps/MapPicker'),
    {
        ssr: false,
        loading: () => (
            <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
        )
    }
);

interface LocationPickerProps {
    coordinates: string;
    placeName?: string;
    houseNo?: string;
    road?: string;
    neighbourhood?: string;
    villageName?: string;
    subdistrictName?: string;
    districtName?: string;
    provinceName?: string;
    postalCode?: string;
    country?: string;
    addressDetail: string;
    pictureUrl?: string;
    onCoordinatesChange: (coords: string) => void;
    onAddressComponentsChange: (components: AddressComponents) => void;
    onAddressDetailChange: (detail: string) => void;
}

export function LocationPicker({
    coordinates,
    placeName,
    houseNo,
    road,
    neighbourhood,
    villageName,
    subdistrictName,
    districtName,
    provinceName,
    postalCode,
    country,
    addressDetail,
    pictureUrl,
    onCoordinatesChange,
    onAddressComponentsChange,
    onAddressDetailChange
}: LocationPickerProps) {
    const [showMap, setShowMap] = useState(false);

    const handleMapConfirm = (lat: number, lng: number, addressComponents: AddressComponents) => {
        onCoordinatesChange(`${lat},${lng}`);
        onAddressComponentsChange(addressComponents);
        setShowMap(false);
    };

    const parseCoordinates = (coords: string) => {
        if (!coords) return null;
        const [lat, lng] = coords.split(',').map(n => parseFloat(n.trim()));
        if (isNaN(lat) || isNaN(lng)) return null;
        return { lat, lng };
    };

    const currentCoords = parseCoordinates(coordinates);

    const displayAddress = () => {
        const parts = [];
        if (placeName) parts.push(placeName);
        if (houseNo) parts.push(houseNo);
        if (road) parts.push(`ถ.${road}`);
        if (neighbourhood) parts.push(neighbourhood);
        if (villageName) parts.push(villageName);
        if (subdistrictName) parts.push(`ต.${subdistrictName}`);
        if (districtName) parts.push(`อ.${districtName}`);
        if (provinceName) parts.push(`จ.${provinceName}`);
        if (postalCode) parts.push(postalCode);
        return parts.join(', ');
    };

    return (
        <div className="space-y-2x">
            <div>
                <label className="typo-body text-text-tertiary mb-1x block">
                    ปักหมุดตำแหน่งที่อยู่ <span className="text-semantic-critical">*</span>
                </label>
                <button
                    type="button"
                    onClick={() => setShowMap(true)}
                    className="w-full bg-white border border-border-neutral rounded-square p-2x flex items-center justify-between hover:border-brand-primary hover:ring-1 hover:ring-brand-primary transition-all group"
                >
                    <div className="flex items-center gap-2x text-text-tertiary group-hover:text-brand-primary">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span className="typo-body text-text-primary group-hover:text-brand-primary">
                            {currentCoords 
                                ? `${displayAddress() || `${currentCoords.lat.toFixed(6)}, ${currentCoords.lng.toFixed(6)}`}`
                                : "กดเพื่อปักหมุดบนแผนที่"}
                        </span>
                    </div>
                    {currentCoords ? (
                        null
                    ) : (
                        <svg className="w-5 h-5 text-text-placeholder group-hover:text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    )}
                </button>
            </div>

            <div>
                <label className="typo-body text-text-tertiary mb-1x block">
                    รายละเอียดที่อยู่ (เพิ่มเติม)
                </label>
                <textarea
                    value={addressDetail}
                    onChange={(e) => onAddressDetailChange(e.target.value)}
                    rows={3}
                    className="w-full p-2x typo-body text-text-primary bg-white border border-border-neutral rounded-square focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all resize-none"
                    placeholder="ชั้น, อาคาร, ซอย, ตรอก..."
                    maxLength={255}
                />
            </div>

            {showMap && (
                <MapPicker
                    initialLat={currentCoords?.lat}
                    initialLng={currentCoords?.lng}
                    pictureUrl={pictureUrl}
                    onConfirm={handleMapConfirm}
                    onClose={() => setShowMap(false)}
                />
            )}

        </div>
    );
}
