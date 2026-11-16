import React, { useMemo, useState } from 'react';
import { getVehicleTypeName, getFuelTypeName } from '@/utils/jobHelpers';

export interface Vehicle {
    id: number;
    licensePlate: string;
    name: string;
    type: string;
    fuelType: string | null;
    brand: string | null;
    model: string | null;
    capacity: number;
    totalMileageKm: number;
    imageUrl: string | null;
    isActive: boolean;
    status?: 'READY' | 'MAINTENANCE' | 'INACTIVE';
}

interface VehicleSummaryTableProps {
    vehicles: Vehicle[];
    busyVehicleIds?: number[];
}

export default function VehicleSummaryTable({ vehicles, busyVehicleIds }: VehicleSummaryTableProps) {
    const [filter, setFilter] = useState<'all' | 'ready' | 'maintenance' | 'inactive'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const busySet = useMemo(() => new Set(busyVehicleIds ?? []), [busyVehicleIds]);

    const stats = useMemo(() => {
        const inUse = vehicles.filter(v => busySet.has(v.id)).length;
        const ready = vehicles.filter(v => !busySet.has(v.id) && (v.status || (v.isActive ? 'READY' : 'INACTIVE')) === 'READY').length;
        const maintenance = vehicles.filter(v => !busySet.has(v.id) && (v.status || (v.isActive ? 'READY' : 'INACTIVE')) === 'MAINTENANCE').length;
        const inactive = vehicles.filter(v => !busySet.has(v.id) && (v.status || (v.isActive ? 'READY' : 'INACTIVE')) === 'INACTIVE').length;
        return {
            inUse,
            ready,
            maintenance,
            inactive,
        };
    }, [vehicles, busySet]);

    const filteredVehicles = useMemo(() => {
        const getStatus = (v: Vehicle) => {
            if (busySet.has(v.id)) return 'IN_USE';
            return v.status || (v.isActive ? 'READY' : 'INACTIVE');
        };
        let result = vehicles;

        if (filter === 'ready') result = result.filter(v => getStatus(v) === 'READY');
        else if (filter === 'inactive') result = result.filter(v => getStatus(v) === 'INACTIVE');
        else if (filter === 'maintenance') result = result.filter(v => getStatus(v) === 'MAINTENANCE');

        if (searchTerm.trim() !== '') {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(v =>
                v.licensePlate.toLowerCase().includes(lowerSearch) ||
                (v.name && v.name.toLowerCase().includes(lowerSearch))
            );
        }

        return result;
    }, [vehicles, filter, busySet, searchTerm]);

    const getStatusBadge = (vehicle: Vehicle) => {
        const status = vehicle.status || (vehicle.isActive ? 'READY' : 'INACTIVE');
        if (status === 'MAINTENANCE') {
            return {
                label: 'ซ่อมบำรุง',
                className: 'bg-[#E54343] text-white',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <mask id="mask0_vehicle_maint" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                            <rect width="20" height="20" fill="#D9D9D9" />
                        </mask>
                        <g mask="url(#mask0_vehicle_maint)">
                            <path d="M13.1011 14.1316L14.0754 13.1572C14.1533 13.0797 14.1923 12.9893 14.1923 12.886C14.1923 12.7827 14.1533 12.692 14.0754 12.6139L11.0738 9.59954C11.1453 9.44148 11.199 9.27669 11.2348 9.10516C11.2706 8.93363 11.2886 8.74266 11.2886 8.53225C11.2886 7.76919 11.0167 7.11662 10.4729 6.57454C9.92918 6.03245 9.27473 5.76141 8.50959 5.76141C8.37195 5.76141 8.24063 5.76836 8.11563 5.78225C7.9905 5.79613 7.8655 5.82551 7.74063 5.87037C7.62827 5.91523 7.55952 5.99912 7.53438 6.12204C7.50938 6.24481 7.54015 6.34947 7.62668 6.436L9.10418 7.92162L7.87334 9.15245L6.3798 7.66683C6.29327 7.5803 6.18855 7.54961 6.06563 7.57475C5.94286 7.59988 5.85793 7.6694 5.81084 7.78329C5.77557 7.90982 5.74918 8.03634 5.73168 8.16287C5.71404 8.2894 5.70522 8.42107 5.70522 8.55787C5.70522 9.32301 5.97702 9.97745 6.52064 10.5212C7.06438 11.0648 7.71883 11.3366 8.48397 11.3366C8.67994 11.3366 8.86459 11.3174 9.03793 11.2789C9.2114 11.2404 9.38251 11.1881 9.55126 11.122L12.5656 14.1235C12.6437 14.2016 12.7329 14.2419 12.8333 14.2445C12.9338 14.2472 13.023 14.2095 13.1011 14.1316ZM10.0015 17.9168C8.90647 17.9168 7.87723 17.7091 6.91376 17.2935C5.95029 16.8779 5.11223 16.314 4.39959 15.6016C3.68695 14.8893 3.12272 14.0516 2.70689 13.0885C2.29119 12.1254 2.08334 11.0965 2.08334 10.0016C2.08334 8.90662 2.29112 7.87738 2.70668 6.91391C3.12223 5.95044 3.68619 5.11238 4.39855 4.39975C5.11091 3.68711 5.94862 3.12287 6.91168 2.70704C7.87473 2.29134 8.90369 2.0835 9.99855 2.0835C11.0936 2.0835 12.1228 2.29127 13.0863 2.70683C14.0497 3.12238 14.8878 3.68634 15.6004 4.3987C16.3131 5.11107 16.8773 5.94877 17.2931 6.91183C17.7088 7.87489 17.9167 8.90384 17.9167 9.9987C17.9167 11.0937 17.7089 12.1229 17.2933 13.0864C16.8778 14.0499 16.3138 14.8879 15.6015 15.6006C14.8891 16.3132 14.0514 16.8775 13.0883 17.2933C12.1253 17.709 11.0963 17.9168 10.0015 17.9168Z" fill="white" />
                        </g>
                    </svg>
                )
            };
        }
        if (status === 'INACTIVE') {
            return {
                label: 'ไม่พร้อมใช้งาน',
                className: 'bg-[#818181] text-white',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <mask id="mask0_vehicle_inactive" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                            <rect width="20" height="20" fill="#D9D9D9" />
                        </mask>
                        <g mask="url(#mask0_vehicle_inactive)">
                            <path d="M10.4775 13.747C10.6079 13.6166 10.6731 13.4574 10.6731 13.2693C10.6731 13.0813 10.6079 12.9221 10.4775 12.7918C10.3472 12.6616 10.1881 12.5964 10 12.5964C9.81195 12.5964 9.65279 12.6616 9.52251 12.7918C9.39209 12.9221 9.32689 13.0813 9.32689 13.2693C9.32689 13.4574 9.39209 13.6166 9.52251 13.747C9.65279 13.8773 9.81195 13.9425 10 13.9425C10.1881 13.9425 10.3472 13.8773 10.4775 13.747ZM10.4454 10.7179C10.5651 10.5981 10.625 10.4497 10.625 10.2727V6.52266C10.625 6.34558 10.5651 6.19711 10.4452 6.07725C10.3254 5.95752 10.1769 5.89766 9.9998 5.89766C9.82258 5.89766 9.67418 5.95752 9.55459 6.07725C9.43487 6.19711 9.37501 6.34558 9.37501 6.52266V10.2727C9.37501 10.4497 9.43494 10.5981 9.5548 10.7179C9.67466 10.8377 9.82314 10.8977 10.0002 10.8977C10.1774 10.8977 10.3258 10.8377 10.4454 10.7179ZM10.0015 17.9168C8.90647 17.9168 7.87723 17.7091 6.91376 17.2935C5.95029 16.8779 5.11223 16.314 4.39959 15.6016C3.68695 14.8893 3.12272 14.0516 2.70689 13.0885C2.29119 12.1254 2.08334 11.0965 2.08334 10.0016C2.08334 8.90662 2.29112 7.87738 2.70668 6.91391C3.12223 5.95044 3.68619 5.11238 4.39855 4.39975C5.11091 3.68711 5.94862 3.12287 6.91168 2.70704C7.87473 2.29134 8.90369 2.0835 9.99855 2.0835C11.0936 2.0835 12.1228 2.29127 13.0863 2.70683C14.0497 3.12238 14.8878 3.68634 15.6004 4.3987C16.3131 5.11107 16.8773 5.94877 17.2931 6.91183C17.7088 7.87489 17.9167 8.90384 17.9167 9.9987C17.9167 11.0937 17.7089 12.1229 17.2933 13.0864C16.8778 14.0499 16.3138 14.8879 15.6015 15.6006C14.8891 16.3132 14.0514 16.8775 13.0883 17.2933C12.1253 17.709 11.0963 17.9168 10.0015 17.9168Z" fill="white" />
                        </g>
                    </svg>
                )
            };
        }
        return {
            label: 'พร้อมใช้งาน',
            className: 'bg-[#009D12] text-white',
            icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <mask id="mask0_vehicle_ready" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                        <rect width="20" height="20" fill="#D9D9D9" />
                    </mask>
                    <g mask="url(#mask0_vehicle_ready)">
                        <path d="M8.81712 11.7877L6.88129 9.85169C6.76587 9.73641 6.6208 9.67738 6.44608 9.6746C6.27149 9.67197 6.12379 9.73099 6.00295 9.85169C5.88226 9.97252 5.82191 10.1189 5.82191 10.2909C5.82191 10.4628 5.88226 10.6092 6.00295 10.73L8.28983 13.0169C8.44052 13.1675 8.61629 13.2427 8.81712 13.2427C9.01795 13.2427 9.19372 13.1675 9.34441 13.0169L13.9807 8.38065C14.0959 8.26523 14.155 8.12016 14.1577 7.94544C14.1604 7.77085 14.1014 7.62315 13.9807 7.50231C13.8598 7.38162 13.7134 7.32127 13.5415 7.32127C13.3696 7.32127 13.2232 7.38162 13.1023 7.50231L8.81712 11.7877ZM10.0013 17.9159C8.90629 17.9159 7.87705 17.7081 6.91358 17.2925C5.95011 16.877 5.11205 16.313 4.39941 15.6006C3.68677 14.8883 3.12254 14.0506 2.7067 13.0875C2.29101 12.1245 2.08316 11.0955 2.08316 10.0006C2.08316 8.90565 2.29094 7.87641 2.70649 6.91294C3.12205 5.94946 3.68601 5.11141 4.39837 4.39877C5.11073 3.68613 5.94844 3.12189 6.91149 2.70606C7.87455 2.29037 8.90351 2.08252 9.99837 2.08252C11.0934 2.08252 12.1226 2.2903 13.0861 2.70585C14.0496 3.12141 14.8876 3.68537 15.6002 4.39773C16.3129 5.11009 16.8771 5.9478 17.293 6.91085C17.7086 7.87391 17.9165 8.90287 17.9165 9.99773C17.9165 11.0927 17.7087 12.122 17.2932 13.0854C16.8776 14.0489 16.3136 14.887 15.6013 15.5996C14.8889 16.3122 14.0512 16.8765 13.0882 17.2923C12.1251 17.708 11.0961 17.9159 10.0013 17.9159Z" fill="white" />
                    </g>
                </svg>
            )
        };
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-6 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-slate-800">ข้อมูลยานพาหนะ</h2>
                    <div className="text-sm text-slate-400">
                        อัปเดตล่าสุด {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                    <div className="flex items-center justify-between sm:pr-6 pt-4 sm:pt-0">
                        <div>
                            <div className="text-sm font-medium text-slate-800 mb-1">กำลังใช้งาน</div>
                            <div className="text-3xl font-bold text-slate-900">{stats.inUse}</div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask_veh_use" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#D9D9D9"/></mask><g mask="url(#mask_veh_use)"><path d="M4.34625 17.339C3.83975 16.8342 3.5865 16.2212 3.5865 15.5H3.43275C2.93558 15.5 2.51 15.323 2.156 14.969C1.802 14.615 1.625 14.1894 1.625 13.6923V7.31175C1.625 6.81042 1.802 6.38308 2.156 6.02975C2.51 5.67658 2.93558 5.5 3.43275 5.5H15.9345C16.172 5.5 16.3983 5.54417 16.6133 5.6325C16.8284 5.72083 17.0176 5.84592 17.1807 6.00775L21.8385 10.5307C22.009 10.6949 22.141 10.8885 22.2345 11.1115C22.3282 11.3347 22.375 11.5693 22.375 11.8155V13.6923C22.375 14.1894 22.198 14.615 21.844 14.969C21.49 15.323 21.0644 15.5 20.5673 15.5C20.5673 16.2212 20.3141 16.8342 19.8078 17.339C19.3013 17.8437 18.6891 18.096 17.9713 18.096C17.2533 18.096 16.6411 17.8437 16.1348 17.339C15.6283 16.8342 15.375 16.2212 15.375 15.5H8.77875C8.77875 16.2178 8.52558 16.83 8.01925 17.3365C7.51275 17.8428 6.90058 18.096 6.18275 18.096C5.46475 18.096 4.85258 17.8437 4.34625 17.339ZM14.625 10.2885H19.3557L16.0385 7.0865C16.0065 7.06083 15.9728 7.04 15.9375 7.024C15.9022 7.008 15.8653 7 15.827 7H14.625V10.2885ZM8.875 10.2885H13.125V7H8.875V10.2885ZM3.125 10.2885H7.375V7H3.43275C3.34292 7 3.26917 7.02883 3.2115 7.0865C3.15383 7.14417 3.125 7.21792 3.125 7.30775V10.2885ZM7.07025 16.3875C7.31192 16.1458 7.43275 15.85 7.43275 15.5C7.43275 15.15 7.31192 14.8542 7.07025 14.6125C6.82858 14.3708 6.53275 14.25 6.18275 14.25C5.83275 14.25 5.53692 14.3708 5.29525 14.6125C5.05358 14.8542 4.93275 15.15 4.93275 15.5C4.93275 15.85 5.05358 16.1458 5.29525 16.3875C5.53692 16.6292 5.83275 16.75 6.18275 16.75C6.53275 16.75 6.82858 16.6292 7.07025 16.3875ZM18.8587 16.3875C19.1004 16.1458 19.2213 15.85 19.2213 15.5C19.2213 15.15 19.1004 14.8542 18.8587 14.6125C18.6171 14.3708 18.3213 14.25 17.9713 14.25C17.6213 14.25 17.3254 14.3708 17.0837 14.6125C16.8421 14.8542 16.7212 15.15 16.7212 15.5C16.7212 15.85 16.8421 16.1458 17.0837 16.3875C17.3254 16.6292 17.6213 16.75 17.9713 16.75C18.3213 16.75 18.6171 16.6292 18.8587 16.3875ZM8.248 14H15.9057C16.1186 13.7 16.4035 13.4423 16.7605 13.227C17.1177 13.0115 17.5213 12.9037 17.9713 12.9037C18.4213 12.9037 18.8199 13.0067 19.1672 13.2125C19.5147 13.4183 19.8045 13.6808 20.0365 14H20.5673C20.6571 14 20.7308 13.9712 20.7885 13.9135C20.8462 13.8558 20.875 13.7821 20.875 13.6923V11.7885H3.125V13.6923C3.125 13.7821 3.15383 13.8558 3.2115 13.9135C3.26917 13.9712 3.34292 14 3.43275 14H4.11725C4.33008 13.7 4.61508 13.4423 4.97225 13.227C5.32925 13.0115 5.73275 12.9037 6.18275 12.9037C6.63275 12.9037 7.03142 13.0067 7.37875 13.2125C7.72625 13.4183 8.016 13.6808 8.248 14Z" fill="#1C1B1F"/></g></svg>
                        </div>
                    </div>
                    <div className="flex items-center justify-between sm:px-6 pt-4 sm:pt-0">
                        <div>
                            <div className="text-sm font-medium text-slate-800 mb-1">พร้อมใช้งาน</div>
                            <div className="text-3xl font-bold text-slate-900">{stats.ready}</div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask_veh_ready" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#D9D9D9"/></mask><g mask="url(#mask_veh_ready)"><path d="M10.5808 14.1463L8.25775 11.823C8.11925 11.6847 7.94517 11.6138 7.7355 11.6105C7.526 11.6073 7.34875 11.6782 7.20375 11.823C7.05892 11.968 6.9865 12.1437 6.9865 12.35C6.9865 12.5563 7.05892 12.732 7.20375 12.877L9.948 15.6212C10.1288 15.8019 10.3398 15.8923 10.5808 15.8923C10.8218 15.8923 11.0327 15.8019 11.2135 15.6212L16.777 10.0578C16.9153 9.91925 16.9862 9.74517 16.9895 9.5355C16.9927 9.326 16.9218 9.14875 16.777 9.00375C16.632 8.85892 16.4563 8.7865 16.25 8.7865C16.0437 8.7865 15.868 8.85892 15.723 9.00375L10.5808 14.1463ZM12.0017 21.5C10.6877 21.5 9.45267 21.2507 8.2965 20.752C7.14033 20.2533 6.13467 19.5766 5.2795 18.7218C4.42433 17.8669 3.74725 16.8617 3.24825 15.706C2.74942 14.5503 2.5 13.3156 2.5 12.0017C2.5 10.6877 2.74933 9.45267 3.248 8.2965C3.74667 7.14033 4.42342 6.13467 5.27825 5.2795C6.13308 4.42433 7.13833 3.74725 8.294 3.24825C9.44967 2.74942 10.6844 2.5 11.9983 2.5C13.3123 2.5 14.5473 2.74933 15.7035 3.248C16.8597 3.74667 17.8653 4.42342 18.7205 5.27825C19.5757 6.13308 20.2528 7.13833 20.7518 8.294C21.2506 9.44967 21.5 10.6844 21.5 11.9983C21.5 13.3123 21.2507 14.5473 20.752 15.7035C20.2533 16.8597 19.5766 17.8653 18.7218 18.7205C17.8669 19.5757 16.8617 20.2528 15.706 20.7518C14.5503 21.2506 13.3156 21.5 12.0017 21.5ZM12 20C14.2333 20 16.125 19.225 17.675 17.675C19.225 16.125 20 14.2333 20 12C20 9.76667 19.225 7.875 17.675 6.325C16.125 4.775 14.2333 4 12 4C9.76667 4 7.875 4.775 6.325 6.325C4.775 7.875 4 9.76667 4 12C4 14.2333 4.775 16.125 6.325 17.675C7.875 19.225 9.76667 20 12 20Z" fill="#009D12"/></g></svg>
                        </div>
                    </div>
                    <div className="flex items-center justify-between sm:px-6 pt-4 sm:pt-0">
                        <div>
                            <div className="text-sm font-medium text-slate-800 mb-1">ซ่อมบำรุง</div>
                            <div className="text-3xl font-bold text-slate-900">{stats.maintenance}</div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                            <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.2212 14.4578L14.3905 13.2885C14.484 13.1955 14.5307 13.087 14.5307 12.963C14.5307 12.839 14.484 12.7302 14.3905 12.6365L10.7885 9.01925C10.8743 8.82958 10.9388 8.63183 10.9818 8.426C11.0248 8.22017 11.0462 7.991 11.0462 7.7385C11.0462 6.82283 10.72 6.03975 10.0675 5.38925C9.415 4.73875 8.62967 4.4135 7.7115 4.4135C7.54633 4.4135 7.38875 4.42183 7.23875 4.4385C7.08858 4.45517 6.93858 4.49042 6.78875 4.54425C6.65392 4.59808 6.57142 4.69875 6.54125 4.84625C6.51125 4.99358 6.54817 5.11917 6.652 5.223L8.425 7.00575L6.948 8.48275L5.15575 6.7C5.05192 6.59617 4.92625 6.55933 4.77875 6.5895C4.63142 6.61967 4.5295 6.70308 4.473 6.83975C4.43067 6.99158 4.399 7.14342 4.378 7.29525C4.35683 7.44708 4.34625 7.60508 4.34625 7.76925C4.34625 8.68742 4.67242 9.47275 5.32475 10.1253C5.97725 10.7776 6.76258 11.1038 7.68075 11.1038C7.91592 11.1038 8.1375 11.0807 8.3455 11.0345C8.55367 10.9883 8.759 10.9256 8.9615 10.8463L12.5788 14.448C12.6724 14.5417 12.7795 14.5901 12.9 14.5932C13.0205 14.5964 13.1276 14.5513 13.2212 14.4578ZM9.50175 19C8.18775 19 6.95267 18.7507 5.7965 18.252C4.64033 17.7533 3.63467 17.0766 2.7795 16.2218C1.92433 15.3669 1.24725 14.3617 0.74825 13.206C0.249417 12.0503 0 10.8156 0 9.50175C0 8.18775 0.249333 6.95267 0.748 5.7965C1.24667 4.64033 1.92342 3.63467 2.77825 2.7795C3.63308 1.92433 4.63833 1.24725 5.794 0.74825C6.94967 0.249417 8.18442 0 9.49825 0C10.8123 0 12.0473 0.249333 13.2035 0.748C14.3597 1.24667 15.3653 1.92342 16.2205 2.77825C17.0757 3.63308 17.7528 4.63833 18.2518 5.794C18.7506 6.94967 19 8.18442 19 9.49825C19 10.8123 18.7507 12.0473 18.252 13.2035C17.7533 14.3597 17.0766 15.3653 16.2218 16.2205C15.3669 17.0757 14.3617 17.7528 13.206 18.2518C12.0503 18.7506 10.8156 19 9.50175 19ZM9.5 17.5C11.7333 17.5 13.625 16.725 15.175 15.175C16.725 13.625 17.5 11.7333 17.5 9.5C17.5 7.26667 16.725 5.375 15.175 3.825C13.625 2.275 11.7333 1.5 9.5 1.5C7.26667 1.5 5.375 2.275 3.825 3.825C2.275 5.375 1.5 7.26667 1.5 9.5C1.5 11.7333 2.275 13.625 3.825 15.175C5.375 16.725 7.26667 17.5 9.5 17.5Z" fill="#E44343"/></svg>
                        </div>
                    </div>
                    <div className="flex items-center justify-between sm:pl-6 pt-4 sm:pt-0">
                        <div>
                            <div className="text-sm font-medium text-slate-800 mb-1">ไม่พร้อมใช้งาน</div>
                            <div className="text-3xl font-bold text-slate-900">{stats.inactive}</div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818181" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-[700px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="ค้นหาทะเบียนรถ"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 h-[44px] border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-sm text-gray-500 whitespace-nowrap">สถานะ:</span>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="block w-full sm:w-48 pl-3 pr-10 py-3 h-[44px] text-base border border-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-xl bg-white"
                    >
                        <option value="all">ทั้งหมด</option>
                        <option value="ready">พร้อมใช้งาน</option>
                        <option value="maintenance">ซ่อมบำรุง</option>
                        <option value="inactive">ไม่พร้อมใช้งาน</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                        <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                            <tr>
                                <th className="px-4 py-3">ลำดับ</th>
                                <th className="px-4 py-3">ทะเบียนรถ</th>
                                <th className="px-4 py-3">ยี่ห้อ / รุ่น</th>
                                <th className="px-4 py-3">ประเภทรถ</th>
                                <th className="px-4 py-3">เชื้อเพลิง</th>
                                <th className="px-4 py-3 text-center">ความจุ (คน)</th>
                                <th className="px-4 py-3 text-right">เลขไมล์สะสม</th>
                                <th className="px-4 py-3 text-center">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {filteredVehicles.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                                        ไม่พบข้อมูล
                                    </td>
                                </tr>
                            ) : (
                                filteredVehicles.map((vehicle, index) => {
                                    const status = getStatusBadge(vehicle);
                                    return (
                                        <tr key={vehicle.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-4">{index + 1}</td>
                                            <td className="">
                                                <div className="font-semibold text-slate-900">{vehicle.licensePlate}</div>
                                                <div className="text-sm text-slate-500">{vehicle.name}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-semibold text-slate-900">{vehicle.brand || '-'} {vehicle.model || ''}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-semibold text-slate-900">{getVehicleTypeName(vehicle.type)}</div>
                                            </td>
                                            <td className="px-4 py-4 text-slate-600">{getFuelTypeName(vehicle.fuelType)}</td>
                                            <td className="px-4 py-4 text-center text-slate-600">{vehicle.capacity}</td>
                                            <td className="px-4 py-4 text-slate-600 text-right">{vehicle.totalMileageKm.toLocaleString(undefined, { maximumFractionDigits: 0 })} กม.</td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-center">
                                                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>
                                                        {status.icon && (
                                                            <span className="flex h-5 w-5 items-center justify-center rounded-full">
                                                                {status.icon}
                                                            </span>
                                                        )}
                                                        {status.label}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
