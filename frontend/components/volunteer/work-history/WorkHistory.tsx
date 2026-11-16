'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import Image from 'next/image';
import { useUserData } from '../hooks';
import { getImageUrl } from '@/utils/image';
import {
  ChevronIcon,
  DateHistoryEmptyState,
  DateHistoryLayout,
  DateHistoryLoadingState,
  dateAccordionButtonClass,
  formatThaiDateLabel,
} from '@/components/shared/DateHistoryLayout';

const UserIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

interface JobItem {
  id: number;
  name: string;
  severityLevel: string;
  severityBadge: string;
  severityColor: string;
  bookingType: string;
  hospital: string;
  bookingDate: string;
  bookingTime: string;
  pictureUrl?: string;
  requiredEquipment?: string[];
  patientDroppedOffAt?: string;
  completedAt?: string;
  jobStatus?: string;
  hasCareU?: boolean;
  careuName?: string;
  careuPhone?: string;
  careuPictureUrl?: string;
  hasDriver?: boolean;
  driverName?: string;
  driverPhone?: string;
  driverPictureUrl?: string;
  returnEvidenceUrl?: string;
  rejectReason?: string;
}

type WorkHistoryVariant = 'driver' | 'careu';

interface DateGroup {
  date: string;
  dateLabel: string;
  jobs: JobItem[];
}

const JobDetailModal: React.FC<{
  job: JobItem | null;
  isOpen: boolean;
  onClose: () => void;
  variant: WorkHistoryVariant;
}> = ({ job, isOpen, onClose, variant }) => {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [job?.pictureUrl]);

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 relative z-10 shadow-xl border-2 border-brand-primary animate-in fade-in zoom-in duration-200">
        <h2 className="text-xl font-bold text-center text-brand-primary mb-2">ข้อมูลประชาชน</h2>

        { }
        <div className="flex justify-center mb-4">
          <div className="w-24 h-24 bg-[#E3F2FD] rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
            {job.pictureUrl && !imgError ? (
              <Image
                src={job.pictureUrl}
                alt={job.name}
                width={96}
                height={96}
                className="object-cover w-full h-full"
                unoptimized
                onError={() => setImgError(true)}
              />
            ) : (
              <UserIcon size={48} className="text-[#94A3B8]" />
            )}
          </div>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-text-primary">{job.name}</h3>
        </div>

        <div className="space-y-3 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <span className="min-w-[100px] text-text-primary font-medium">สถานะประชาชน :</span>
            <span className={`${job.severityColor} text-white text-xs px-3 py-1 rounded-full`}>
              {job.severityBadge}
            </span>
          </div>

          <div className="flex gap-2">
            <span className="min-w-[100px] text-text-primary font-medium">ประเภทการจอง :</span>
            <span>{job.bookingType}</span>
          </div>

          <div className="flex gap-2">
            <span className="min-w-[100px] text-text-primary font-medium">สถานที่ :</span>
            <span>{job.hospital !== '-' && job.hospital ? job.hospital : 'ไม่ระบุ'}</span>
          </div>

          <div className="flex gap-2 items-center">
            <span className="min-w-[100px] text-text-primary font-medium">สถานะงาน :</span>
            <span className={`px-3 py-0.5 rounded-full text-xs font-medium border ${
              job.jobStatus === 'เสร็จสิ้น'
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-rose-100 text-rose-700 border-rose-200'
            }`}>
              {job.jobStatus}
            </span>
          </div>

          {job.rejectReason && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              ⚠️ หมายเหตุการยกเลิก: {job.rejectReason}
            </div>
          )}

          <div className="flex gap-2">
            <span className="min-w-[100px] text-text-primary font-medium">วันที่จอง :</span>
            <span>{job.bookingDate}</span>
          </div>

          <div className="flex gap-2">
            <span className="min-w-[100px] text-text-primary font-medium">ช่วงเวลาที่จอง :</span>
            <span>{job.bookingTime}</span>
          </div>

          {variant === 'driver' && job.hasCareU && (
            <VolunteerContactSection
              title="จิตอาสาแคร์ยู :"
              name={job.careuName}
              phone={job.careuPhone}
              pictureUrl={job.careuPictureUrl}
              callTitle="โทรหาจิตอาสาแคร์ยู?"
              avatarBg="bg-green-50"
            />
          )}

          {variant === 'careu' && job.hasDriver && (
            <VolunteerContactSection
              title="เจ้าหน้าที่ขับรถ :"
              name={job.driverName}
              phone={job.driverPhone}
              pictureUrl={job.driverPictureUrl}
              callTitle="โทรหาเจ้าหน้าที่ขับรถ?"
              avatarBg="bg-blue-50"
            />
          )}

          {job.patientDroppedOffAt && (
            <div className="flex gap-2">
              <span className="min-w-[100px] text-text-primary font-medium">เวลาส่งถึงบ้าน :</span>
              <span className="text-brand-primary font-medium text-[15px]">{job.patientDroppedOffAt}</span>
            </div>
          )}

          {job.returnEvidenceUrl && (
            <div className="flex flex-col gap-1.5 mt-3">
              <span className="text-text-primary font-medium">รูปส่งกลับบ้าน :</span>
              <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 mt-1">
                <img
                  src={getImageUrl(job.returnEvidenceUrl)}
                  alt="รูปส่งกลับบ้าน"
                  className="object-contain w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setPreviewImageUrl(getImageUrl(job.returnEvidenceUrl!))}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <span className="text-text-primary font-medium">อุปกรณ์ที่ต้องการใช้ :</span>
            {job.requiredEquipment && job.requiredEquipment.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 mt-1">
                {job.requiredEquipment.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-400 pl-4">- ไม่มี -</span>
            )}
          </div>
        </div>
      </div>

      {previewImageUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <img
            src={previewImageUrl}
            alt="รูปส่งกลับบ้าน"
            className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function VolunteerContactSection({
  title,
  name,
  phone,
  pictureUrl,
  callTitle,
  avatarBg,
}: {
  title: string;
  name?: string;
  phone?: string;
  pictureUrl?: string;
  callTitle: string;
  avatarBg: string;
}) {
  return (
    <div className="pt-3 mt-3 border-t border-brand-primary">
      <h4 className="text-sm font-medium text-text-primary mb-3">{title}</h4>
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 ${avatarBg} rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 relative border`}>
          {pictureUrl ? (
            <img src={getImageUrl(pictureUrl)} alt={name} className="object-cover w-full h-full" />
          ) : (
            <svg className="w-6 h-6 text-text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>
        <div className="text-left">
          <p className="font-medium text-text-primary text-sm">{name || '-'}</p>
          {phone ? (
            <button
              onClick={async () => {
                const SwalLib = (await import('@/lib/swal')).default;
                const result = await SwalLib.fire({
                  title: callTitle,
                  text: `ต้องการโทรหา ${phone} หรือไม่?`,
                  icon: 'question',
                  showCancelButton: true,
                  confirmButtonColor: '#1E7D55',
                  cancelButtonColor: '#6B7280',
                  confirmButtonText: 'โทร',
                  cancelButtonText: 'ยกเลิก',
                });
                if (result.isConfirmed) {
                  window.location.href = `tel:${phone}`;
                }
              }}
              className="flex items-center gap-1.5 text-text-secondary hover:text-brand-primary transition-colors cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span className="text-xs underline">{phone}</span>
            </button>
          ) : (
            <p className="text-xs text-text-tertiary">-</p>
          )}
        </div>
      </div>
    </div>
  );
}

const JobCard: React.FC<{ job: JobItem; onClick: () => void; variant: WorkHistoryVariant }> = ({ job, onClick, variant }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [job.pictureUrl]);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-4 flex gap-4 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    >
      { }
      <div className="flex-shrink-0">
        <div className="w-16 h-16 bg-[#E3F2FD] rounded-xl flex items-center justify-center overflow-hidden relative">
          {job.pictureUrl && !imgError ? (
            <Image
              src={job.pictureUrl}
              alt={job.name}
              fill
              className="object-cover"
              sizes="64px"
              unoptimized
              onError={() => setImgError(true)}
            />
          ) : (
            <UserIcon size={32} className="text-[#94A3B8]" />
          )}
        </div>
      </div>

      { }
      <div className="flex-1 space-y-1.5 text-sm">
        <p className="text-text-primary font-medium">ชื่อ - สกุล : {job.name}</p>

        {variant === 'driver' && job.hasCareU && (
          <p className="text-text-tertiary flex items-center gap-2 flex-wrap mt-1">
            จิตอาสาแคร์ยู :
            <span className="bg-brand-primary/10 text-brand-primary font-medium text-xs px-2.5 py-0.5 rounded-full border border-brand-primary/20 inline-flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              {job.careuName || 'มีจิตอาสาแคร์ยู'}
            </span>
          </p>
        )}

        {variant === 'careu' && job.hasDriver && (
          <p className="text-text-tertiary flex items-center gap-2 flex-wrap mt-1">
            เจ้าหน้าที่ขับรถ :
            <span className="bg-blue-50 text-blue-700 font-medium text-xs px-2.5 py-0.5 rounded-full border border-blue-200 inline-flex items-center gap-1">
              {job.driverName || 'มีเจ้าหน้าที่ขับรถ'}
            </span>
          </p>
        )}

        <p className="text-text-tertiary flex items-center gap-2 flex-wrap mt-1">
          สถานะประชาชน :
          <span className={`${job.severityColor} text-white text-xs px-2.5 py-0.5 rounded-full`}>
            {job.severityBadge}
          </span>
        </p>
        <p className="text-text-tertiary">ประเภทการจอง : {job.bookingType}</p>
        <p className="text-text-tertiary flex items-center gap-2">
          สถานะงาน :
          <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
            job.jobStatus === 'เสร็จสิ้น'
              ? 'bg-green-100 text-green-700 border-green-200'
              : 'bg-rose-100 text-rose-700 border-rose-200'
          }`}>
            {job.jobStatus}
          </span>
        </p>

        {job.rejectReason && (
          <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded border border-rose-100 mt-1">
            ⚠️ {job.rejectReason}
          </p>
        )}

        <p className="text-text-tertiary">
          สถานที่ : {job.hospital !== '-' && job.hospital ? job.hospital : 'ไม่ระบุ'}
        </p>
        <p className="text-text-tertiary">วันที่จอง {job.bookingDate}</p>
        <p className="text-text-tertiary">เวลาที่จอง {job.bookingTime}</p>

        {job.patientDroppedOffAt && (
          <p className="text-text-tertiary">เวลาส่งถึงบ้าน: <span className="text-brand-primary font-medium text-[15px]">{job.patientDroppedOffAt}</span></p>
        )}
      </div>
    </div>
  );
};

const DateAccordion: React.FC<{
  group: DateGroup;
  isOpen: boolean;
  onToggle: () => void;
  onJobClick: (job: JobItem) => void;
  isLoading: boolean;
  variant: WorkHistoryVariant;
}> = ({ group, isOpen, onToggle, onJobClick, isLoading, variant }) => {
  return (
    <div className="mb-4">
      { }
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-colors border-2 border-brand-primary focus:outline-none ${isOpen
          ? 'bg-brand-primary text-white'
          : 'bg-white text-brand-primary'
          }`}
      >
        <span className="text-lg">{group.dateLabel}</span>
        <ChevronIcon isOpen={isOpen} />
      </button>

      { }
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100 mt-3' : 'max-h-0 opacity-0'
          }`}
      >
        {isLoading ? (
          <div className="p-4 text-center text-gray-400">กำลังโหลดข้อมูล...</div>
        ) : (
          <div className="bg-gray-100 rounded-xl p-3 space-y-3">
            {group.jobs && group.jobs.length > 0 ? (
              group.jobs.map((job) => (
                <JobCard key={job.id} job={job} variant={variant} onClick={() => onJobClick(job)} />
              ))
            ) : (
              <div className="p-2 text-center text-gray-400">ไม่พบงานในวันนี้</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function mapJobToItem(job: Record<string, any>): JobItem {
  let severityBadge = 'ทั่วไป';
  let severityColor = 'bg-brand-primary';
  if (job.queue.severityLevel === 'RED') {
    severityBadge = 'ต้องดูแลใกล้ชิด';
    severityColor = 'bg-status-danger';
  } else if (job.queue.severityLevel === 'YELLOW') {
    severityBadge = 'ต้องดูแลเพิ่ม';
    severityColor = 'bg-status-warning';
  }

  return {
    id: job.id,
    name: job.queue.user?.displayName || `${job.queue.user?.firstName || ''} ${job.queue.user?.lastName || ''}`.trim() || 'ไม่ระบุชื่อ',
    severityLevel: job.queue.severityLevel || 'GREEN',
    severityBadge,
    severityColor,
    bookingType: job.queue.hasAppointment ? 'มีใบนัด' : 'ไม่มีใบนัด',
    hospital: job.queue.hospitalName || job.queue.hospital?.name || '-',
    bookingDate: new Date(job.queue.requestDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }),
    bookingTime: job.queue.bookingTime || '-',
    jobStatus: job.status === 'COMPLETED' ? 'เสร็จสิ้น' : (job.status === 'CANCELLED' ? 'ยกเลิก' : (job.status === 'REJECTED' ? 'ปฏิเสธงาน' : job.status)),
    pictureUrl: job.queue.user?.pictureUrl || '',
    requiredEquipment: job.queue.requiredEquipment ? job.queue.requiredEquipment.split(',').map((item: string) => item.trim()) : [],
    patientDroppedOffAt: job.patientDroppedOffAt ? new Date(job.patientDroppedOffAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.' : undefined,
    completedAt: job.completedAt ? new Date(job.completedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.' : undefined,
    hasCareU: !!job.careuId,
    careuName: job.careu ? `${job.careu.firstName} ${job.careu.lastName || ''}`.trim() : undefined,
    careuPhone: job.careu?.phone || undefined,
    careuPictureUrl: job.careu?.pictureUrl || undefined,
    hasDriver: !!job.vltId,
    driverName: job.vlt ? `${job.vlt.firstName} ${job.vlt.lastName || ''}`.trim() : undefined,
    driverPhone: job.vlt?.phone || undefined,
    driverPictureUrl: job.vlt?.pictureUrl || undefined,
    returnEvidenceUrl: job.returnEvidenceUrl || undefined,
    rejectReason: job.rejectReason || job.queue?.rejectReason || undefined,
  };
}

export default function JobHistory({ variant = 'driver' }: { variant?: WorkHistoryVariant }) {
  const [dateGroups, setDateGroups] = useState<DateGroup[]>([]);
  const [openDates, setOpenDates] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDateGroups = dateGroups.filter(group => {
    const searchLower = searchTerm.toLowerCase();
    return group.dateLabel.toLowerCase().includes(searchLower) ||
      group.date.includes(searchLower);
  });

  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);

  const [loadedJobs, setLoadedJobs] = useState<Record<string, JobItem[]>>({});
  const [loadingDates, setLoadingDates] = useState<Set<string>>(new Set());

  const { userData, loading: userLoading } = useUserData();
  const userId = userData?.id;

  const handleJobClick = (job: JobItem) => {
    setSelectedJob(job);
  };

  const handleCloseModal = () => {
    setSelectedJob(null);
  };

  const toggleDate = async (date: string) => {
    setOpenDates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });

    if (!loadedJobs[date] && !loadingDates.has(date) && userId) {
      await fetchJobsForDate(date);
    }
  };

  const fetchJobsForDate = async (dateStr: string) => {
    if (!userId) return;

    try {
      setLoadingDates(prev => new Set(prev).add(dateStr));

      const response = await fetch(`${getApiUrl()}/jobs/assigned-to/${userId}?status=COMPLETED&date=${dateStr}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลงานได้');

      const jobs = await response.json();
      const userIdStr = String(userId);
      const roleJobs = variant === 'careu'
        ? jobs.filter((job: { careuId?: string }) => job.careuId === userIdStr)
        : jobs.filter((job: { vltId?: string }) => job.vltId === userIdStr);

      const formattedJobs: JobItem[] = roleJobs.map((job: Record<string, unknown>) => mapJobToItem(job));

      setLoadedJobs(prev => ({
        ...prev,
        [dateStr]: formattedJobs
      }));

    } catch (error) {
      console.error(`Error fetching jobs for ${dateStr}:`, error);
    } finally {
      setLoadingDates(prev => {
        const newSet = new Set(prev);
        newSet.delete(dateStr);
        return newSet;
      });
    }
  };

  useEffect(() => {
    if (userLoading || !userId) return;

    const fetchHistoryDates = async () => {
      try {
        setIsLoading(true);
        const roleQuery = variant === 'careu' ? 'CAREU' : 'DRIVE';
        const response = await fetch(`${getApiUrl()}/jobs/history-dates/${userId}?role=${roleQuery}`, {
          credentials: 'include',
        });

        if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลประวัติได้');

        const dates: string[] = await response.json();

        const groups: DateGroup[] = dates.map(date => ({
          date,
          dateLabel: formatThaiDateLabel(date),
          jobs: []
        }));

        setDateGroups(groups);

      } catch (error) {
        console.error('Failed to fetch history dates:', error);
        setDateGroups([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoryDates();
  }, [userId, userLoading, variant]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value) {
      setOpenDates(new Set(dateGroups.map(g => g.date)));
      dateGroups.forEach((group) => {
        if (!loadedJobs[group.date] && !loadingDates.has(group.date)) {
          fetchJobsForDate(group.date);
        }
      });
    }
  };

  if (isLoading) {
    return <DateHistoryLoadingState message="กำลังโหลดประวัติการทำงาน..." />;
  }

  return (
    <>
      <JobDetailModal
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={handleCloseModal}
        variant={variant}
      />

      <DateHistoryLayout
        title="ประวัติการทำงาน"
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
      >
        {filteredDateGroups.length > 0 ? (
          filteredDateGroups.map((group) => (
            <div key={group.date} className="mb-4 w-full">
              <button
                onClick={() => toggleDate(group.date)}
                className={dateAccordionButtonClass()}
              >
                <span className="text-lg">{group.dateLabel}</span>
                <ChevronIcon isOpen={openDates.has(group.date)} />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out w-full ${
                  openDates.has(group.date) ? 'max-h-[2000px] opacity-100 mt-3' : 'max-h-0 opacity-0'
                }`}
              >
                {loadingDates.has(group.date) ? (
                  <div className="p-4 text-center text-gray-400">กำลังโหลดข้อมูล...</div>
                ) : (
                  <div className="bg-gray-100 rounded-xl p-3 space-y-3 w-full">
                    {loadedJobs[group.date]?.map((job) => (
                      <JobCard key={job.id} job={job} variant={variant} onClick={() => handleJobClick(job)} />
                    ))}
                    {(!loadedJobs[group.date] || loadedJobs[group.date].length === 0) && openDates.has(group.date) && (
                      <div className="p-2 text-center text-gray-400">ไม่พบงานในวันนี้</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <DateHistoryEmptyState
            message={searchTerm ? 'ไม่พบวันที่ที่ค้นหา' : 'ไม่พบประวัติการทำงาน'}
          />
        )}
      </DateHistoryLayout>
    </>
  );
}