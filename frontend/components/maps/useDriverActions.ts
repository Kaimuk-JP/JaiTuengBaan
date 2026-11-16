import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from '@/lib/swal';
import { JobStatus, RideRequest, DriverLocation } from '../driver/types';
import { getRoundGroup, getDateKey, getHosp, getRoleCalendarPath } from '@/utils/jobHelpers';
import { captureReturnEvidence, uploadReturnEvidence } from '@/lib/returnEvidenceCapture';

function jobHasCareU(req: RideRequest | undefined): boolean {
    if (!req) return false;
    return !!(req.job?.careuId || req.careu?.id);
}

interface UseDriverActionsProps {
    user: any;
    driverLocation: DriverLocation | null;
    rideRequests: RideRequest[];
    selectedRequest: RideRequest | null;
    API_BASE_URL?: string;
    setRideRequests: React.Dispatch<React.SetStateAction<RideRequest[]>>;
    setSelectedRequest: React.Dispatch<React.SetStateAction<RideRequest | null>>;
    fetchRideRequests: () => void;
    getNextPickupActionTarget?: () => RideRequest | null;
    getNextDropoffActionTarget?: () => RideRequest | null;
    onJobRemovedFromQueue?: (jobId: number) => void;
    onTripCompleted?: () => void;
}

export function useDriverActions({
    user,
    driverLocation,
    rideRequests,
    selectedRequest,
    API_BASE_URL = process.env.NEXT_PUBLIC_API_URL,
    setRideRequests,
    setSelectedRequest,
    fetchRideRequests,
    getNextPickupActionTarget,
    getNextDropoffActionTarget,
    onJobRemovedFromQueue,
    onTripCompleted,
}: UseDriverActionsProps) {
    const router = useRouter();
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const handleUpdateJobStatus = async (
        jobId: number,
        status: JobStatus,
        skipConfirm = false,
        returnEvidenceUrl?: string
    ) => {
        if (!user) {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณาเข้าสู่ระบบ',
                text: 'กรุณา login ก่อน',
                confirmButtonColor: '#1E7D55',
            });
            return Promise.resolve(false);
        }

        if (isUpdatingStatus) return false;

        const statusLabels = {
            ASSIGNED: 'รับงาน',
            ACCEPTED: 'รับงาน',
            PICKING_UP: 'เริ่มเดินทางไปรับ',
            IN_TRANSIT: 'รับขึ้นรถแล้ว',
            AT_HOSPITAL: 'ถึงโรงพยาบาลแล้ว',
            RETURN_HOME: 'รับจากโรงพยาบาลแล้ว',
            AT_PATIENT_HOME: 'ส่งถึงบ้านแล้ว',
            RETURN_OFFICE: 'ส่งกลับถึงบ้าน',
            COMPLETED: 'นำรถกลับถึงเทศบาล',
        };

        if (!skipConfirm) {
            const result = await Swal.fire({
                icon: 'question',
                title: 'ยืนยัน',
                text: `${statusLabels[status as keyof typeof statusLabels]}?`,
                showCancelButton: true,
                confirmButtonColor: '#1E7D55',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'ยืนยัน',
                cancelButtonText: 'ยกเลิก',
            });
            if (!result.isConfirmed) return false;
        }

        setIsUpdatingStatus(true);
        try {
            let response;
            if (status === 'ACCEPTED') {
                response = await fetch(`${API_BASE_URL}/jobs/${jobId}/accept-by-volunteer`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        vltId: user.id,
                        lat: driverLocation?.lat,
                        lng: driverLocation?.lng
                    }),
                });
            } else {
                const body: any = { status, vltId: user.id };
                if (driverLocation) {
                    body.lat = driverLocation.lat;
                    body.lng = driverLocation.lng;
                }
                if (returnEvidenceUrl) {
                    body.returnEvidenceUrl = returnEvidenceUrl;
                }
                response = await fetch(`${API_BASE_URL}/jobs/${jobId}/update-status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(body),
                });
            }

            if (response.status === 401) {
                Swal.fire({
                    icon: 'error',
                    title: 'เซสชั่นหมดอายุ',
                    text: 'กรุณาเข้าสู่ระบบใหม่',
                    confirmButtonColor: '#1E7D55',
                });
                window.location.href = '/login';
                return false;
            }

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'สำเร็จ!',
                    text: `${statusLabels[status as keyof typeof statusLabels]}สำเร็จ!`,
                    timer: 1500,
                    showConfirmButton: false,
                });

                setRideRequests(prev => {
                    if (status === 'COMPLETED') return prev.filter(req => req.id !== jobId);
                    return prev.map(req =>
                        req.id === jobId
                            ? { ...req, status: status, job: { ...req.job!, status: status } }
                            : req
                    );
                });

                onJobRemovedFromQueue?.(jobId);

                if (selectedRequest && selectedRequest.id === jobId) {
                    if (status === 'COMPLETED') {
                        setSelectedRequest(null);
                    } else {
                        setSelectedRequest({
                            ...selectedRequest,
                            status: status,
                            job: { ...selectedRequest.job!, status: status }
                        });

                        if (status === 'IN_TRANSIT') {
                            const nextPickup = getNextPickupActionTarget?.() ??
                                rideRequests.find(r =>
                                    r.id !== jobId && r.job && ['PICKING_UP'].includes(r.job.status)
                                );
                            if (nextPickup) {
                                setTimeout(() => setSelectedRequest(nextPickup), 100);
                            }
                        } else if (status === 'RETURN_OFFICE' || status === 'AT_PATIENT_HOME') {
                            const nextDropOff = getNextDropoffActionTarget?.() ??
                                rideRequests.find(r =>
                                    r.id !== jobId && r.job && ['RETURN_HOME'].includes(r.job.status)
                                );
                            if (nextDropOff) {
                                setTimeout(() => setSelectedRequest(nextDropOff), 100);
                            }
                        }
                    }
                }

                if (status === 'COMPLETED') {
                    const tripContext = rideRequests.find((r) => r.id === jobId)
                        || (selectedRequest?.id === jobId ? selectedRequest : null);
                    const remainingJobsInSameTrip = rideRequests.filter(req => {
                        if (req.id === jobId) return false;
                        if (!['PICKING_UP', 'IN_TRANSIT', 'ACCEPTED', 'AT_HOSPITAL', 'RETURN_HOME', 'AT_PATIENT_HOME', 'RETURN_OFFICE'].includes(req.job?.status || '')) return false;
                        if (!tripContext) return false;

                        return getDateKey(req.queue?.requestDate) === getDateKey(tripContext.queue?.requestDate) &&
                            getRoundGroup(req.queue?.bookingTime) === getRoundGroup(tripContext.queue?.bookingTime) &&
                            getHosp(req.queue) === getHosp(tripContext.queue);
                    });

                    if (remainingJobsInSameTrip.length > 0) {
                        const nextJob = remainingJobsInSameTrip.find(r =>
                            ['PICKING_UP', 'IN_TRANSIT', 'AT_HOSPITAL', 'RETURN_HOME', 'AT_PATIENT_HOME', 'RETURN_OFFICE'].includes(r.job?.status || '')
                        ) || remainingJobsInSameTrip[0];
                        setSelectedRequest(nextJob);
                    } else if (onTripCompleted) {
                        onTripCompleted();
                    } else if (user?.role) {
                        router.replace(getRoleCalendarPath(user.role));
                    }
                }

                setTimeout(() => fetchRideRequests(), 500);
                return true;
            } else {
                const error = await response.json();
                Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    text: error.message || 'ไม่สามารถอัพเดทสถานะได้',
                    confirmButtonColor: '#1E7D55',
                });
                return false;
            }
        } catch (error) {
            console.error('Error updating status:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'เกิดข้อผิดพลาดในการอัพเดทสถานะ',
                confirmButtonColor: '#1E7D55',
            });
            return false;
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleStartService = async (jobId: number) => {
        const targetRequest = rideRequests.find(r => r.job?.id === jobId);
        if (!targetRequest || !user) return;

        const targetGroup = getRoundGroup(targetRequest.queue.bookingTime);
        const targetDate = getDateKey(targetRequest.queue.requestDate);
        const targetHosp = getHosp(targetRequest.queue);

        const carpoolSiblings = rideRequests.filter(r =>
            r.job && ['ASSIGNED', 'ACCEPTED'].includes(r.job.status) &&
            getRoundGroup(r.queue.bookingTime) === targetGroup &&
            getDateKey(r.queue.requestDate) === targetDate &&
            getHosp(r.queue) === targetHosp
        );

        const passengerCount = carpoolSiblings.length;
        const result = await Swal.fire({
            icon: 'question',
            title: 'ยืนยันเริ่มให้บริการ?',
            text: passengerCount > 1
                ? `เริ่มงานสำหรับผู้โดยสารทั้ง ${passengerCount} คนในกลุ่มนี้`
                : 'คุณพร้อมจะเริ่มให้บริการแล้วหรือไม่?',
            showCancelButton: true,
            confirmButtonColor: '#1E7D55',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'เริ่มให้บริการ',
            cancelButtonText: 'ยกเลิก',
        });

        if (!result.isConfirmed) return;

        try {
            setIsUpdatingStatus(true);
            for (const req of carpoolSiblings) {
                if (req.status === 'ASSIGNED') {
                    const acceptRes = await fetch(`${API_BASE_URL}/jobs/${req.job!.id}/accept-by-volunteer`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            vltId: user.id,
                            lat: driverLocation?.lat,
                            lng: driverLocation?.lng
                        }),
                    });
                    if (!acceptRes.ok) throw new Error(`ไม่สามารถรับงาน ${req.job!.id} ได้`);
                }
            }

            for (const req of carpoolSiblings) {
                await handleUpdateJobStatus(req.job!.id, 'PICKING_UP', true);
            }
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'เกิดข้อผิดพลาดในการเริ่มงาน',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleCompleteService = async (jobId: number) => {
        if (isUpdatingStatus) return;
        const carpoolToComplete = rideRequests.filter(r => r.job && r.job.status === 'RETURN_OFFICE');
        try {
            setIsUpdatingStatus(true);
            for (const req of carpoolToComplete) {
                await handleUpdateJobStatus(req.job!.id, 'COMPLETED', true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handlePickedUp = (jobId: number) => {
        if (!isUpdatingStatus) handleUpdateJobStatus(jobId, 'IN_TRANSIT', true);
    };

    const handleArrivedHospital = async (jobId: number) => {
        if (isUpdatingStatus) return;
        const carpoolInTransit = rideRequests.filter(r => r.job && r.job.status === 'IN_TRANSIT');
        try {
            setIsUpdatingStatus(true);
            for (const req of carpoolInTransit) {
                await handleUpdateJobStatus(req.job!.id, 'AT_HOSPITAL', true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handlePickupFromHospital = (jobId: number) => {
        if (!isUpdatingStatus) handleUpdateJobStatus(jobId, 'RETURN_HOME', true);
    };

    const handleDeliveredAtHome = async (jobId: number) => {
        if (isUpdatingStatus) return;
        try {
            const file = await captureReturnEvidence();
            if (!file) return;
            const returnEvidenceUrl = await uploadReturnEvidence(file);
            await handleUpdateJobStatus(jobId, 'RETURN_OFFICE', true, returnEvidenceUrl);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'ไม่สามารถยืนยันส่งถึงบ้านได้';
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: message,
                confirmButtonColor: '#1E7D55',
            });
        }
    };

    const handleCancelJob = async (jobId: number) => {
        if (!user) return;

        const { value: reason, isConfirmed } = await Swal.fire({
            title: 'ยกเลิกคิวงาน?',
            text: 'กรุณาระบุเหตุผลในการยกเลิกคิว เพื่อส่งกลับให้เทศบาลดำเนินการเปลี่ยนคนขับ',
            input: 'textarea',
            inputPlaceholder: 'ระบุเหตุผล เช่น ติดภารกิจด่วน, รถมีปัญหา...',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ยืนยันยกเลิกคิว',
            cancelButtonText: 'ย้อนกลับ',
            inputValidator: (val: string) => {
                if (!val || !val.trim()) {
                    return 'กรุณากรอกเหตุผลในการยกเลิก';
                }
                return null;
            },
        });

        if (!isConfirmed || !reason) return;

        try {
            setIsUpdatingStatus(true);
            const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/reject-by-volunteer`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    vltId: user.id,
                    reason: reason.trim(),
                }),
            });

            if (response.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'ยกเลิกคิวสำเร็จ',
                    text: 'ระบบได้ส่งคิวกลับไปยังเทศบาลเพื่อเปลี่ยนคนขับแล้ว',
                    confirmButtonColor: '#1E7D55',
                });
                fetchRideRequests();
                router.push('/volunteer/driver');
            } else {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'ไม่สามารถยกเลิกงานได้');
            }
        } catch (error: any) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถยกเลิกงานได้',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    return {
        isUpdatingStatus,
        handleUpdateJobStatus,
        handleStartService,
        handleCompleteService,
        handlePickedUp,
        handleArrivedHospital,
        handlePickupFromHospital,
        handleDeliveredAtHome,
        handleCancelJob,
    };
}
