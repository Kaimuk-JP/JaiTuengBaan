'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket, Notification } from '@/contexts/SocketContext';
import axios from '@/lib/api-client';
import Swal from '@/lib/swal';
import VehicleModal from './VehicleModal';
import MileageLogsModal from './MileageLogsModal';

export interface Vehicle {
    id: number;
    licensePlate: string;
    name: string;
    type: string;
    fuelType: string | null;
    brand: string | null;
    model: string | null;
    color: string | null;
    capacity: number;
    totalMileageKm: number;
    imageUrl: string | null;
    isActive: boolean;
    status?: 'READY' | 'MAINTENANCE' | 'INACTIVE';
}

export default function VehiclesClient() {
    const { socket } = useSocket();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [busyVehicleIds, setBusyVehicleIds] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'maintenance' | 'inactive'>('all');

    const ACTIVE_JOB_STATUSES = new Set([
        'ACCEPTED',
        'PICKING_UP',
        'IN_TRANSIT',
        'RETURN_HOME',
        'RETURN_OFFICE',
    ]);

    const getQueueJobStatus = (queue: any) => queue?.job?.status || queue?.status;
    const isActiveJob = (queue: any) => ACTIVE_JOB_STATUSES.has(getQueueJobStatus(queue));

    const fetchVehicles = useCallback(async () => {
        try {
            setIsLoading(true);
            const [vehiclesRes, queuesRes] = await Promise.all([
                axios.get('/vehicles'),
                axios.get('/queues'),
            ]);

            const vehiclesData = vehiclesRes.data;
            setVehicles(Array.isArray(vehiclesData) ? vehiclesData : (vehiclesData?.data ?? []));

            const queuesData = queuesRes.data;
            const queues = Array.isArray(queuesData) ? queuesData : (queuesData?.data ?? []);
            const activeJobs = queues.filter((q: any) => isActiveJob(q));
            const busyIds = new Set<number>();

            activeJobs.forEach((q: any) => {
                const vehicleId = q.job?.vehicleId ?? q.vehicleId ?? q.job?.vehicle?.id;
                if (typeof vehicleId === 'number') busyIds.add(vehicleId);
            });

            setBusyVehicleIds(busyIds);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    useEffect(() => {
        if (!socket) return;

        const handleNotification = (notification: Notification) => {
            fetchVehicles();
        };

        const handleRefresh = () => {
            fetchVehicles();
        };

        socket.on('notification', handleNotification);
        socket.on('refresh_vehicles', handleRefresh);

        return () => {
            socket.off('notification', handleNotification);
            socket.off('refresh_vehicles', handleRefresh);
        };
    }, [socket, fetchVehicles]);

    const handleCreate = () => {
        setSelectedVehicle(null);
        setIsModalOpen(true);
    };

    const handleEdit = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setIsModalOpen(true);
    };

    const handleViewLogs = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setIsLogsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "คุณต้องการปิดใช้งานรถคันนี้ใช่หรือไม่ (ประวัติการใช้งานจะไม่ถูกลบ)",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ลบข้อมูล',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`/vehicles/${id}`);
                Swal.fire({
                    title: 'สำเร็จ!',
                    text: 'ลบข้อมูลเรียบร้อยแล้ว',
                    icon: 'success'
                });
                fetchVehicles();
            } catch (error) {
                console.error('Error deleting vehicle:', error);
                Swal.fire({
                    title: 'ข้อผิดพลาด',
                    text: 'ไม่สามารถลบข้อมูลได้',
                    icon: 'error'
                });
            }
        }
    };

    const getEffectiveStatus = (vehicle: Vehicle) => {
        if (busyVehicleIds.has(vehicle.id)) return 'IN_USE';
        return vehicle.status || (vehicle.isActive ? 'READY' : 'INACTIVE');
    };

    const filteredVehicles = vehicles.filter(v => {
        if (statusFilter === 'ready' && getEffectiveStatus(v) !== 'READY') return false;
        if (statusFilter === 'maintenance' && getEffectiveStatus(v) !== 'MAINTENANCE') return false;
        if (statusFilter === 'inactive' && getEffectiveStatus(v) !== 'INACTIVE') return false;

        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            return v.licensePlate.toLowerCase().includes(q) || (v.name && v.name.toLowerCase().includes(q));
        }
        return true;
    });

    const getVehicleTypeName = (type: string) => {
        return type || '-';
    };

    const getFuelTypeName = (type: string | null) => {
        if (!type) return '-';
        switch (type) {
            case 'BENZENE': return 'เบนซิน';
            case 'GASOHOL_91': return 'แก๊สโซฮอล์ 91';
            case 'GASOHOL_95': return 'แก๊สโซฮอล์ 95';
            case 'GASOHOL_E20': return 'แก๊สโซฮอล์ E20';
            case 'GASOHOL_E85': return 'แก๊สโซฮอล์ E85';
            case 'DIESEL': return 'ดีเซล';
            case 'ELECTRIC': return 'ไฟฟ้า (EV)';
            default: return type;
        }
    };

    const getStatusBadge = (vehicle: Vehicle) => {
        if (busyVehicleIds.has(vehicle.id)) {
            return { label: 'กำลังใช้งาน', className: 'bg-blue-100 text-blue-700' };
        }
        const status = vehicle.status || (vehicle.isActive ? 'READY' : 'INACTIVE');
        if (status === 'MAINTENANCE') {
            return {
                label: 'ซ่อมบำรุง',
                className: 'bg-[#E54343] text-white',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <mask id="mask0_vehicle_maint_list" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                            <rect width="20" height="20" fill="#D9D9D9" />
                        </mask>
                        <g mask="url(#mask0_vehicle_maint_list)">
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
                        <mask id="mask0_vehicle_inactive_list" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                            <rect width="20" height="20" fill="#D9D9D9" />
                        </mask>
                        <g mask="url(#mask0_vehicle_inactive_list)">
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
                    <mask id="mask0_vehicle_ready_list" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                        <rect width="20" height="20" fill="#D9D9D9" />
                    </mask>
                    <g mask="url(#mask0_vehicle_ready_list)">
                        <path d="M8.81712 11.7877L6.88129 9.85169C6.76587 9.73641 6.6208 9.67738 6.44608 9.6746C6.27149 9.67197 6.12379 9.73099 6.00295 9.85169C5.88226 9.97252 5.82191 10.1189 5.82191 10.2909C5.82191 10.4628 5.88226 10.6092 6.00295 10.73L8.28983 13.0169C8.44052 13.1675 8.61629 13.2427 8.81712 13.2427C9.01795 13.2427 9.19372 13.1675 9.34441 13.0169L13.9807 8.38065C14.0959 8.26523 14.155 8.12016 14.1577 7.94544C14.1604 7.77085 14.1014 7.62315 13.9807 7.50231C13.8598 7.38162 13.7134 7.32127 13.5415 7.32127C13.3696 7.32127 13.2232 7.38162 13.1023 7.50231L8.81712 11.7877ZM10.0013 17.9159C8.90629 17.9159 7.87705 17.7081 6.91358 17.2925C5.95011 16.877 5.11205 16.313 4.39941 15.6006C3.68677 14.8883 3.12254 14.0506 2.7067 13.0875C2.29101 12.1245 2.08316 11.0955 2.08316 10.0006C2.08316 8.90565 2.29094 7.87641 2.70649 6.91294C3.12205 5.94946 3.68601 5.11141 4.39837 4.39877C5.11073 3.68613 5.94844 3.12189 6.91149 2.70606C7.87455 2.29037 8.90351 2.08252 9.99837 2.08252C11.0934 2.08252 12.1226 2.2903 13.0861 2.70585C14.0496 3.12141 14.8876 3.68537 15.6002 4.39773C16.3129 5.11009 16.8771 5.9478 17.293 6.91085C17.7086 7.87391 17.9165 8.90287 17.9165 9.99773C17.9165 11.0927 17.7087 12.122 17.2932 13.0854C16.8776 14.0489 16.3136 14.887 15.6013 15.5996C14.8889 16.3122 14.0512 16.8765 13.0882 17.2923C12.1251 17.708 11.0961 17.9159 10.0013 17.9159Z" fill="white" />
                    </g>
                </svg>
            )
        };
    };

    const totalCount = vehicles.length;
    const readyCount = vehicles.filter(v => getEffectiveStatus(v) === 'READY').length;
    const maintenanceCount = vehicles.filter(v => getEffectiveStatus(v) === 'MAINTENANCE').length;
    const inactiveCount = vehicles.filter(v => getEffectiveStatus(v) === 'INACTIVE').length;

    return (
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
            {}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">จัดการข้อมูลรถเทศบาล</h2>
                    <p className="text-sm text-gray-500 mt-1">ของหน่วยงานรับสมัครอาสาสมัคร</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-btn-hover transition-colors font-medium shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    เพิ่มข้อมูลรถ
                </button>
            </div>

            {}
            <div className="border border-gray-200 dark:border-slate-700 rounded-2xl p-4 flex items-center divide-x divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {}
                <div className="flex items-center gap-3 flex-1 px-4 first:pl-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-white to-gray-50 dark:from-slate-700 dark:to-slate-800 border border-gray-200 dark:border-slate-600 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <mask id="mask_stat_all" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#D9D9D9"/></mask>
                            <g mask="url(#mask_stat_all)">
                                <path d="M3.346 15.339C2.84 14.834 2.587 14.221 2.587 13.5H2.433C1.936 13.5 1.51 13.323 1.156 12.969C0.802 12.615 0.625 12.189 0.625 11.692V5.312C0.625 4.81 0.802 4.383 1.156 4.03C1.51 3.677 1.936 3.5 2.433 3.5H14.935C15.172 3.5 15.398 3.544 15.613 3.633C15.828 3.721 16.018 3.846 16.181 4.008L20.838 8.531C21.009 8.695 21.141 8.889 21.235 9.112C21.328 9.335 21.375 9.569 21.375 9.816V11.692C21.375 12.189 21.198 12.615 20.844 12.969C20.49 13.323 20.064 13.5 19.567 13.5C19.567 14.221 19.314 14.834 18.808 15.339C18.301 15.844 17.689 16.096 16.971 16.096C16.253 16.096 15.641 15.844 15.135 15.339C14.628 14.834 14.375 14.221 14.375 13.5H7.779C7.779 14.218 7.526 14.83 7.019 15.337C6.513 15.843 5.901 16.096 5.183 16.096C4.465 16.096 3.853 15.844 3.346 15.339ZM13.625 8.289H18.356L15.038 5.087C15.007 5.061 14.973 5.04 14.938 5.024C14.902 5.008 14.865 5 14.827 5H13.625V8.289ZM7.875 8.289H12.125V5H7.875V8.289ZM2.125 8.289H6.375V5H2.433C2.343 5 2.269 5.029 2.212 5.087C2.154 5.144 2.125 5.218 2.125 5.308V8.289ZM6.07 14.387C6.312 14.146 6.433 13.85 6.433 13.5C6.433 13.15 6.312 12.854 6.07 12.613C5.829 12.371 5.533 12.25 5.183 12.25C4.833 12.25 4.537 12.371 4.295 12.613C4.054 12.854 3.933 13.15 3.933 13.5C3.933 13.85 4.054 14.146 4.295 14.387C4.537 14.629 4.833 14.75 5.183 14.75C5.533 14.75 5.829 14.629 6.07 14.387ZM17.859 14.387C18.1 14.146 18.221 13.85 18.221 13.5C18.221 13.15 18.1 12.854 17.859 12.613C17.617 12.371 17.321 12.25 16.971 12.25C16.621 12.25 16.325 12.371 16.084 12.613C15.842 12.854 15.721 13.15 15.721 13.5C15.721 13.85 15.842 14.146 16.084 14.387C16.325 14.629 16.621 14.75 16.971 14.75C17.321 14.75 17.617 14.629 17.859 14.387ZM7.248 12H14.906C15.119 11.7 15.403 11.442 15.76 11.227C16.118 11.012 16.521 10.904 16.971 10.904C17.421 10.904 17.82 11.007 18.167 11.213C18.515 11.418 18.805 11.681 19.037 12H19.567C19.657 12 19.731 11.971 19.788 11.914C19.846 11.856 19.875 11.782 19.875 11.692V9.789H2.125V11.692C2.125 11.782 2.154 11.856 2.212 11.914C2.269 11.971 2.343 12 2.433 12H3.117C3.33 11.7 3.615 11.442 3.972 11.227C4.329 11.012 4.733 10.904 5.183 10.904C5.633 10.904 6.031 11.007 6.379 11.213C6.726 11.418 7.016 11.681 7.248 12Z" fill="#1C1B1F"/>
                            </g>
                        </svg>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">รถทั้งหมด</div>
                        <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
                    </div>
                </div>
                {}
                <div className="flex items-center gap-3 flex-1 px-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-white to-green-50 dark:from-green-900/40 dark:to-green-900/20 border border-gray-200 dark:border-green-800/50 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><mask id="mask_stat_ready" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20"><rect width="20" height="20" fill="#D9D9D9"/></mask><g mask="url(#mask_stat_ready)"><path d="M8.817 11.788L6.881 9.852C6.766 9.736 6.621 9.677 6.446 9.675C6.271 9.672 6.124 9.731 6.003 9.852C5.882 9.973 5.822 10.119 5.822 10.291C5.822 10.463 5.882 10.609 6.003 10.73L8.29 13.017C8.441 13.168 8.616 13.243 8.817 13.243C9.018 13.243 9.194 13.168 9.344 13.017L13.981 8.381C14.096 8.265 14.155 8.12 14.158 7.945C14.16 7.771 14.101 7.623 13.981 7.502C13.86 7.382 13.713 7.321 13.542 7.321C13.37 7.321 13.223 7.382 13.102 7.502L8.817 11.788ZM10.001 17.916C8.906 17.916 7.877 17.708 6.914 17.293C5.95 16.877 5.112 16.313 4.399 15.601C3.687 14.888 3.123 14.051 2.707 13.088C2.291 12.125 2.083 11.096 2.083 10.001C2.083 8.906 2.291 7.877 2.707 6.914C3.122 5.949 3.686 5.111 4.398 4.399C5.111 3.686 5.949 3.122 6.912 2.706C7.875 2.29 8.904 2.083 9.999 2.083C11.094 2.083 12.123 2.29 13.086 2.706C14.05 3.121 14.888 3.685 15.6 4.398C16.313 5.11 16.877 5.948 17.293 6.911C17.709 7.875 17.917 8.904 17.917 9.999C17.917 11.093 17.709 12.122 17.293 13.085C16.878 14.049 16.314 14.887 15.601 15.6C14.889 16.312 14.051 16.877 13.088 17.292C12.125 17.708 11.096 17.916 10.001 17.916Z" fill="#009D12"/></g></svg>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">พร้อมใช้งาน</div>
                        <div className="text-2xl font-bold text-gray-900">{readyCount}</div>
                    </div>
                </div>
                {}
                <div className="flex items-center gap-3 flex-1 px-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-white to-red-50 dark:from-red-900/40 dark:to-red-900/20 border border-gray-200 dark:border-red-800/50 flex items-center justify-center">
                        <svg width="19" height="19" viewBox="0 0 19 19" fill="none"><path d="M13.221 14.458L14.391 13.289C14.484 13.196 14.531 13.087 14.531 12.963C14.531 12.839 14.484 12.73 14.391 12.637L10.789 9.019C10.874 8.83 10.939 8.632 10.982 8.426C11.025 8.22 11.046 7.991 11.046 7.739C11.046 6.823 10.72 6.04 10.068 5.389C9.415 4.739 8.63 4.414 7.712 4.414C7.546 4.414 7.389 4.422 7.239 4.439C7.089 4.455 6.939 4.49 6.789 4.544C6.654 4.598 6.571 4.699 6.541 4.846C6.511 4.994 6.548 5.119 6.652 5.223L8.425 7.006L6.948 8.483L5.156 6.7C5.052 6.596 4.926 6.559 4.779 6.59C4.631 6.62 4.53 6.703 4.473 6.84C4.431 6.992 4.399 7.143 4.378 7.295C4.357 7.447 4.346 7.605 4.346 7.769C4.346 8.687 4.672 9.473 5.325 10.125C5.977 10.778 6.763 11.104 7.681 11.104C7.916 11.104 8.138 11.081 8.346 11.035C8.554 10.988 8.759 10.926 8.962 10.846L12.566 14.448C12.659 14.542 12.767 14.59 12.888 14.593C13.008 14.596 13.115 14.551 13.221 14.458Z" fill="#E44343"/><circle cx="9.5" cy="9.5" r="9" stroke="#E44343"/></svg>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">ซ่อมบำรุง</div>
                        <div className="text-2xl font-bold text-gray-900">{maintenanceCount}</div>
                    </div>
                </div>
                {}
                <div className="flex items-center gap-3 flex-1 px-4 last:pr-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-white to-gray-100 dark:from-slate-700 dark:to-slate-800 border border-gray-200 dark:border-slate-600 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><mask id="mask_stat_inactive" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20"><rect width="20" height="20" fill="#D9D9D9"/></mask><g mask="url(#mask_stat_inactive)"><path d="M10.478 13.747C10.608 13.617 10.673 13.457 10.673 13.269C10.673 13.081 10.608 12.922 10.478 12.792C10.347 12.662 10.188 12.596 10 12.596C9.812 12.596 9.653 12.662 9.523 12.792C9.392 12.922 9.327 13.081 9.327 13.269C9.327 13.457 9.392 13.617 9.523 13.747C9.653 13.877 9.812 13.943 10 13.943C10.188 13.943 10.347 13.877 10.478 13.747ZM10.445 10.718C10.565 10.598 10.625 10.45 10.625 10.273V6.523C10.625 6.346 10.565 6.197 10.445 6.077C10.325 5.958 10.177 5.898 10 5.898C9.823 5.898 9.674 5.958 9.555 6.077C9.435 6.197 9.375 6.346 9.375 6.523V10.273C9.375 10.45 9.435 10.598 9.555 10.718C9.675 10.838 9.823 10.898 10 10.898C10.177 10.898 10.326 10.838 10.445 10.718ZM10.001 17.917C8.906 17.917 7.877 17.709 6.914 17.293C5.95 16.878 5.112 16.314 4.4 15.602C3.687 14.889 3.123 14.052 2.707 13.088C2.291 12.125 2.083 11.096 2.083 10.002C2.083 8.907 2.291 7.877 2.707 6.914C3.122 5.95 3.686 5.112 4.399 4.4C5.111 3.687 5.949 3.123 6.912 2.707C7.875 2.291 8.904 2.083 9.999 2.083C11.094 2.083 12.123 2.291 13.086 2.707C14.05 3.122 14.888 3.686 15.6 4.399C16.313 5.111 16.877 5.948 17.293 6.912C17.709 7.875 17.917 8.904 17.917 9.999C17.917 11.094 17.709 12.123 17.293 13.086C16.878 14.05 16.314 14.888 15.601 15.601C14.889 16.313 14.051 16.877 13.088 17.293C12.125 17.709 11.096 17.917 10.001 17.917Z" fill="#818181"/></g></svg>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">ไม่พร้อมใช้งาน</div>
                        <div className="text-2xl font-bold text-gray-900">{inactiveCount}</div>
                    </div>
                </div>
            </div>

            {}
            <div className="flex items-center gap-4">
                {}
                <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-xl h-[44px] overflow-hidden bg-white dark:bg-slate-800 flex-1">
                    <div className="pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="ค้นหาทะเบียนรถ"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 h-full pl-2 pr-3 bg-transparent placeholder-gray-400 focus:outline-none text-sm"
                    />
                </div>
                {}
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl h-[44px] px-3 bg-white">
                    <span className="text-sm text-gray-500 whitespace-nowrap">สถานะ:</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="bg-transparent text-sm font-semibold text-gray-800 focus:outline-none cursor-pointer appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right center', paddingRight: '18px' }}
                    >
                        <option value="all">ทั้งหมด</option>
                        <option value="ready">พร้อมใช้งาน</option>
                        <option value="maintenance">ซ่อมบำรุง</option>
                        <option value="inactive">ไม่พร้อมใช้งาน</option>
                    </select>
                </div>
            </div>

            {}
            <div className="border border-gray-200 rounded-xl overflow-x-auto">
                <table className="w-full border-collapse">
                    <colgroup>
                        <col style={{ width: '5%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '16%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '10%' }} />
                    </colgroup>
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                            <th className="px-4 py-3 font-semibold text-center">ลำดับ</th>
                            <th className="px-4 py-3 font-semibold text-left">ทะเบียนรถ</th>
                            <th className="px-4 py-3 font-semibold text-left">ยี่ห้อ / รุ่น</th>
                            <th className="px-4 py-3 font-semibold text-left">ประเภทรถ</th>
                            <th className="px-4 py-3 font-semibold text-left">เชื้อเพลิง</th>
                            <th className="px-4 py-3 font-semibold text-center">ความจุ (คน)</th>
                            <th className="px-4 py-3 font-semibold text-right">เลขไมล์สะสม</th>
                            <th className="px-4 py-3 font-semibold text-center">สถานะ</th>
                            <th className="px-4 py-3 font-semibold text-center">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                                        กำลังโหลดข้อมูล...
                                    </div>
                                </td>
                            </tr>
                        ) : vehicles.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                    ยังไม่มีข้อมูลรถในระบบ
                                </td>
                            </tr>
                        ) : (
                            filteredVehicles.map((vehicle, index) => (
                                <tr key={vehicle.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 text-center text-gray-700 font-medium">{index + 1}</td>
                                    <td className="px-4 py-3 text-left">
                                        <div className="font-semibold text-gray-900">{vehicle.licensePlate}</div>
                                        <div className="text-sm text-gray-500">{vehicle.name}</div>
                                    </td>
                                    <td className="px-4 py-3 text-left">
                                        <span className="font-semibold text-gray-900">{vehicle.brand || '-'} {vehicle.model || ''}</span>
                                    </td>
                                    <td className="px-4 py-3 text-left">
                                        <span className="font-semibold text-gray-900">{getVehicleTypeName(vehicle.type)}</span>
                                    </td>
                                    <td className="px-4 py-3 text-left text-gray-500">
                                        {getFuelTypeName(vehicle.fuelType)}
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-500">
                                        {vehicle.capacity}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">
                                        {vehicle.totalMileageKm.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} กม.
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {(() => {
                                            const status = getStatusBadge(vehicle);
                                            return (
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${status.className}`}>
                                                    {status.icon && (
                                                        <span className="flex h-5 w-5 items-center justify-center rounded-full">
                                                            {status.icon}
                                                        </span>
                                                    )}
                                                    {status.label}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="inline-flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(vehicle)}
                                                className="p-1.5 text-gray-500 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
                                                title="แก้ไข"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(vehicle.id)}
                                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="ลบ"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path>
                                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <VehicleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                vehicle={selectedVehicle}
                onSuccess={fetchVehicles}
            />

            <MileageLogsModal
                isOpen={isLogsModalOpen}
                onClose={() => setIsLogsModalOpen(false)}
                vehicle={selectedVehicle}
            />
        </div>
    );
}
