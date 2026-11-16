'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getImageUrl } from '@/utils/image';
import { fetchWithAuth } from '@/lib/auth';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HomeIcon from '@mui/icons-material/Home';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PhoneIcon from '@mui/icons-material/Phone';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { RouteInfo } from '@/types/common';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const MAPBOX_STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE || 'mapbox://styles/mapbox/streets-v12';

interface LiveTrackingModalProps {
    queue: any;
    onClose: () => void;
}

export default function LiveTrackingModal({ queue, onClose }: LiveTrackingModalProps) {
    const mapRef = useRef<any>(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    const [currentQueue, setCurrentQueue] = useState<any>(queue);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const job = (Array.isArray(currentQueue?.job) ? currentQueue.job[0] : currentQueue?.job) || null;
    const volunteer = job?.vlt || null;
    const careu = job?.careu || null;
    const vehicle = job?.vehicle || null;
    const patient = currentQueue?.user || null;
    const hospital = currentQueue?.hospital || null;

    const driverLat = volunteer?.lat || job?.startLat || 13.7563;
    const driverLng = volunteer?.lng || job?.startLng || 100.5018;

    const patientLat = patient?.lat;
    const patientLng = patient?.lng;
    const hospitalLat = hospital?.lat;
    const hospitalLng = hospital?.lng;

    const [routeGeojson, setRouteGeojson] = useState<any>(null);
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

    const [viewState, setViewState] = useState({
        longitude: driverLng,
        latitude: driverLat,
        zoom: 13,
    });

    const targetDestination = useMemo(() => {
        const status = job?.status;
        if (['RETURN_HOME', 'AT_PATIENT_HOME'].includes(status)) {
            if (patientLat && patientLng) return { lat: patientLat, lng: patientLng, label: 'บ้านของคุณ' };
        }
        if (['IN_TRANSIT', 'PICKED_UP', 'AT_HOSPITAL'].includes(status)) {
            if (hospitalLat && hospitalLng) return { lat: hospitalLat, lng: hospitalLng, label: hospital?.name || 'โรงพยาบาล' };
        }
        if (patientLat && patientLng) {
            return { lat: patientLat, lng: patientLng, label: 'บ้านของคุณ' };
        }
        if (hospitalLat && hospitalLng) {
            return { lat: hospitalLat, lng: hospitalLng, label: hospital?.name || 'โรงพยาบาล' };
        }
        return null;
    }, [job?.status, patientLat, patientLng, hospitalLat, hospitalLng, hospital?.name]);

    const fetchLiveLocation = async (silent = false) => {
        if (!currentQueue?.id) return;
        if (!silent) setIsRefreshing(true);
        try {
            const res = await fetchWithAuth(`/queues/${currentQueue.id}`);
            if (res.ok) {
                const data = await res.json();
                setCurrentQueue(data);
                setLastUpdated(new Date());
            }
        } catch (e) {
            console.warn('Failed to poll live driver location:', e);
        } finally {
            if (!silent) setIsRefreshing(false);
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            fetchLiveLocation(true);
        }, 5000);
        return () => clearInterval(interval);
    }, [currentQueue?.id]);

    useEffect(() => {
        if (!driverLat || !driverLng || !targetDestination) return;

        const destLat = targetDestination.lat;
        const destLng = targetDestination.lng;

        fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${driverLng},${driverLat};${destLng},${destLat}?geometries=geojson&language=th&access_token=${MAPBOX_TOKEN}`
        )
            .then((res) => res.json())
            .then((data) => {
                if (data.routes && data.routes[0]) {
                    const route = data.routes[0];
                    setRouteGeojson({
                        type: 'Feature',
                        properties: {},
                        geometry: route.geometry,
                    });
                    setRouteInfo({
                        distance: route.distance,
                        duration: route.duration,
                    });
                }
            })
            .catch((err) => console.error('Error fetching directions route:', err));
    }, [driverLat, driverLng, targetDestination]);

    useEffect(() => {
        if (!mapLoaded || !mapRef.current) return;
        const points: [number, number][] = [];
        if (driverLng && driverLat) points.push([driverLng, driverLat]);
        if (patientLng && patientLat) points.push([patientLng, patientLat]);
        if (hospitalLng && hospitalLat) points.push([hospitalLng, hospitalLat]);

        if (points.length >= 2) {
            let minLng = points[0][0], maxLng = points[0][0];
            let minLat = points[0][1], maxLat = points[0][1];

            points.forEach(([lng, lat]) => {
                if (lng < minLng) minLng = lng;
                if (lng > maxLng) maxLng = lng;
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
            });

            mapRef.current.fitBounds(
                [[minLng, minLat], [maxLng, maxLat]],
                { padding: { top: 90, bottom: 260, left: 50, right: 50 }, duration: 1000 }
            );
        }
    }, [mapLoaded, driverLat, driverLng, patientLat, patientLng, hospitalLat, hospitalLng]);

    const getLiveStatusInfo = () => {
        const s = job?.status;
        if (s === 'PICKING_UP' || s === 'IN_PROGRESS') {
            return {
                title: 'รถกำลังเดินทางมารับคุณ',
                sub: targetDestination ? `มุ่งหน้าไปยัง: ${targetDestination.label}` : 'คนขับกำลังออกเดินทาง',
                badgeBg: 'bg-emerald-500',
                badgeText: 'กำลังเดินทางไปรับ',
            };
        }
        if (s === 'IN_TRANSIT' || s === 'PICKED_UP') {
            return {
                title: 'กำลังเดินทางไปโรงพยาบาล',
                sub: hospital?.name ? `ปลายทาง: ${hospital.name}` : 'กำลังเดินทาง',
                badgeBg: 'bg-blue-600',
                badgeText: 'กำลังไปโรงพยาบาล',
            };
        }
        if (s === 'AT_HOSPITAL') {
            return {
                title: 'ถึงโรงพยาบาลแล้ว',
                sub: hospital?.name || 'รอพบแพทย์',
                badgeBg: 'bg-teal-600',
                badgeText: 'อยู่ที่โรงพยาบาล',
            };
        }
        if (s === 'RETURN_HOME') {
            return {
                title: 'กำลังพาคุณเดินทางกลับบ้าน',
                sub: 'มุ่งหน้ากลับที่พักอาศัย',
                badgeBg: 'bg-purple-600',
                badgeText: 'กำลังพากลับบ้าน',
            };
        }
        if (s === 'AT_PATIENT_HOME') {
            return {
                title: 'ส่งถึงบ้านแล้ว',
                sub: 'รอจิตอาสาแคร์ยูยืนยันรูปภาพ',
                badgeBg: 'bg-emerald-600',
                badgeText: 'ถึงบ้านแล้ว',
            };
        }
        if (s === 'ACCEPTED') {
            return {
                title: 'เจ้าหน้าที่รับงานแล้ว',
                sub: 'เตรียมพร้อมก่อนออกเดินทาง',
                badgeBg: 'bg-amber-500',
                badgeText: 'รับงานแล้ว',
            };
        }
        return {
            title: 'มอบหมายเจ้าหน้าที่แล้ว',
            sub: 'รอเริ่มการเดินทาง',
            badgeBg: 'bg-blue-500',
            badgeText: 'พร้อมให้บริการ',
        };
    };

    const statusInfo = getLiveStatusInfo();

    return (
        <div className="fixed inset-0 z-[1000] bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4 animate-fade-in">
            <div
                className="relative bg-white dark:bg-gray-900 w-full sm:max-w-xl md:max-w-2xl h-[92vh] sm:h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-slate-100 dark:border-gray-800">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center text-brand-primary">
                            <DirectionsCarIcon fontSize="small" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                                    ตำแหน่งรถรับส่ง (GPS สด)
                                </h3>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    สด
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-gray-400">
                                อัปเดตล่าสุด: {lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} น.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => fetchLiveLocation(false)}
                            disabled={isRefreshing}
                            title="รีเฟรชตำแหน่ง"
                            className="p-2 text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full transition-all active:scale-95 disabled:opacity-50"
                        >
                            <RefreshIcon fontSize="small" className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full transition-all active:scale-95"
                        >
                            <CloseIcon fontSize="small" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 relative w-full h-full bg-slate-100">
                    <Map
                        ref={mapRef}
                        {...viewState}
                        onMove={(evt) => setViewState(evt.viewState)}
                        style={{ width: '100%', height: '100%' }}
                        mapStyle={MAPBOX_STYLE}
                        mapboxAccessToken={MAPBOX_TOKEN}
                        minZoom={4}
                        onLoad={(e) => {
                            setMapLoaded(true);
                            try {
                                (e.target as any).setLanguage('th');
                            } catch (err) {}
                        }}
                    >
                        {mapLoaded && (
                            <>
                                {routeGeojson && (
                                    <Source id="route-source" type="geojson" data={routeGeojson}>
                                        <Layer
                                            id="route-line-bg"
                                            type="line"
                                            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                                            paint={{ 'line-color': '#1E7D55', 'line-width': 8, 'line-opacity': 0.4 }}
                                        />
                                        <Layer
                                            id="route-line"
                                            type="line"
                                            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                                            paint={{ 'line-color': '#10B981', 'line-width': 5, 'line-opacity': 0.95 }}
                                        />
                                    </Source>
                                )}

                                {driverLat && driverLng && (
                                    <Marker longitude={driverLng} latitude={driverLat} anchor="center">
                                        <div className="relative flex items-center justify-center cursor-pointer group">
                                            <div className="absolute w-12 h-12 bg-emerald-500/30 rounded-full animate-ping"></div>
                                            <div className="relative w-10 h-10 bg-emerald-600 border-2 border-white rounded-full flex items-center justify-center text-white shadow-xl">
                                                <DirectionsCarIcon style={{ fontSize: 22 }} />
                                            </div>
                                            <div className="absolute -bottom-6 whitespace-nowrap bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md pointer-events-none">
                                                {vehicle?.licensePlate || 'รถรับส่ง'}
                                            </div>
                                        </div>
                                    </Marker>
                                )}

                                {patientLat && patientLng && (
                                    <Marker longitude={patientLng} latitude={patientLat} anchor="bottom">
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-white shadow-lg">
                                                <HomeIcon style={{ fontSize: 18 }} />
                                            </div>
                                            <span className="text-[10px] font-bold bg-white dark:bg-gray-800 text-slate-800 dark:text-white px-2 py-0.5 rounded-md shadow-sm border border-slate-200 dark:border-gray-700 mt-1">
                                                บ้านของคุณ
                                            </span>
                                        </div>
                                    </Marker>
                                )}

                                {hospitalLat && hospitalLng && (
                                    <Marker longitude={hospitalLng} latitude={hospitalLat} anchor="bottom">
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 bg-red-600 border-2 border-white rounded-full flex items-center justify-center text-white shadow-lg">
                                                <LocalHospitalIcon style={{ fontSize: 18 }} />
                                            </div>
                                            <span className="text-[10px] font-bold bg-white dark:bg-gray-800 text-slate-800 dark:text-white px-2 py-0.5 rounded-md shadow-sm border border-slate-200 dark:border-gray-700 mt-1 max-w-[120px] truncate">
                                                {hospital.name || 'โรงพยาบาล'}
                                            </span>
                                        </div>
                                    </Marker>
                                )}
                            </>
                        )}
                    </Map>
                </div>

                <div className="z-20 bg-white dark:bg-gray-900 p-4 sm:p-5 border-t border-slate-100 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] space-y-3.5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${statusInfo.badgeBg}`}></span>
                                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                                    {statusInfo.title}
                                </h4>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                                {statusInfo.sub}
                            </p>
                        </div>

                        {routeInfo && (
                            <div className="text-right shrink-0 bg-slate-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-gray-700">
                                <div className="text-xs text-slate-500 dark:text-gray-400">ประมาณการ</div>
                                <div className="text-sm font-bold text-brand-primary">
                                    ~{Math.max(1, Math.ceil(routeInfo.duration / 60))} นาที ({((routeInfo.distance) / 1000).toFixed(1)} กม.)
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800/70 rounded-2xl border border-slate-100 dark:border-gray-700/60">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-gray-700 overflow-hidden shrink-0 border border-white dark:border-gray-600 shadow-sm">
                                {volunteer?.pictureUrl ? (
                                    <img
                                        src={getImageUrl(volunteer.pictureUrl)}
                                        alt="driver"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <DirectionsCarIcon fontSize="small" />
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-medium text-slate-500 dark:text-gray-400">คนขับ:</span>
                                    <span className="text-xs font-bold text-slate-800 dark:text-gray-100">
                                        {volunteer ? `${volunteer.firstName || ''} ${volunteer.lastName || ''}`.trim() : 'เจ้าหน้าที่เทศบาล'}
                                    </span>
                                </div>

                                {vehicle && (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold">
                                            ทะเบียน {vehicle.licensePlate}
                                        </span>
                                        <span className="text-[11px] text-slate-500 dark:text-gray-400 truncate max-w-[140px]">
                                            {vehicle.brand || ''} {vehicle.model || vehicle.name || ''}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {volunteer?.phone && (
                            <a
                                href={`tel:${volunteer.phone}`}
                                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-brand-primary hover:bg-[#166D45] text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
                            >
                                <PhoneIcon fontSize="small" style={{ fontSize: 16 }} />
                                <span>โทร</span>
                            </a>
                        )}
                    </div>

                    {careu && (
                        <div className="flex items-center justify-between px-3 py-2 bg-pink-50/60 dark:bg-pink-950/20 rounded-xl border border-pink-100 dark:border-pink-900/40 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-pink-700 dark:text-pink-300">จิตอาสาแคร์ยู:</span>
                                <span className="text-slate-800 dark:text-gray-200 font-medium">
                                    {careu.firstName} {careu.lastName}
                                </span>
                            </div>
                            {careu.phone && (
                                <a
                                    href={`tel:${careu.phone}`}
                                    className="text-pink-600 dark:text-pink-400 font-bold hover:underline"
                                >
                                    📞 โทร ({careu.phone})
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
