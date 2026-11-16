'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Swal from '@/lib/swal';
import MapView from '../driver/MapView';
import PatientInfoCard from '../driver/PatientInfoCard';
import MapControls from '../driver/MapControls';
import NavigationPanel from '../driver/NavigationPanel';
import { NavigationInfo } from './Routing';
import { RideRequest, DriverLocation, JobStatus } from '../driver/types';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { fetchWithAuth } from '@/lib/auth';
import { isInAppBrowser, getInAppBrowserName, openInExternalBrowser } from '@/utils/browserDetection';
import { useDriverActions } from './useDriverActions';
import { useTripQueue } from './useTripQueue';
import { getApiUrl } from '@/lib/api';
import {
    LOCATION_EMIT_INTERVAL_MS,
    emitJobLocationUpdate,
    flushPendingJobLocations,
    type JobLocationSource,
} from '@/lib/jobLocationTracking';
import { isPlausibleThailandCoordinate } from '@/lib/sanitizeLocationTrail';
import { formatReturningToMunicipality, getRoleCalendarPath, getDateKey, getBangkokDateKey, getRoundGroup, getHosp, canDriverCompleteTrip, hasCareUAwaitingPhotoConfirmation } from '@/utils/jobHelpers';
import { getTripGroupKey, filterActiveDropoff } from '@/utils/tripQueueOrder';
import TripQueuePanel from '../driver/TripQueuePanel';
import HospitalReturnQueuePanel from '../driver/HospitalReturnQueuePanel';

interface DriverMapProps {
    initialJobId?: number | null;
    onExitMap?: () => void;
}

export default function DriverMap({ initialJobId, onExitMap }: DriverMapProps) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { socket, isConnected } = useSocket();

    const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<RideRequest | null>(null);
    const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
    const [isTracking, setIsTracking] = useState(false);
    const [isSheetExpanded, setIsSheetExpanded] = useState(true);
    const [sheetLevel, setSheetLevel] = useState<1 | 2 | 3>(3);

    const [isFullscreenMap, setIsFullscreenMap] = useState(false);
    const [showTraffic, setShowTraffic] = useState(false);
    const [loadingError, setLoadingError] = useState<string>('');
    const [navigationInfo, setNavigationInfo] = useState<NavigationInfo | null>(null);
    const [isJobsLoaded, setIsJobsLoaded] = useState(false);
    const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
    const compassHeadingRef = useRef<number | null>(null);
    const gpsHeadingRef = useRef<number | null>(null);
    const previousLocationRef = useRef<DriverLocation | null>(null);
    const lastSocketEmitRef = useRef<number>(0);
    const activeTrackingJobIdRef = useRef<number | null>(null);
    const trackingSourceRef = useRef<JobLocationSource>('DRIVE');
    const autoAcceptedJobsRef = useRef<Set<number>>(new Set());
    const touchStartYRef = useRef<number>(0);
    const patientInfoRef = useRef<HTMLDivElement>(null);
    const exitRedirectedRef = useRef(false);
    const SWIPE_THRESHOLD = 50;

    const exitToCalendar = useCallback(() => {
        if (exitRedirectedRef.current || !user?.role) return;
        exitRedirectedRef.current = true;

        const target = getRoleCalendarPath(user.role);
        const path = typeof window !== 'undefined' ? window.location.pathname : '';
        const hasMapQuery = typeof window !== 'undefined' && window.location.search.includes('map=true');

        if (path === target) {
            onExitMap?.();
            if (hasMapQuery) {
                router.replace(target);
            }
            return;
        }

        if (user.role === 'CAREU' && path.startsWith('/volunteer/driver')) {
            router.replace(target);
            return;
        }

        router.replace(target);
    }, [user?.role, onExitMap, router]);

    const fetchRideRequests = useCallback(async () => {
        if (!user) return;

        try {
            const response = await fetchWithAuth(
                `/jobs/assigned-to/${user.id}?status=ASSIGNED,ACCEPTED,PICKING_UP,IN_TRANSIT,AT_HOSPITAL,RETURN_HOME,AT_PATIENT_HOME,RETURN_OFFICE`,
            );
            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (response.status === 429) {
                return;
            }

            const data = await response.json();

            if (Array.isArray(data)) {
                const transformedData = data.map((job: any) => ({
                    id: job.id,
                    status: job.status,
                    queue: job.queue,
                    vlt: user ? {
                        id: user.id,
                        displayName: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    } : null,
                    job: {
                        id: job.id,
                        status: job.status,
                        startLat: job.startLat,
                        startLng: job.startLng,
                        careuId: job.careuId,
                        returnPickupRequestedAt: job.returnPickupRequestedAt,
                    },
                    careu: job.careu || null
                }));

                setRideRequests(prevRequests => {
                    if (JSON.stringify(prevRequests) === JSON.stringify(transformedData)) {
                        return prevRequests;
                    }
                    return transformedData;
                });
            } else {
                console.error('Received invalid data format for jobs:', data);
                setRideRequests([]);
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
            setRideRequests([]);
        } finally {
            setIsJobsLoaded(true);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchRideRequests();
            const interval = setInterval(fetchRideRequests, 15000);

            const handleVisibility = () => {
                if (document.visibilityState === 'visible') {
                    fetchRideRequests();
                }
            };
            document.addEventListener('visibilitychange', handleVisibility);

            return () => {
                clearInterval(interval);
                document.removeEventListener('visibilitychange', handleVisibility);
            };
        }
    }, [fetchRideRequests, user]);

    useEffect(() => {
        if (!socket || !user) return;

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;

        const handleRealtimeUpdate = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                fetchRideRequests();
            }, 2000);
        };

        const handleRefreshJobs = (data: { status?: string } | null) => {
            if (data?.status === 'COMPLETED') {
                if (user?.role === 'CAREU') {
                    Swal.fire({
                        icon: 'success',
                        title: 'งานเสร็จสิ้น',
                        text: 'คนขับรถนำรถกลับเทศบาลแล้ว',
                        timer: 2000,
                        showConfirmButton: false,
                    }).then(() => {
                        exitToCalendar();
                    });
                } else {
                    exitToCalendar();
                }
                return;
            }
            handleRealtimeUpdate();
        };

        socket.on('notification', handleRealtimeUpdate);
        socket.on('refresh_jobs', handleRefreshJobs);

        return () => {
            socket.off('notification', handleRealtimeUpdate);
            socket.off('refresh_jobs', handleRefreshJobs);
            if (debounceTimer) clearTimeout(debounceTimer);
        };
    }, [socket, user, fetchRideRequests, exitToCalendar]);

    useEffect(() => {
        if (!socket || !isConnected) return;
        void flushPendingJobLocations(socket, isConnected);
    }, [socket, isConnected]);

    useEffect(() => {
        trackingSourceRef.current = user?.role === 'CAREU' ? 'CAREU' : 'DRIVE';
    }, [user?.role]);

    const tryEmitLocations = useCallback(async () => {
        const loc = previousLocationRef.current;
        if (!loc) return;

        const now = Date.now();
        if (now - lastSocketEmitRef.current < LOCATION_EMIT_INTERVAL_MS) return;
        lastSocketEmitRef.current = now;

        if (socket && isConnected && user?.role === 'DRIVE') {
            socket.emit('updateLocation', loc);
        }

        const jobId = activeTrackingJobIdRef.current;
        if (jobId) {
            await emitJobLocationUpdate(
                socket,
                isConnected,
                jobId,
                loc.lat,
                loc.lng,
                trackingSourceRef.current,
            );
        }
    }, [socket, isConnected, user?.role]);

    const tryEmitLocationsRef = useRef(tryEmitLocations);
    useEffect(() => {
        tryEmitLocationsRef.current = tryEmitLocations;
    }, [tryEmitLocations]);

    useEffect(() => {
        if (!user) return;
        const intervalId = setInterval(() => {
            void tryEmitLocations();
        }, LOCATION_EMIT_INTERVAL_MS);

        const handleOnline = () => {
            if (socket && isConnected) {
                void flushPendingJobLocations(socket, isConnected);
            }
            void tryEmitLocations();
        };
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                void tryEmitLocations();
                if (socket && isConnected) {
                    void flushPendingJobLocations(socket, isConnected);
                }
            }
        };

        window.addEventListener('online', handleOnline);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('online', handleOnline);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [user, tryEmitLocations, socket, isConnected]);

    useEffect(() => {
        if (sheetLevel !== 3 || !selectedRequest || !driverLocation) return;

        let attempts = 0;
        const maxAttempts = 10;
        const tryScroll = () => {
            attempts++;
            if (patientInfoRef.current && patientInfoRef.current.scrollHeight > 0) {
                patientInfoRef.current.scrollTo({
                    top: patientInfoRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            } else if (attempts < maxAttempts) {
                setTimeout(tryScroll, 300);
            }
        };
        setTimeout(tryScroll, 500);
    }, [sheetLevel, selectedRequest, driverLocation]);

    useEffect(() => {
        if (!rideRequests.length) return;
        setSelectedRequest(prev => {
            if (!prev) return prev;
            const updated = rideRequests.find(r => r.id === prev.id);
            if (!updated) return null;
            if (updated.status !== prev.status) return updated;
            return prev;
        });
    }, [rideRequests]);

    useEffect(() => {
        if (!user || !rideRequests.length || selectedRequest) return;

        let activeJob = null;

        if (initialJobId) {
            activeJob = rideRequests.find(r => r.id === initialJobId);
        }

        if (!activeJob) {
            activeJob = rideRequests.find(r =>
                ['PICKING_UP', 'IN_TRANSIT', 'ACCEPTED', 'RETURN_HOME', 'RETURN_OFFICE'].includes(r.status) &&
                r.vlt?.id === user.id
            );
        }

        if (!activeJob) {
            const today = getBangkokDateKey(new Date());
            activeJob = rideRequests.find(r => {
                if (r.status !== 'ASSIGNED' || r.vlt?.id !== user.id) return false;
                return getBangkokDateKey(r.queue?.requestDate) === today;
            });
        }

        if (!activeJob) {
            activeJob = rideRequests.find(r =>
                r.status === 'ASSIGNED' &&
                r.vlt?.id === user.id
            );
        }

        if (activeJob) {
            setSelectedRequest(activeJob);
            setIsSheetExpanded(true);
        }
    }, [rideRequests, user, selectedRequest, initialJobId]);

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
        if (user && navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const newLat = position.coords.latitude;
                    const newLng = position.coords.longitude;

                    if (position.coords.accuracy > 1000) return;
                    if (!isPlausibleThailandCoordinate(newLat, newLng)) return;

                    if (position.coords.heading !== null && !isNaN(position.coords.heading) && position.coords.speed !== null && position.coords.speed > 1) {
                        gpsHeadingRef.current = position.coords.heading;
                        if (compassHeadingRef.current === null) {
                            setDeviceHeading(position.coords.heading);
                        }
                    }

                    const newLocation = { lat: newLat, lng: newLng };
                    previousLocationRef.current = newLocation;
                    setDriverLocation(newLocation);
                    void tryEmitLocationsRef.current();
                },
                (error) => {
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            Swal.fire({
                                icon: 'error',
                                title: 'ไม่ได้รับสิทธิ์เข้าถึง GPS',
                                html: 'กรุณาอนุญาตให้เข้าถึงตำแหน่ง<br/>ในการตั้งค่าเบราว์เซอร์ของคุณ<br/><br/><b>วิธีแก้:</b> ไปที่ ตั้งค่า → เบราว์เซอร์ → สิทธิ์ → ตำแหน่ง',
                                confirmButtonColor: '#1E7D55',
                            });
                            break;
                        case error.POSITION_UNAVAILABLE:
                            Swal.fire({
                                icon: 'warning',
                                title: 'ไม่สามารถระบุตำแหน่งได้',
                                html: 'กรุณาตรวจสอบว่า GPS เปิดอยู่<br/>และอยู่ในพื้นที่ที่มีสัญญาณ',
                                confirmButtonColor: '#1E7D55',
                                timer: 5000,
                                showConfirmButton: true,
                            });
                            break;
                        case error.TIMEOUT:
                            return;
                    }
                    console.warn('Geolocation error:', error.code, error.message);
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: LOCATION_EMIT_INTERVAL_MS,
                    timeout: 15000
                }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, [user]);

    const activeTrackingJobId = useMemo(() => {
        const trackingStatuses = new Set([
            'ASSIGNED',
            'ACCEPTED',
            'PICKING_UP',
            'IN_TRANSIT',
            'AT_HOSPITAL',
            'AT_PATIENT_HOME',
            'RETURN_HOME',
            'RETURN_OFFICE',
        ]);

        const isMyJob = (r: RideRequest) => {
            if (user?.role === 'CAREU') {
                return String(r.job?.careuId || r.careu?.id || '') === String(user.id);
            }
            return r.vlt?.id === user?.id;
        };

        const candidates = rideRequests.filter((r) => {
            const status = r.job?.status;
            return status && trackingStatuses.has(status) && r.job?.id && isMyJob(r);
        });

        if (selectedRequest?.job?.id) {
            const selected = candidates.find((r) => r.id === selectedRequest.id);
            if (selected) return selected.job!.id;
        }

        return candidates[0]?.job?.id ?? null;
    }, [rideRequests, user?.role, user?.id, selectedRequest?.id, selectedRequest?.job?.id]);

    useEffect(() => {
        activeTrackingJobIdRef.current = activeTrackingJobId;
    }, [activeTrackingJobId]);

    useEffect(() => {
        if (!activeTrackingJobId) return;
        lastSocketEmitRef.current = 0;
        void tryEmitLocations();
    }, [activeTrackingJobId, tryEmitLocations]);

    useEffect(() => {
        if (!activeTrackingJobId) return;

        let wakeLock: WakeLockSentinel | null = null;
        const requestWakeLock = async () => {
            if (!('wakeLock' in navigator)) return;
            try {
                wakeLock = await navigator.wakeLock.request('screen');
            } catch {
            }
        };

        void requestWakeLock();
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                void requestWakeLock();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            void wakeLock?.release();
        };
    }, [activeTrackingJobId]);

    const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
        let heading: number | null = null;

        if ((event as any).webkitCompassHeading !== undefined) {
            heading = (event as any).webkitCompassHeading;
        } else if (event.absolute && event.alpha !== null) {
            heading = (360 - event.alpha) % 360;
        } else if (event.alpha !== null) {
            heading = (360 - event.alpha) % 360;
        }

        if (heading !== null) {
            compassHeadingRef.current = heading;
            setDeviceHeading(prev => {
                if (prev === null || Math.abs(prev - heading!) > 2) {
                    return heading;
                }
                return prev;
            });
        }
    }, []);

    const requestOrientationPermission = useCallback(async () => {
        if (typeof window === 'undefined') return false;

        try {
            if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                const response = await (DeviceOrientationEvent as any).requestPermission();
                if (response === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation, true);
                    return true;
                }
                return false;
            } else {
                window.addEventListener('deviceorientationabsolute', handleOrientation, true);
                window.addEventListener('deviceorientation', handleOrientation, true);
                return true;
            }
        } catch (error) {
            console.error('Error requesting orientation permission:', error);
            return false;
        }
    }, [handleOrientation]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const isIOS = typeof (DeviceOrientationEvent as any).requestPermission === 'function';

        if (!isIOS) {
            window.addEventListener('deviceorientationabsolute', handleOrientation, true);
            window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
            const requestOnFirstTouch = async () => {
                try {
                    const response = await (DeviceOrientationEvent as any).requestPermission();
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation, true);
                    }
                } catch (e) {
                    console.warn('iOS orientation permission error:', e);
                }
                document.removeEventListener('touchstart', requestOnFirstTouch);
                document.removeEventListener('click', requestOnFirstTouch);
            };
            document.addEventListener('touchstart', requestOnFirstTouch, { once: true });
            document.addEventListener('click', requestOnFirstTouch, { once: true });
        }

        return () => {
            window.removeEventListener('deviceorientationabsolute', handleOrientation);
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, [handleOrientation]);

    const today = getBangkokDateKey(new Date());
    const activeRequests = (() => {
        const filtered = rideRequests.filter(req => {
            if (!req.job) return false;
            if (['PICKING_UP', 'IN_TRANSIT', 'ACCEPTED', 'AT_HOSPITAL', 'RETURN_HOME', 'AT_PATIENT_HOME', 'RETURN_OFFICE'].includes(req.job.status)) return true;
            if (req.job.status === 'ASSIGNED' && req.queue?.requestDate) {
                return getBangkokDateKey(req.queue.requestDate) === today;
            }
            return false;
        }).filter(req => {
            if (!selectedRequest) return true;
            return getDateKey(req.queue.requestDate) === getDateKey(selectedRequest.queue.requestDate) &&
                getRoundGroup(req.queue.bookingTime) === getRoundGroup(selectedRequest.queue.bookingTime) &&
                getHosp(req.queue) === getHosp(selectedRequest.queue);
        });

        if (initialJobId) {
            const initial = rideRequests.find((r) => r.id === initialJobId);
            if (initial && !filtered.some((r) => r.id === initialJobId)) {
                return [initial, ...filtered];
            }
        }

        return filtered;
    })();

    const tripReference =
        selectedRequest && activeRequests.some((r) => r.id === selectedRequest.id)
            ? selectedRequest
            : activeRequests[0] ?? null;
    const tripGroupKey = tripReference ? getTripGroupKey(tripReference) : null;

    const hospitalLocation = useMemo(() => {
        if (!tripReference?.queue.hospital?.lat || !tripReference?.queue.hospital?.lng) return null;
        return {
            lat: tripReference.queue.hospital.lat,
            lng: tripReference.queue.hospital.lng,
        };
    }, [tripReference]);

    const {
        orderedPickup,
        orderedDropoff,
        orderedHospitalReturn,
        orderedDisplayRequests,
        currentPhase,
        pickupMode,
        dropoffMode,
        hospitalReturnMode,
        nextPickupActionTarget,
        nextDropoffActionTarget,
        reorderQueue,
        resetAuto,
        removeCompletedId,
    } = useTripQueue({
        tripGroupKey,
        tripRequests: activeRequests,
        driverLocation,
        hospitalLocation,
    });

    const displayRequests =
        orderedDisplayRequests.length > 0 ? orderedDisplayRequests : activeRequests;

    const {
        isUpdatingStatus,
        handleUpdateJobStatus,
        handleStartService,
        handleCompleteService,
        handlePickedUp,
        handleArrivedHospital,
        handlePickupFromHospital,
        handleDeliveredAtHome,
        handleCancelJob,
    } = useDriverActions({
        user,
        driverLocation,
        rideRequests,
        selectedRequest,
        setRideRequests,
        setSelectedRequest,
        fetchRideRequests,
        API_BASE_URL: getApiUrl(),
        getNextPickupActionTarget: () => nextPickupActionTarget,
        getNextDropoffActionTarget: () => nextDropoffActionTarget,
        onJobRemovedFromQueue: removeCompletedId,
        onTripCompleted: exitToCalendar,
    });

    const center: [number, number] = driverLocation
        ? [driverLocation.lat, driverLocation.lng]
        : rideRequests[0]?.queue.user.lat && rideRequests[0]?.queue.user.lng
            ? [rideRequests[0].queue.user.lat, rideRequests[0].queue.user.lng]
            : [13.7563, 100.5018];

    const mapActiveRequest = displayRequests.find((r) => r.id === selectedRequest?.id) ?? displayRequests[0] ?? null;

    const pickupRequestedJobs = orderedHospitalReturn;
    const nextHospitalReturnTarget = pickupRequestedJobs[0] ?? null;

    const handleCarouselScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const scrollLeft = container.scrollLeft;
        const cardWidth = container.clientWidth;
        if (cardWidth === 0) return;
        const index = Math.round(scrollLeft / cardWidth);
        const currentReq = displayRequests[index];

        if (currentReq && selectedRequest?.id !== currentReq.id) {
            setSelectedRequest(currentReq);
        }
    };

    const currentIndex = Math.max(0, displayRequests.findIndex(r => r.id === selectedRequest?.id));

    const handleNavigateSlide = (direction: 'left' | 'right', isMapMode: boolean) => {
        const carouselId = isMapMode ? 'driver-map-carousel' : 'driver-map-carousel-2';
        const carousel = document.getElementById(carouselId);
        if (!carousel) return;

        const cardWidth = carousel.clientWidth;
        const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;

        if (newIndex >= 0 && newIndex < displayRequests.length) {
            setSelectedRequest(displayRequests[newIndex]);
            carousel.scrollTo({
                left: newIndex * cardWidth,
                behavior: 'smooth'
            });
        }
    };

    const activeRequest = mapActiveRequest;

    const actionRequest = (() => {
        if (orderedPickup.length > 0 && nextPickupActionTarget) {
            const status = nextPickupActionTarget.job?.status || '';
            if (['ASSIGNED', 'ACCEPTED', 'PICKING_UP'].includes(status)) {
                return nextPickupActionTarget;
            }
        }
        if (nextHospitalReturnTarget) {
            return nextHospitalReturnTarget;
        }
        if (orderedDropoff.length > 0 && nextDropoffActionTarget) {
            return nextDropoffActionTarget;
        }
        return mapActiveRequest;
    })();

    const queuePanelPhase = currentPhase;
    const queuePanelRequests =
        queuePanelPhase === 'pickup' ? orderedPickup : queuePanelPhase === 'dropoff' ? orderedDropoff : [];
    const queuePanelMode = queuePanelPhase === 'pickup' ? pickupMode : dropoffMode;

    useEffect(() => {
        if (!isJobsLoaded || authLoading || !user?.role) return;
        if (activeRequests.length > 0) {
            exitRedirectedRef.current = false;
            return;
        }
        if (initialJobId && rideRequests.some((r) => r.id === initialJobId)) {
            exitRedirectedRef.current = false;
            return;
        }
        exitToCalendar();
    }, [isJobsLoaded, authLoading, user?.role, activeRequests.length, initialJobId, rideRequests, exitToCalendar]);

    const isCareUUser = user?.role === 'CAREU';

    const renderCareUActionBar = (extraClass = '') => {
        if (!isCareUUser || !activeRequest?.job) return null;

        const jobStatus = activeRequest.job.status;
        const hasCareU = !!(activeRequest.job.careuId || activeRequest.careu?.id);
        const pillBase = `w-full rounded-full font-bold text-center flex items-center justify-center gap-2 text-sm px-3 ${extraClass}`;

        if (jobStatus === 'RETURN_OFFICE') {
            const muniLabel = formatReturningToMunicipality(
                activeRequest.queue?.user?.organization?.name,
                user?.organization?.name
            );
            return (
                <div className={`${pillBase} py-3 bg-amber-50 border-2 border-amber-300 text-amber-700`}>
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shrink-0"></span>
                    {muniLabel}
                </div>
            );
        }

        if (jobStatus === 'COMPLETED') return null;

        let message = 'คนขับรถกำลังดำเนินงาน';
        if (jobStatus === 'RETURN_HOME') {
            message = 'รอคนขับส่งถึงบ้าน — คนขับจะถ่ายรูปยืนยัน';
        } else if (jobStatus === 'AT_HOSPITAL') {
            message = activeRequest.job.returnPickupRequestedAt
                ? 'ผู้ใช้เรียกรถกลับแล้ว — รอคนขับรับจากรพ.'
                : 'อยู่ที่รพ. — รอผู้ใช้กดเรียกรถกลับ';
        } else if (jobStatus === 'AT_PATIENT_HOME') {
            message = 'รอคนขับถ่ายรูปยืนยันส่งถึงบ้าน';
        }

        return (
            <div className={`${pillBase} py-3 bg-blue-50 border-2 border-blue-300 text-blue-700`}>
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shrink-0"></span>
                <span>{message}</span>
            </div>
        );
    };

    const careUActionBar = renderCareUActionBar();

    const hasReturnPickupPending = activeRequests.some(
        (r) => r.job?.status === 'AT_HOSPITAL' && r.job?.returnPickupRequestedAt
    );

    const isServiceInProgress = !!(
        activeRequest?.job?.status &&
        ['PICKING_UP', 'IN_TRANSIT', 'ACCEPTED', 'RETURN_HOME', 'RETURN_OFFICE'].includes(activeRequest.job.status)
    ) || hasReturnPickupPending;

    const shouldShowMap = isServiceInProgress;


    if (!user) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center max-w-md px-6">
                    {loadingError ? (
                        <>
                            <div className="text-6xl mb-4">⚠️</div>
                            <p className="text-xl font-semibold text-gray-800 mb-2">{loadingError}</p>
                            <p className="text-sm text-gray-600 mb-6">
                                {'กรุณาเข้าสู่ระบบเพื่อใช้งานแผนที่'}
                            </p>
                            <button
                                onClick={() => window.location.href = '/login'}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                            >
                                ไปหน้า Login
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-xl font-semibold text-gray-700">กำลังโหลดแผนที่...</p>
                            <p className="text-sm text-gray-500 mt-2">
                                {!user && 'กำลังโหลดข้อมูลผู้ใช้...'}
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    if (isJobsLoaded && displayRequests.length === 0 && !authLoading) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 text-center px-4 relative">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-primary mx-auto mb-4"></div>
                <p className="text-lg font-semibold text-gray-700">กำลังกลับไปหน้าปฏิทินงาน...</p>
            </div>
        );
    }

    if (displayRequests.length === 0 && !authLoading) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 text-center px-4 relative">
                {}
                <button
                    onClick={exitToCalendar}
                    className="absolute top-4 left-4 z-[1000] flex items-center gap-1.5 bg-white dark:bg-gray-800 text-brand-primary shadow-lg rounded-full px-4 py-2.5 hover:shadow-xl active:scale-95 transition-all border border-gray-200 dark:border-gray-600"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm font-semibold">กลับหน้าหลัก</span>
                </button>

                <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">ไม่พบงานที่กำลังดำเนินการ</h2>
                <button
                    onClick={() => fetchRideRequests()}
                    className="px-6 py-3 bg-brand-primary text-white rounded-full font-bold shadow-md hover:bg-brand-secondary active:scale-95 transition-all"
                >
                    โหลดข้อมูลตัวจริงอีกครั้ง
                </button>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col bg-gray-50">
            {}
            {!shouldShowMap && (
                <div className="px-6 py-4 bg-white border-b">
                    <h1 className="text-2xl font-bold text-center text-[#1E7D55]">งานที่ได้รับมอบหมาย</h1>
                </div>
            )}

            {}
            {shouldShowMap && (
                <div className="flex-1 relative bg-gray-200">
                    <MapView
                        center={center}
                        driverLocation={driverLocation}
                        rideRequests={rideRequests}
                        activeRequest={activeRequest}
                        isTracking={isTracking}
                        onUserInteraction={() => setIsTracking(false)}
                        isBottomSheetOpen={sheetLevel > 1}
                        onNavigationUpdate={setNavigationInfo}
                        deviceHeading={deviceHeading}
                        showTraffic={showTraffic}
                        orderedPickup={orderedPickup}
                        orderedDropoff={orderedDropoff}
                        orderedHospitalReturn={orderedHospitalReturn}
                    />

                    {}
                    {isTracking && (
                        <div className="absolute top-4 right-4 z-[1000] bg-brand-primary text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            กำลังติดตาม
                        </div>
                    )}
                    {activeTrackingJobId && (
                        <div className="absolute top-4 left-4 z-[1000] bg-emerald-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            กำลังส่งตำแหน่ง
                        </div>
                    )}

                    {}
                    {isFullscreenMap && (
                        <MapControls
                            isTracking={isTracking}
                            isUpdatingStatus={isUpdatingStatus}
                            activeJobStatus={activeRequest?.job?.status}
                            showTraffic={showTraffic}
                            onToggleTracking={() => setIsTracking(!isTracking)}
                            onExitFullscreen={() => setIsFullscreenMap(false)}
                            onUpdateStatus={(status) => activeRequest && handleUpdateJobStatus(activeRequest.job!.id, status)}
                            onToggleTraffic={() => setShowTraffic(!showTraffic)}
                        />
                    )}
                </div>
            )}

            {}
            {shouldShowMap && driverLocation ? (
                <div
                    className="fixed bottom-0 left-0 right-0 z-[1001] shadow-[0_-5px_20px_rgba(0,0,0,0.15)] transition-all duration-300 ease-in-out"
                    style={{
                        transform: sheetLevel === 1 ? 'translateY(calc(100% - 140px))' :
                            sheetLevel === 2 ? 'translateY(calc(100% - 250px))' : 'translateY(0)'
                    }}
                    onTouchStart={(e) => {
                        touchStartYRef.current = e.touches[0].clientY;
                    }}
                    onTouchEnd={(e) => {
                        const touchEndY = e.changedTouches[0].clientY;
                        const swipeDistance = touchStartYRef.current - touchEndY;

                        if (swipeDistance > SWIPE_THRESHOLD) {
                            setSheetLevel(prev => Math.min(3, prev + 1) as 1 | 2 | 3);
                        } else if (swipeDistance < -SWIPE_THRESHOLD) {
                            setSheetLevel(prev => Math.max(1, prev - 1) as 1 | 2 | 3);
                        }
                    }}
                >
                    {}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsTracking(!isTracking);
                            requestOrientationPermission();
                        }}
                        className={`absolute right-4 -top-[70px] z-[1000] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${isTracking
                            ? 'bg-brand-primary text-white scale-110'
                            : 'bg-white text-gray-600 border-2 border-brand-primary/20'
                            }`}
                        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}
                        title={isTracking ? 'ปลดล็อกตำแหน่ง' : 'ล็อกตำแหน่งจิตอาสา'}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
                            <circle cx="12" cy="12" r="3" fill="currentColor" />
                            <path d="M12 2V4M12 20V22M2 12H4M20 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>

                    {}
                    {(() => {
                        if (!actionRequest?.job) return null;

                        const jobStatus = actionRequest.job.status;
                        const isCareU = user?.role === 'CAREU';
                        const canUpdateStandardStatus = !isCareU;
                        const isCarpool = displayRequests.length > 1;

                        const stillNeedPickup = orderedPickup;
                        const isLastPickup = isCarpool && stillNeedPickup.length === 1 && stillNeedPickup[0].id === actionRequest.id;

                        const stillNeedDropOff = filterActiveDropoff(orderedDropoff);
                        const isLastDropOff = isCarpool && stillNeedDropOff.length === 1 && stillNeedDropOff[0].id === actionRequest.id;

                        const allPickedUp = isCarpool ? stillNeedPickup.length === 0 : jobStatus === 'IN_TRANSIT';
                        const allDroppedOff = isCarpool ? stillNeedDropOff.length === 0 : ['RETURN_OFFICE', 'COMPLETED'].includes(jobStatus);
                        const careuPhotoPending = hasCareUAwaitingPhotoConfirmation(displayRequests);
                        const canCompleteTrip = canDriverCompleteTrip(displayRequests);
                        const hasCareU = !!(actionRequest.job?.careuId || actionRequest.careu?.id);

                        const nextDropOff = nextDropoffActionTarget ?? actionRequest;
                        const nextDropOffHasCareU = !!(nextDropOff?.job?.careuId || nextDropOff?.careu?.id);

                        const btnClass = "w-full h-full bg-brand-primary text-white text-lg rounded-full font-bold hover:bg-btn-hover shadow-[0_4px_20px_rgba(30,125,85,0.4)] transition-transform active:scale-95 disabled:bg-btn-disabled flex items-center justify-center";

                        return (
                            <div className={`absolute left-4 right-[84px] -top-[70px] z-[1000] flex items-center ${isCareU ? 'min-h-14 h-auto' : 'h-14'}`}>
                                {}
                                {canUpdateStandardStatus && (
                                    <>
                                        {['ACCEPTED', 'ASSIGNED'].includes(jobStatus) && (
                                            <div className="flex gap-2 w-full h-full">
                                                <button
                                                    onClick={() => handleStartService((nextPickupActionTarget ?? actionRequest).job!.id)}
                                                    disabled={isUpdatingStatus}
                                                    className={btnClass}
                                                >
                                                    {isUpdatingStatus ? 'ประมวลผล...' : 'เริ่มเดินทางไปรับ'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCancelJob((nextPickupActionTarget ?? actionRequest).job!.id)}
                                                    disabled={isUpdatingStatus}
                                                    title="ยกเลิกคิวงาน"
                                                    className="w-14 h-14 shrink-0 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
                                                >
                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}

                                        {['PICKING_UP'].includes(jobStatus) && (
                                            <button
                                                onClick={() => {
                                                    const next = nextPickupActionTarget ?? actionRequest;
                                                    handlePickedUp(next.job!.id);
                                                }}
                                                disabled={isUpdatingStatus}
                                                className={btnClass}
                                            >
                                                {isUpdatingStatus ? 'ประมวลผล...' : isLastPickup ? 'รับคนสุดท้าย' : 'รับขึ้นรถแล้ว'}
                                            </button>
                                        )}

                                        {}
                                        {jobStatus === 'IN_TRANSIT' && isCarpool && !allPickedUp && (
                                            <button
                                                onClick={() => {
                                                    const next = nextPickupActionTarget ?? actionRequest;
                                                    handlePickedUp(next.job!.id);
                                                }}
                                                disabled={isUpdatingStatus}
                                                className={btnClass}
                                            >
                                                {isUpdatingStatus ? 'ประมวลผล...' : stillNeedPickup.length === 1 ? 'รับคนสุดท้าย' : `รับคนถัดไป (เหลือ ${stillNeedPickup.length} คน)`}
                                            </button>
                                        )}

                                        {}
                                        {jobStatus === 'IN_TRANSIT' && (allPickedUp || !isCarpool) && (
                                            <button
                                                onClick={() => handleArrivedHospital(actionRequest.job!.id)}
                                                disabled={isUpdatingStatus}
                                                className={btnClass}
                                            >
                                                {isUpdatingStatus ? 'ประมวลผล...' : 'ถึงโรงพยาบาลแล้ว'}
                                            </button>
                                        )}

                                        {jobStatus === 'AT_HOSPITAL' && nextHospitalReturnTarget?.job?.returnPickupRequestedAt && (
                                            <button
                                                onClick={() => handlePickupFromHospital(nextHospitalReturnTarget.job!.id)}
                                                disabled={isUpdatingStatus}
                                                className={btnClass}
                                            >
                                                {isUpdatingStatus ? 'ประมวลผล...' :
                                                    pickupRequestedJobs.length > 1
                                                        ? `รับขึ้นรถ (จากรพ.) — ${pickupRequestedJobs[0].queue.user.firstName || 'ผู้ป่วย'}`
                                                        : 'รับขึ้นรถแล้ว (จากรพ.)'}
                                            </button>
                                        )}

                                        {jobStatus === 'RETURN_HOME' && (
                                            <button
                                                onClick={() => handleDeliveredAtHome(nextDropOff.job!.id)}
                                                disabled={isUpdatingStatus}
                                                className={btnClass}
                                            >
                                                {isUpdatingStatus ? 'ประมวลผล...' : 'ถ่ายรูปยืนยันส่งถึงบ้าน'}
                                            </button>
                                        )}

                                        {}
                                        {jobStatus === 'RETURN_OFFICE' && isCarpool && !allDroppedOff && (
                                            <button
                                                onClick={() => handleDeliveredAtHome(nextDropOff.job!.id)}
                                                disabled={isUpdatingStatus}
                                                className={btnClass}
                                            >
                                                {isUpdatingStatus ? 'ประมวลผล...' :
                                                    (stillNeedDropOff.length === 1 ? 'ถ่ายรูปยืนยันส่งถึงบ้าน' : `ถ่ายรูปส่งคนถัดไป (เหลือ ${stillNeedDropOff.length} คน)`)}
                                            </button>
                                        )}
                                    </>
                                )}

                                {isCareU && careUActionBar}





                                {}
                                {canUpdateStandardStatus && canCompleteTrip && (() => {
                                    const org: any = activeRequest?.queue?.user?.organization || user?.organization;
                                    const isLockReturnOffice = !!(org?.lockReturnOfficeEnabled && org?.lat && org?.lng);
                                    const allowedRadius = org?.returnOfficeRadiusMeters || 200;

                                    let distanceToOfficeMeters: number | null = null;
                                    let isOutsideGeofence = false;

                                    if (isLockReturnOffice) {
                                        if (driverLocation?.lat && driverLocation?.lng && org?.lat && org?.lng) {
                                            const R = 6371e3;
                                            const φ1 = (driverLocation.lat * Math.PI) / 180;
                                            const φ2 = (org.lat * Math.PI) / 180;
                                            const Δφ = ((org.lat - driverLocation.lat) * Math.PI) / 180;
                                            const Δλ = ((org.lng - driverLocation.lng) * Math.PI) / 180;
                                            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                                                Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                                            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                            distanceToOfficeMeters = R * c;
                                            isOutsideGeofence = distanceToOfficeMeters > allowedRadius;
                                        } else {
                                            isOutsideGeofence = true;
                                        }
                                    }

                                    if (isOutsideGeofence) {
                                        return (
                                            <button
                                                type="button"
                                                disabled={true}
                                                className="w-full h-full bg-slate-800 text-white rounded-full font-bold border-2 border-amber-400/80 shadow-lg flex items-center justify-center cursor-not-allowed opacity-95 px-3 py-1"
                                                title={`ปุ่มถูกล็อค: ต้องอยู่ในรัศมี ${allowedRadius} เมตรรอบเทศบาล`}
                                            >
                                                <div className="flex flex-col items-center justify-center leading-tight">
                                                    <span className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-amber-300">
                                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-pulse shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                        {distanceToOfficeMeters !== null
                                                            ? `ล็อคปุ่ม: ห่างเทศบาล ${distanceToOfficeMeters >= 1000 ? `${(distanceToOfficeMeters / 1000).toFixed(1)} กม.` : `${Math.round(distanceToOfficeMeters)} ม.`}`
                                                            : 'ล็อคปุ่ม: กำลังระบุพิกัด GPS...'}
                                                    </span>
                                                    <span className="text-[11px] font-normal text-slate-300">
                                                        (ต้องอยู่ในระยะ {allowedRadius} ม. จึงจะกดจบงานได้)
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    }

                                    return (
                                        <button
                                            onClick={() => handleCompleteService(activeRequest.job!.id)}
                                            disabled={isUpdatingStatus}
                                            className={btnClass}
                                        >
                                            {isUpdatingStatus ? 'ประมวลผล...' : 'นำรถกลับถึงเทศบาลแล้ว'}
                                        </button>
                                    );
                                })()}
                            </div>
                        );
                    })()}

                    {}
                    <div className="border-t-2 border-x-2 border-[#1E7D55] rounded-t-2xl bg-white shadow-lg overflow-hidden">
                        {sheetLevel >= 2 && user?.role === 'DRIVE' && queuePanelPhase && queuePanelRequests.length > 1 && (
                            <TripQueuePanel
                                phase={queuePanelPhase}
                                orderedRequests={queuePanelRequests}
                                mode={queuePanelMode}
                                selectedId={selectedRequest?.id}
                                onReorder={(from, to) => reorderQueue(queuePanelPhase, from, to)}
                                onResetAuto={() => resetAuto(queuePanelPhase)}
                                onSelect={(req) => setSelectedRequest(req)}
                            />
                        )}
                        {pickupRequestedJobs.length > 0 && (
                            <HospitalReturnQueuePanel
                                orderedRequests={pickupRequestedJobs}
                                mode={hospitalReturnMode}
                                onReorder={(from, to) => reorderQueue('hospitalReturn', from, to)}
                                onResetAuto={() => resetAuto('hospitalReturn')}
                            />
                        )}
                        {}
                        <NavigationPanel
                            navInfo={navigationInfo}
                            hospitalName={
                                (() => {
                                    if (!activeRequest?.job) return undefined;

                                    const stillNeedPickup = displayRequests.some(req =>
                                        ['ASSIGNED', 'ACCEPTED', 'PICKING_UP'].includes(req.job?.status || '')
                                    );

                                    const allReturnOffice = canDriverCompleteTrip(displayRequests);

                                    if (stillNeedPickup) {
                                        return 'เดินทางไปรับ (ที่บ้าน)';
                                    } else if (allReturnOffice) {
                                        return activeRequest.queue?.user?.organization?.name
                                            || user?.organization?.name
                                            || 'เทศบาล';
                                    } else if (hasCareUAwaitingPhotoConfirmation(displayRequests)) {
                                        return 'รอคนขับถ่ายรูปยืนยัน';
                                    } else if (activeRequest.job.status === 'AT_HOSPITAL' && activeRequest.job.returnPickupRequestedAt) {
                                        return 'ไปรับที่โรงพยาบาล';
                                    } else if (activeRequest.job.status === 'RETURN_HOME') {
                                        return 'ส่งผู้ป่วย (กลับบ้าน)';
                                    } else {
                                        return `ส่งรพ: ${activeRequest.queue?.hospital?.name || activeRequest.queue?.hospitalName || 'โรงพยาบาล'}`;
                                    }
                                })()
                            }
                            onToggle={() => setSheetLevel(prev => prev === 3 ? 1 : (prev + 1) as 1 | 2 | 3)}
                            sheetLevel={sheetLevel}
                            isEmbedded={true}
                        />

                        {}
                        {sheetLevel >= 2 && (
                            <div ref={patientInfoRef} className={`pt-4 pb-2 overflow-hidden border-t border-gray-200 flex flex-col ${sheetLevel === 3 ? 'max-h-[50vh]' : 'max-h-[200px]'}`}>
                                <div className="flex flex-col gap-4 w-full h-full overflow-y-auto pt-0 pb-4 no-scrollbar items-start flex-1">
                                    {displayRequests.map((req, idx) => (
                                        <div key={req.job!.id} className="w-full shrink-0 px-2 box-border">
                                            <PatientInfoCard
                                                activeRequest={req}
                                                carpoolRequests={displayRequests}
                                                orderedPickup={orderedPickup}
                                                orderedDropoff={orderedDropoff}
                                                showActions={false}
                                                hideStatusBadge={true}
                                                isUpdatingStatus={isUpdatingStatus}
                                                onStartService={() => handleStartService((nextPickupActionTarget ?? req).job!.id)}
                                                onPickedUp={() => {
                                                    const next = nextPickupActionTarget;
                                                    if (next?.job) handlePickedUp(next.job.id);
                                                }}
                                                onArrivedHospital={() => handleArrivedHospital(req.job!.id)}
                                                onDeliveredAtHome={() => {
                                                    const next = nextDropoffActionTarget;
                                                    if (next?.job) handleDeliveredAtHome(next.job.id);
                                                }}
                                                isCompact={sheetLevel === 2}
                                                sheetLevel={sheetLevel}
                                                userRole={user?.role}
                                                showProgress={req.id === actionRequest?.id}
                                                showHeader={req.id === actionRequest?.id}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : shouldShowMap && !driverLocation ? (
                                <div className="fixed bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.15)] p-6">
                    <div className="flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#1E7D55]"></div>
                        <p className="text-lg font-semibold text-gray-700">กำลังค้นหาตำแหน่ง GPS...</p>
                        <p className="text-sm text-gray-500">กรุณาอนุญาตการเข้าถึงตำแหน่ง</p>
                    </div>
                </div>
            ) : !shouldShowMap ? (
                <>
                    <div className="flex-1 py-8 pb-28 bg-white overflow-y-auto">
                        {!isCareUUser && nextHospitalReturnTarget?.job?.returnPickupRequestedAt && (
                            <div className="px-4 mb-4">
                                <button
                                    type="button"
                                    onClick={() => handlePickupFromHospital(nextHospitalReturnTarget.job!.id)}
                                    disabled={isUpdatingStatus}
                                    className="w-full py-4 bg-brand-primary text-white rounded-full font-bold text-lg hover:bg-btn-hover shadow-lg transition-transform active:scale-95 disabled:bg-btn-disabled"
                                >
                                    {isUpdatingStatus ? 'ประมวลผล...' :
                                        pickupRequestedJobs.length > 1
                                            ? `รับขึ้นรถ (จากรพ.) — ${pickupRequestedJobs[0].queue.user.firstName || 'ผู้ป่วย'}`
                                            : 'รับขึ้นรถแล้ว (จากรพ.)'}
                                </button>
                            </div>
                        )}
                        {pickupRequestedJobs.length > 0 && (
                            <div className="mx-4 mb-4 rounded-xl border border-amber-200 overflow-hidden">
                                <HospitalReturnQueuePanel
                                    orderedRequests={pickupRequestedJobs}
                                    mode={hospitalReturnMode}
                                    onReorder={(from, to) => reorderQueue('hospitalReturn', from, to)}
                                    onResetAuto={() => resetAuto('hospitalReturn')}
                                />
                            </div>
                        )}
                        <div className="flex flex-col gap-6 w-full h-full overflow-y-auto pt-0 pb-4 no-scrollbar items-start">
                            {displayRequests.map((req, idx) => (
                                <div key={req.job!.id} className="w-full shrink-0 px-4">
                                    <PatientInfoCard
                                        activeRequest={req}
                                        carpoolRequests={displayRequests}
                                        orderedPickup={orderedPickup}
                                        orderedDropoff={orderedDropoff}
                                        showActions={!isCareUUser && req.id === actionRequest?.id}
                                        isUpdatingStatus={isUpdatingStatus}
                                        onStartService={() => handleStartService((nextPickupActionTarget ?? req).job!.id)}
                                        onPickedUp={() => {
                                            const next = nextPickupActionTarget;
                                            if (next?.job) handlePickedUp(next.job.id);
                                        }}
                                        onArrivedHospital={() => handleArrivedHospital(req.job!.id)}
                                        onDeliveredAtHome={() => {
                                            const next = nextDropoffActionTarget;
                                            if (next?.job) handleDeliveredAtHome(next.job.id);
                                        }}
                                        isCompact={false}
                                        userRole={user?.role}
                                        showProgress={req.id === actionRequest?.id}
                                        showHeader={req.id === actionRequest?.id}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    {careUActionBar && (
                        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200 px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.12)]">
                            {careUActionBar}
                        </div>
                    )}
                </>
            ) : null}
        </div>
    );
}

