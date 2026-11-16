'use client';

import Image from 'next/image';
import Swal from '@/lib/swal';
import { JOB_STATUS_CONFIG } from '@/components/staff/JobStatusBadge';
import { formatReturningToMunicipality, canDriverStartJob } from '@/utils/jobHelpers';
import { filterActiveDropoff } from '@/utils/tripQueueOrder';

interface RideRequest {
    id: number;
    status: string;
    queue: {
        user: {
            id: number;
            displayName?: string;
            firstName?: string;
            lastName?: string;
            phone: string;
            lat: number;
            lng: number;
            addressDetail: string;
            mobilityStatus: string;
            pictureUrl?: string;
            diseases?: { disease: { name: string } }[];
            customDiseases?: string[];
            organization?: { name?: string };
        };
        hospitalName?: string;
        hospital?: {
            name: string;
            lat?: number;
            lng?: number;
        };
        severityLevel: string;
        hasAppointment: boolean;
        requestDate: string;
        bookingTime?: string;
        requiredEquipment?: string;
    };
    vlt: {
        id: number;
        displayName: string;
    } | null;
    job?: {
        id: number;
        status: string;
        careuId?: string | null;
        returnPickupRequestedAt?: string | null;
    };
    careu?: {
        id: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        pictureUrl?: string;
    } | null;
}

interface PatientInfoCardProps {
    activeRequest: RideRequest | null;
    carpoolRequests?: RideRequest[];
    orderedPickup?: RideRequest[];
    orderedDropoff?: RideRequest[];
    showActions?: boolean;
    hideStatusBadge?: boolean;
    showHeader?: boolean;
    isUpdatingStatus: boolean;
    onStartService: () => void;
    onPickedUp?: () => void;
    onArrivedHospital?: () => void;
    onPickupFromHospital?: () => void;
    onDeliveredAtHome?: () => void;
    onConfirmHomeDelivery?: () => void;
    isCompact?: boolean;
    sheetLevel?: 1 | 2 | 3;
    userRole?: string;
    showProgress?: boolean;
}

export default function PatientInfoCard({
    activeRequest,
    carpoolRequests = [],
    orderedPickup,
    orderedDropoff,
    showActions = true,
    hideStatusBadge = false,
    isUpdatingStatus,
    onStartService,
    onPickedUp,
    onArrivedHospital,
    onPickupFromHospital,
    onDeliveredAtHome,
    onConfirmHomeDelivery,
    isCompact = false,
    sheetLevel = 3,
    userRole = 'DRIVE',
    showProgress = true,
    showHeader = true



}: PatientInfoCardProps) {
    if (!activeRequest) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <p className="text-6xl mb-4">😴</p>
                <h3 className="text-xl font-bold text-text-primary mb-2">ยังไม่มีงานในขณะนี้</h3>
                <p className="text-text-tertiary">รอรับงานใหม่จากระบบ</p>
            </div>
        );
    }

    const { user } = activeRequest.queue;
    const displayName = user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'ไม่ระบุชื่อ';
    const jobStatus = activeRequest.job?.status || activeRequest.status;

    const careuName = activeRequest.careu
        ? `${activeRequest.careu.firstName || ''} ${activeRequest.careu.lastName || ''}`.trim() || 'ไม่ระบุชื่อ'
        : null;

    const isCarpool = carpoolRequests.length > 1;
    const stillNeedPickup = orderedPickup ??
        carpoolRequests.filter(r => ['ASSIGNED', 'ACCEPTED', 'PICKING_UP'].includes(r.job?.status || ''));
    const stillNeedDropOff = orderedDropoff
        ? filterActiveDropoff(orderedDropoff)
        : carpoolRequests.filter(r => r.job?.status === 'RETURN_HOME');
    const allPickedUp = isCarpool && stillNeedPickup.length === 0;
    const allDroppedOff = isCarpool && stillNeedDropOff.length === 0;
    const isLastPickup = isCarpool && jobStatus === 'PICKING_UP' && stillNeedPickup.length === 1;
    const isLastDropOff = isCarpool && jobStatus === 'RETURN_HOME' && stillNeedDropOff.length === 1;
    const alreadyPickedUp = isCarpool && jobStatus === 'IN_TRANSIT' && !allPickedUp;
    const alreadyDroppedOff = isCarpool && jobStatus === 'RETURN_OFFICE' && !allDroppedOff;

    const isCareU = userRole === 'CAREU';
    const hasCareU = !!(activeRequest.job?.careuId || activeRequest.careu?.id);
    const reqHasCareU = (r: RideRequest) => !!(r.job?.careuId || r.careu?.id);

    const canUpdateStandardStatus = !isCareU;


    const StepProgress = ({ currentStep }: { currentStep: number }) => {
        const stepLabels = ['ออกเทศบาล', 'รับที่บ้าน', 'ถึงรพ.', 'รับกลับ/ส่งบ้าน', 'กลับเทศบาล'];

        return (
            <div className="mb-6 w-full">
                { }
                <div className="flex items-center justify-between relative">
                    { }
                    <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-300 z-0" />
                    { }
                    <div
                        className="absolute left-0 top-5 h-0.5 bg-brand-primary z-0 transition-all duration-300"
                        style={{ width: `${(Math.min(currentStep, 5) - 1) * 25}%` }}
                    />

                    {[1, 2, 3, 4, 5].map((step, index) => (
                        <div key={step} className="flex flex-col items-center z-10 w-1/5">
                            { }
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 ${step < currentStep
                                ? 'bg-brand-primary border-brand-primary text-white'
                                : step === currentStep
                                    ? 'bg-white border-brand-primary text-brand-primary'
                                    : 'bg-white border-gray-300 text-gray-400'
                                }`}>
                                {step < currentStep ? (
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <span className="text-xs sm:text-sm font-bold">{step}</span>
                                )}
                            </div>
                            { }
                            <span className={`text-[10px] sm:text-xs mt-2 text-center leading-tight ${step <= currentStep ? 'text-btn-primary font-semibold' : 'text-gray-400'
                                }`}>
                                {stepLabels[index]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const getCurrentStep = () => {
        if (jobStatus === 'ACCEPTED' || jobStatus === 'ASSIGNED') return 1;
        if (jobStatus === 'PICKING_UP') return 2;
        if (jobStatus === 'IN_TRANSIT') return 3;
        if (jobStatus === 'AT_HOSPITAL' || jobStatus === 'RETURN_HOME' || jobStatus === 'AT_PATIENT_HOME') return 4;
        if (jobStatus === 'RETURN_OFFICE') return 5;
        if (jobStatus === 'COMPLETED') return 6;
        return 1;
    };

    if (isCompact) {
        return (
            <div className="w-full">
                { }
                {showProgress && <StepProgress currentStep={getCurrentStep()} />}

                { }
                <div className="flex items-center gap-4 mb-4 mt-8">
                    { }
                    <div className="w-16 h-16 rounded-full bg-background-secondary flex items-center justify-center overflow-hidden shadow-sm border-2 border-white relative flex-shrink-0">
                        {activeRequest.queue.user.pictureUrl ? (
                            <Image
                                src={activeRequest.queue.user.pictureUrl}
                                alt={displayName}
                                fill
                                className="object-cover"
                                sizes="64px"
                                unoptimized
                                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                            />
                        ) : null}
                        <svg className={`w-8 h-8 text-text-disabled ${activeRequest.queue.user.pictureUrl ? 'hidden' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                    </div>

                    { }
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-text-primary mb-1">{displayName}</h3>
                        <p className="text-sm text-text-secondary">เบอร์ : {user.phone || 'ไม่ระบุ'}</p>
                    </div>
                </div>

                { }


                { }
                {sheetLevel === 3 && showActions && (
                    <div className="space-y-3">
                        { }
                        {canUpdateStandardStatus && (
                            <>
                                { }
                                {['ACCEPTED', 'ASSIGNED'].includes(jobStatus) && (
                                    canDriverStartJob(activeRequest.queue.requestDate, activeRequest.queue.bookingTime) ? (
                                        <button
                                            onClick={onStartService}
                                            disabled={isUpdatingStatus}
                                            className="w-full py-3 bg-brand-primary text-white rounded-full font-bold hover:bg-btn-hover shadow-lg transition-transform active:scale-95 disabled:bg-btn-disabled disabled:shadow-none"
                                        >
                                            {isUpdatingStatus ? 'กำลังประมวลผล...' : 'เริ่มเดินทางไปรับ '}
                                        </button>
                                    ) : (
                                        <div className="w-full py-3 bg-gray-100 text-gray-500 rounded-full font-bold text-center">
                                            ยังไม่ถึงกำหนดวันทำงาน
                                        </div>
                                    )
                                )}

                                { }
                                {['PICKING_UP'].includes(jobStatus) && (
                                    <button
                                        onClick={onPickedUp}
                                        disabled={isUpdatingStatus}
                                        className="w-full py-3 bg-brand-primary text-white rounded-full font-bold hover:bg-btn-hover shadow-lg transition-transform active:scale-95 disabled:bg-btn-disabled disabled:shadow-none"
                                    >
                                        {isUpdatingStatus ? 'กำลังประมวลผล...' :
                                            isLastPickup ? 'รับคนสุดท้าย' : 'รับขึ้นรถแล้ว'}
                                    </button>
                                )}

                                { }
                                {alreadyPickedUp && (
                                    <div className="w-full py-3 bg-green-50 border-2 border-green-400 text-green-700 rounded-full font-bold text-center">
                                        รับขึ้นรถแล้ว - รอรับคนที่เหลือ ({stillNeedPickup.length} คน)
                                    </div>
                                )}

                                { }
                                {jobStatus === 'IN_TRANSIT' && allPickedUp && (
                                    <button
                                        onClick={onArrivedHospital}
                                        disabled={isUpdatingStatus}
                                        className="w-full py-3 bg-brand-primary text-white rounded-full font-bold hover:bg-btn-hover shadow-lg transition-transform active:scale-95 disabled:bg-btn-disabled disabled:shadow-none"
                                    >
                                        {isUpdatingStatus ? 'กำลังประมวลผล...' : 'ถึงโรงพยาบาลแล้ว'}
                                    </button>
                                )}
                                { }
                                {jobStatus === 'IN_TRANSIT' && !isCarpool && (
                                    <button
                                        onClick={onArrivedHospital}
                                        disabled={isUpdatingStatus}
                                        className="w-full py-3 bg-brand-primary text-white rounded-full font-bold hover:bg-btn-hover shadow-lg transition-transform active:scale-95 disabled:bg-btn-disabled disabled:shadow-none"
                                    >
                                        {isUpdatingStatus ? 'กำลังประมวลผล...' : 'ถึงโรงพยาบาลแล้ว'}
                                    </button>
                                )}

                                { }
                                {jobStatus === 'AT_HOSPITAL' && activeRequest.job?.returnPickupRequestedAt && onPickupFromHospital && (
                                    <button
                                        onClick={onPickupFromHospital}
                                        disabled={isUpdatingStatus}
                                        className="w-full py-3 bg-brand-primary text-white rounded-full font-bold hover:bg-btn-hover shadow-lg transition-transform active:scale-95 disabled:bg-btn-disabled disabled:shadow-none"
                                    >
                                        {isUpdatingStatus ? 'กำลังประมวลผล...' : 'รับขึ้นรถแล้ว (จากรพ.)'}
                                    </button>
                                )}

                                {jobStatus === 'RETURN_HOME' && onDeliveredAtHome && (
                                    <button
                                        onClick={onDeliveredAtHome}
                                        disabled={isUpdatingStatus}
                                        className="w-full py-3 bg-brand-primary text-white rounded-full font-bold hover:bg-btn-hover shadow-lg transition-transform active:scale-95 disabled:bg-btn-disabled disabled:shadow-none"
                                    >
                                        {isUpdatingStatus ? 'กำลังประมวลผล...' : 'ถ่ายรูปยืนยันส่งถึงบ้าน'}
                                    </button>
                                )}

                                {alreadyDroppedOff && onDeliveredAtHome && (
                                    <button
                                        onClick={onDeliveredAtHome}
                                        disabled={isUpdatingStatus}
                                        className="w-full py-3 bg-brand-primary text-white rounded-full font-bold hover:bg-btn-hover shadow-lg transition-transform active:scale-95 disabled:bg-btn-disabled disabled:shadow-none"
                                    >
                                        {isUpdatingStatus ? 'กำลังประมวลผล...' :
                                            (stillNeedDropOff.length === 1 ? 'ถ่ายรูปยืนยันส่งถึงบ้าน' : `ถ่ายรูปส่งคนถัดไป (เหลือ ${stillNeedDropOff.length} คน)`)}
                                    </button>
                                )}
                            </>
                        )}

                        {isCareU && jobStatus === 'AT_PATIENT_HOME' && (
                            <div className="w-full py-3 bg-blue-50 border-2 border-blue-300 text-blue-700 rounded-full font-bold text-center flex items-center justify-center gap-2">
                                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
                                รอคนขับถ่ายรูปยืนยัน
                            </div>
                        )}

                        {isCareU && !['RETURN_OFFICE', 'COMPLETED', 'AT_PATIENT_HOME'].includes(jobStatus) && (
                            <div className="w-full py-3 bg-blue-50 border-2 border-blue-300 text-blue-700 rounded-full font-bold text-center flex items-center justify-center gap-2">
                                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
                                คนขับรถกำลังดำเนินงาน
                            </div>
                        )}

                        { }
                        {isCareU && jobStatus === 'RETURN_OFFICE' && (
                            <div className="w-full py-3 bg-amber-50 border-2 border-amber-300 text-amber-700 rounded-full font-bold text-center flex items-center justify-center gap-2">
                                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></span>
                                {formatReturningToMunicipality(activeRequest.queue.user.organization?.name)}
                            </div>
                        )}

                        { }
                        {jobStatus === 'COMPLETED' && (
                            <div className="text-center p-3 bg-apple-soft text-brand-primary rounded-lg font-bold">
                                ให้บริการเสร็จสิ้นและคืนรถแล้ว
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            { }
            {showProgress && <StepProgress currentStep={getCurrentStep()} />}

            { }
            <div className="mb-6 w-full">
                { }
                {showHeader && (
                    <div className="text-center py-3 border-b-2 border-gray-300 mb-4">
                        <h2 className="text-lg font-bold text-gray-800">ข้อมูลผู้ป่วย</h2>
                    </div>
                )}

                { }
                <div className="bg-white px-4">
                    { }
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4 overflow-hidden border-2 border-gray-200 relative">
                            {activeRequest.queue.user.pictureUrl ? (
                                <Image
                                    src={activeRequest.queue.user.pictureUrl}
                                    alt={displayName}
                                    fill
                                    className="object-cover"
                                    sizes="96px"
                                    unoptimized
                                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                                />
                            ) : null}
                            <svg className={`w-16 h-16 text-gray-400 ${activeRequest.queue.user.pictureUrl ? 'hidden' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-btn-primary">{displayName}</h3>
                    </div>

                    { }
                    <div className="space-y-4 text-base">
                        { }
                        <div className="flex items-center gap-2">
                            <span className="text-gray-700 font-medium">สถานะผู้ป่วย :</span>
                            <span className={`px-4 py-1 rounded-full text-sm font-semibold ${activeRequest.queue.severityLevel === 'RED' ? 'bg-fuan-dark text-white' :
                                activeRequest.queue.severityLevel === 'YELLOW' ? 'bg-saffron-default text-white' :
                                    'bg-brand-primary text-white'
                                }`}>
                                {activeRequest.queue.severityLevel === 'RED' ? 'ต้องดูแลใกล้ชิด' :
                                    activeRequest.queue.severityLevel === 'YELLOW' ? 'ต้องดูแลเพิ่ม' :
                                        'ทั่วไป'}
                            </span>
                        </div>

                        { }
                        <div className="flex items-center gap-2">
                            <span className="text-gray-700 font-medium">เบอร์โทร :</span>
                            {user.phone ? (
                                <button
                                    onClick={async () => {
                                        const result = await Swal.fire({
                                            title: 'โทรหาประชาชน?',
                                            text: `ต้องการโทรหา ${user.phone} หรือไม่?`,
                                            icon: 'question',
                                            showCancelButton: true,
                                            confirmButtonColor: '#1E7D55',
                                            cancelButtonColor: '#6B7280',
                                            confirmButtonText: 'โทร',
                                            cancelButtonText: 'ยกเลิก',
                                        });
                                        if (result.isConfirmed) {
                                            window.location.href = `tel:${user.phone}`;
                                        }
                                    }}
                                    className="flex items-center gap-1.5 text-text-secondary hover:text-brand-primary transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </svg>
                                    <span className="underline text-sm">{user.phone}</span>
                                </button>
                            ) : (
                                <span className="text-gray-400">-</span>
                            )}
                        </div>

                        { }
                        <div className="flex flex-col gap-1 mt-2 mb-2">
                            <span className="text-gray-700 font-medium whitespace-nowrap">โรคประจำตัว :</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {user.diseases?.map((d, index) => (
                                    <span key={index} className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-semibold">
                                        {d.disease.name}
                                    </span>
                                ))}
                                {user.customDiseases?.map((d, index) => (
                                    <span key={`custom-${index}`} className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-semibold">
                                        {d}
                                    </span>
                                ))}
                                {(!user.diseases?.length && !user.customDiseases?.length) && (
                                    <span className="text-gray-500">- ไม่มี -</span>
                                )}
                            </div>
                        </div>

                        { }
                        <div>
                            <span className="text-gray-700 font-medium">ประเภทการจอง : </span>
                            <span className="text-gray-900">{activeRequest.queue.hasAppointment ? 'มีใบนัด' : 'ไม่มีใบนัด'}</span>
                        </div>

                        { }
                        <div>
                            <span className="text-gray-700 font-medium">โรงพยาบาล </span>
                            <span className="text-gray-900">{activeRequest.queue.hospital?.name || activeRequest.queue.hospitalName || '-'}</span>
                        </div>

                        { }
                        <div>
                            <span className="text-gray-700 font-medium">วันที่จอง : </span>
                            <span className="text-gray-900">
                                {new Date(activeRequest.queue.requestDate).toLocaleDateString('th-TH', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </span>
                        </div>

                        { }
                        <div>
                            <span className="text-gray-700 font-medium">ช่วงเวลาที่จอง : </span>
                            <span className="text-gray-900">{activeRequest.queue.bookingTime || '-'}</span>
                        </div>

                        { }
                        {activeRequest.queue.requiredEquipment && (
                            <div>
                                <div className="text-gray-700 font-medium mb-1">อุปกรณ์ที่ต้องการใช้ :</div>
                                <ul className="list-disc list-inside text-gray-900 ml-2">
                                    {activeRequest.queue.requiredEquipment.split(',').map((item, index) => (
                                        <li key={index}>{item.trim()}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            { }

            { }
            {showActions ? (
                <div className="mt-auto pb-4 pt-4 space-y-4 flex flex-col items-center">
                    { }
                    {canUpdateStandardStatus && (
                        <>
                            { }
                            {['ASSIGNED', 'ACCEPTED'].includes(jobStatus) && (
                                canDriverStartJob(activeRequest?.queue?.requestDate, activeRequest?.queue?.bookingTime) ? (
                                    <button
                                        onClick={onStartService}
                                        disabled={isUpdatingStatus}
                                        className="w-full py-4 bg-brand-primary text-white rounded-full font-bold text-lg hover:bg-btn-hover shadow-lg transition-transform active:scale-95 disabled:bg-gray-400 disabled:shadow-none"
                                    >
                                        {isUpdatingStatus ? 'กำลังประมวลผล...' : 'เริ่มเดินทางไปรับ '}
                                    </button>
                                ) : (
                                    <div className="w-full py-4 bg-gray-100 text-gray-500 rounded-full font-bold text-center text-lg">
                                        ยังไม่ถึงกำหนดวันทำงาน
                                    </div>
                                )
                            )}

                            { }
                            {['PICKING_UP'].includes(jobStatus) && (
                                <button
                                    onClick={onPickedUp}
                                    disabled={isUpdatingStatus}
                                    className="w-full py-4 bg-brand-primary text-white rounded-full font-bold text-lg hover:bg-btn-hover shadow-lg transition-transform active:scale-95 disabled:bg-btn-disabled disabled:shadow-none"
                                >
                                    {isUpdatingStatus ? 'กำลังประมวลผล...' :
                                        isLastPickup ? 'คนสุดท้าย - ไปโรงพยาบาล' : 'รับขึ้นรถแล้ว'}
                                </button>
                            )}

                            { }
                            {alreadyPickedUp && (
                                <button
                                    onClick={onPickedUp}
                                    disabled={isUpdatingStatus}
                                    className="w-full py-4 bg-brand-primary text-white rounded-full font-bold text-lg hover:bg-btn-hover shadow-lg transition-transform active:scale-95 disabled:bg-btn-disabled disabled:shadow-none"
                                >
                                    {isUpdatingStatus ? 'กำลังประมวลผล...' :
                                        stillNeedPickup.length === 1 ? 'รับคนสุดท้าย' :
                                            `รับผู้โดยสารคนถัดไป (เหลือ ${stillNeedPickup.length} คน)`}
                                </button>
                            )}

                            { }
                            {jobStatus === 'IN_TRANSIT' && (allPickedUp || !isCarpool) && (
                                <button
                                    onClick={onArrivedHospital}
                                    disabled={isUpdatingStatus}
                                    className="w-full py-4 bg-brand-primary text-white rounded-full font-bold text-lg hover:bg-btn-hover shadow-lg transition-transform active:scale-95 disabled:bg-btn-disabled disabled:shadow-none"
                                >
                                    {isUpdatingStatus ? 'กำลังประมวลผล...' : 'ถึงโรงพยาบาลแล้ว'}
                                </button>
                            )}

                            { }
                            {jobStatus === 'AT_HOSPITAL' && activeRequest.job?.returnPickupRequestedAt && onPickupFromHospital && (
                                <button
                                    onClick={onPickupFromHospital}
                                    disabled={isUpdatingStatus}
                                    className="w-full py-4 bg-brand-primary text-white rounded-full font-bold text-lg hover:bg-btn-hover shadow-lg transition-transform active:scale-95 disabled:bg-btn-disabled disabled:shadow-none"
                                >
                                    {isUpdatingStatus ? 'กำลังประมวลผล...' : 'รับขึ้นรถแล้ว (จากรพ.)'}
                                </button>
                            )}

                            {jobStatus === 'RETURN_HOME' && onDeliveredAtHome && (
                                <button
                                    onClick={onDeliveredAtHome}
                                    disabled={isUpdatingStatus}
                                    className="w-full py-4 bg-brand-primary text-white rounded-full font-bold text-lg hover:bg-btn-hover shadow-lg transition-transform active:scale-95 disabled:bg-btn-disabled disabled:shadow-none"
                                >
                                    {isUpdatingStatus ? 'กำลังประมวลผล...' : 'ถ่ายรูปยืนยันส่งถึงบ้าน'}
                                </button>
                            )}

                            {alreadyDroppedOff && onDeliveredAtHome && (
                                <button
                                    onClick={onDeliveredAtHome}
                                    disabled={isUpdatingStatus}
                                    className="w-full py-4 bg-brand-primary text-white rounded-full font-bold text-lg hover:bg-btn-hover shadow-lg transition-transform active:scale-95 disabled:bg-btn-disabled disabled:shadow-none"
                                >
                                    {isUpdatingStatus ? 'กำลังประมวลผล...' :
                                        (stillNeedDropOff.length === 1 ? 'ถ่ายรูปยืนยันส่งถึงบ้าน' : `ถ่ายรูปส่งคนถัดไป (เหลือ ${stillNeedDropOff.length} คน)`)}
                                </button>
                            )}
                        </>
                    )}

                    {isCareU && jobStatus === 'AT_PATIENT_HOME' && (
                        <div className="w-full py-3 bg-blue-50 border-2 border-blue-300 text-blue-700 rounded-full font-bold text-center flex items-center justify-center gap-2">
                            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
                            รอคนขับถ่ายรูปยืนยัน
                        </div>
                    )}

                    {isCareU && !['RETURN_OFFICE', 'COMPLETED', 'AT_PATIENT_HOME'].includes(jobStatus) && (
                        <div className="w-full py-3 bg-blue-50 border-2 border-blue-300 text-blue-700 rounded-full font-bold text-center flex items-center justify-center gap-2">
                            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
                            คนขับรถกำลังดำเนินงาน
                        </div>
                    )}
                    { }
                    {jobStatus === 'COMPLETED' && (
                        <div className="text-center p-4 bg-apple-soft text-brand-primary rounded-lg font-bold text-xl w-full">
                            ให้บริการเสร็จสิ้นและคืนรถแล้ว
                        </div>
                    )}


                </div>
            ) : !hideStatusBadge && !isCareU ? (
                <div className="mt-auto pb-4 pt-4">
                    {(() => {
                        const statusMeta = JOB_STATUS_CONFIG[jobStatus];
                        const statusLabel = statusMeta?.label ?? jobStatus;
                        const statusStyle = jobStatus === 'COMPLETED' ? 'bg-green-50 border-2 border-green-400 text-green-700' :
                            jobStatus === 'IN_TRANSIT' ? 'bg-blue-50 border-2 border-blue-300 text-blue-700' :
                                jobStatus === 'AT_HOSPITAL' ? 'bg-cyan-50 border-2 border-cyan-300 text-cyan-700' :
                                    jobStatus === 'AT_PATIENT_HOME' ? 'bg-teal-50 border-2 border-teal-300 text-teal-700' :
                                        jobStatus === 'RETURN_HOME' ? 'bg-orange-50 border-2 border-orange-300 text-orange-700' :
                                            jobStatus === 'RETURN_OFFICE' ? 'bg-purple-50 border-2 border-purple-300 text-purple-700' :
                                                'bg-gray-50 border-2 border-gray-300 text-gray-600';
                        return (
                            <div className={`w-full py-3 rounded-full font-bold text-center text-sm ${statusStyle}`}>
                                {statusLabel}
                            </div>
                        );
                    })()}
                </div>
            ) : null}
        </div>
    );
}
