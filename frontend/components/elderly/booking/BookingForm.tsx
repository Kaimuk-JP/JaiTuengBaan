"use client";

import { useState, useEffect } from "react";
import { getApiUrl } from '@/lib/api';
import { fetchWithAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import LayoutWithSidebar from "@/components/shared/LayoutWithSidebar";
import ElderlySidebar from "@/components/elderly/sidebar/ElderlySidebar";
import ElderlyHeader from "@/components/elderly/header/ElderlyHeader";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "@/components/elderly/types";
import { AppointmentTypeSelector } from "@/components/elderly/booking/AppointmentTypeSelector";
import { BookingFormFields } from "@/components/elderly/booking/BookingFormFields";
import { AppointmentImageUpload } from "@/components/elderly/booking/AppointmentImageUpload";
import { EquipmentSelector } from "@/components/shared/EquipmentSelector";
import Swal from '@/lib/swal';
import { validateFile } from '@/utils/fileValidation';

export default function BookingForm() {
  const router = useRouter();
    const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orgPhone, setOrgPhone] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    fetchWithAuth('/settings/organization/phone')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.phone) setOrgPhone(data.phone);
        if (data?.name) setOrgName(data.name);
      })
      .catch(() => { });
  }, []);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasAppointment, setHasAppointment] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    hospital: "",
    hospitalId: null as number | null,
    bookingDate: "",
    bookingTime: "",
    bookedFor: "self",
    appointmentFile: null as File | null,
    selectedEquipment: [] as string[],
    wantCareU: true,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const validation = validateFile(file, {
        maxSize: 15 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });

      if (!validation.valid) {
        Swal.fire({
          icon: 'warning',
          title: 'ไฟล์ไม่ถูกต้อง',
          text: validation.error,
          confirmButtonColor: '#1E7D55',
        });
        e.target.value = '';
        return;
      }

      setFormData({ ...formData, appointmentFile: file });

      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData({ ...formData, appointmentFile: null });
  };

  const handleSubmit = async () => {
    if (!user) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเข้าสู่ระบบก่อน',
        confirmButtonColor: '#1E7D55',
      });
      return;
    }

    if (formData.hospital && !formData.hospitalId) {
      Swal.fire({
        icon: 'warning',
        title: 'ไม่พบรายชื่อโรงพยาบาล',
        text: 'กรุณาเลือกโรงพยาบาลจากรายการที่แสดง หากไม่พบข้อมูล กรุณาติดต่อเจ้าหน้าที่',
        confirmButtonColor: '#1E7D55',
      });
      return;
    }

    {
      const missingBookingFields: string[] = [];
      if (!formData.hospital || !formData.hospitalId) missingBookingFields.push('โรงพยาบาล');
      if (!formData.bookingDate) missingBookingFields.push('วันที่นัด');
      if (!formData.bookingTime) missingBookingFields.push('เวลานัด');

      if (missingBookingFields.length > 0) {
        Swal.fire({
          icon: 'warning',
          title: 'กรุณากรอกข้อมูลให้ครบ',
          html: `ข้อมูลต่อไปนี้ยังไม่ได้กรอก:<br/><br/><ul style="text-align: left; list-style: disc; padding-left: 20px; font-size: 15px;">${missingBookingFields.map(f => `<li>${f}</li>`).join('')}</ul>`,
          confirmButtonColor: '#1E7D55',
        });
        return;
      }
    }

    if (hasAppointment && !formData.appointmentFile) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาแนบใบนัดแพทย์',
        text: 'เนื่องจากคุณเลือกจองแบบ "มีใบนัด" กรุณาอัปโหลดรูปใบนัดแพทย์',
        confirmButtonColor: '#1E7D55',
      });
      return;
    }

    if (formData.hospital.length > 255) {
      Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ถูกต้อง',
        text: 'ชื่อโรงพยาบาล ต้องไม่เกิน 255 ตัวอักษร',
        confirmButtonColor: '#1E7D55',
      });
      return;
    }

    const confirmResult = await Swal.fire({
      title: 'ยืนยันข้อมูลการจอง',
      html: `
        <div style="text-align: left; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; margin-top: 12px; font-size: 15px;">
          <p style="margin-bottom: 8px;"><b>${formData.hospital}</b></p>
          <p style="margin-bottom: 8px;"><b>วันที่:</b> ${formData.bookingDate.split('-').reverse().join('/')}</p>
          <p style="margin-bottom: 8px;"><b>เวลา:</b> ${formData.bookingTime ? formData.bookingTime + ' น.' : 'ไม่ระบุ'}</p>
          <p style="margin-bottom: 8px;"><b>อุปกรณ์:</b> ${formData.selectedEquipment.length > 0 ? formData.selectedEquipment.join(', ') : 'ไม่ต้องการ'}</p>
          <p style="margin-bottom: 0px; display: flex; align-items: center; gap: 8px;"><b>จิตอาสาแคร์ยู</b> ${formData.wantCareU ? `<svg fill="#000000" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20px" height="20px" viewBox="0 0 72.00 72.00" enable-background="new 0 0 72 72" xml:space="preserve" stroke="#000000" strokeWidth="0.00072"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M24.014,70.462c-2.617,0-5.073-1.016-6.917-2.859L2.175,53.877c-1.908-1.906-2.926-4.364-2.926-6.979 s1.018-5.072,2.866-6.92c1.849-1.849,4.307-2.866,6.921-2.866c2.591,0,5.029,1,6.872,2.818l8.102,7.109L55.861,4.618 c0.057-0.075,0.119-0.146,0.186-0.213c1.849-1.85,4.307-2.867,6.921-2.867s5.072,1.018,6.921,2.867 c3.784,3.784,3.815,9.923,0.093,13.747L31.697,67.416c-0.051,0.065-0.106,0.128-0.165,0.188c-1.914,1.912-4.498,2.926-7.214,2.854 C24.216,70.46,24.116,70.462,24.014,70.462z M9.037,41.112c-1.546,0-2.999,0.602-4.093,1.695C3.851,43.9,3.25,45.353,3.25,46.898 s0.602,3,1.694,4.093l14.922,13.726c1.148,1.146,2.6,1.914,4.148,1.914l0.227,0.164c0.05,0,0.1,0,0.151,0l0.221-0.164 c1.51,0,2.929-0.654,4.008-1.69l38.275-49.294c0.051-0.065,0.105-0.148,0.165-0.207c2.256-2.258,2.256-5.939,0-8.195 c-1.094-1.094-2.547-1.701-4.093-1.701c-1.502,0-2.917,0.566-3.999,1.602L25.914,51.169c-0.335,0.445-0.84,0.73-1.394,0.787 c-0.551,0.057-1.106-0.118-1.525-0.486l-9.771-8.573c-0.032-0.028-0.064-0.058-0.095-0.089 C12.036,41.714,10.583,41.112,9.037,41.112z"></path> </g> </g></svg> ต้องการ` : `ไม่ต้องการ`}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#1E7D55',
      cancelButtonColor: '#94A3B8',
      confirmButtonText: 'ยืนยันการจอง',
      cancelButtonText: 'กลับไปแก้ไข',
      reverseButtons: true
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      let appointmentImageUrl = null;

      if (hasAppointment && formData.appointmentFile) {
        const imageFormData = new FormData();
        imageFormData.append('file', formData.appointmentFile);

        const uploadResponse = await fetchWithAuth('/upload/appointment-image', {
          method: 'POST',
          body: imageFormData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          appointmentImageUrl = uploadData.imageUrl || uploadData.url;
        } else {
          const errBody = await uploadResponse.text().catch(() => 'no body');
          console.error('Upload failed:', uploadResponse.status, errBody);
          throw new Error(`ไม่สามารถอัปโหลดรูปใบนัดได้ (${uploadResponse.status})`);
        }
      }

      let severityLevel: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
      if (user.mobilityStatus === 'BEDRIDDEN') {
        severityLevel = 'RED';
      } else if (user.mobilityStatus === 'WHEELCHAIR') {
        severityLevel = 'YELLOW';
      }

      const requiredEquipment = formData.selectedEquipment.length > 0 ? formData.selectedEquipment.join(', ') : null;

      const queueData = {
        userId: user.id,
        hospitalId: Number(formData.hospitalId),
        requestDate: formData.bookingDate,
        bookingTime: formData.bookingTime,
        hasAppointment: hasAppointment,
        appointmentImage: appointmentImageUrl,
        requiredEquipment: requiredEquipment,
        severityLevel: severityLevel,
        wantCareU: formData.wantCareU,
      };

      const response = await fetchWithAuth('/queues', {
        method: 'POST',
        body: JSON.stringify(queueData),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'ไม่สามารถจองคิวได้');
      }

      await Swal.fire({
        icon: 'success',
        title: 'จองสำเร็จ!',
        confirmButtonColor: '#1E7D55',
        timer: 2000,
        showConfirmButton: false,
      });
      router.push('/elderly/confirm');
    } catch (error: any) {
      console.error('Error creating queue:', error);
      const isDuplicate = error.message?.includes('มีการจอง');
      Swal.fire({
        icon: isDuplicate ? 'warning' : 'error',
        title: isDuplicate ? 'มีการจองซ้ำ' : 'เกิดข้อผิดพลาด',
        html: isDuplicate
          ? `<div style="text-align:left; font-size:15px; line-height:1.7">
              <p>${error.message}</p>
              <hr style="margin:12px 0; border-color:#e2e8f0"/>
              <p style="color:#64748b">หากต้องการยกเลิกคิวเดิม กรุณาโทรติดต่อ <strong>${orgName || 'เทศบาลของท่าน'}</strong></p>
              ${orgPhone ? `<a href="tel:${orgPhone}" style="display:inline-flex; align-items:center; gap:8px; margin-top:10px; padding:10px 20px; background:#1E7D55; color:#fff; border-radius:12px; text-decoration:none; font-weight:600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                โทร ${orgPhone}
              </a>` : '<p style="color:#94a3b8; margin-top:8px">ไม่พบเบอร์โทรเทศบาล</p>'}
            </div>`
          : (error.message || 'ไม่สามารถจองคิวได้'),
        confirmButtonColor: '#1E7D55',
      });
      setIsSubmitting(false);
    }
  };

  const getSeverityLevel = (mobilityStatus: string | undefined) => {
    if (!mobilityStatus) return null;

    switch (mobilityStatus) {
      case "WALKING":
        return {
          level: "GREEN",
          label: "เดินได้ปกติ",
          color: "bg-status-stable",
          icon: "🟢",
        };
      case "WHEELCHAIR":
        return {
          level: "YELLOW",
          label: "ต้องดูแลเพิ่ม",
          color: "bg-status-warning",
          icon: "🟡",
        };
      case "BEDRIDDEN":
        return {
          level: "RED",
          label: "ต้องดูแลใกล้ชิด",
          color: "bg-status-danger",
          icon: "🔴",
        };
      default:
        return null;
    }
  };

  const severityLevel = getSeverityLevel(user?.mobilityStatus);

  return (
    <LayoutWithSidebar role="USERS" showSidebar={false} user={user}>
      <div className="min-h-[100dvh] h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#F5F5F5] dark:bg-gray-900 pb-24">
        <ElderlySidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="bg-gradient-to-bl from-[#3AAE7D] to-[#346D55] dark:from-slate-800 dark:to-slate-900 text-white">
            <ElderlyHeader user={user} variant="default" onToggleSidebar={() => setSidebarOpen(true)} />
        </div>

        <div className="px-4 mt-6 max-w-md mx-auto space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white leading-tight">
                จองคิวรถรับส่ง
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">กรุณากรอกข้อมูลเพื่อทำการจองคิว</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary text-white text-xs">1</span>
              ประเภทการนัดหมาย
            </h2>
            <AppointmentTypeSelector
              hasAppointment={hasAppointment}
              onSelect={setHasAppointment}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary text-white text-xs">2</span>
              ข้อมูลการจอง
            </h2>
            <BookingFormFields
              hospital={formData.hospital}
              bookingTime={formData.bookingTime}
              bookingDate={formData.bookingDate}
              bookedFor={formData.bookedFor}
              hasAppointment={hasAppointment}
              showBookedForField={user?.roles?.includes('CAREGIVER')}
              onHospitalChange={(value) => setFormData({ ...formData, hospital: value })}
              onHospitalSelect={(h) => setFormData(prev => ({ ...prev, hospitalId: h?.id || null }))}
              onTimeChange={(value) => setFormData({ ...formData, bookingTime: value })}
              onDateChange={(value) => setFormData({ ...formData, bookingDate: value })}
              onBookedForChange={(value) => setFormData({ ...formData, bookedFor: value })}
            />

            {hasAppointment && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700 mt-4">
                <AppointmentImageUpload
                  imagePreview={imagePreview}
                  onFileChange={handleFileChange}
                  onRemove={handleRemoveImage}
                />
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary text-white text-xs">3</span>
              ความต้องการเพิ่มเติม
            </h2>
            <div className="mt-2x">
              <EquipmentSelector
                selectedEquipment={formData.selectedEquipment}
                onSelectionChange={(selected) => setFormData({ ...formData, selectedEquipment: selected })}
              />
            </div>

            {}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                ต้องการจิตอาสาแคร์ยูไปเป็นเพื่อนไหม?
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, wantCareU: true })}
                  className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-2xl border-2 transition-all duration-300 ${formData.wantCareU
                    ? 'border-brand-primary bg-brand-primary/10 text-brand-primary shadow-sm'
                    : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:border-brand-primary/30 hover:bg-gray-50'
                    }`}
                >
                  <svg className={`w-7 h-7 ${formData.wantCareU ? 'text-brand-primary' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="font-bold text-sm">ต้องการ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, wantCareU: false })}
                  className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-2xl border-2 transition-all duration-300 ${!formData.wantCareU
                    ? 'border-gray-300 bg-gray-50 dark:bg-gray-700 text-gray-700 shadow-sm'
                    : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <svg className={`w-7 h-7 ${!formData.wantCareU ? 'text-gray-500' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-12.728 12.728m12.728-.707l-1.414 1.414M5.636 5.636l1.414-1.414M12 2v2m0 16v2M2 12h2m16 0h2" />
                  </svg>
                  <span className="font-bold text-sm">ไม่ต้องการ</span>
                </button>
              </div>
              {formData.wantCareU && (
                <div className="mt-3 bg-brand-primary/5 rounded-xl p-3 flex items-start gap-2 border border-brand-primary/10">
                  <svg className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-xs text-brand-primary leading-relaxed">
                    จิตอาสาแคร์ยู (CareU) จะเดินทางไปเป็นเพื่อน และช่วยเหลือคุณที่โรงพยาบาลในวันนัดหมาย
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 z-40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="max-w-md mx-auto">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full py-3.5 px-4 rounded-xl transition-all font-bold text-[15px] flex items-center justify-center gap-2 ${isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-brand-primary text-white hover:bg-[#2C8B64] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md'
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังดำเนินการ...
                  </>
                ) : (
                  <>
                    ยืนยันการจอง
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </button>
            </div>
        </div>
      </div>
    </LayoutWithSidebar>
  );
}
