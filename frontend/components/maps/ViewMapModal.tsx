"use client";

import { useState, useEffect } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getImageUrl } from '@/utils/image';
import Swal from '@/lib/swal';
import type { LatLng, RouteInfo } from '@/types/common';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const MAPBOX_STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE || 'mapbox://styles/mapbox/satellite-streets-v12';

interface ViewMapModalProps {
    lat: number;
    lng: number;
    title?: string;
    pictureUrl?: string | null;
    onClose: () => void;
}

export default function ViewMapModal({ lat, lng, title = "ตำแหน่งที่ตั้ง", pictureUrl, onClose }: ViewMapModalProps) {
    const [viewState, setViewState] = useState({ longitude: lng, latitude: lat, zoom: 15 });
    const [mapLoaded, setMapLoaded] = useState(false);
    const [userLoc, setUserLoc] = useState<LatLng | null>(null);
    const [routeGeojson, setRouteGeojson] = useState<any>(null);
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
    const [isGettingRoute, setIsGettingRoute] = useState(false);

    useEffect(() => {
        if (!navigator.geolocation) return;
        setIsGettingRoute(true);
        navigator.geolocation.getCurrentPosition((pos) => {
            const uLat = pos.coords.latitude;
            const uLng = pos.coords.longitude;
            setUserLoc({ lat: uLat, lng: uLng });
            fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${uLng},${uLat};${lng},${lat}?geometries=geojson&language=th&access_token=${MAPBOX_TOKEN}`)
                .then(res => res.json())
                .then(data => {
                    if (data.routes && data.routes[0]) {
                        const route = data.routes[0];
                        setRouteGeojson({ type: 'Feature', properties: {}, geometry: route.geometry });
                        setRouteInfo({ distance: route.distance, duration: route.duration });
                        setViewState(prev => ({ ...prev, longitude: (uLng + lng) / 2, latitude: (uLat + lat) / 2, zoom: 12 }));
                    }
                })
                .catch(err => console.error('Error fetching route:', err))
                .finally(() => setIsGettingRoute(false));
        }, (err) => { console.error('Error getting GPS:', err); setIsGettingRoute(false); }, { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
    }, [lat, lng]);

    return (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-gray-100 gap-4">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">{title}</h3>
                        {routeInfo && <p className="text-sm text-gray-500 mt-1">ระยะทาง {(routeInfo.distance / 1000).toFixed(1)} กม. • เวลาเดินทางประมาณ {Math.ceil(routeInfo.duration / 60)} นาที</p>}
                        {isGettingRoute && <p className="text-sm text-brand-primary mt-1 animate-pulse">กำลังค้นหาเส้นทาง...</p>}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95 text-gray-500 shrink-0 self-end sm:self-auto">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="flex-1 relative min-h-[400px]">
                    <Map {...viewState} onMove={evt => setViewState(evt.viewState)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} mapStyle={MAPBOX_STYLE} mapboxAccessToken={MAPBOX_TOKEN} minZoom={5} maxBounds={[[96.5, 5.0], [106.5, 21.0]]} onLoad={e => { setMapLoaded(true); setTimeout(() => { try { e.target.resize(); } catch (err) { } }, 100); try { (e.target as any).setLanguage('th'); } catch (err) {} }}>
                        {mapLoaded && (<>
                            <Marker longitude={lng} latitude={lat} anchor="bottom">
                                <div className="relative flex flex-col items-center" style={{ zIndex: 1000 }}>
                                    {pictureUrl ? (<div className="relative w-[44px] h-[58px] z-10 drop-shadow-md"><svg viewBox="0 0 44 58" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full"><path d="M22 0C9.8 0 0 9.8 0 22C0 38.5 22 58 22 58C22 58 44 38.5 44 22C44 9.8 34.2 0 22 0Z" fill="#1E7D55" /></svg><div className="absolute top-[4px] left-[4px] w-[36px] h-[36px] rounded-full overflow-hidden bg-slate-100 border-2 border-white"><img src={getImageUrl(pictureUrl)} className="w-full h-full object-cover" alt="Pin" /></div></div>) : (<div className="relative z-10 drop-shadow-md text-brand-primary"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C7.58 0 4 3.58 4 8C4 13.5 12 24 12 24C12 24 20 13.5 20 8C20 3.58 16.42 0 12 0Z" fill="currentColor" /><circle cx="12" cy="8" r="3.5" fill="white" /></svg></div>)}
                                </div>
                            </Marker>
                            {userLoc && (<Marker longitude={userLoc.lng} latitude={userLoc.lat} anchor="center"><div className="relative flex items-center justify-center"><div className="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping"></div><div className="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-md"></div></div></Marker>)}
                            {routeGeojson && (<Source id="route" type="geojson" data={routeGeojson}><Layer id="route-line" type="line" layout={{ 'line-join': 'round', 'line-cap': 'round' }} paint={{ 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 0.8 }} /></Source>)}
                        </>)}
                    </Map>
                </div>
            </div>
        </div>
    );
}
