"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import DashboardCalendar from "./DashboardCalendar";

const JobTrackingMap = dynamic(
  () => import("@/components/staff/JobTrackingMap"),
  { ssr: false },
);
import {
  getQueueLocalDateStr,
  getTodayLocalDateStr,
  parseQueueDate,
} from "@/utils/dateHelpers";

interface DashboardScheduleTableProps {
  queues: any[];
}

type FilterKey = "all" | "pending" | "active";
type ViewKey = "table" | "calendar" | "card" | "timeline";

const ACTIVE_JOB_STATUSES = new Set([
  "PICKING_UP",
  "IN_PROGRESS",
  "IN_TRANSIT",
  "AT_HOSPITAL",
  "AT_PATIENT_HOME",
  "RETURN_HOME",
  "RETURN_OFFICE",
]);

const PENDING_QUEUE_STATUSES = new Set([
  "PENDING_MUNICIPAL",
  "PENDING",
  "APPROVED",
  "PENDING_EXECUTIVE",
  "EXECUTIVE_REJECTED",
  "CONFIRMED",
]);

const PENDING_JOB_STATUSES = new Set(["OPEN", "ASSIGNED", "ACCEPTED"]);

const CANCELLED_STATUSES = new Set([
  "CANCELLED",
  "CANCELLED_BY_USER",
  "CANCELLED_BY_MUNICIPAL",
  "REJECTED",
]);

const isCancelledQueue = (q: any): boolean => {
  const queueStatus = q?.status;
  const jobStatus = q?.job?.status;
  return (
    CANCELLED_STATUSES.has(queueStatus) ||
    (Boolean(jobStatus) && CANCELLED_STATUSES.has(jobStatus))
  );
};

const getDisplayName = (person?: any) => {
  if (!person) return "-";
  if (person.displayName) return person.displayName;
  const first = person.firstName || "";
  const last = person.lastName || "";
  const full = `${first} ${last}`.trim();
  return full || "-";
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("th-TH");
};

const getScheduleStatus = (queue: any) => {
  const jobStatus = queue?.job?.status;
  const queueStatus = queue?.status;
  const returnPickupRequestedAt = queue?.job?.returnPickupRequestedAt;

  if (jobStatus === "AT_HOSPITAL") {
    if (returnPickupRequestedAt) {
      return {
        label: "เรียกรถกลับแล้ว",
        className: "bg-amber-100 text-amber-700",
        dotClass: "bg-amber-500",
      };
    }
    return {
      label: "อยู่ที่โรงพยาบาล",
      className: "bg-cyan-100 text-cyan-700",
      dotClass: "bg-cyan-500",
    };
  }

  if (jobStatus === "AT_PATIENT_HOME") {
    return {
      label: "ส่งถึงบ้าน รอคนขับยืนยัน",
      className: "bg-teal-100 text-teal-700",
      dotClass: "bg-teal-500",
    };
  }

  if (jobStatus === "ASSIGNED") {
    return {
      label: "มอบหมายจิตอาสาแล้ว",
      className: "bg-blue-50 text-blue-700",
      dotClass: "bg-blue-500",
    };
  }

  if (jobStatus === "ACCEPTED") {
    return {
      label: "จิตอาสารับงานแล้ว",
      className: "bg-emerald-50 text-emerald-700",
      dotClass: "bg-emerald-500",
    };
  }

  if (jobStatus && ACTIVE_JOB_STATUSES.has(jobStatus)) {
    const mapping: Record<string, string> = {
      PICKING_UP: "กำลังไปรับประชาชน",
      IN_PROGRESS: "กำลังดูแลประชาชน",
      IN_TRANSIT: "กำลังเดินทางไปโรงพยาบาล",
      RETURN_HOME: "กำลังพาประชาชนกลับบ้าน",
      RETURN_OFFICE: "กำลังกลับเทศบาล",
    };
    return {
      label: mapping[jobStatus] || "กำลังให้บริการ",
      className: "bg-amber-100 text-amber-700",
      dotClass: "bg-amber-500",
    };
  }

  if (jobStatus === "COMPLETED" || queueStatus === "COMPLETED") {
    return {
      label: "เสร็จสิ้น",
      className: "bg-emerald-100 text-emerald-700",
      dotClass: "bg-emerald-500",
    };
  }

  if (
    queueStatus === "REJECTED" ||
    jobStatus === "CANCELLED" ||
    queueStatus === "CANCELLED_BY_USER" ||
    queueStatus === "CANCELLED_BY_MUNICIPAL"
  ) {
    return {
      label: "ยกเลิก",
      className: "bg-slate-100 text-slate-500",
      dotClass: "bg-slate-400",
    };
  }

  if (queueStatus === "PENDING_EXECUTIVE") {
    return {
      label: "รอผู้บริหารอนุมัติ",
      className: "bg-purple-50 text-purple-700",
      dotClass: "bg-purple-500",
    };
  }

  if (queueStatus === "EXECUTIVE_REJECTED") {
    return {
      label: "ผู้บริหารส่งกลับแก้ไข",
      className: "bg-rose-50 text-rose-700",
      dotClass: "bg-rose-500",
    };
  }

  if (queueStatus === "APPROVED") {
    return {
      label: "รอประชาชนยืนยัน",
      className: "bg-blue-50 text-blue-700",
      dotClass: "bg-blue-500",
    };
  }

  if (queueStatus === "CONFIRMED") {
    return {
      label: "รอมอบหมายจิตอาสา",
      className: "bg-amber-50 text-amber-700",
      dotClass: "bg-amber-500",
    };
  }

  if (queueStatus === "PENDING_MUNICIPAL" || queueStatus === "PENDING") {
    return {
      label: "รอเทศบาลตรวจสอบ",
      className: "bg-sky-50 text-sky-700",
      dotClass: "bg-sky-500",
    };
  }

  return {
    label: "รอดำเนินการ",
    className: "bg-slate-100 text-slate-600",
    dotClass: "bg-slate-400",
  };
};

export default function DashboardScheduleTable({
  queues,
}: DashboardScheduleTableProps) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [viewType, setViewType] = useState<ViewKey>("table");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [calendarDate, setCalendarDate] = useState<string>(getTodayLocalDateStr());
  const [selectedQueue, setSelectedQueue] = useState<any | null>(null);

  useEffect(() => {
    if (!selectedQueue) return;

    const latest = queues.find((q) => q?.id === selectedQueue?.id);
    if (!latest) return;

    if (latest !== selectedQueue) {
      setSelectedQueue(latest);
    }
  }, [queues, selectedQueue]);

  const trackingMapData = useMemo(() => {
    if (!selectedQueue?.job?.id) return null;

    const user = selectedQueue?.user || {};
    const hospital = selectedQueue?.hospital || {};
    const userLat = typeof user.lat === "number" ? user.lat : null;
    const userLng = typeof user.lng === "number" ? user.lng : null;
    const hospLat = typeof hospital.lat === "number" ? hospital.lat : null;
    const hospLng = typeof hospital.lng === "number" ? hospital.lng : null;
    const jobStatus = selectedQueue?.job?.status;

    return {
      jobId: selectedQueue.job.id as number,
      jobStatus,
      patientLatLng:
        userLat !== null && userLng !== null
          ? { lat: userLat, lng: userLng }
          : null,
      hospitalLatLng:
        hospLat !== null && hospLng !== null
          ? { lat: hospLat, lng: hospLng }
          : null,
      hasCoords: userLat !== null || hospLat !== null,
      isLive: Boolean(jobStatus && ACTIVE_JOB_STATUSES.has(jobStatus)),
      showMap:
        Boolean(jobStatus && ACTIVE_JOB_STATUSES.has(jobStatus)) ||
        jobStatus === "COMPLETED",
    };
  }, [selectedQueue]);

  const calendarQueues = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const all = [...queues]
      .filter((q) => !isCancelledQueue(q))
      .sort((a, b) => {
        const aDate = parseQueueDate(a.requestDate || a.createdAt)?.getTime() ?? 0;
        const bDate = parseQueueDate(b.requestDate || b.createdAt)?.getTime() ?? 0;
        return aDate - bDate;
      });
    if (!keyword) return all;
    return all.filter((q) => {
      const userName = getDisplayName(q?.user).toLowerCase();
      const userPhone = String(q?.user?.phone || '').toLowerCase();
      const hospitalName = String(q?.hospital?.name || q?.hospitalName || '').toLowerCase();
      return userName.includes(keyword) || userPhone.includes(keyword) || hospitalName.includes(keyword);
    });
  }, [queues, searchTerm]);

  const filteredQueues = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getStatusPriority = (q: any): number => {
      const jobStatus = q?.job?.status;
      const queueStatus = q?.status;

      if (jobStatus && ACTIVE_JOB_STATUSES.has(jobStatus)) return 0;

      if (
        jobStatus === "COMPLETED" ||
        queueStatus === "COMPLETED"
      ) return 2;

      return 1;
    };

    const getQueueDateTime = (q: any): number => {
      const dateStr = q.requestDate || q.createdAt;
      if (!dateStr) return 0;
      const base = new Date(dateStr);
      if (q.bookingTime) {
        const parts = String(q.bookingTime).split(":");
        if (parts.length >= 2) {
          base.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
        }
      }
      return base.getTime();
    };

    const normalized = [...queues]
      .filter((q) => {
        if (isCancelledQueue(q)) return false;
        const dateStr = q.requestDate || q.createdAt;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        return d >= today;
      })
      .sort((a, b) => {
        const aDateTime = getQueueDateTime(a);
        const bDateTime = getQueueDateTime(b);
        if (aDateTime !== bDateTime) return aDateTime - bDateTime;

        const priorityDiff = getStatusPriority(a) - getStatusPriority(b);
        if (priorityDiff !== 0) return priorityDiff;

        return (a.id || 0) - (b.id || 0);
      });

    let result = normalized;

    if (filter === "active") {
      result = result.filter((q) => ACTIVE_JOB_STATUSES.has(q?.job?.status));
    } else if (filter === "pending") {
      result = result.filter(
        (q) =>
          (PENDING_QUEUE_STATUSES.has(q?.status) ||
            PENDING_JOB_STATUSES.has(q?.job?.status)) &&
          !ACTIVE_JOB_STATUSES.has(q?.job?.status),
      );
    }

    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return result;

    return result.filter((q) => {
      const userName = getDisplayName(q?.user).toLowerCase();
      const userPhone = String(q?.user?.phone || "").toLowerCase();
      const hospitalName = String(q?.hospital?.name || q?.hospitalName || "").toLowerCase();
      const careuName = getDisplayName(q?.job?.careu || q?.job?.careuUser).toLowerCase();
      const driverName = getDisplayName(q?.job?.vlt || q?.job?.driver).toLowerCase();
      const queueId = String(q?.id || "").toLowerCase();

      return (
        userName.includes(keyword) ||
        userPhone.includes(keyword) ||
        hospitalName.includes(keyword) ||
        careuName.includes(keyword) ||
        driverName.includes(keyword) ||
        queueId.includes(keyword)
      );
    });
  }, [queues, filter, searchTerm]);

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base sm:text-lg font-bold text-slate-900">
          ตารางการให้บริการ
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-[516px]">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                className="h-4 w-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="ค้นหาผู้รับบริการ / โรงพยาบาล"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder-slate-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
            <span className="hidden sm:inline">รูปแบบ:</span>
            <select
              className="h-11 w-[177px] border border-slate-200 rounded-lg px-2.5 py-1.5 pr-8 text-slate-700 bg-white appearance-none bg-no-repeat"
              value={viewType}
              onChange={(event) => setViewType(event.target.value as ViewKey)}
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                backgroundPosition: "right 0.5rem center",
              }}
            >
              <option value="table">แบบตาราง</option>
              <option value="calendar">แบบปฏิทิน</option>
              <option value="card">แบบการ์ด</option>
              <option value="timeline">แบบไทม์ไลน์</option>
            </select>
          </div>
        </div>
      </div>

      {viewType === "calendar" ? (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          <div className="h-full">
            <DashboardCalendar
              queues={calendarQueues}
              selectedDate={calendarDate}
              onDateSelect={setCalendarDate}
            />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-fit">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                งานของวันที่ {formatDate(calendarDate)}
              </h3>
            </div>
            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {calendarQueues.filter((q) => getQueueLocalDateStr(q) === calendarDate).length === 0 ? (
                <div className="text-center text-sm text-slate-400 py-10">
                  ไม่มีงานในวันที่เลือก
                </div>
              ) : (
                calendarQueues.filter((q) => getQueueLocalDateStr(q) === calendarDate).map((queue, index) => {
                  const careuName = getDisplayName(
                    queue?.job?.careu || queue?.job?.careuUser,
                  );
                  const driverName = getDisplayName(
                    queue?.job?.vlt || queue?.job?.driver,
                  );
                  const status = getScheduleStatus(queue);
                  const timeText = queue?.bookingTime || "-";

                  return (
                    <div
                      key={queue?.id || index}
                      className="rounded-xl border border-slate-200 p-4 shadow-sm bg-white"
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={queue?.user?.pictureUrl || "/placeholder-avatar.jpg"}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover bg-slate-100"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {getDisplayName(queue?.user)}
                            </div>
                            <div className="text-xs text-slate-500">
                              {queue?.user?.phone || "-"}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="border-t border-slate-100 pt-3 pb-3">
                        <div className="text-xs text-slate-400 mb-1">รายละเอียด</div>
                        <div className="text-sm font-medium text-slate-700">
                          {queue?.hospital?.name || queue?.hospitalName || "-"}
                        </div>
                        <div className="text-sm font-medium text-slate-700">
                          {formatDate(calendarDate)} {timeText}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3 flex flex-col gap-3">
                        <div className="text-xs text-slate-400">จิตอาสา</div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                              {queue?.job?.careu?.pictureUrl || queue?.job?.careuUser?.pictureUrl ? (
                                <img src={queue?.job?.careu?.pictureUrl || queue?.job?.careuUser?.pictureUrl} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <span className="text-xs font-medium text-slate-500">{careuName.charAt(0)}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-slate-900 truncate">{careuName} (จิตอาสา)</div>
                              <div className="text-[10px] text-slate-500">{queue?.job?.careu?.phone || queue?.job?.careuUser?.phone || "-"}</div>
                            </div>
                          </div>
                          <div className="flex-1 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                              {queue?.job?.vlt?.pictureUrl || queue?.job?.driver?.pictureUrl ? (
                                <img src={queue?.job?.vlt?.pictureUrl || queue?.job?.driver?.pictureUrl} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <span className="text-xs font-medium text-slate-500">{driverName.charAt(0)}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-slate-900 truncate">{driverName} (คนขับรถ)</div>
                              <div className="text-[10px] text-slate-500">{queue?.job?.vlt?.phone || queue?.job?.driver?.phone || "-"}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : viewType === "card" ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {filteredQueues.length === 0 ? (
            <div className="col-span-full py-10 text-center text-sm text-slate-400">
              ไม่พบข้อมูล
            </div>
          ) : (
            filteredQueues.map((queue, index) => {
              const careuName = getDisplayName(
                queue?.job?.careu || queue?.job?.careuUser,
              );
              const driverName = getDisplayName(
                queue?.job?.vlt || queue?.job?.driver,
              );
              const status = getScheduleStatus(queue);
              const dateText = formatDate(
                queue?.requestDate || queue?.createdAt,
              );
              const timeText = queue?.bookingTime || "-";

              return (
                <div
                  key={queue?.id || index}
                  className="rounded-2xl border border-slate-200 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {getDisplayName(queue?.user)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {dateText} {timeText}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${status.className}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${status.dotClass}`}
                      />
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between gap-3">
                      <span>จิตอาสา</span>
                      <span className="font-medium text-emerald-700">
                        {careuName}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>เจ้าหน้าที่ขับรถ</span>
                      <span className="font-medium text-blue-700">
                        {driverName}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span>โรงพยาบาล</span>
                      <span className="font-medium text-slate-700">
                        {queue?.hospital?.name || queue?.hospitalName || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : viewType === "timeline" ? (
        <div className="mt-4 space-y-4">
          {filteredQueues.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              ไม่พบข้อมูล
            </div>
          ) : (
            filteredQueues.map((queue, index) => {
              const status = getScheduleStatus(queue);
              const dateText = formatDate(
                queue?.requestDate || queue?.createdAt,
              );
              const timeText = queue?.bookingTime || "-";

              return (
                <div
                  key={queue?.id || index}
                  className="flex items-start gap-4"
                >
                  <div className="flex flex-col items-center">
                    <span
                      className={`w-3 h-3 rounded-full ${status.dotClass}`}
                    />
                    {index < filteredQueues.length - 1 && (
                      <span className="w-px flex-1 bg-slate-200" />
                    )}
                  </div>
                  <div className="flex-1 rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">
                        {getDisplayName(queue?.user)}
                      </div>
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${status.className}`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${status.dotClass}`}
                        />
                        {status.label}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      {dateText} {timeText}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      โรงพยาบาล:{" "}
                      {queue?.hospital?.name || queue?.hospitalName || "-"}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold text-slate-500">
                <th className="py-3 px-4">วันเวลานัดหมาย</th>
                <th className="py-3 px-4">ผู้ขอใช้บริการ</th>
                <th className="py-3 px-4">จิตอาสาแคร์ยู</th>
                <th className="py-3 px-4">เจ้าหน้าที่ขับรถ</th>
                <th className="py-3 px-4">โรงพยาบาล</th>
                <th className="py-3 px-4 flex justify-center">สถานะ</th>
                <th className="py-3 px-4 w-10"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQueues.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-10 text-center text-sm text-slate-400"
                  >
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                filteredQueues.map((queue, index) => {
                  const careuName = getDisplayName(
                    queue?.job?.careu || queue?.job?.careuUser,
                  );
                  const driverName = getDisplayName(
                    queue?.job?.vlt || queue?.job?.driver,
                  );
                  const userName = getDisplayName(queue?.user);
                  const userPhone = queue?.user?.phone || "-";
                  const careuPhone =
                    queue?.job?.careu?.phone ||
                    queue?.job?.careuUser?.phone ||
                    "-";
                  const driverPhone =
                    queue?.job?.vlt?.phone || queue?.job?.driver?.phone || "-";
                  const status = getScheduleStatus(queue);
                  const dateText = formatDate(
                    queue?.requestDate || queue?.createdAt,
                  );
                  const timeText = queue?.bookingTime || "-";

                  return (
                    <tr
                      key={queue?.id || index}
                      className="text-sm text-slate-700"
                    >
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {dateText}
                          </span>
                          <span className="text-xs text-slate-500">
                            {timeText}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {queue?.user?.pictureUrl ? (
                              <img
                                src={queue?.user?.pictureUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="text-xs font-medium text-slate-500">
                                {userName.charAt(0) || "-"}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 truncate">
                              {userName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {userPhone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {queue?.job?.careu?.pictureUrl ||
                              queue?.job?.careuUser?.pictureUrl ? (
                              <img
                                src={
                                  queue?.job?.careu?.pictureUrl ||
                                  queue?.job?.careuUser?.pictureUrl
                                }
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="text-xs font-medium text-slate-500">
                                {careuName.charAt(0) || "-"}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium  truncate">
                              {careuName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {careuPhone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {queue?.job?.vlt?.pictureUrl ||
                              queue?.job?.driver?.pictureUrl ? (
                              <img
                                src={
                                  queue?.job?.vlt?.pictureUrl ||
                                  queue?.job?.driver?.pictureUrl
                                }
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="text-xs font-medium text-slate-500">
                                {driverName.charAt(0) || "-"}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 truncate">
                              {driverName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {driverPhone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {queue?.hospital?.name || queue?.hospitalName || "-"}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-end">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${status.className}`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${status.dotClass}`}
                            />
                            {status.label}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setSelectedQueue(queue)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                          aria-label="ดูรายละเอียด"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedQueue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
              <div>
                <div className="text-sm text-slate-500">รายละเอียดคิว</div>
                <div className="text-lg font-semibold text-slate-900">
                  {getDisplayName(selectedQueue?.user)}
                </div>
              </div>
              <button
                onClick={() => setSelectedQueue(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="ปิด"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 flex-1 overflow-y-auto min-h-0">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs text-slate-500">ผู้ขอใช้บริการ</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">
                    {getDisplayName(selectedQueue?.user)}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 ">
                  <div className="text-xs text-slate-500">สถานะ</div>
                  <div className="mt-1">
                    {(() => {
                      const status = getScheduleStatus(selectedQueue);
                      return (
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${status.className}`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${status.dotClass}`}
                          />
                          {status.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div className="rounded-xl bg-white border border-slate-100 p-4">
                  <div className="text-xs text-slate-500">วันเวลานัดหมาย</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">
                    {formatDate(
                      selectedQueue?.requestDate || selectedQueue?.createdAt,
                    )}{" "}
                    {selectedQueue?.bookingTime || "-"}
                  </div>
                </div>
                <div className="rounded-xl bg-white border border-slate-100 p-4">
                  <div className="text-xs text-slate-500">โรงพยาบาล</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">
                    {selectedQueue?.hospital?.name ||
                      selectedQueue?.hospitalName ||
                      "-"}
                  </div>
                </div>
                <div className="rounded-xl bg-white border border-slate-100 p-4">
                  <div className="text-xs text-slate-500">จิตอาสา</div>
                  <div className="mt-1 text-sm font-medium text-emerald-700">
                    {getDisplayName(
                      selectedQueue?.job?.careu ||
                      selectedQueue?.job?.careuUser,
                    )}
                  </div>
                </div>
                <div className="rounded-xl bg-white border border-slate-100 p-4">
                  <div className="text-xs text-slate-500">เจ้าหน้าที่ขับรถ</div>
                  <div className="mt-1 text-sm font-medium text-blue-700">
                    {getDisplayName(
                      selectedQueue?.job?.vlt || selectedQueue?.job?.driver,
                    )}
                  </div>
                </div>
              </div>

              {trackingMapData?.showMap && trackingMapData.hasCoords && (
                <div className="mt-4">
                  <div className="text-xs font-medium text-slate-600 mb-2">แผนที่ติดตามเส้นทาง</div>
                  <JobTrackingMap
                    jobId={trackingMapData.jobId}
                    jobStatus={trackingMapData.jobStatus}
                    patientLatLng={trackingMapData.patientLatLng}
                    hospitalLatLng={trackingMapData.hospitalLatLng}
                    isLive={trackingMapData.isLive}
                    patientPictureUrl={selectedQueue?.user?.pictureUrl}
                    patientName={getDisplayName(selectedQueue?.user)}
                    className="h-72 w-full"
                  />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {selectedQueue?.job?.returnEvidenceUrl && (
                  <div className="rounded-xl bg-white border border-slate-100 p-4 sm:col-span-2">
                    <div className="text-xs text-slate-500 mb-2">หลักฐานการปฏิบัติงาน (ส่งผู้ใช้ถึงบ้าน)</div>
                    <img
                      src={selectedQueue.job.returnEvidenceUrl}
                      alt="หลักฐาน"
                      className="w-full max-h-[300px] object-contain rounded-lg border border-slate-200 bg-slate-50"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
