'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

import io, { Socket } from 'socket.io-client';
import Swal from '@/lib/swal';
import Routing from './Routing';
import { CurrentLocationMarker, DestinationMarker } from '../driver/MapIcons';
import { isInAppBrowser, getInAppBrowserName, openInExternalBrowser } from '@/utils/browserDetection';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE || 'mapbox://styles/mapbox/satellite-streets-v12';
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL;

interface Location {
    id: string;
    lat: number;
    lng: number;
}

interface DestinationMarkerType {
    lat: number;
    lng: number;
}

export default function RealTimeMap() {
    const [myLocation, setMyLocation] = useState<Location | null>(null);
    const [otherLocations, setOtherLocations] = useState<Record<string, Location>>({});
    const [destination, setDestination] = useState<DestinationMarkerType | null>(null);
    const [viewState, setViewState] = useState({
        longitude: 100.5018,
        latitude: 13.7563,
        zoom: 13,
    });
    const socketRef = useRef<Socket | null>(null);
    const hasInitialCenteredRef = useRef(false);

    useEffect(() => {
        socketRef.current = io(SOCKET_URL);

        socketRef.current.on('connect', () => { });

        socketRef.current.on('initialLocations', (locations: Location[]) => {
            const locs: Record<string, Location> = {};
            locations.forEach((loc) => {
                if (loc.id !== socketRef.current?.id) {
                    locs[loc.id] = loc;
                }
            });
            setOtherLocations(locs);
        });

        socketRef.current.on('locationUpdated', (data: Location) => {
            setOtherLocations((prev) => {
                if (data.id === socketRef.current?.id) return prev;
                return { ...prev, [data.id]: data };
            });
        });

        socketRef.current.on('userDisconnected', (id: string) => {
            setOtherLocations((prev) => {
                const newLocs = { ...prev };
                delete newLocs[id];
                return newLocs;
            });
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (isInAppBrowser()) {
            const appName = getInAppBrowserName() || 'แอปนี้';
            Swal.fire({
                icon: 'warning',
                title: 'แนะนำเปิดผ่านเบราว์เซอร์',
                html: `คุณกำลังเปิดผ่าน <b>${appName}</b><br/>GPS อาจไม่ทำงาน กรุณาเปิดผ่าน<br/><b>Chrome, Safari หรือ Firefox</b> แทน`,
                confirmButtonText: 'เปิดเบราว์เซอร์',
                cancelButtonText: 'ใช้งานต่อ',
                showCancelButton: true,
                confirmButtonColor: '#1E7D55',
                cancelButtonColor: '#6B7280',
            }).then((result) => {
                if (result.isConfirmed) {
                    openInExternalBrowser();
                }
            });
        }
    }, []);

    useEffect(() => {
        if (!navigator.geolocation) {
            console.error('Geolocation is not supported by this browser.');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newLocation = {
                    id: socketRef.current?.id || 'unknown',
                    lat: latitude,
                    lng: longitude,
                };

                setMyLocation(newLocation);

                if (!hasInitialCenteredRef.current) {
                    setViewState(prev => ({
                        ...prev,
                        longitude: longitude,
                        latitude: latitude,
                        zoom: 15,
                    }));
                    hasInitialCenteredRef.current = true;
                }

                if (socketRef.current?.connected) {
                    socketRef.current.emit('updateLocation', newLocation);
                }
            },
            (error) => {
                console.error('Error getting location:', error);
                if (error.code === error.PERMISSION_DENIED) {
                    Swal.fire({
                        icon: 'error',
                        title: 'ไม่ได้รับสิทธิ์เข้าถึง GPS',
                        html: 'กรุณาอนุญาตให้เข้าถึงตำแหน่ง<br/>ในการตั้งค่าเบราว์เซอร์ของคุณ',
                        confirmButtonColor: '#1E7D55',
                    });
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
            }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    const handleMapClick = useCallback((e: any) => {
        setDestination({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    }, []);

    const handleUserMarkerClick = (loc: Location) => {
        setDestination({ lat: loc.lat, lng: loc.lng });
    };

    return (
        <div className="h-screen w-full relative">
            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                onClick={handleMapClick}
                style={{ width: '100%', height: '100%' }}
                mapStyle={MAPBOX_STYLE}
                mapboxAccessToken={MAPBOX_TOKEN}
                minZoom={5}
                maxBounds={[[96.5, 5.0], [106.5, 21.0]]}
                onLoad={e => {
                    try {
                        (e.target as any).setLanguage('th');
                    } catch (err) {
                        console.warn('setLanguage failed:', err);
                    }
                }}
            >
                {myLocation && (
                    <Marker
                        longitude={myLocation.lng}
                        latitude={myLocation.lat}
                        anchor="center"
                    >
                        <CurrentLocationMarker />
                    </Marker>
                )}

                {Object.values(otherLocations).map((loc) => (
                    <Marker
                        key={loc.id}
                        longitude={loc.lng}
                        latitude={loc.lat}
                        anchor="bottom"
                        onClick={(e) => {
                            e.originalEvent.stopPropagation();
                            handleUserMarkerClick(loc);
                        }}
                    >
                        <div style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: '#3B82F6',
                            border: '2px solid white',
                            boxShadow: '0 0 6px rgba(59, 130, 246, 0.5)',
                            cursor: 'pointer',
                        }} />
                    </Marker>
                ))}

                {destination && (
                    <Marker
                        longitude={destination.lng}
                        latitude={destination.lat}
                        anchor="bottom"
                    >
                        <DestinationMarker />
                    </Marker>
                )}

                {myLocation && destination && (
                    <Routing
                        pathPoints={[
                            [myLocation.lat, myLocation.lng],
                            [destination.lat, destination.lng],
                        ]}
                    />
                )}
            </Map>

            {destination && (
                <div className="absolute top-4 right-4 z-[1000] bg-white p-4 rounded-lg shadow-lg max-w-sm border-2 border-blue-500">
                    <h3 className="font-bold text-lg mb-2 flex items-center">
                        🗺️ กำลังนำทาง
                    </h3>
                    <div className="text-sm space-y-2">
                        <div className="flex items-start">
                            <span className="text-brand-primary mr-2">📍</span>
                            <div>
                                <p className="font-semibold">จุดเริ่มต้น</p>
                                <p className="text-xs text-gray-600">
                                    {myLocation?.lat.toFixed(6)}, {myLocation?.lng.toFixed(6)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <span className="text-red-600 mr-2">🎯</span>
                            <div>
                                <p className="font-semibold">จุดหมายปลายทาง</p>
                                <p className="text-xs text-gray-600">
                                    {destination.lat.toFixed(6)}, {destination.lng.toFixed(6)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setDestination(null)}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 w-full mt-3 font-semibold transition-colors"
                    >
                        ยกเลิกการนำทาง
                    </button>
                </div>
            )}

            {!myLocation && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
                    <p className="text-sm font-semibold">🔍 กำลังค้นหาตำแหน่งของคุณ...</p>
                </div>
            )}

            <div className="absolute bottom-4 left-4 z-[1000] bg-white p-3 rounded-lg shadow-lg border-2 border-gray-300">
                <p className="text-sm font-semibold mb-1">💡 วิธีใช้งาน</p>
                <ul className="text-xs text-gray-700 space-y-1">
                    <li>• คลิกบนแผนที่เพื่อปักหมุดจุดหมาย</li>
                    <li>• คลิก marker ผู้ใช้อื่นเพื่อนำทาง</li>
                    <li>• เส้นทางจะแสดงอัตโนมัติ</li>
                </ul>
            </div>
        </div>
    );
}
