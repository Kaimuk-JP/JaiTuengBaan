"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

import Swal from '@/lib/swal';
import { Search } from 'lucide-react';
import { getImageUrl } from '@/utils/image';
import { isInAppBrowser, getInAppBrowserName, openInExternalBrowser } from '@/utils/browserDetection';
import type { LatLng } from '@/types/common';
import { getApiUrl } from '@/lib/api';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const MAPBOX_STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE || 'mapbox://styles/mapbox/satellite-streets-v12';

export interface AddressComponents {
    placeName?: string;
    houseNo?: string;
    road?: string;
    villageName?: string;
    neighbourhood?: string;
    subdistrictName?: string;
    districtName?: string;
    provinceName?: string;
    postalCode?: string;
    country?: string;
}

interface MapPickerProps {
    initialLat?: number;
    initialLng?: number;
    pictureUrl?: string | null;
    onConfirm: (lat: number, lng: number, addressComponents: AddressComponents) => void;
    onClose: () => void;
    confirmText?: string;
    closeOnConfirm?: boolean;
}

const DEFAULT_CENTER = { lat: 13.7563, lng: 100.5018 };

export default function MapPicker({ initialLat, initialLng, pictureUrl, onConfirm, onClose, confirmText = "ยืนยันที่อยู่ ณ ปัจจุบัน", closeOnConfirm = true }: MapPickerProps) {
    const [center, setCenter] = useState<LatLng | null>(null);
    const [viewState, setViewState] = useState({ longitude: initialLng || DEFAULT_CENTER.lng, latitude: initialLat || DEFAULT_CENTER.lat, zoom: 15 });
    const [address, setAddress] = useState<string>('กำลังโหลดที่อยู่...');
    const [addressComponents, setAddressComponents] = useState<AddressComponents>({});
    const [isLoadingAddress, setIsLoadingAddress] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const isSelectingRef = useRef(false);
    const [ready, setReady] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const initialLocation = (initialLat && initialLng) ? { lat: initialLat, lng: initialLng } : { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng };
            setCenter(initialLocation);
            if (navigator.geolocation && !initialLat && !initialLng) {
                setIsLoadingAddress(true);
                navigator.geolocation.getCurrentPosition((position) => {
                    const { latitude, longitude } = position.coords;
                    const newLocation = { lat: latitude, lng: longitude };
                    setCenter(newLocation);
                    setViewState(prev => ({ ...prev, longitude, latitude }));
                }, () => { setIsLoadingAddress(false); }, { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
            }
            setReady(true);
        }
    }, [initialLat, initialLng]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (isInAppBrowser()) {
            const appName = getInAppBrowserName() || 'แอปนี้';
            Swal.fire({ icon: 'warning', title: 'แนะนำเปิดผ่านเบราว์เซอร์', html: `คุณกำลังเปิดผ่าน <b>${appName}</b><br/>GPS อาจไม่ทำงาน กรุณาเปิดผ่าน<br/><b>Chrome, Safari หรือ Firefox</b> แทน`, confirmButtonText: 'เปิดเบราว์เซอร์', cancelButtonText: 'ใช้งานต่อ', showCancelButton: true, confirmButtonColor: '#1E7D55', cancelButtonColor: '#6B7280' }).then((result) => { if (result.isConfirmed) openInExternalBrowser(); });
        }
    }, []);

    const fetchAddress = useCallback(async (lat: number, lng: number) => {
        setIsLoadingAddress(true);
        try {
            const response = await fetch(`${getApiUrl()}/geocode/reverse?lat=${lat}&lng=${lng}`, { credentials: 'include' });
            if (!response.ok) throw new Error('ไม่สามารถค้นหาที่อยู่ได้');
            const data = await response.json();
            if (data && data.address) {
                const addr = data.address;
                const components: AddressComponents = {};
                if (addr.house_number) components.houseNo = addr.house_number;
                if (addr.road) components.road = addr.road;
                if (addr.villageName) components.villageName = addr.villageName; else if (addr.suburb) components.villageName = addr.suburb;
                if (addr.neighbourhood) components.neighbourhood = addr.neighbourhood;
                if (addr.city) components.subdistrictName = addr.city; else if (addr.town) components.subdistrictName = addr.town; else if (addr.suburb && !components.villageName) components.subdistrictName = addr.suburb;
                if (addr.county) components.districtName = addr.county; else if (addr.city_district) components.districtName = addr.city_district;
                if (addr.provinceName) components.provinceName = addr.provinceName; else if (addr.state && addr.state !== 'ประเทศไทย' && addr.state !== 'Thailand') components.provinceName = (addr.state.includes('กรุงเทพ') || addr.state.includes('Bangkok')) ? 'กรุงเทพมหานคร' : addr.state; else if (addr.county && !components.districtName && !addr.county.includes('เทศบาล')) components.provinceName = addr.county; else if (addr.city && (addr.city.includes('กรุงเทพ') || addr.city.includes('Bangkok'))) components.provinceName = 'กรุงเทพมหานคร';
                if (addr.postalCode) components.postalCode = addr.postalCode; else if (addr.postcode) components.postalCode = addr.postcode;
                if (addr.country) components.country = addr.country;
                if (!components.postalCode && data.display_name) { const pcMatch = data.display_name.match(/(\d{5})/); if (pcMatch) components.postalCode = pcMatch[1]; }
                setAddressComponents(components);
                if (data.name && data.name !== components.road) components.placeName = data.name;
                const parts = [];
                if (components.placeName) parts.push(components.placeName);
                if (components.houseNo) parts.push(components.houseNo);
                if (components.road) parts.push(`ถ.${components.road}`);
                if (components.neighbourhood) parts.push(components.neighbourhood);
                if (components.villageName) parts.push(components.villageName);
                if (components.subdistrictName) parts.push(`ต.${components.subdistrictName}`);
                if (components.districtName) parts.push(`อ.${components.districtName}`);
                if (components.provinceName) parts.push(`จ.${components.provinceName}`);
                if (components.country && components.country !== 'ประเทศไทย') parts.push(components.country);
                if (components.postalCode) parts.push(components.postalCode);
                let formattedAddress = parts.join(' ');
                if (!formattedAddress && data.display_name) formattedAddress = data.display_name;
                setAddress(formattedAddress || `ตำแหน่งที่เลือก (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
            } else {
                setAddress(`ตำแหน่งที่เลือก (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
                setAddressComponents({});
            }
        } catch (error) {
            console.error('Error fetching address:', error);
            setAddress(`ตำแหน่งที่เลือก (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
            setAddressComponents({});
        } finally {
            setIsLoadingAddress(false);
        }
    }, []);

    const lastFetchedRef = useRef<{ lat: number, lng: number } | null>(null);
    function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
        const R = 6371e3; const φ1 = lat1 * Math.PI / 180; const φ2 = lat2 * Math.PI / 180; const Δφ = (lat2 - lat1) * Math.PI / 180; const Δλ = (lon2 - lon1) * Math.PI / 180; const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2); return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    useEffect(() => { if (!center) return; const timer = setTimeout(() => { let shouldFetch = true; if (lastFetchedRef.current) { const dist = calculateDistance(lastFetchedRef.current.lat, lastFetchedRef.current.lng, center.lat, center.lng); if (dist < 20) shouldFetch = false; } if (shouldFetch) { fetchAddress(center.lat, center.lng); lastFetchedRef.current = { lat: center.lat, lng: center.lng }; } }, 1000); return () => clearTimeout(timer); }, [center, fetchAddress]);

    const handleSearchLocation = async (query: string) => {
        if (!query.trim()) { setSearchResults([]); return; }
        setIsSearching(true);
        try {
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=TH&language=th`;
            const response = await fetch(url); const data = await response.json();
            let results = (data.features || []).map((item: any) => ({ display_name: item.place_name, lat: parseFloat(item.center[1]), lon: parseFloat(item.center[0]) }));
            if (results.length === 0) { const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=th&countrycodes=th&limit=5`; const nomResponse = await fetch(nomUrl); const nomData = await nomResponse.json(); results = (nomData || []).map((item: any) => ({ display_name: item.display_name, lat: parseFloat(item.lat), lon: parseFloat(item.lon) })); }
            setSearchResults(results); setShowDropdown(true);
        } catch (error) {
            console.error('Search error:', error);
            Swal.fire({ icon: 'error', title: 'ค้นหาล้มเหลว', text: 'ไม่สามารถค้นหาสถานที่ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง', confirmButtonColor: '#1E7D55' });
        } finally { setIsSearching(false); }
    };

    useEffect(() => { const timer = setTimeout(() => { if (isSelectingRef.current) { isSelectingRef.current = false; return; } if (searchQuery.trim().length > 2) handleSearchLocation(searchQuery); else { setSearchResults([]); setShowDropdown(false); } }, 500); return () => clearTimeout(timer); }, [searchQuery]);
    const handleSelectSearchResult = (result: any) => { const newLocation = { lat: result.lat, lng: result.lon }; setCenter(newLocation); setViewState(prev => ({ ...prev, longitude: result.lon, latitude: result.lat, zoom: 16 })); isSelectingRef.current = true; setShowDropdown(false); setSearchQuery(result.display_name); };
    const handleGetCurrentLocation = () => { if (!navigator.geolocation) { Swal.fire({ icon: 'error', title: 'ไม่รองรับ', text: 'เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง', confirmButtonColor: '#1E7D55' }); return; } setIsLoadingAddress(true); navigator.geolocation.getCurrentPosition((position) => { const { latitude, longitude, accuracy } = position.coords; const newLocation = { lat: latitude, lng: longitude }; setCenter(newLocation); setViewState(prev => ({ ...prev, longitude, latitude, zoom: 16 })); setIsLoadingAddress(false); if (accuracy > 100) Swal.fire({ icon: 'info', title: 'ตำแหน่งโดยประมาณ', text: `ความแม่นยำ: ${Math.round(accuracy)} เมตร อาจไม่แม่นยำนัก`, timer: 2000, showConfirmButton: false }); }, (error) => { console.error('GPS error:', error.code, error.message); setIsLoadingAddress(false); switch (error.code) { case error.PERMISSION_DENIED: Swal.fire({ icon: 'error', title: 'ไม่ได้รับสิทธิ์เข้าถึง GPS', html: 'กรุณาอนุญาตให้เข้าถึงตำแหน่ง<br/>ในการตั้งค่าเบราว์เซอร์ของคุณ', confirmButtonColor: '#1E7D55' }); break; case error.POSITION_UNAVAILABLE: Swal.fire({ icon: 'warning', title: 'ไม่สามารถระบุตำแหน่งได้', html: 'กรุณาตรวจสอบว่า GPS เปิดอยู่<br/>และอยู่ในพื้นที่ที่มีสัญญาณ', confirmButtonColor: '#1E7D55', timer: 4000, showConfirmButton: true }); break; case error.TIMEOUT: Swal.fire({ icon: 'info', title: 'ค้นหาตำแหน่งนานเกินไป', text: 'กรุณาลองใหม่อีกครั้ง', confirmButtonColor: '#1E7D55', timer: 3000, showConfirmButton: true }); break; } }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }); };
    const handleConfirm = () => { if (!center) return; onConfirm(center.lat, center.lng, addressComponents); if (closeOnConfirm) onClose(); };
    if (!center || !ready) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
            <div className="bg-white shadow-sm z-[1001] w-full pt-4 pb-2 px-4 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.1)] absolute top-0 left-0 flex flex-col gap-3">
                <div className="flex flex-row items-center gap-2">
                    <button type="button" onClick={onClose} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors active:scale-95 text-text-secondary">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    </button>
                    <h3 className="font-bold text-lg text-text-primary tracking-tight">เลือกตำแหน่งบนแผนที่</h3>
                </div>
                <div className="relative z-[1002] w-full max-w-lg mx-auto mb-2">
                    <div className="relative flex items-center bg-background-primary border-2 border-brand-primary/20 focus-within:border-brand-primary rounded-xl overflow-hidden transition-all shadow-sm">
                        <div className="pl-3 pb-0.5 text-brand-primary"><Search size={20} strokeWidth={2.5} /></div>
                        <input type="text" className="w-full py-3.5 px-3 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 typo-body text-text-primary placeholder:text-text-placeholder" placeholder="ค้นหา หมู่บ้าน, ตำบล, อำเภอ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => { if (searchResults.length > 0) setShowDropdown(true) }} />
                        {isSearching && <div className="pr-3"><div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div></div>}
                        {searchQuery && !isSearching && <button type="button" className="pr-3 text-text-placeholder hover:text-text-secondary active:scale-90 transition-all font-bold" onClick={() => { setSearchQuery(''); setSearchResults([]); setShowDropdown(false); }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>}
                    </div>
                    {showDropdown && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-border-neutral max-h-60 overflow-y-auto z-[1003]">
                            {searchResults.map((result, idx) => (
                                <button key={idx} type="button" className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-border-neutral/50 last:border-0 typo-body text-text-primary transition-colors" onMouseDown={(e) => e.preventDefault()} onClick={() => handleSelectSearchResult(result)}>
                                    {result.display_name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex-1 relative">
                <Map {...viewState} onMove={evt => setViewState(evt.viewState)} onClick={(e) => setCenter({ lat: e.lngLat.lat, lng: e.lngLat.lng })} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} mapStyle={MAPBOX_STYLE} mapboxAccessToken={MAPBOX_TOKEN} minZoom={5} maxBounds={[[96.5, 5.0], [106.5, 21.0]]} onLoad={e => { setMapLoaded(true); setTimeout(() => { try { e.target.resize(); } catch (err) { } }, 100); try { (e.target as any).setLanguage('th'); } catch (err) { console.warn('setLanguage failed:', err); } }}>
                    {mapLoaded && <Marker longitude={center.lng} latitude={center.lat} anchor="bottom" draggable onDragEnd={(e) => setCenter({ lat: e.lngLat.lat, lng: e.lngLat.lng })}><div className="relative flex flex-col items-center cursor-move" style={{ zIndex: 1000 }}><div className="relative z-10 transition-transform active:scale-95"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))' }}><path d="M12 0C7.58 0 4 3.58 4 8C4 13.5 12 24 12 24C12 24 20 13.5 20 8C20 3.58 16.42 0 12 0Z" fill="#10B981" /><circle cx="12" cy="8" r="3.5" fill="white" /></svg></div></div></Marker>}
                </Map>
                <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="absolute bottom-24 right-4 z-[1001] bg-white p-3 rounded-full shadow-lg border border-border-neutral text-brand-primary hover:bg-gray-50 active:scale-95 transition-all"
                    title="ใช้ตำแหน่งปัจจุบัน"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                    </svg>
                </button>
            </div>
            <div className="bg-white p-4 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.1)] z-[1001]">
                <div className="max-w-lg mx-auto space-y-2">
                    <div className="text-sm text-text-secondary space-y-0.5">
                        {isLoadingAddress ? (
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 flex-shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                                <span>กำลังโหลดที่อยู่...</span>
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {addressComponents.placeName && <div><span className="text-text-tertiary text-xs">สถานที่:</span> {addressComponents.placeName}</div>}
                                {addressComponents.houseNo && <div><span className="text-text-tertiary text-xs">บ้านเลขที่:</span> {addressComponents.houseNo}</div>}
                                {addressComponents.road && <div><span className="text-text-tertiary text-xs">ถนน:</span> {addressComponents.road}</div>}
                                {addressComponents.villageName && <div><span className="text-text-tertiary text-xs">หมู่บ้าน:</span> {addressComponents.villageName}</div>}
                                {addressComponents.neighbourhood && <div><span className="text-text-tertiary text-xs">ย่าน:</span> {addressComponents.neighbourhood}</div>}
                                {addressComponents.subdistrictName && <div><span className="text-text-tertiary text-xs">ตำบล:</span> {addressComponents.subdistrictName}</div>}
                                {addressComponents.districtName && <div><span className="text-text-tertiary text-xs">อำเภอ:</span> {addressComponents.districtName}</div>}
                                {addressComponents.provinceName && <div><span className="text-text-tertiary text-xs">จังหวัด:</span> {addressComponents.provinceName}</div>}
                                {addressComponents.postalCode && <div><span className="text-text-tertiary text-xs">รหัสไปรษณีย์:</span> {addressComponents.postalCode}</div>}
                                {addressComponents.country && <div><span className="text-text-tertiary text-xs">ประเทศ:</span> {addressComponents.country}</div>}
                                {!addressComponents.placeName && !addressComponents.houseNo && !addressComponents.road && !addressComponents.villageName && !addressComponents.neighbourhood && !addressComponents.subdistrictName && !addressComponents.districtName && !addressComponents.provinceName && !addressComponents.postalCode && !addressComponents.country && (
                                    <div>{address}</div>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="w-full py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 active:scale-[0.98] transition-all shadow-sm"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
