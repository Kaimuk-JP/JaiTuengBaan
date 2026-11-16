'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

import { CurrentLocationMarker, SelectedLocationMarker } from '../../driver/MapIcons';
import Swal from '@/lib/swal';
import { isInAppBrowser, getInAppBrowserName, openInExternalBrowser } from '@/utils/browserDetection';
import type { LatLng } from '@/types/common';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface SelectedLocation extends LatLng {
    address?: string;
}

export default function LocationPickerMap() {
    const router = useRouter();
    const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
    const [address, setAddress] = useState<string>('');
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const [viewState, setViewState] = useState({
        longitude: 100.5018,
        latitude: 13.7563,
        zoom: 15,
    });
    const hasInitialCenteredRef = useRef(false);

    useEffect(() => {
        if (!navigator.geolocation) {
            console.error('Geolocation is not supported by this browser.');
            const defaultLat = 13.7563;
            const defaultLng = 100.5018;
            setCurrentLocation({ lat: defaultLat, lng: defaultLng });
            setSelectedLocation({ lat: defaultLat, lng: defaultLng });
            fetchAddress(defaultLat, defaultLng);
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newLocation = { lat: latitude, lng: longitude };

                setCurrentLocation(newLocation);

                if (!hasInitialCenteredRef.current) {
                    setViewState(prev => ({
                        ...prev,
                        longitude: longitude,
                        latitude: latitude,
                    }));
                    hasInitialCenteredRef.current = true;
                }

                setSelectedLocation(prev => {
                    if (!prev) {
                        fetchAddress(latitude, longitude);
                        return newLocation;
                    }
                    return prev;
                });
            },
            (error) => {
                console.error('Error getting location:', error);
                const defaultLat = 13.7563;
                const defaultLng = 100.5018;
                setCurrentLocation({ lat: defaultLat, lng: defaultLng });
                setSelectedLocation({ lat: defaultLat, lng: defaultLng });
                fetchAddress(defaultLat, defaultLng);
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

    const fetchAddress = async (lat: number, lng: number) => {
        setIsLoadingAddress(true);
        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=th&types=address,poi&limit=1`
            );
            const data = await response.json();
            const addressText = data.features?.[0]?.place_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            setAddress(addressText);
        } catch (error) {
            console.error('Error fetching address:', error);
            setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        } finally {
            setIsLoadingAddress(false);
        }
    };

    const handleMapClick = useCallback((e: any) => {
        const lat = e.lngLat.lat;
        const lng = e.lngLat.lng;
        setSelectedLocation({ lat, lng });
        fetchAddress(lat, lng);
    }, []);

    const handleConfirm = () => {
        if (selectedLocation) {
            const locationData = {
                lat: selectedLocation.lat.toString(),
                lng: selectedLocation.lng.toString(),
                address: address
            };

            sessionStorage.setItem('selectedLocation', JSON.stringify(locationData));
            router.push('/elderly/profile/edit');
        } else {
            console.warn('⚠️ No location selected!');
        }
    };

    const handleCancel = () => {
        router.push('/elderly/profile/edit');
    };

    const handleUseCurrentLocation = () => {
        if (currentLocation) {
            setSelectedLocation(currentLocation);
            fetchAddress(currentLocation.lat, currentLocation.lng);
        }
    };

    return (
        <div className="h-screen w-full relative">
            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                onClick={handleMapClick}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
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
                {currentLocation && (
                    <Marker
                        longitude={currentLocation.lng}
                        latitude={currentLocation.lat}
                        anchor="center"
                    >
                        <CurrentLocationMarker />
                    </Marker>
                )}

                {selectedLocation && (
                    <Marker
                        longitude={selectedLocation.lng}
                        latitude={selectedLocation.lat}
                        anchor="bottom"
                    >
                        <SelectedLocationMarker />
                    </Marker>
                )}
            </Map>

            <div className="absolute top-0 left-0 right-0 z-[1000] bg-white shadow-md">
                <div className="px-5 py-4 flex items-center justify-between">
                    <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 text-text-tertiary hover:text-text-primary"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="font-medium">กลับ</span>
                    </button>
                    <h1 className="text-lg font-bold text-brand-primary">เลือกที่อยู่</h1>
                    <div className="w-16"></div>
                </div>
            </div>

            {selectedLocation && (
                <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-3xl shadow-2xl p-6">
                    <div className="mb-4">
                        <h3 className="font-bold text-lg mb-2 text-text-primary">ที่อยู่ที่เลือก</h3>
                        <div className="bg-background-secondary p-4 rounded-lg">
                            {isLoadingAddress ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-sm text-text-tertiary">กำลังค้นหาที่อยู่...</p>
                                </div>
                            ) : (
                                <p className="text-sm text-text-primary">{address}</p>
                            )}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-text-tertiary">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 8C8.55228 8 9 7.55228 9 7C9 6.44772 8.55228 6 8 6C7.44772 6 7 6.44772 7 7C7 7.55228 7.44772 8 8 8Z" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M8 1C6.67392 1 5.40215 1.52678 4.46447 2.46447C3.52678 3.40215 3 4.67392 3 6C3 7.1136 3.2816 7.904 4 9L8 14L12 9C12.7184 7.904 13 7.1136 13 6C13 4.67392 12.4732 3.40215 11.5355 2.46447C10.5979 1.52678 9.32608 1 8 1Z" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                            <span>{selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {currentLocation && (
                            <button
                                onClick={handleUseCurrentLocation}
                                className="w-full bg-white border-2 border-brand-primary text-brand-primary font-semibold py-3 px-6 rounded-xl hover:bg-background-hover transition-colors flex items-center justify-center gap-2"
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="2" />
                                    <path d="M10 13C11.6569 13 13 11.6569 13 10C13 8.34315 11.6569 7 10 7C8.34315 7 7 8.34315 7 10C7 11.6569 8.34315 13 10 13Z" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                ใช้ตำแหน่งปัจจุบัน
                            </button>
                        )}
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedLocation}
                            className="w-full bg-brand-primary hover:bg-btn-hover disabled:bg-btn-disabled text-white font-semibold py-3.5 px-6 rounded-xl transition-colors shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                        >
                            ยืนยันที่อยู่
                        </button>
                    </div>
                </div>
            )}

            <div className="absolute top-20 left-4 z-[1000] bg-white p-3 rounded-lg shadow-lg border-2 border-border-neutral-light max-w-xs">
                <p className="text-sm font-semibold mb-1 text-text-primary">💡 วิธีใช้งาน</p>
                <p className="text-xs text-text-tertiary">คลิกบนแผนที่เพื่อเลือกตำแหน่งที่อยู่ของคุณ</p>
            </div>

            {!currentLocation && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1000] bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
                    <p className="text-sm font-semibold">🔍 กำลังค้นหาตำแหน่งของคุณ...</p>
                </div>
            )}
        </div>
    );
}
