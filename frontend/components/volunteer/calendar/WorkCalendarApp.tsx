'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { getApiUrl } from '@/lib/api';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import Swal from '@/lib/swal';
import { getRoundGroup, getBangkokDateKey, getVolunteerJobStatusDisplay, canDriverStartJob, formatVehicleInfo } from '@/utils/jobHelpers';
import { getImageUrl } from '@/utils/image';
import { fetchWithAuth } from '@/lib/auth';


const ChevronLeftIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const ChevronRightIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const UserIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const LoadingSpinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export interface Task {
  id: number;
  date: string;
  hasAppointment: boolean;
  statusLabel: string;
  name: string;
  phone?: string;
  hospital: string;
  bookingDate: string;
  bookingTime?: string;
  badge: string;
  badgeColor: string;
  jobStatus: string;
  pictureUrl?: string;
  requiredEquipment?: string[];
  diseases?: string[];
  hasCareU?: boolean;
  careuName?: string;
  careuPhone?: string;
  careuPictureUrl?: string;
  vehicleInfo?: string;
  driverName?: string;
  driverPhone?: string;
  driverPictureUrl?: string;
  patientDroppedOffAt?: string;
  returnEvidenceUrl?: string;
  returnPickupRequestedAt?: string | null;
}

interface GroupedTask {
  id: string;
  hospital: string;
  bookingTime: string;
  tasks: Task[];
  jobStatus: string;
  statusLabel: string;
}

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

interface CalendarWidgetProps {
  currentDate: Date;
  onMonthChange: (direction: 'prev' | 'next') => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  tasks: Task[];
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  currentDate,
  onMonthChange,
  selectedDate,
  onDateSelect,
  tasks
}) => {
  const daysOfWeek = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const taskDates = useMemo(() => {
    const dateMap = new Map<number, boolean>();

    tasks.forEach(t => {
      if (!t.date) return;
      const [tYear, tMonth, tDay] = t.date.split('-').map(Number);
      if (tMonth - 1 === month && tYear === year) {
        const day = tDay;
        const isActive = t.jobStatus !== 'COMPLETED' && t.jobStatus !== 'CANCELLED' && t.jobStatus !== 'REJECTED';

        if (isActive) {
          dateMap.set(day, true);
        } else if (!dateMap.has(day)) {
          dateMap.set(day, false);
        }
      }
    });
    return dateMap;
  }, [tasks, month, year]);

  const renderDays = () => {
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate.getDate() === day &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year;

      const hasTask = taskDates.has(day);
      const hasActiveTask = taskDates.get(day);

      let className = "relative w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all cursor-pointer ";

      if (hasTask && hasActiveTask) {
        className += "bg-[#66BB6A] text-white shadow-md ";
        if (isSelected) {
          className += "ring-2 ring-offset-2 ring-[#1B5E20] scale-110 ";
        }
      } else {
        if (isSelected) {
          className += "bg-fuji-soft text-text-primary scale-110 ";
        } else {
          className += "text-[#060D26] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 ";
        }
      }

      days.push(
        <button
          key={day}
          onClick={() => onDateSelect(new Date(year, month, day))}
          className={className}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 w-full max-w-xs">
      { }
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => onMonthChange('prev')}
          className="p-1 text-text-placeholder hover:text-[#060D26] dark:hover:text-white transition-colors hover:bg-fuji-light dark:hover:bg-slate-700 rounded-full"
        >
          <ChevronLeftIcon size={20} />
        </button>
        <h2 className="text-base font-bold text-text-tertiary dark:text-white">
          {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={() => onMonthChange('next')}
          className="p-1 text-text-placeholder hover:text-[#060D26] dark:hover:text-white transition-colors hover:bg-fuji-light dark:hover:bg-slate-700 rounded-full"
        >
          <ChevronRightIcon size={20} />
        </button>
      </div>

      { }
      <div className="grid grid-cols-7 text-center mb-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-xs font-semibold text-text-placeholder dark:text-gray-400 uppercase">
            {day}
          </div>
        ))}
      </div>

      { }
      <div className="grid grid-cols-7 text-center gap-y-4 gap-x-1 justify-items-center">
        {renderDays()}
      </div>
    </div>
  );
};

export { getRoundGroup } from '@/utils/jobHelpers';

interface GroupedTaskCardProps {
  groupedTask: GroupedTask;
  onActionClick: (tasks: Task[], action: 'accept' | 'complete' | 'continue') => void;
  onCancelClick?: (tasks: Task[]) => void;
  isProcessing?: boolean;
  isCareU?: boolean;
}

const GroupedTaskCard: React.FC<GroupedTaskCardProps> = ({
  groupedTask,
  onActionClick,
  onCancelClick,
  isProcessing = false,
  isCareU = false,
}) => {
  const { tasks, jobStatus } = groupedTask;

  const getStatusDisplay = (status: string, returnPickupRequestedAt?: string | null) =>
    getVolunteerJobStatusDisplay(status, returnPickupRequestedAt);

  const statusDisplay = (() => {
    if (jobStatus === 'AT_HOSPITAL') {
      const anyRequested = tasks.some((t) => t.returnPickupRequestedAt);
      const allRequested = tasks.every((t) => t.returnPickupRequestedAt);
      if (anyRequested && !allRequested) {
        return { label: 'อยู่ที่รพ. — บางคนเรียกรถกลับแล้ว', color: 'bg-amber-50 text-amber-700' };
      }
      return getStatusDisplay(
        jobStatus,
        tasks.find((t) => t.returnPickupRequestedAt)?.returnPickupRequestedAt
      );
    }
    return getStatusDisplay(jobStatus);
  })();
  const isCompleted = jobStatus === 'COMPLETED' || jobStatus === 'REJECTED' || jobStatus === 'CANCELLED';
  const isInProgress = ['ACCEPTED', 'PICKING_UP', 'IN_TRANSIT', 'AT_HOSPITAL', 'AT_PATIENT_HOME', 'RETURN_HOME', 'RETURN_OFFICE'].includes(jobStatus);

  return (
    <div className="w-full animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-4 flex flex-col gap-3 border border-gray-100 dark:border-slate-700 transition-transform hover:scale-[1.02] duration-200">

        <div className="flex justify-between items-start border-b border-gray-100 dark:border-slate-700 pb-3 gap-2">
          <div>
            <p className="font-bold text-[#060D26] dark:text-white">
              {groupedTask.hospital !== '-' ? groupedTask.hospital : 'ไม่ระบุโรงพยาบาล'}
            </p>
            <p className="text-sm text-gray-500 mt-1">เวลาจอง: {groupedTask.bookingTime || '-'}</p>
          </div>
          <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${statusDisplay.color}`}>
            {statusDisplay.label}
          </span>
        </div>

        { }
        <div className="flex flex-col gap-3 mt-1">
          {tasks.map((task, index) => (
            <div key={task.id} className={`flex flex-col gap-2 ${index !== tasks.length - 1 ? 'border-b border-gray-50 pb-3' : ''}`}>
              <div className="flex gap-4">
                { }
                <div className="flex flex-col items-center space-y-2 min-w-[60px]">
                  <div className="w-14 h-14 bg-[#E3F2FD] dark:bg-slate-700 rounded-xl flex items-center justify-center text-black dark:text-white overflow-hidden relative shadow-sm">
                    {task.pictureUrl ? (
                      <Image
                        src={getImageUrl(task.pictureUrl)}
                        alt={task.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                        unoptimized
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                      />
                    ) : null}
                    <UserIcon size={28} className={`text-[#94A3B8] ${task.pictureUrl ? 'hidden' : ''}`} />
                  </div>
                </div>

                { }
                <div className="flex-1 flex flex-col justify-center">
                  <div className="text-sm space-y-1">
                    <div className="flex gap-2 items-start">
                      <span className="text-[#060D26] dark:text-gray-200 font-medium min-w-[70px] shrink-0">ชื่อ - สกุล:</span>
                      <span className="text-[#060D26] dark:text-gray-100 font-medium">{task.name}</span>
                    </div>
                    {(task.jobStatus === 'AT_HOSPITAL' || task.returnPickupRequestedAt) && (
                      <div className="flex gap-2 items-center">
                        <span className="text-[#060D26] dark:text-gray-200 font-medium min-w-[70px] shrink-0">สถานะ:</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getVolunteerJobStatusDisplay(task.jobStatus, task.returnPickupRequestedAt).color}`}>
                          {getVolunteerJobStatusDisplay(task.jobStatus, task.returnPickupRequestedAt).label}
                        </span>
                      </div>
                    )}

                    { }
                    <div className="flex gap-2 items-center">
                      <span className="text-[#060D26] dark:text-gray-200 font-medium min-w-[70px]">เบอร์โทร:</span>
                      {task.phone ? (
                        <button
                          onClick={async () => {
                            const result = await Swal.fire({
                              title: 'โทรหาประชาชน?',
                              text: `ต้องการโทรหา ${task.phone} หรือไม่?`,
                              icon: 'question',
                              showCancelButton: true,
                              confirmButtonColor: '#1E7D55',
                              cancelButtonColor: '#6B7280',
                              confirmButtonText: 'โทร',
                              cancelButtonText: 'ยกเลิก',
                            });
                            if (result.isConfirmed) {
                              window.location.href = `tel:${task.phone}`;
                            }
                          }}
                          className="flex items-center gap-1.5 text-brand-primary font-medium hover:text-brand-secondary transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          <span className="underline text-sm">{task.phone}</span>
                        </button>
                      ) : (
                        <span className="text-text-placeholder">-</span>
                      )}
                    </div>

                    { }
                    {task.diseases && task.diseases.length > 0 && (
                      <div className="pt-0.5 flex gap-2">
                        <span className="text-[#060D26] dark:text-gray-200 font-medium min-w-[70px] shrink-0">โรค/อาการ:</span>
                        <span className="text-gray-600 dark:text-gray-300 text-sm leading-snug">
                          {task.diseases.join(', ')}
                        </span>
                      </div>
                    )}

                    { }
                    {task.requiredEquipment && task.requiredEquipment.length > 0 && (
                      <div className="pt-0.5 flex gap-2">
                        <span className="text-[#060D26] dark:text-gray-200 font-medium min-w-[70px] shrink-0">อุปกรณ์ช่วย:</span>
                        <span className="text-gray-600 dark:text-gray-300 text-sm leading-snug">
                          {task.requiredEquipment.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {task.patientDroppedOffAt && (
                <div className="flex gap-2 items-center text-xs mt-1 pl-[76px]">
                  <span className="text-slate-500 dark:text-gray-400 font-medium">เวลาส่งถึงบ้าน:</span>
                  <span className="text-brand-primary font-bold text-sm">
                    {new Date(task.patientDroppedOffAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.'}
                  </span>
                </div>
              )}
              {task.returnEvidenceUrl && (
                <div className="flex flex-col gap-1 mt-1 pl-[76px]">
                  <span className="text-xs text-slate-500 dark:text-gray-400 font-medium">รูปส่งกลับบ้าน:</span>
                  <div className="relative w-40 h-28 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 mt-0.5">
                    <img
                      src={getImageUrl(task.returnEvidenceUrl)}
                      alt="รูปส่งกลับบ้าน"
                      className="object-contain w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(getImageUrl(task.returnEvidenceUrl!), '_blank')}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        { }
        {(() => {
          const firstTask = tasks[0];

          if (isCareU && firstTask.driverName) {
            return (
              <div className="border-t border-gray-100 dark:border-slate-700 mt-3 pt-3 text-sm space-y-3">
                <div className="flex flex-col gap-2">
                  <span className="text-[#060D26] dark:text-gray-200 font-medium text-xs">เจ้าหน้าที่ขับรถ:</span>
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-slate-700 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 relative border border-gray-200 dark:border-slate-700">
                      {firstTask.driverPictureUrl ? (
                        <img
                          src={getImageUrl(firstTask.driverPictureUrl)}
                          alt={firstTask.driverName || 'Driver Profile'}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                        </svg>
                      )}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-gray-200 text-sm truncate">
                        {firstTask.driverName}
                      </p>
                      {firstTask.driverPhone ? (
                        <button
                          onClick={async () => {
                            const result = await Swal.fire({
                              title: 'โทรหาเจ้าหน้าที่ขับรถ?',
                              text: `ต้องการโทรหา ${firstTask.driverPhone} หรือไม่?`,
                              icon: 'question',
                              showCancelButton: true,
                              confirmButtonColor: '#1E7D55',
                              cancelButtonColor: '#6B7280',
                              confirmButtonText: 'โทร',
                              cancelButtonText: 'ยกเลิก',
                            });
                            if (result.isConfirmed) {
                              window.location.href = `tel:${firstTask.driverPhone}`;
                            }
                          }}
                          className="flex items-center gap-1.5 text-xs text-brand-primary hover:text-brand-primary/80 transition-colors cursor-pointer mt-0.5"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                          <span className="underline font-medium">{firstTask.driverPhone}</span>
                        </button>
                      ) : (
                        <p className="text-xs text-gray-400">-</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          const hasInfo = firstTask.hasCareU || firstTask.vehicleInfo;
          if (!hasInfo) return null;

          return (
            <div className="border-t border-gray-100 dark:border-slate-700 mt-3 pt-3 text-sm space-y-3">
              {firstTask.hasCareU && (
                <div className="flex flex-col gap-2">
                  <span className="text-[#060D26] dark:text-gray-200 font-medium text-xs">จิตอาสาแคร์ยู:</span>
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700">
                    <div className="w-10 h-10 bg-green-50 dark:bg-slate-700 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 relative border border-gray-200 dark:border-slate-700">
                      {firstTask.careuPictureUrl ? (
                        <img
                          src={getImageUrl(firstTask.careuPictureUrl)}
                          alt={firstTask.careuName || 'CareU Profile'}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>

                    <div className="text-left flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-gray-200 text-sm truncate">
                        {firstTask.careuName || 'มีจิตอาสาแคร์ยู'}
                      </p>
                      {firstTask.careuPhone ? (
                        <button
                          onClick={async () => {
                            const result = await Swal.fire({
                              title: 'โทรหาจิตอาสาแคร์ยู?',
                              text: `ต้องการโทรหา ${firstTask.careuPhone} หรือไม่?`,
                              icon: 'question',
                              showCancelButton: true,
                              confirmButtonColor: '#1E7D55',
                              cancelButtonColor: '#6B7280',
                              confirmButtonText: 'โทร',
                              cancelButtonText: 'ยกเลิก',
                            });
                            if (result.isConfirmed) {
                              window.location.href = `tel:${firstTask.careuPhone}`;
                            }
                          }}
                          className="flex items-center gap-1.5 text-xs text-brand-primary hover:text-brand-primary/80 transition-colors cursor-pointer mt-0.5"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                          <span className="underline font-medium">{firstTask.careuPhone}</span>
                        </button>
                      ) : (
                        <p className="text-xs text-gray-400">-</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {firstTask.vehicleInfo && (
                <div className="flex gap-2 items-center">
                  <span className="text-[#060D26] dark:text-gray-200 font-medium min-w-[85px] shrink-0">รถที่ใช้:</span>
                  <span className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-gray-100 dark:border-slate-700 text-xs">
                    {firstTask.vehicleInfo}
                  </span>
                </div>
              )}
            </div>
          );
        })()}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-2 pt-2 w-full">
          {!canDriverStartJob(tasks[0].date, tasks[0].bookingTime) && !isCompleted && !isInProgress ? (
            <>
              <span className="text-gray-500 w-full text-center sm:w-auto text-sm font-medium px-6 py-2.5 bg-gray-100 dark:bg-slate-800 dark:text-gray-400 rounded-full">
                ยังไม่ถึงกำหนดวันทำงาน
              </span>
              {onCancelClick && !isCompleted && ['ASSIGNED', 'ACCEPTED'].includes(jobStatus) && (
                <button
                  type="button"
                  onClick={() => onCancelClick(tasks)}
                  disabled={isProcessing}
                  className="w-full sm:w-auto text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 text-sm px-6 py-2.5 rounded-full font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  ยกเลิกคิว
                </button>
              )}
            </>
          ) : (
            <>
              {!isCareU && jobStatus === 'ASSIGNED' && (
                <button
                  onClick={() => onActionClick(tasks, 'accept')}
                  disabled={isProcessing}
                  className="bg-brand-primary w-full justify-center sm:w-auto hover:bg-btn-hover active:bg-btn-hover text-white text-sm px-8 py-2.5 rounded-full font-bold transition-colors shadow-md cursor-pointer flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">กำลัง...</span>
                    </>
                  ) : 'เริ่มให้บริการ'}
                </button>
              )}

              {isInProgress && (
                <button
                  onClick={() => onActionClick(tasks, 'continue')}
                  className="bg-brand-primary w-full justify-center sm:w-auto hover:bg-brand-secondary text-white text-sm px-8 py-2.5 rounded-full font-bold shadow-md"
                >
                  ไปที่แผนที่
                </button>
              )}

              {onCancelClick && !isCompleted && ['ASSIGNED', 'ACCEPTED'].includes(jobStatus) && (
                <button
                  type="button"
                  onClick={() => onCancelClick(tasks)}
                  disabled={isProcessing}
                  className="w-full sm:w-auto text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 text-sm px-6 py-2.5 rounded-full font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  ยกเลิกคิว
                </button>
              )}

              {isCareU && tasks.some((t) => t.jobStatus === 'AT_PATIENT_HOME') && (
                <div className="w-full sm:w-auto text-blue-700 bg-blue-50 border border-blue-300 text-sm px-8 py-2.5 rounded-full font-bold flex items-center justify-center gap-2">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
                  รอคนขับถ่ายรูปยืนยัน
                </div>
              )}
            </>
          )}

          {isCompleted && (
            <span className="text-brand-primary w-full text-center sm:w-auto text-sm font-bold px-6 py-2.5 bg-apple-soft rounded-full">
              ✓ เสร็จสิ้น
            </span>
          )}
        </div>
      </div>
    </div>
  );
};



interface WorkCalendarAppProps {
  onNavigateToMap?: (jobId: number) => void;
  variant?: 'driver' | 'careu';
}

export default function WorkCalendarApp({ onNavigateToMap, variant = 'driver' }: WorkCalendarAppProps) {
  const { user, loading: authLoading } = useAuth();
  const isCareU = variant === 'careu' || user?.role === 'CAREU';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingTaskId, setProcessingTaskId] = useState<number | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [viewType, setViewType] = useState<'calendar' | 'list'>('calendar');
  const { socket } = useSocket();

  const fetchTasks = useCallback(async () => {
    if (!user?.id) {
      console.warn('No user ID available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${getApiUrl()}/jobs/assigned-to/${user.id}`, {
        credentials: 'include'
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลงานได้');

      const data = await response.json();

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      let mappedTasks: Task[] = data
        .filter((job: any) => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(job.status))
        .map((job: any) => {
          const dateStr = getBangkokDateKey(job.queue.requestDate);
          const dateObj = dateStr ? new Date(`${dateStr}T12:00:00`) : new Date(job.queue.requestDate);

          const statusDisplay = getVolunteerJobStatusDisplay(job.status, job.returnPickupRequestedAt);

          let badge = 'ทั่วไป';
          let badgeColor = 'bg-brand-primary';

          if (job.queue.user.mobilityStatus === 'BEDRIDDEN') {
            badge = 'ต้องดูแลใกล้ชิด';
            badgeColor = 'bg-fuan-dark';
          } else if (job.queue.user.mobilityStatus === 'WHEELCHAIR') {
            badge = 'ต้องดูแลเพิ่ม';
            badgeColor = 'bg-saffron-default';
          }

          const userDiseases = job.queue.user.diseases?.map((d: any) => d.disease?.name) || [];
          const customDiseases = job.queue.user.customDiseases || [];
          const allDiseases = [...userDiseases, ...customDiseases];

          const eqStr = job.queue.requiredEquipment || '';
          const eqArray = typeof eqStr === 'string' ? eqStr.split(',').map((s: string) => s.trim()).filter(Boolean) : (Array.isArray(eqStr) ? eqStr : []);

          return {
            id: job.id,
            date: dateStr,
            hasAppointment: job.queue.hasAppointment,
            statusLabel: statusDisplay.label,
            name: job.queue.user.firstName + ' ' + job.queue.user.lastName || 'ไม่ระบุชื่อ',
            phone: job.queue.user.phone,
            hospital: job.queue.hospital?.name || job.queue.hospitalName || '-',
            bookingDate: dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }),
            bookingTime: job.queue.bookingTime,
            badge: badge,
            badgeColor: badgeColor,
            jobStatus: job.status,
            pictureUrl: job.queue.user.pictureUrl,
            requiredEquipment: eqArray,
            diseases: allDiseases,
            hasCareU: !!job.careuId,
            careuName: job.careu ? `${job.careu.firstName} ${job.careu.lastName || ''}`.trim() : undefined,
            careuPhone: job.careu?.phone || undefined,
            careuPictureUrl: job.careu?.pictureUrl || undefined,
            driverName: job.vlt ? `${job.vlt.firstName} ${job.vlt.lastName || ''}`.trim() : undefined,
            driverPhone: job.vlt?.phone || undefined,
            driverPictureUrl: job.vlt?.pictureUrl || undefined,
            vehicleInfo: formatVehicleInfo(job.vehicle) ?? undefined,
            patientDroppedOffAt: job.patientDroppedOffAt || undefined,
            returnEvidenceUrl: job.returnEvidenceUrl || undefined,
            returnPickupRequestedAt: job.returnPickupRequestedAt || null,
          };
        });

      mappedTasks = mappedTasks.filter(task => task.date >= todayStr);

      setTasks(mappedTasks);
    } catch (error) {
      console.warn('Backend not reachable (Simulating mode):', error);

      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchTasks();
    }
  }, [authLoading, user, fetchTasks]);

  useEffect(() => {
    if (!socket || !user) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const handleRealtimeUpdate = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchTasks();
      }, 2000);
    };

    socket.on('notification', handleRealtimeUpdate);
    socket.on('refresh_jobs', handleRealtimeUpdate);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      socket.off('notification', handleRealtimeUpdate);
      socket.off('refresh_jobs', handleRealtimeUpdate);
    };
  }, [socket, user, fetchTasks]);

  const groupedTasks = useMemo(() => {
    const selYear = selectedDate.getFullYear();
    const selMonth = selectedDate.getMonth() + 1;
    const selDay = selectedDate.getDate();
    const selDateKey = `${selYear}-${String(selMonth).padStart(2, '0')}-${String(selDay).padStart(2, '0')}`;

    const filtered = tasks.filter(task => task.date === selDateKey);

    const groupsMap = new Map<string, GroupedTask>();

    filtered.forEach(task => {
      const roundGroup = getRoundGroup(task.bookingTime);
      const key = `${task.hospital}_${roundGroup}_${task.jobStatus}`;

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          id: key,
          hospital: task.hospital,
          bookingTime: task.bookingTime || 'ไม่ระบุเวลา',
          tasks: [],
          jobStatus: task.jobStatus,
          statusLabel: task.statusLabel
        });
      }
      groupsMap.get(key)!.tasks.push(task);
    });

    const groups = Array.from(groupsMap.values());

    groups.sort((a, b) => {
      const aCompleted = a.jobStatus === 'COMPLETED';
      const bCompleted = b.jobStatus === 'COMPLETED';

      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;

      const timeA = a.bookingTime === 'ไม่ระบุเวลา' ? '99:99' : a.bookingTime;
      const timeB = b.bookingTime === 'ไม่ระบุเวลา' ? '99:99' : b.bookingTime;
      return timeA.localeCompare(timeB);
    });

    return groups;
  }, [tasks, selectedDate]);

  const allGroupedTasks = useMemo(() => {
    const dateGroups = new Map<string, Task[]>();
    const today = new Date().setHours(0, 0, 0, 0);

    tasks.forEach(t => {
      const taskDate = new Date(t.date).setHours(0, 0, 0, 0);
      if (taskDate >= today) {
        if (!dateGroups.has(t.date)) dateGroups.set(t.date, []);
        dateGroups.get(t.date)!.push(t);
      }
    });

    const sortedDates = Array.from(dateGroups.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return sortedDates.map(dateStr => {
      const dateTasks = dateGroups.get(dateStr)!;
      const groupsMap = new Map<string, GroupedTask>();

      dateTasks.forEach(task => {
        const roundGroup = getRoundGroup(task.bookingTime);
        const key = `${task.hospital}_${roundGroup}_${task.jobStatus}`;
        if (!groupsMap.has(key)) {
          groupsMap.set(key, {
            id: key + '_' + dateStr,
            hospital: task.hospital,
            bookingTime: task.bookingTime || 'ไม่ระบุเวลา',
            tasks: [],
            jobStatus: task.jobStatus,
            statusLabel: task.statusLabel
          });
        }
        groupsMap.get(key)!.tasks.push(task);
      });

      const groups = Array.from(groupsMap.values()).sort((a, b) => {
        const aCompleted = a.jobStatus === 'COMPLETED';
        const bCompleted = b.jobStatus === 'COMPLETED';
        if (aCompleted && !bCompleted) return 1;
        if (!aCompleted && bCompleted) return -1;
        const timeA = a.bookingTime === 'ไม่ระบุเวลา' ? '99:99' : a.bookingTime;
        const timeB = b.bookingTime === 'ไม่ระบุเวลา' ? '99:99' : b.bookingTime;
        return timeA.localeCompare(timeB);
      });

      return { dateStr, groups };
    });
  }, [tasks]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (date.getMonth() !== currentDate.getMonth()) {
      setCurrentDate(date);
    }

    const hasTasks = tasks.some(task => {
      const taskDate = new Date(task.date);
      return taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear();
    });
    if (hasTasks) {
      setIsSheetOpen(true);
    }
  };

  const handleGroupAction = async (tasksArray: Task[], action: 'accept' | 'complete' | 'continue') => {
    if (tasksArray.length === 0) return;

    if (action === 'continue' || action === 'accept') {
      if (typeof window !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          await (DeviceOrientationEvent as any).requestPermission();
        } catch (e) {
          console.error('Orientation request failed:', e);
        }
      }
    }

    if (action === 'continue') {
      setIsSheetOpen(false);
      if (onNavigateToMap) onNavigateToMap(tasksArray[0].id);
      return;
    }

    try {
      setProcessingTaskId(tasksArray[0].id);

      const promises = tasksArray.map(task => {
        let endpoint = '';
        let method = 'PUT';
        let body = {};

        if (action === 'accept') {
          endpoint = `/jobs/${task.id}/accept-by-volunteer`;
          body = { vltId: user?.id };
        } else if (action === 'complete') {
          endpoint = `/jobs/${task.id}/update-status`;
          body = { status: 'COMPLETED', vltId: user?.id };
        }

        return fetch(`${getApiUrl()}${endpoint}`, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(body),
        }).then(res => {
          if (res.status === 401) {
            window.location.href = '/login';
            throw new Error('Unauthorized');
          }
          if (!res.ok) throw new Error('ไม่สามารถอัปเดตงานได้');
          return res;
        });
      });

      await Promise.all(promises);

      let nextStatus = action === 'accept' ? 'ACCEPTED' : 'COMPLETED';
      let nextStatusLabel = action === 'accept' ? 'กำลังให้บริการ' : 'เสร็จสิ้น';

      setTasks(prev => prev.map(t => {
        if (tasksArray.find(x => x.id === t.id)) {
          return {
            ...t,
            statusLabel: nextStatusLabel,
            jobStatus: nextStatus
          };
        }
        return t;
      }));

      if (action === 'accept' && onNavigateToMap) {
        setIsSheetOpen(false);
        onNavigateToMap(tasksArray[0].id);
      }

    } catch (error) {
      console.warn('Backend error:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setProcessingTaskId(null);
    }
  };

  const handleCancelTask = async (tasksArray: Task[]) => {
    if (tasksArray.length === 0) return;

    const isCareuRole = isCareU || user?.role === 'CAREU';
    const roleText = isCareuRole ? 'จิตอาสาแคร์ยู' : 'เจ้าหน้าที่ขับรถ';
    const targetText = isCareuRole ? 'มอบหมายจิตอาสาแคร์ยูใหม่' : 'เปลี่ยนคนขับใหม่';

    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'ยกเลิกคิวงาน?',
      text: `กรุณาระบุเหตุผลในการยกเลิก เพื่อส่งกลับให้เทศบาลดำเนินการ${targetText}`,
      input: 'textarea',
      inputPlaceholder: 'ระบุเหตุผล เช่น ติดภารกิจด่วน, มีธุระจำเป็น...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6B7280',
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
      setProcessingTaskId(tasksArray[0].id);

      const promises = tasksArray.map((task) =>
        fetchWithAuth(`/jobs/${task.id}/reject-by-volunteer`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vltId: user?.id,
            reason: reason.trim(),
          }),
        }).then(async (res) => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || 'ไม่สามารถยกเลิกงานได้');
          }
          return res;
        })
      );

      await Promise.all(promises);

      await Swal.fire({
        icon: 'success',
        title: 'ยกเลิกคิวสำเร็จ',
        text: `ระบบได้ส่งข้อมูลกลับไปยังเทศบาลเพื่อ${targetText}แล้ว`,
        confirmButtonColor: '#1E7D55',
      });

      fetchTasks();
    } catch (error: any) {
      console.error('Error cancelling task:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถยกเลิกงานได้',
        confirmButtonColor: '#1E7D55',
      });
    } finally {
      setProcessingTaskId(null);
    }
  };

  const formattedSelectedDate = selectedDate.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit'
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-brand-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div>
          <p>กำลังโหลดตารางงาน...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-600">
        <div className="flex flex-col items-center gap-4">
          <p>กรุณาเข้าสู่ระบบเพื่อดูตารางงาน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-8 font-sans text-gray-700 w-full min-h-screen bg-white">

      <h1 className="text-xl font-bold text-brand-primary mb-4">ตารางงานของคุณ</h1>

      { }
      <div className="flex w-full max-w-xs mx-auto mb-6 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner">
        <button
          onClick={() => setViewType('calendar')}
          className={`flex-1 py-2 text-sm font-bold flex items-center justify-center gap-1.5 rounded-lg transition-all ${viewType === 'calendar'
            ? 'bg-white dark:bg-slate-700 text-brand-primary shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
            <path d="M1411.824 0c31.17 0 56.47 25.3 56.47 56.471v56.47h169.412c93.403 0 169.412 76.01 169.412 169.412V1920H113V282.353c0-93.402 76.009-169.412 169.412-169.412h169.41v-56.47c0-31.172 25.3-56.47 56.472-56.47s56.47 25.298 56.47 56.47v56.47h790.589v-56.47c0-31.172 25.299-56.47 56.47-56.47Zm282.352 564.705H225.942v1242.353h1468.234V564.705Zm-1016.47 677.648v338.824H338.882v-338.824h338.824Zm451.765 0v338.824H790.647v-338.824h338.824Zm451.764 0v338.824h-338.823v-338.824h338.823Zm-1016.47 112.941H451.824v112.941h112.941v-112.941Zm451.764 0H903.588v112.941h112.941v-112.941Zm451.765 0h-112.941v112.941h112.941v-112.941ZM677.706 790.588v338.824H338.882V790.588h338.824Zm451.765 0v338.824H790.647V790.588h338.824Zm451.764 0v338.824h-338.823V790.588h338.823ZM564.765 903.53H451.824v112.941h112.941V903.53Zm451.764 0H903.588v112.941h112.941V903.53Zm451.765 0h-112.941v112.941h112.941V903.53ZM451.823 225.882H282.412c-31.06 0-56.47 25.3-56.47 56.471v169.412h1468.234V282.353c0-31.172-25.411-56.47-56.47-56.47h-169.412v56.47c0 31.172-25.3 56.471-56.47 56.471-31.172 0-56.471-25.299-56.471-56.47v-56.472H564.765v56.471c0 31.172-25.3 56.471-56.471 56.471-31.171 0-56.471-25.299-56.471-56.47v-56.472Z" fillRule="evenodd"></path>
          </svg>
          ปฏิทิน
        </button>
        <button
          onClick={() => setViewType('list')}
          className={`flex-1 py-2 text-sm font-bold flex items-center justify-center gap-1.5 rounded-lg transition-all ${viewType === 'list'
            ? 'bg-white dark:bg-slate-700 text-brand-primary shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
            <line x1="10" y1="6" x2="19" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="10" y1="18" x2="19" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="10" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <polygon fill="currentColor" fillRule="nonzero" points="5.251 5.676 4.775 6.004 4.327 5.308 5.331 4.668 6.211 4.668 6.211 7.5 5.251 7.5" />
            <path d="M5.48361,11.864 C5.52894,11.8293 5.56628,11.7907 5.59561,11.748 C5.62494,11.7053 5.63961,11.6613 5.63961,11.616 C5.63961,11.5627 5.62228,11.516 5.58761,11.476 C5.55561,11.436 5.50361,11.416 5.43161,11.416 C5.35428,11.416 5.29028,11.4467 5.23961,11.508 C5.18894,11.5693 5.16094,11.652 5.15561,11.756 L4.24761,11.652 C4.26628,11.468 4.31428,11.3093 4.39161,11.176 C4.46894,11.0427 4.56494,10.932 4.67961,10.844 C4.79694,10.756 4.92628,10.692 5.06761,10.652 C5.21161,10.6093 5.35961,10.588 5.51161,10.588 C5.65028,10.588 5.78761,10.6053 5.92361,10.64 C6.06228,10.6747 6.18494,10.7293 6.29161,10.804 C6.39828,10.876 6.48494,10.9707 6.55161,11.088 C6.61828,11.2053 6.65161,11.3467 6.65161,11.512 C6.65161,11.6293 6.63561,11.7333 6.60361,11.824 C6.57428,11.912 6.53294,11.9907 6.47961,12.06 C6.42894,12.1293 6.37028,12.192 6.30361,12.248 C6.23961,12.304 6.17161,12.3573 6.09961,12.408 L5.68361,12.704 L6.65961,12.704 L6.65961,13.5 L4.36361,13.5 L4.36361,12.76 L5.48361,11.864 Z" fill="currentColor" fillRule="nonzero" />
            <path d="M6.23161,18.016 C6.30361,18.04 6.36894,18.0733 6.42761,18.116 C6.48894,18.1587 6.54094,18.208 6.58361,18.264 C6.62628,18.32 6.65828,18.3813 6.67961,18.448 C6.70361,18.512 6.71561,18.5773 6.71561,18.644 C6.71561,18.8093 6.68094,18.952 6.61161,19.072 C6.54228,19.1893 6.45161,19.2867 6.33961,19.364 C6.22761,19.4387 6.10094,19.4933 5.95961,19.528 C5.81828,19.5627 5.67561,19.58 5.53161,19.58 C5.38761,19.58 5.24494,19.5627 5.10361,19.528 C4.96494,19.496 4.83694,19.444 4.71961,19.372 C4.60494,19.3 4.50361,19.2093 4.41561,19.1 C4.33028,18.9907 4.26894,18.86 4.23161,18.708 L5.11961,18.5 C5.13561,18.5693 5.17428,18.6333 5.23561,18.692 C5.29961,18.7507 5.38094,18.78 5.47961,18.78 C5.50628,18.78 5.53428,18.7773 5.56361,18.772 C5.59294,18.764 5.61961,18.7533 5.64361,18.74 C5.66761,18.724 5.68761,18.704 5.70361,18.68 C5.71961,18.656 5.72761,18.6253 5.72761,18.588 C5.72761,18.5027 5.69028,18.4467 5.61561,18.42 C5.54094,18.3933 5.44094,18.38 5.31561,18.38 L5.04361,18.38 L5.04361,17.724 L5.34761,17.724 C5.44894,17.724 5.53028,17.7107 5.59161,17.684 C5.65294,17.6547 5.68361,17.6 5.68361,17.52 C5.68361,17.4587 5.65961,17.416 5.61161,17.392 C5.56361,17.368 5.51294,17.356 5.45961,17.356 C5.39294,17.356 5.33161,17.3773 5.27561,17.42 C5.21961,17.46 5.18494,17.52 5.17161,17.6 L4.28761,17.412 C4.33561,17.2573 4.40361,17.128 4.49161,17.024 C4.57961,16.9173 4.67961,16.832 4.79161,16.768 C4.90628,16.704 5.02761,16.6587 5.15561,16.632 C5.28628,16.6027 5.41428,16.588 5.53961,16.588 C5.66494,16.588 5.79428,16.604 5.92761,16.636 C6.06094,16.6653 6.18228,16.7147 6.29161,16.784 C6.40094,16.8507 6.49028,16.9373 6.55961,17.044 C6.62894,17.148 6.66361,17.2747 6.66361,17.424 C6.66361,17.584 6.62094,17.712 6.53561,17.808 C6.45294,17.9013 6.35161,17.9653 6.23161,18 L6.23161,18.016 Z" fill="currentColor" fillRule="nonzero" />
          </svg>
          รายการ
        </button>
      </div>

      { }
      <div className={`mb-8 w-full flex justify-center px-4 ${viewType !== 'calendar' ? 'hidden' : ''}`}>
        <CalendarWidget
          currentDate={currentDate}
          onMonthChange={handleMonthChange}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          tasks={tasks}
        />
      </div>

      { }
      <div style={{
        width: '100%',
        maxWidth: '24rem',
        margin: '0 auto',
        padding: '0 1rem 3rem',
      }}>
        {viewType === 'calendar' ? (
          <>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: '#1a1a2e',
              margin: '0 0 0.75rem 0',
            }}>
              งานวันที่ {formattedSelectedDate}
            </h3>

            {groupedTasks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {groupedTasks.map((group) => (
                  <GroupedTaskCard
                    key={group.id}
                    groupedTask={group}
                    onActionClick={handleGroupAction}
                    onCancelClick={handleCancelTask}
                    isProcessing={processingTaskId === group.tasks[0].id}
                    isCareU={isCareU}
                  />
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                background: '#fff',
                borderRadius: '1rem',
                border: '1px dashed #d1d5db',
              }}>
                <p style={{ color: '#9ca3af', margin: 0 }}>ไม่มีงานในวันที่เลือก</p>
                <p style={{ color: '#d1d5db', fontSize: '0.75rem', marginTop: '0.25rem' }}>ลองเลือกวันที่สีเขียวดูสิครับ</p>
              </div>
            )}
          </>
        ) : (
          <>
            {allGroupedTasks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {allGroupedTasks.map(({ dateStr, groups }) => {
                  const dateObj = new Date(dateStr);
                  const fDate = dateObj.toLocaleDateString('th-TH', {
                    day: 'numeric', month: 'short', year: '2-digit'
                  });
                  return (
                    <div key={dateStr} className="flex flex-col gap-3 relative">
                      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm pt-2 pb-1">
                        <h3 className="text-lg font-bold text-brand-primary border-b-2 border-brand-primary inline-block">
                          {fDate}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {groups.map((group) => (
                          <GroupedTaskCard
                            key={group.id}
                            groupedTask={group}
                            onActionClick={handleGroupAction}
                            onCancelClick={handleCancelTask}
                            isProcessing={processingTaskId === group.tasks[0].id}
                            isCareU={isCareU}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                background: '#fff',
                borderRadius: '1rem',
                border: '1px dashed #d1d5db',
              }}>
                <p style={{ color: '#9ca3af', margin: 0 }}>ยังไม่มีงานที่ถูกมอบหมาย</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}