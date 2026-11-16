'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
    Upload, X, Shield, Save, Phone, Pencil, ShieldCheck, MapPin, Lock, 
    CalendarClock, Clock, CalendarDays, Calendar, CheckCircle2, AlertCircle, 
    ExternalLink, Eye, EyeOff, Bot, RefreshCw, KeyRound, Sparkles, HelpCircle,
    Smartphone, ChevronRight, ChevronDown, Building2 
} from 'lucide-react';
import { fetchWithAuth } from '@/lib/auth';
import Swal from 'sweetalert2';
import { 
    getOrganizationLineOa, 
    updateOrganizationLineOa, 
    testOrganizationLineOaToken, 
    OrganizationLineOaConfig 
} from '@/lib/lineService';

export default function OrganizationSettings() {
    const { user: currentUser } = useAuth();
    const isExecutive = currentUser?.role === 'EXECUTIVE' || currentUser?.role === 'ADMIN';
    const [organization, setOrganization] = useState<any>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [formLat, setFormLat] = useState<string>('');
    const [formLng, setFormLng] = useState<string>('');
    const [formPhone, setFormPhone] = useState<string>('');
    const [isSavingData, setIsSavingData] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [executiveApprovalEnabled, setExecutiveApprovalEnabled] = useState(true);
    const [isSavingExecutiveSetting, setIsSavingExecutiveSetting] = useState(false);
    const [lockReturnOfficeEnabled, setLockReturnOfficeEnabled] = useState(false);
    const [returnOfficeRadiusMeters, setReturnOfficeRadiusMeters] = useState(200);
    const [isSavingLockSetting, setIsSavingLockSetting] = useState(false);
    const [allowUserCancelQueue, setAllowUserCancelQueue] = useState(true);
    const [cancelQueueUnit, setCancelQueueUnit] = useState<'DAYS' | 'HOURS'>('DAYS');
    const [cancelQueueValue, setCancelQueueValue] = useState<number>(1);
    const [customUserCancelInput, setCustomUserCancelInput] = useState<string>('1');
    const [isSavingCancellationSetting, setIsSavingCancellationSetting] = useState(false);
    const [allowVolunteerCancelJob, setAllowVolunteerCancelJob] = useState(true);
    const [volunteerCancelUnit, setVolunteerCancelUnit] = useState<'DAYS' | 'HOURS'>('DAYS');
    const [volunteerCancelValue, setVolunteerCancelValue] = useState<number>(1);
    const [customVolunteerCancelInput, setCustomVolunteerCancelInput] = useState<string>('1');
    const [isSavingVolunteerCancellationSetting, setIsSavingVolunteerCancellationSetting] = useState(false);
    const [advanceBookingLimitEnabled, setAdvanceBookingLimitEnabled] = useState(true);
    const [advanceBookingUnit, setAdvanceBookingUnit] = useState<'DAYS' | 'HOURS'>('DAYS');
    const [advanceBookingValue, setAdvanceBookingValue] = useState<number>(1);
    const [customAdvanceInput, setCustomAdvanceInput] = useState<string>('1');
    const [isSavingAdvanceBookingSetting, setIsSavingAdvanceBookingSetting] = useState(false);
    const [lineNotificationEnabled, setLineNotificationEnabled] = useState(true);
    const [isSavingLineNotificationSetting, setIsSavingLineNotificationSetting] = useState(false);

    const [lineOaConfig, setLineOaConfig] = useState<OrganizationLineOaConfig | null>(null);
    const [lineUseCustomOa, setLineUseCustomOa] = useState(false);
    const [lineChannelId, setLineChannelId] = useState('');
    const [lineChannelSecret, setLineChannelSecret] = useState('');
    const [lineChannelAccessToken, setLineChannelAccessToken] = useState('');
    const [lineLiffId, setLineLiffId] = useState('');
    const [lineBotBasicId, setLineBotBasicId] = useState('');
    const [hasChannelSecret, setHasChannelSecret] = useState(false);
    const [hasChannelAccessToken, setHasChannelAccessToken] = useState(false);
    const [isEditingSecret, setIsEditingSecret] = useState(false);
    const [isEditingToken, setIsEditingToken] = useState(false);
    const [showChannelSecret, setShowChannelSecret] = useState(false);
    const [showAccessToken, setShowAccessToken] = useState(false);
    const [isSavingLineOa, setIsSavingLineOa] = useState(false);
    const [isTestingLineOa, setIsTestingLineOa] = useState(false);
    const [showLineGuide, setShowLineGuide] = useState(false);
    const [showAdvancedLineConfig, setShowAdvancedLineConfig] = useState(false);
    const [testBotResult, setTestBotResult] = useState<{
        displayName: string;
        basicId: string;
        pictureUrl?: string;
    } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchOrganization();
        fetchExecutiveApprovalSetting();
        fetchLineNotificationSetting();
        fetchOrganizationLineOa();
        fetchLockReturnOfficeSetting();
        fetchQueueCancellationSetting();
        fetchVolunteerCancellationSetting();
        fetchAdvanceBookingSetting();
    }, []);

    const fetchLineNotificationSetting = async () => {
        try {
            const response = await fetchWithAuth('/settings/line-notification-enabled');
            if (response.ok) {
                const data = await response.json();
                setLineNotificationEnabled(data.lineNotificationEnabled ?? true);
            }
        } catch (error) {
            console.error('Error fetching line notification setting:', error);
        }
    };

    const handleToggleLineNotification = async () => {
        const nextValue = !lineNotificationEnabled;
        setIsSavingLineNotificationSetting(true);
        try {
            const response = await fetchWithAuth('/settings/line-notification-enabled', {
                method: 'PUT',
                body: JSON.stringify({ enabled: nextValue }),
            });
            if (response.ok) {
                setLineNotificationEnabled(nextValue);
                Swal.fire({
                    icon: 'success',
                    title: nextValue ? 'เปิดระบบแจ้งเตือนผ่าน LINE แล้ว' : 'ปิดระบบแจ้งเตือนผ่าน LINE แล้ว',
                    text: nextValue
                        ? 'ระบบจะส่งข้อความแจ้งเตือนผ่าน LINE และแนะนำให้ประชาชนผูกบัญชี LINE'
                        : 'ระบบจะไม่ส่งข้อความแจ้งเตือนผ่าน LINE และจะไม่แสดงป็อปอัปแนะนำให้ผูกบัญชี LINE',
                    timer: 2500,
                    showConfirmButton: false,
                });
            }
        } catch (error) {
            console.error('Error saving line notification setting:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกการตั้งค่าได้',
            });
        } finally {
            setIsSavingLineNotificationSetting(false);
        }
    };

    const fetchOrganizationLineOa = async () => {
        try {
            const data = await getOrganizationLineOa();
            setLineOaConfig(data);
            setLineUseCustomOa(data.lineUseCustomOa ?? false);
            setLineChannelId(data.lineChannelId || '');
            setLineLiffId(data.lineLiffId || '');
            setLineBotBasicId(data.lineBotBasicId || '');
            setHasChannelSecret(data.hasChannelSecret ?? false);
            setHasChannelAccessToken(data.hasChannelAccessToken ?? false);
        } catch (error) {
            console.error('Error fetching organization line OA:', error);
        }
    };

    const handleSaveLineOa = async () => {
        const cleanLiff = lineLiffId.replace('https://liff.line.me/', '').trim();

        if (lineUseCustomOa) {
            if (!cleanLiff) {
                Swal.fire({
                    icon: 'warning',
                    title: 'กรุณากรอก LIFF ID หรือ LIFF URL',
                    text: 'ตัวอย่าง: 2009434685-ab99Ke7r หรือ https://liff.line.me/2009434685-ab99Ke7r',
                });
                return;
            }
        }

        const extractedChannelId = cleanLiff.includes('-') ? cleanLiff.split('-')[0] : (lineChannelId.trim() || undefined);

        setIsSavingLineOa(true);
        try {
            const result = await updateOrganizationLineOa({
                lineUseCustomOa,
                lineLiffId: cleanLiff || undefined,
                lineChannelId: extractedChannelId,
                lineBotBasicId: lineBotBasicId.trim() || undefined,
                lineChannelSecret: lineChannelSecret.trim() ? lineChannelSecret.trim() : undefined,
                lineChannelAccessToken: lineChannelAccessToken.trim() ? lineChannelAccessToken.trim() : undefined,
            });
            setLineOaConfig(result);
            setLineLiffId(result.lineLiffId || '');
            setLineChannelId(result.lineChannelId || '');
            setHasChannelSecret(result.hasChannelSecret);
            setHasChannelAccessToken(result.hasChannelAccessToken);
            setIsEditingSecret(false);
            setIsEditingToken(false);
            setLineChannelSecret('');
            setLineChannelAccessToken('');
            Swal.fire({
                icon: 'success',
                title: 'บันทึกสำเร็จ!',
                text: lineUseCustomOa
                    ? 'ระบบจะใช้งาน LIFF App ของเทศบาลคุณเรียบร้อยแล้ว'
                    : 'ระบบกลับมาใช้ค่าเริ่มต้นของส่วนกลางเรียบร้อยแล้ว',
                timer: 2500,
                showConfirmButton: false,
            });
        } catch (error: any) {
            console.error('Error updating LINE settings:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถบันทึกการตั้งค่าได้',
            });
        } finally {
            setIsSavingLineOa(false);
        }
    };

    const handleTestLineOa = async () => {
        const tokenToTest = lineChannelAccessToken.trim();
        if (!tokenToTest && !hasChannelAccessToken) {
            Swal.fire({
                icon: 'warning',
                title: 'ไม่พบ Access Token',
                text: 'กรุณากรอก Channel Access Token เพื่อทดสอบการเชื่อมต่อ',
            });
            return;
        }

        setIsTestingLineOa(true);
        setTestBotResult(null);
        try {
            const res = await testOrganizationLineOaToken(tokenToTest || '');
            if (res.success && res.bot) {
                setTestBotResult(res.bot);
                Swal.fire({
                    icon: 'success',
                    title: 'เชื่อมต่อสำเร็จ!',
                    html: `
                        <div class="text-left space-y-2 text-sm mt-2">
                            <p><b>ชื่อบอท:</b> ${res.bot.displayName}</p>
                            <p><b>Basic ID:</b> @${res.bot.basicId}</p>
                            <p class="text-emerald-600 font-medium">✓ Token ถูกต้องและระบบสามารถส่งข้อความได้ตามปกติ</p>
                        </div>
                    `,
                });
            } else {
                setTestBotResult(null);
                Swal.fire({
                    icon: 'error',
                    title: 'เชื่อมต่อไม่สำเร็จ',
                    text: res.error || 'Token ไม่ถูกต้องหรือหมดอายุ กรุณาตรวจสอบอีกครั้ง',
                });
            }
        } catch (error: any) {
            console.error('Test LINE OA error:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาดในการทดสอบ',
                text: error.message || 'ไม่สามารถทดสอบ Token ได้',
            });
        } finally {
            setIsTestingLineOa(false);
        }
    };

    const handleResetLineOaToDefault = async () => {
        const confirm = await Swal.fire({
            title: 'ยืนยันกลับไปใช้ LINE OA ส่วนกลาง?',
            text: 'ระบบจะเปลี่ยนกลับไปใช้ LINE Official Account ของระบบส่วนกลางสำหรับการแจ้งเตือน',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#1E7D55',
        });
        if (!confirm.isConfirmed) return;

        setIsSavingLineOa(true);
        try {
            const result = await updateOrganizationLineOa({
                lineUseCustomOa: false,
            });
            setLineUseCustomOa(false);
            setLineOaConfig(result);
            setTestBotResult(null);
            Swal.fire({
                icon: 'success',
                title: 'เปลี่ยนกลับเป็นค่าเริ่มต้นแล้ว',
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถบันทึกได้',
            });
        } finally {
            setIsSavingLineOa(false);
        }
    };

    const fetchAdvanceBookingSetting = async () => {
        try {
            const response = await fetchWithAuth('/settings/advance-booking');
            if (response.ok) {
                const data = await response.json();
                setAdvanceBookingLimitEnabled(data.advanceBookingLimitEnabled ?? true);
                const unit = data.advanceBookingUnit || 'DAYS';
                const val = data.advanceBookingValue ?? data.minAdvanceBookingDays ?? 1;
                setAdvanceBookingUnit(unit);
                setAdvanceBookingValue(val);
                setCustomAdvanceInput(String(val));
            }
        } catch (error) {
            console.error('Error fetching advance booking setting:', error);
        }
    };

    const handleToggleAdvanceBookingLimit = async () => {
        const nextValue = !advanceBookingLimitEnabled;
        setIsSavingAdvanceBookingSetting(true);
        try {
            const response = await fetchWithAuth('/settings/advance-booking', {
                method: 'PUT',
                body: JSON.stringify({
                    advanceBookingLimitEnabled: nextValue,
                    advanceBookingUnit,
                    advanceBookingValue,
                }),
            });
            if (response.ok) {
                setAdvanceBookingLimitEnabled(nextValue);
                const notice = advanceBookingUnit === 'DAYS'
                    ? (advanceBookingValue === 1 ? '1 วัน (เริ่มจองได้ตั้งแต่วันถัดไป)' : `${advanceBookingValue} วัน`)
                    : `${advanceBookingValue} ชั่วโมง`;
                Swal.fire({
                    icon: 'success',
                    title: nextValue ? 'เปิดระบบกำหนดเวลาจองล่วงหน้าแล้ว' : 'ปิดระบบกำหนดเวลาจองล่วงหน้าแล้ว',
                    text: nextValue
                        ? `ประชาชนต้องจองคิวก่อนเวลานัดหมายอย่างน้อย ${notice}`
                        : 'ประชาชนสามารถจองคิววันเดียวกันได้ทันทีโดยไม่จำกัดเวลาล่วงหน้า',
                    timer: 2500,
                    showConfirmButton: false,
                });
            }
        } catch (error) {
            console.error('Error saving advance booking setting:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกการตั้งค่าได้',
            });
        } finally {
            setIsSavingAdvanceBookingSetting(false);
        }
    };

    const handleSaveAdvanceBooking = async (unit: 'DAYS' | 'HOURS', val: number) => {
        setAdvanceBookingUnit(unit);
        setAdvanceBookingValue(val);
        setCustomAdvanceInput(String(val));
        try {
            await fetchWithAuth('/settings/advance-booking', {
                method: 'PUT',
                body: JSON.stringify({
                    advanceBookingLimitEnabled,
                    advanceBookingUnit: unit,
                    advanceBookingValue: val,
                }),
            });
        } catch (error) {
            console.error('Error updating advance booking:', error);
        }
    };

    const fetchQueueCancellationSetting = async () => {
        try {
            const response = await fetchWithAuth('/settings/queue-cancellation');
            if (response.ok) {
                const data = await response.json();
                setAllowUserCancelQueue(data.allowUserCancelQueue ?? true);
                const unit = data.cancelQueueUnit || 'DAYS';
                const val = data.cancelQueueValue ?? 1;
                setCancelQueueUnit(unit);
                setCancelQueueValue(val);
                setCustomUserCancelInput(String(val));
            }
        } catch (error) {
            console.error('Error fetching queue cancellation setting:', error);
        }
    };

    const handleSaveQueueCancellation = async (unit: 'DAYS' | 'HOURS', val: number) => {
        setCancelQueueUnit(unit);
        setCancelQueueValue(val);
        setCustomUserCancelInput(String(val));
        try {
            await fetchWithAuth('/settings/queue-cancellation', {
                method: 'PUT',
                body: JSON.stringify({
                    allowUserCancelQueue,
                    cancelQueueUnit: unit,
                    cancelQueueValue: val,
                }),
            });
        } catch (error) {
            console.error('Error updating queue cancel setting:', error);
        }
    };

    const handleToggleAllowUserCancelQueue = async () => {
        const nextValue = !allowUserCancelQueue;
        setIsSavingCancellationSetting(true);
        try {
            const response = await fetchWithAuth('/settings/queue-cancellation', {
                method: 'PUT',
                body: JSON.stringify({
                    allowUserCancelQueue: nextValue,
                    cancelQueueUnit,
                    cancelQueueValue,
                }),
            });
            if (response.ok) {
                setAllowUserCancelQueue(nextValue);
                const desc = cancelQueueUnit === 'DAYS'
                    ? (cancelQueueValue === 1 ? '1 วันก่อนวันเริ่มงาน (เช่น งาน 28 ยกเลิกได้ถึง 27)' : `${cancelQueueValue} วันก่อนวันเริ่มงาน`)
                    : `${cancelQueueValue} ชั่วโมงก่อนเวลานัดหมาย`;
                Swal.fire({
                    icon: 'success',
                    title: nextValue ? 'เปิดให้ประชาชนยกเลิกคิวได้' : 'ปิดการยกเลิกคิวโดยประชาชนแล้ว',
                    text: nextValue
                        ? `ประชาชนสามารถกดยกเลิกคิวก่อนเวลานัดหมายอย่างน้อย ${desc}`
                        : 'ประชาชนไม่สามารถกดยกเลิกคิวเองได้ (ต้องติดต่อเทศบาลเท่านั้น)',
                    timer: 2500,
                    showConfirmButton: false,
                });
            }
        } catch (error) {
            console.error('Error saving cancellation setting:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกการตั้งค่าได้',
            });
        } finally {
            setIsSavingCancellationSetting(false);
        }
    };

    const fetchVolunteerCancellationSetting = async () => {
        try {
            const response = await fetchWithAuth('/settings/volunteer-cancellation');
            if (response.ok) {
                const data = await response.json();
                setAllowVolunteerCancelJob(data.allowVolunteerCancelJob ?? true);
                const unit = data.volunteerCancelUnit || 'DAYS';
                const val = data.volunteerCancelValue ?? 1;
                setVolunteerCancelUnit(unit);
                setVolunteerCancelValue(val);
                setCustomVolunteerCancelInput(String(val));
            }
        } catch (error) {
            console.error('Error fetching volunteer cancellation setting:', error);
        }
    };

    const handleSaveVolunteerCancellation = async (unit: 'DAYS' | 'HOURS', val: number) => {
        setVolunteerCancelUnit(unit);
        setVolunteerCancelValue(val);
        setCustomVolunteerCancelInput(String(val));
        try {
            await fetchWithAuth('/settings/volunteer-cancellation', {
                method: 'PUT',
                body: JSON.stringify({
                    allowVolunteerCancelJob,
                    volunteerCancelUnit: unit,
                    volunteerCancelValue: val,
                }),
            });
        } catch (error) {
            console.error('Error updating volunteer cancel setting:', error);
        }
    };

    const handleToggleAllowVolunteerCancelJob = async () => {
        const nextValue = !allowVolunteerCancelJob;
        setIsSavingVolunteerCancellationSetting(true);
        try {
            const response = await fetchWithAuth('/settings/volunteer-cancellation', {
                method: 'PUT',
                body: JSON.stringify({
                    allowVolunteerCancelJob: nextValue,
                    volunteerCancelUnit,
                    volunteerCancelValue,
                }),
            });
            if (response.ok) {
                setAllowVolunteerCancelJob(nextValue);
                const desc = volunteerCancelUnit === 'DAYS'
                    ? (volunteerCancelValue === 1 ? '1 วันก่อนวันเริ่มงาน (เช่น งาน 28 ยกเลิกได้ถึง 27)' : `${volunteerCancelValue} วันก่อนวันเริ่มงาน`)
                    : `${volunteerCancelValue} ชั่วโมงก่อนเวลานัดหมาย`;
                Swal.fire({
                    icon: 'success',
                    title: nextValue ? 'เปิดให้คนขับและแคร์ยูยกเลิกงานได้' : 'ปิดการยกเลิกงานโดยคนขับและแคร์ยูแล้ว',
                    text: nextValue
                        ? `คนขับและแคร์ยูสามารถกดยกเลิกงานก่อนเวลานัดหมายอย่างน้อย ${desc}`
                        : 'คนขับและแคร์ยูไม่สามารถกดยกเลิกงานเองได้ (ต้องติดต่อเทศบาลเท่านั้น)',
                    timer: 2500,
                    showConfirmButton: false,
                });
            }
        } catch (error) {
            console.error('Error saving volunteer cancellation setting:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกการตั้งค่าได้',
            });
        } finally {
            setIsSavingVolunteerCancellationSetting(false);
        }
    };

    const fetchLockReturnOfficeSetting = async () => {
        try {
            const response = await fetchWithAuth('/settings/lock-return-office');
            if (response.ok) {
                const data = await response.json();
                setLockReturnOfficeEnabled(data.lockReturnOfficeEnabled ?? false);
                setReturnOfficeRadiusMeters(data.returnOfficeRadiusMeters ?? 200);
            }
        } catch (error) {
            console.error('Error fetching lock return office setting:', error);
        }
    };

    const handleToggleLockReturnOffice = async () => {
        const nextValue = !lockReturnOfficeEnabled;
        setIsSavingLockSetting(true);
        try {
            const response = await fetchWithAuth('/settings/lock-return-office', {
                method: 'PUT',
                body: JSON.stringify({ enabled: nextValue, radiusMeters: returnOfficeRadiusMeters }),
            });
            if (response.ok) {
                setLockReturnOfficeEnabled(nextValue);
                Swal.fire({
                    icon: 'success',
                    title: nextValue ? 'เปิดระบบล็อคปุ่มนำรถกลับเทศบาลแล้ว' : 'ปิดระบบล็อคปุ่มนำรถกลับเทศบาลแล้ว',
                    text: nextValue
                        ? `ปุ่มจะล็อคจนกว่าคนขับจะเข้ามาในรัศมี ${returnOfficeRadiusMeters} เมตรรอบเทศบาล`
                        : 'คนขับสามารถกดนำรถกลับถึงเทศบาลได้โดยไม่ตรวจจับรัศมี GPS',
                    timer: 2500,
                    showConfirmButton: false,
                });
            }
        } catch (error) {
            console.error('Error saving lock return office setting:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกการตั้งค่าได้',
            });
        } finally {
            setIsSavingLockSetting(false);
        }
    };

    const handleUpdateRadius = async (newRadius: number) => {
        setReturnOfficeRadiusMeters(newRadius);
        try {
            await fetchWithAuth('/settings/lock-return-office', {
                method: 'PUT',
                body: JSON.stringify({ enabled: lockReturnOfficeEnabled, radiusMeters: newRadius }),
            });
        } catch (error) {
            console.error('Error updating radius:', error);
        }
    };

    const fetchOrganization = async () => {
        try {
            const res = await fetchWithAuth('/settings/organization');
            if (res.ok) {
                const data = await res.json();
                setOrganization(data);
                if (data?.lat) setFormLat(data.lat.toString());
                if (data?.lng) setFormLng(data.lng.toString());
                if (data?.phone) setFormPhone(data.phone);

                if (data?.logoUrl) {
                    setPreviewUrl(`${process.env.NEXT_PUBLIC_API_URL}${data.logoUrl}`);
                }
            }
        } catch (error) {
            console.error('Error fetching organization:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchExecutiveApprovalSetting = async () => {
        try {
            const response = await fetchWithAuth('/settings/executive-approval-enabled');
            if (response.ok) {
                const data = await response.json();
                setExecutiveApprovalEnabled(data.executiveApprovalEnabled ?? true);
            }
        } catch (error) {
            console.error('Error fetching executive approval setting:', error);
        }
    };

    const handleToggleExecutiveApproval = async () => {
        const nextValue = !executiveApprovalEnabled;
        setIsSavingExecutiveSetting(true);
        try {
            const response = await fetchWithAuth('/settings/executive-approval-enabled', {
                method: 'PUT',
                body: JSON.stringify({ enabled: nextValue }),
            });
            if (response.ok) {
                setExecutiveApprovalEnabled(nextValue);
                Swal.fire({
                    icon: 'success',
                    title: nextValue ? 'เปิดระบบผู้อนุมัติแล้ว' : 'ปิดระบบผู้อนุมัติแล้ว',
                    text: nextValue
                        ? 'คำร้องจะต้องผ่านผู้บริหารอนุมัติก่อนมอบหมายงาน'
                        : 'เจ้าหน้าที่อนุมัติคำร้องแล้วจะไปขั้นตอนมอบหมายงานได้เลย',
                    timer: 2500,
                    showConfirmButton: false,
                });
            }
        } catch (error) {
            console.error('Error saving executive approval setting:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกการตั้งค่าได้',
            });
        } finally {
            setIsSavingExecutiveSetting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            Swal.fire({
                icon: 'error',
                title: 'ไฟล์ไม่ถูกต้อง',
                text: 'กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น'
            });
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            Swal.fire({
                icon: 'error',
                title: 'ขนาดไฟล์ใหญ่เกินไป',
                text: 'กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 10MB'
            });
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleCancel = () => {
        setSelectedFile(null);
        if (organization?.logoUrl) {
            setPreviewUrl(`${process.env.NEXT_PUBLIC_API_URL}${organization.logoUrl}`);
        } else {
            setPreviewUrl(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('logo', selectedFile);

            const res = await fetchWithAuth('/settings/organization/logo', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'บันทึกสำเร็จ',
                        text: 'อัปโหลดโลโก้เทศบาลเรียบร้อยแล้ว',
                        timer: 2000,
                        showConfirmButton: false
                    });

                    await fetchOrganization();
                    setSelectedFile(null);

                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('Upload error:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองใหม่อีกครั้ง'
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        if (organization?.lat) setFormLat(organization.lat.toString());
        else setFormLat('');
        if (organization?.lng) setFormLng(organization.lng.toString());
        else setFormLng('');
        if (organization?.phone) setFormPhone(organization.phone);
        else setFormPhone('');
    };

    const handleSaveInfo = async () => {
        if (!formLat || !formLng) {
            Swal.fire({
                icon: 'warning',
                title: 'กรอกข้อมูลไม่ครบ',
                text: 'กรุณาระบุพิกัดละติจูดและลองจิจูด'
            });
            return;
        }

        setIsSavingData(true);
        try {
            const res = await fetchWithAuth('/settings/organization', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lat: parseFloat(formLat),
                    lng: parseFloat(formLng),
                    phone: formPhone.trim() || null
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'บันทึกสำเร็จ',
                        text: 'อัปเดตข้อมูลหน่วยงานเรียบร้อยแล้ว',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    setIsEditing(false);
                    await fetchOrganization();
                }
            } else {
                throw new Error('Failed to update organization data');
            }
        } catch (error) {
            console.error('Update org data error:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถอัปเดตข้อมูลได้ กรุณาลองใหม่อีกครั้ง'
            });
        } finally {
            setIsSavingData(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">ข้อมูลเทศบาลและนโยบายหน่วยงาน</h2>
                <p className="text-sm text-slate-500 dark:text-gray-400">
                    จัดการโลโก้ ข้อมูลพื้นฐาน ระบบแจ้งเตือน LINE และนโยบายการดำเนินงาน
                </p>
            </div>

            <div className="flex flex-wrap gap-2 pb-1 border-b border-slate-100 dark:border-slate-700/60 sticky top-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md py-2 z-10">
                <a
                    href="#sec-org-info"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 transition-colors"
                >
                    <Building2 className="w-3.5 h-3.5" />
                    ข้อมูลทั่วไปและพิกัด
                </a>
                <a
                    href="#sec-line-oa"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 transition-colors"
                >
                    <Bot className="w-3.5 h-3.5 text-[#00C300]" />
                    LINE OA และการแจ้งเตือน
                </a>
                <a
                    href="#sec-geofence"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 transition-colors"
                >
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    ล็อกพิกัดสำนักงาน GPS
                </a>
                <a
                    href="#sec-policies"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 transition-colors"
                >
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    นโยบายการจองและยกเลิก
                </a>
            </div>

            <div id="sec-org-info" className="bg-slate-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-slate-100 dark:border-gray-700 scroll-mt-20">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    { }
                    <div className="flex flex-col items-center gap-4">
                        <span className="text-sm font-medium text-slate-700 dark:text-gray-300">ความคมชัดแนะนำ 512x512px</span>

                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center">
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Organization Logo"
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <Shield className="w-16 h-16 text-slate-300" />
                                )}
                            </div>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 w-10 h-10 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-brand-primary/90 transition-colors"
                                title="เปลี่ยนรูปภาพ"
                            >
                                <Upload className="w-5 h-5" />
                            </button>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                        />

                        {selectedFile && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCancel}
                                    disabled={isUploading}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isUploading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-xl hover:bg-brand-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isUploading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    บันทึก
                                </button>
                            </div>
                        )}
                    </div>

                    { }
                    <div className="flex-1 space-y-4 w-full">
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">
                                รหัสหน่วยงาน (Organization ID)
                            </label>
                            <input
                                type="text"
                                disabled
                                value={organization?.id || '-'}
                                className="w-full px-4 py-3 bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl text-slate-700 dark:text-gray-300"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">
                                ชื่อหน่วยงาน
                            </label>
                            <input
                                type="text"
                                disabled
                                value={organization?.name || '-'}
                                className="w-full px-4 py-3 bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl text-slate-700 dark:text-gray-300 font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">
                                    ละติจูด (Lat)
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={formLat}
                                    onChange={(e) => setFormLat(e.target.value)}
                                    disabled={!isEditing}
                                    placeholder="เช่น 13.7563"
                                    className={`w-full px-4 py-3 border rounded-xl text-slate-700 dark:text-gray-300 text-sm transition-all ${isEditing
                                        ? 'bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-600 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
                                        : 'bg-slate-100 dark:bg-gray-900 border-slate-200 dark:border-gray-700 cursor-not-allowed'
                                        }`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">
                                    ลองจิจูด (Lng)
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={formLng}
                                    onChange={(e) => setFormLng(e.target.value)}
                                    disabled={!isEditing}
                                    placeholder="เช่น 100.5018"
                                    className={`w-full px-4 py-3 border rounded-xl text-slate-700 dark:text-gray-300 text-sm transition-all ${isEditing
                                        ? 'bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-600 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
                                        : 'bg-slate-100 dark:bg-gray-900 border-slate-200 dark:border-gray-700 cursor-not-allowed'
                                        }`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">
                                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> เบอร์โทรหน่วยงาน</span>
                            </label>
                            <input
                                type="tel"
                                value={formPhone}
                                onChange={(e) => setFormPhone(e.target.value)}
                                disabled={!isEditing}
                                placeholder="เช่น 02-XXX-XXXX"
                                className={`w-full px-4 py-3 border rounded-xl text-slate-700 dark:text-gray-300 text-sm transition-all ${isEditing
                                    ? 'bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-600 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
                                    : 'bg-slate-100 dark:bg-gray-900 border-slate-200 dark:border-gray-700 cursor-not-allowed'
                                    }`}
                            />
                            <p className="text-xs text-slate-400 mt-1">เบอร์โทรนี้จะแสดงในหน้าประชาชนเมื่อกด &quot;โทรหาเจ้าหน้าที่&quot;</p>
                        </div>

                        <div className="flex justify-end mt-4 gap-3">
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-5 py-2.5 text-sm font-medium text-white bg-brand-primary rounded-xl hover:bg-brand-primary/90 transition-colors flex items-center gap-2"
                                >
                                    <Pencil className="w-4 h-4" />
                                    แก้ไขข้อมูล
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleCancelEdit}
                                        disabled={isSavingData}
                                        className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        onClick={handleSaveInfo}
                                        disabled={isSavingData}
                                        className="px-5 py-2.5 text-sm font-medium text-white bg-slate-800 dark:bg-gray-700 rounded-xl hover:bg-slate-700 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isSavingData ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        บันทึกข้อมูลหน่วยงาน
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isExecutive && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 overflow-hidden shadow-sm">
                    <div className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
                                <ShieldCheck className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base">ระบบผู้อนุมัติ (ผู้บริหาร)</h3>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-1">
                                    เปิดใช้เมื่อต้องให้ผู้บริหารอนุมัติคำร้องก่อนมอบหมายงาน — ปิดได้หากหน่วยงานไม่ใช้ขั้นตอนนี้
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleToggleExecutiveApproval}
                            disabled={isSavingExecutiveSetting}
                            className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${executiveApprovalEnabled ? 'bg-violet-500' : 'bg-slate-300 dark:bg-gray-600'}`}
                            aria-pressed={executiveApprovalEnabled}
                            aria-label={executiveApprovalEnabled ? 'ปิดระบบผู้อนุมัติ' : 'เปิดระบบผู้อนุมัติ'}
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${executiveApprovalEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>
                </div>
            )}

            <div id="sec-line-oa" className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 overflow-hidden shadow-sm scroll-mt-20">
                <div className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#00C300] flex items-center justify-center shadow-md flex-shrink-0">
                            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                                <path d="M19.365 9.864c0-4.08-4.195-7.4-9.365-7.4-5.17 0-9.365 3.32-9.365 7.4 0 3.655 3.27 6.72 7.7 7.28.3.065.707.2.81.458.093.235.06.602.03.84-.045.312-.21 1.22-.23 1.345-.035.195-.16.765.67.417.83-.348 4.48-2.64 6.115-4.52 2.37-2.6 3.64-4.11 3.64-5.82z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2">
                                ระบบแจ้งเตือนผ่าน LINE
                                {lineNotificationEnabled ? (
                                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                        เปิดใช้งาน
                                    </span>
                                ) : (
                                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-400">
                                        ปิดใช้งาน
                                    </span>
                                )}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
                                เปิด/ปิดระบบส่งข้อความแจ้งเตือนผ่าน LINE สำหรับคิวรถ งานใหม่ และการแจ้งเตือนประชาชน หากปิดระบบนี้ ระบบจะไม่ส่งข้อความแจ้งเตือนผ่าน LINE และจะไม่แสดงป็อปอัปแนะนำให้ผูกบัญชี LINE
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleToggleLineNotification}
                        disabled={isSavingLineNotificationSetting}
                        className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${lineNotificationEnabled ? 'bg-[#00C300]' : 'bg-slate-300 dark:bg-gray-600'}`}
                        aria-pressed={lineNotificationEnabled}
                        aria-label={lineNotificationEnabled ? 'ปิดระบบแจ้งเตือนผ่าน LINE' : 'เปิดระบบแจ้งเตือนผ่าน LINE'}
                    >
                        <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${lineNotificationEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                    </button>
                </div>

                {lineNotificationEnabled && (
                    <div className="border-t border-slate-100 dark:border-gray-700/80 bg-slate-50/60 dark:bg-gray-800/40 p-4 sm:p-6 space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Bot className="w-4 h-4 text-[#00C300]" />
                                    บัญชี LINE Official Account (LINE OA) ที่ใช้ส่งข้อความ
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                                    เลือกใช้ LINE OA ของระบบส่วนกลาง หรือนำ LINE OA ของเทศบาลมาใส่แทน เพื่อให้ประชาชนได้รับการแจ้งเตือนจากบัญชีของเทศบาลโดยตรง
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowLineGuide(!showLineGuide)}
                                className="inline-flex items-center gap-1.5 text-xs text-brand-primary hover:text-brand-primary/80 font-medium transition-colors self-start sm:self-auto"
                            >
                                <HelpCircle className="w-3.5 h-3.5" />
                                {showLineGuide ? 'ซ่อนวิธีตั้งค่า' : 'วิธีสร้าง LINE Bot ของเทศบาล'}
                            </button>
                        </div>

                        {showLineGuide && (
                            <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs space-y-2.5 text-slate-700 dark:text-slate-300">
                                <div className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-emerald-600" />
                                    ขั้นตอนการนำ LINE OA ของเทศบาลมาเชื่อมต่อกับระบบ
                                </div>
                                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-400 pl-1 leading-relaxed">
                                    <li>
                                        เข้าสู่ระบบที่{' '}
                                        <a
                                            href="https://developers.line.biz/console/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-brand-primary underline inline-flex items-center gap-0.5 font-medium"
                                        >
                                            LINE Developers Console <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </li>
                                    <li>สร้างหรือเลือก <b>Provider</b> (เช่น เทศบาล...) แล้วสร้าง Channel ประเภท <b>Messaging API</b> (หรือเชื่อมโยงกับ LINE OA ที่มีอยู่แล้ว)</li>
                                    <li>ไปที่แท็บ <b>Basic settings</b> คัดลอก <b>Channel ID</b> และ <b>Channel Secret</b></li>
                                    <li>ไปที่แท็บ <b>Messaging API</b> กดปุ่ม <b>Issue</b> ตรงหัวข้อ <b>Channel access token (long-lived)</b> แล้วคัดลอก Token มาวาง</li>
                                    <li>ระบุ <b>LINE Official Account Basic ID</b> (เช่น @เทศบาล...) เพื่อให้ประชาชนกดเพิ่มเพื่อนได้ถูกต้อง</li>
                                    <li>กดปุ่ม <b>&quot;ทดสอบการเชื่อมต่อ LINE&quot;</b> เพื่อตรวจสอบความถูกต้องก่อนกดบันทึก</li>
                                </ol>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div
                                onClick={() => {
                                    if (lineUseCustomOa) {
                                        setLineUseCustomOa(false);
                                    }
                                }}
                                className={`cursor-pointer p-4 rounded-xl border-2 transition-all relative ${
                                    !lineUseCustomOa
                                        ? 'bg-white dark:bg-gray-800 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
                                        : 'bg-white/60 dark:bg-gray-800/60 border-slate-200 dark:border-gray-700 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                            !lineUseCustomOa ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-gray-700'
                                        }`}>
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800 dark:text-white">
                                                LINE OA ส่วนกลาง
                                            </div>
                                            <div className="text-[11px] text-slate-500 dark:text-gray-400">
                                                (ค่าเริ่มต้นของระบบ)
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                        !lineUseCustomOa ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 dark:border-gray-600'
                                    }`}>
                                        {!lineUseCustomOa && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                </div>
                                <ul className="mt-3 text-xs text-slate-500 dark:text-gray-400 space-y-1">
                                    <li className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        พร้อมใช้งานทันที ไม่ต้องตั้งค่า API Token
                                    </li>
                                    <li className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        ส่งแจ้งเตือนผ่านบอทกลางของระบบ ใจส่งถึงบ้าน
                                    </li>
                                </ul>
                            </div>

                            <div
                                onClick={() => {
                                    if (!lineUseCustomOa) {
                                        setLineUseCustomOa(true);
                                    }
                                }}
                                className={`cursor-pointer p-4 rounded-xl border-2 transition-all relative ${
                                    lineUseCustomOa
                                        ? 'bg-white dark:bg-gray-800 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
                                        : 'bg-white/60 dark:bg-gray-800/60 border-slate-200 dark:border-gray-700 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                            lineUseCustomOa ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-gray-700'
                                        }`}>
                                            <Bot className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                                LINE OA ของเทศบาลเอง
                                                <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                    แนะนำ
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-slate-500 dark:text-gray-400">
                                                (ปรับแต่งตามแบรนด์หน่วยงาน)
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                        lineUseCustomOa ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 dark:border-gray-600'
                                    }`}>
                                        {lineUseCustomOa && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                </div>
                                <ul className="mt-3 text-xs text-slate-500 dark:text-gray-400 space-y-1">
                                    <li className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        ส่งข้อความด้วยชื่อและรูปโปรไฟล์ LINE เทศบาลโดยตรง
                                    </li>
                                    <li className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        ประชาชนมั่นใจ แอดไลน์เทศบาลที่เป็นทางการ
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {lineUseCustomOa && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-gray-700 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-700 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="w-4 h-4 text-emerald-600" />
                                        <span className="text-sm font-bold text-slate-800 dark:text-white">
                                            ตั้งค่า LINE LIFF สำหรับเทศบาล
                                        </span>
                                    </div>
                                    {lineOaConfig?.lineLiffId && (
                                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> กำหนดค่าแล้ว
                                        </span>
                                    )}
                                </div>

                                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold mb-0.5">ใช้งานง่ายเพียงระบุ LIFF ID หรือ LIFF URL อย่างเดียว</div>
                                        <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400">
                                            ระบบจะตรวจจับ Channel ID และเปิดให้ประชาชนผูกบัญชี LINE กับเทศบาลของคุณทันที ไม่จำเป็นต้องตั้งค่า Token ซับซ้อน
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                                        LIFF ID หรือ ลิงก์ LIFF URL ของเทศบาล <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                            <Smartphone className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            value={lineLiffId}
                                            onChange={(e) => setLineLiffId(e.target.value)}
                                            placeholder="เช่น 2009434685-ab99Ke7r หรือ https://liff.line.me/2009434685-ab99Ke7r"
                                            className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-slate-800 dark:text-gray-100 font-mono"
                                        />
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5">
                                        <p className="text-[11px] text-slate-400">
                                            คัดลอกได้จาก LINE Developers Console &gt; Channel ของเทศบาล &gt; แท็บ LIFF
                                        </p>
                                        {lineLiffId.trim() && (
                                            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/50">
                                                ✓ Channel ID อัตโนมัติ: {lineLiffId.replace('https://liff.line.me/', '').trim().split('-')[0] || '-'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                                        LINE OA Basic ID หรือ ลิงก์เพิ่มเพื่อน (ไม่บังคับ)
                                    </label>
                                    <input
                                        type="text"
                                        value={lineBotBasicId}
                                        onChange={(e) => setLineBotBasicId(e.target.value)}
                                        placeholder="เช่น @muang_phrae หรือ https://lin.ee/xxxxx"
                                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-slate-800 dark:text-gray-100"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">ใช้สำหรับแสดงปุ่มเพิ่มเพื่อน LINE OA ของเทศบาลในหน้าเชื่อมต่อของประชาชน</p>
                                </div>

                                <div className="border border-slate-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setShowAdvancedLineConfig(!showAdvancedLineConfig)}
                                        className="w-full flex items-center justify-between p-3 bg-slate-50/80 dark:bg-gray-900/50 hover:bg-slate-100 dark:hover:bg-gray-900 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-2">
                                            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-xs font-medium text-slate-700 dark:text-gray-300">
                                                การตั้งค่าขั้นสูง (Messaging API Token) - ไม่บังคับ
                                            </span>
                                            {hasChannelAccessToken && (
                                                <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-1.5 py-0.2 rounded font-medium">
                                                    มี Token แล้ว
                                                </span>
                                            )}
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showAdvancedLineConfig ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showAdvancedLineConfig && (
                                        <div className="p-4 space-y-3.5 border-t border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-800/80">
                                            <p className="text-xs text-slate-500 dark:text-gray-400">
                                                หากไม่ระบุ Token ระบบจะใช้ระบบส่งแจ้งเตือนของส่วนกลางให้อัตโนมัติ แต่หากต้องการส่ง Push Notification ผ่านโควต้าและบัญชีบอทของเทศบาลเองโดยตรง สามารถกรอกข้อมูลเพิ่มเติมได้ที่นี่
                                            </p>

                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                                                        Channel Secret ของ LINE Login
                                                    </label>
                                                    {hasChannelSecret && !isEditingSecret && (
                                                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> บันทึกแล้วอย่างปลอดภัย
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-500 dark:text-gray-400 mb-1.5">
                                                    คัดลอกจาก LINE Developers &gt; Channel LINE Login เดียวกันกับ Channel ID ด้านบน &gt; แท็บ <b>Basic settings</b>
                                                    <span className="text-amber-600 dark:text-amber-400 ml-1 font-medium">(⚠️ ห้ามใช้ Secret ของ Messaging API)</span>
                                                </p>

                                                {hasChannelSecret && !isEditingSecret ? (
                                                    <div className="p-3 bg-slate-50 dark:bg-gray-900/80 border border-slate-200 dark:border-gray-700 rounded-xl flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                                                            <div>
                                                                <span className="text-xs text-slate-600 dark:text-gray-300 font-mono tracking-widest font-bold">••••••••••••••••••••••••</span>
                                                                <p className="text-[10px] text-slate-400">ระบบเข้ารหัสความปลอดภัยไว้ (จะไม่แสดงค่าย้อนหลัง)</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsEditingSecret(true);
                                                                setLineChannelSecret('');
                                                            }}
                                                            className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200/60 dark:border-emerald-800/40 px-3 py-1.5 rounded-lg font-medium transition-colors"
                                                        >
                                                            แก้ไข / กรอก Secret ใหม่
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1.5">
                                                        <div className="relative">
                                                            <input
                                                                type={showChannelSecret ? 'text' : 'password'}
                                                                value={lineChannelSecret}
                                                                onChange={(e) => setLineChannelSecret(e.target.value)}
                                                                placeholder="วาง Channel Secret ของ LINE Login ที่นี่ (เช่น 6b39ac27b3f5c2...)"
                                                                className="w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm font-mono bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-slate-800 dark:text-gray-100"
                                                                autoFocus={isEditingSecret}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowChannelSecret(!showChannelSecret)}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                                                title={showChannelSecret ? 'ซ่อนรหัส' : 'แสดงรหัส'}
                                                            >
                                                                {showChannelSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                        {hasChannelSecret && (
                                                            <div className="flex justify-end">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setIsEditingSecret(false);
                                                                        setLineChannelSecret('');
                                                                    }}
                                                                    className="text-[11px] text-slate-400 hover:text-slate-600 underline"
                                                                >
                                                                    ยกเลิกการแก้ไข (ใช้ค่าเดิมที่บันทึกไว้)
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                                                        Channel Access Token (Long-lived) ของ Messaging API
                                                    </label>
                                                    {hasChannelAccessToken && !isEditingToken && (
                                                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> บันทึก Token แล้ว
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-500 dark:text-gray-400 mb-1.5">
                                                    คัดลอกจาก LINE Developers &gt; Channel Messaging API (บอท) &gt; แท็บ <b>Messaging API</b> ด้านล่างสุด
                                                </p>

                                                {hasChannelAccessToken && !isEditingToken ? (
                                                    <div className="p-3 bg-slate-50 dark:bg-gray-900/80 border border-slate-200 dark:border-gray-700 rounded-xl flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <KeyRound className="w-4 h-4 text-emerald-600 shrink-0" />
                                                            <div>
                                                                <span className="text-xs text-slate-600 dark:text-gray-300 font-mono tracking-widest font-bold">••••••••••••••••••••••••••••••••</span>
                                                                <p className="text-[10px] text-slate-400">บันทึกเรียบร้อยแล้ว พร้อมส่งการแจ้งเตือน</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsEditingToken(true);
                                                                setLineChannelAccessToken('');
                                                            }}
                                                            className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200/60 dark:border-emerald-800/40 px-3 py-1.5 rounded-lg font-medium transition-colors"
                                                        >
                                                            แก้ไข / กรอก Token ใหม่
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1.5">
                                                        <textarea
                                                            rows={2}
                                                            value={lineChannelAccessToken}
                                                            onChange={(e) => setLineChannelAccessToken(e.target.value)}
                                                            placeholder="วาง Channel Access Token (Long-lived) ตัวยาวๆ จาก Messaging API ที่นี่"
                                                            className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-slate-800 dark:text-gray-100"
                                                            autoFocus={isEditingToken}
                                                        />
                                                        {hasChannelAccessToken && (
                                                            <div className="flex justify-end">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setIsEditingToken(false);
                                                                        setLineChannelAccessToken('');
                                                                    }}
                                                                    className="text-[11px] text-slate-400 hover:text-slate-600 underline"
                                                                >
                                                                    ยกเลิกการแก้ไข (ใช้ค่าเดิมที่บันทึกไว้)
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-1">
                                                <button
                                                    type="button"
                                                    onClick={handleTestLineOa}
                                                    disabled={isTestingLineOa || (!hasChannelAccessToken && !lineChannelAccessToken.trim())}
                                                    className="px-3.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                                >
                                                    {isTestingLineOa ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                                                    ทดสอบการเชื่อมต่อ Messaging API
                                                </button>
                                            </div>

                                            {testBotResult && (
                                                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center gap-3">
                                                    {testBotResult.pictureUrl ? (
                                                        <img
                                                            src={testBotResult.pictureUrl}
                                                            alt={testBotResult.displayName}
                                                            className="w-9 h-9 rounded-full border border-white shadow-sm object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs">
                                                            LINE
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">
                                                            {testBotResult.displayName}
                                                        </div>
                                                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                                                            @{testBotResult.basicId} • สถานะ: พร้อมส่งการแจ้งเตือน
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                                        Verified ✓
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleResetLineOaToDefault}
                                        disabled={isSavingLineOa}
                                        className="px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-gray-400 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        กลับไปใช้ค่าเริ่มต้น
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveLineOa}
                                        disabled={isSavingLineOa}
                                        className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        {isSavingLineOa ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        บันทึกการตั้งค่า LIFF เทศบาล
                                    </button>
                                </div>
                            </div>
                        )}

                        {!lineUseCustomOa && lineOaConfig?.lineUseCustomOa && (
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={handleSaveLineOa}
                                    disabled={isSavingLineOa}
                                    className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {isSavingLineOa ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    บันทึกการเปลี่ยนเป็น LINE OA ส่วนกลาง
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div id="sec-geofence" className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 overflow-hidden shadow-sm scroll-mt-20">
                <div className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md flex-shrink-0">
                            <Lock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2">
                                ล็อคปุ่ม "นำรถกลับถึงเทศบาลแล้ว" ตามรัศมี GPS
                                {lockReturnOfficeEnabled ? (
                                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                        เปิดใช้งาน (รัศมี {returnOfficeRadiusMeters} ม.)
                                    </span>
                                ) : (
                                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-400">
                                        ปิดใช้งาน
                                    </span>
                                )}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
                                ปุ่ม "นำรถกลับถึงเทศบาล" จะถูกล็อคจนกว่า GPS ของคนขับจะเข้ามาในรัศมี {returnOfficeRadiusMeters} เมตรรอบเทศบาล เพื่อป้องกันการปิดงานก่อนเวลาหรือไม่กลับเทศบาลจริง
                            </p>
                            {organization?.lat && organization?.lng ? (
                                <p className="text-xs text-slate-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    พิกัดเทศบาล: {organization.lat.toFixed(6)}, {organization.lng.toFixed(6)}
                                </p>
                            ) : (
                                <p className="text-xs text-red-500 mt-2 flex items-center gap-1 font-medium">
                                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                    ยังไม่ได้ตั้งพิกัดเทศบาล (กรุณาระบุพิกัดในกล่องข้อมูลหน่วยงานด้านบน)
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleToggleLockReturnOffice}
                            disabled={isSavingLockSetting}
                            className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${lockReturnOfficeEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-gray-600'}`}
                            aria-pressed={lockReturnOfficeEnabled}
                            aria-label={lockReturnOfficeEnabled ? 'ปิดการล็อคปุ่ม' : 'เปิดการล็อคปุ่ม'}
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${lockReturnOfficeEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>
                </div>

                {lockReturnOfficeEnabled && (
                    <div className="px-4 sm:px-5 pb-4 pt-1 border-t border-slate-100 dark:border-gray-700/60 bg-amber-50/50 dark:bg-amber-950/10 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
                        <span className="text-slate-600 dark:text-gray-300 font-medium">
                            ระยะรัศมีที่อนุญาตให้กดปิดงาน:
                        </span>
                        <div className="flex items-center gap-2">
                            {[100, 200, 500, 1000].map((radius) => (
                                <button
                                    key={radius}
                                    type="button"
                                    onClick={() => handleUpdateRadius(radius)}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${returnOfficeRadiusMeters === radius
                                            ? 'bg-amber-500 text-white shadow-sm'
                                            : 'bg-white dark:bg-gray-700 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-600 hover:bg-amber-100/50'
                                        }`}
                                >
                                    {radius} ม.
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div id="sec-policies" className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 overflow-hidden shadow-sm scroll-mt-20">
                <div className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-md flex-shrink-0">
                            <CalendarClock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2 flex-wrap">
                                กำหนดเวลายกเลิกคิว (สำหรับประชาชน)
                                {allowUserCancelQueue ? (
                                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                        เปิดให้ยกเลิกได้ (ล่วงหน้าอย่างน้อย {cancelQueueUnit === 'DAYS' ? (cancelQueueValue === 1 ? '1 วันก่อนวันเริ่มงาน' : `${cancelQueueValue} วันก่อนวันเริ่มงาน`) : `${cancelQueueValue} ชม.`})
                                    </span>
                                ) : (
                                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                                        ปิดการยกเลิกเอง (ต้องติดต่อเทศบาล)
                                    </span>
                                )}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
                                ควบคุมว่าประชาชนสามารถกดยกเลิกคิวด้วยตนเองได้หรือไม่ และต้องยกเลิกล่วงหน้าอย่างน้อยกี่วันก่อนวันเริ่มงาน หรือกี่ชั่วโมงก่อนเวลานัดหมาย
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleToggleAllowUserCancelQueue}
                            disabled={isSavingCancellationSetting}
                            className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${allowUserCancelQueue ? 'bg-rose-500' : 'bg-slate-300 dark:bg-gray-600'}`}
                            aria-pressed={allowUserCancelQueue}
                            aria-label={allowUserCancelQueue ? 'ปิดการยกเลิกคิว' : 'เปิดการยกเลิกคิว'}
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${allowUserCancelQueue ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>
                </div>

                {allowUserCancelQueue && (
                    <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-slate-100 dark:border-gray-700/60 bg-rose-50/40 dark:bg-rose-950/10 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-gray-200 font-medium">
                                <Clock className="w-4 h-4 text-rose-500 shrink-0" />
                                <span>หน่วยการนับเวลา:</span>
                            </div>
                            <div className="inline-flex p-1 bg-slate-200/70 dark:bg-gray-700 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => handleSaveQueueCancellation('DAYS', cancelQueueUnit === 'DAYS' ? cancelQueueValue : 1)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${cancelQueueUnit === 'DAYS'
                                            ? 'bg-rose-500 text-white shadow-sm'
                                            : 'text-slate-600 dark:text-gray-300 hover:text-rose-500'
                                        }`}
                                >
                                    <Calendar className="w-3.5 h-3.5" />
                                    นับเป็นวัน (ก่อนวันเริ่มงาน)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSaveQueueCancellation('HOURS', cancelQueueUnit === 'HOURS' ? cancelQueueValue : 24)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${cancelQueueUnit === 'HOURS'
                                            ? 'bg-rose-500 text-white shadow-sm'
                                            : 'text-slate-600 dark:text-gray-300 hover:text-rose-500'
                                        }`}
                                >
                                    <Clock className="w-3.5 h-3.5" />
                                    นับเป็นชั่วโมง
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-rose-100 dark:border-rose-900/30">
                            <span className="text-xs text-slate-600 dark:text-gray-300 font-medium">
                                {cancelQueueUnit === 'DAYS' ? 'เลือกจำนวนวันก่อนวันเริ่มงาน:' : 'เลือกจำนวนชั่วโมงล่วงหน้า:'}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                                {cancelQueueUnit === 'DAYS' ? (
                                    <>
                                        {[
                                            { label: '1 วันก่อนวันเริ่มงาน ', value: 1 },
                                            { label: '2 วันก่อน', value: 2 },
                                            { label: '3 วันก่อน', value: 3 },
                                            { label: '5 วันก่อน', value: 5 },
                                            { label: '7 วันก่อน', value: 7 },
                                        ].map((preset) => (
                                            <button
                                                key={preset.value}
                                                type="button"
                                                onClick={() => handleSaveQueueCancellation('DAYS', preset.value)}
                                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${cancelQueueValue === preset.value
                                                        ? 'bg-rose-500 text-white shadow-sm'
                                                        : 'bg-white dark:bg-gray-700 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-600 hover:bg-rose-100/50'
                                                    }`}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </>
                                ) : (
                                    <>
                                        {[
                                            { label: '1 ชม.', value: 1 },
                                            { label: '2 ชม.', value: 2 },
                                            { label: '6 ชม.', value: 6 },
                                            { label: '12 ชม.', value: 12 },
                                            { label: '24 ชม.', value: 24 },
                                        ].map((preset) => (
                                            <button
                                                key={preset.value}
                                                type="button"
                                                onClick={() => handleSaveQueueCancellation('HOURS', preset.value)}
                                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${cancelQueueValue === preset.value
                                                        ? 'bg-rose-500 text-white shadow-sm'
                                                        : 'bg-white dark:bg-gray-700 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-600 hover:bg-rose-100/50'
                                                    }`}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </>
                                )}

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const num = parseInt(customUserCancelInput, 10);
                                        if (!isNaN(num) && num >= 0) {
                                            handleSaveQueueCancellation(cancelQueueUnit, num);
                                        }
                                    }}
                                    className="flex items-center gap-1.5 ml-auto"
                                >
                                    <span className="text-xs text-slate-500 dark:text-gray-400 font-medium">กำหนดเอง:</span>
                                    <div className="flex items-center gap-1 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg px-2 py-0.5 shadow-sm">
                                        <input
                                            type="number"
                                            min="0"
                                            max={cancelQueueUnit === 'DAYS' ? 90 : 720}
                                            value={customUserCancelInput}
                                            onChange={(e) => setCustomUserCancelInput(e.target.value)}
                                            className="w-12 text-xs font-bold text-center text-slate-800 dark:text-white bg-transparent outline-none"
                                            placeholder={cancelQueueUnit === 'DAYS' ? '1' : '24'}
                                        />
                                        <span className="text-xs text-slate-500 dark:text-gray-300 font-medium">
                                            {cancelQueueUnit === 'DAYS' ? 'วัน' : 'ชม.'}
                                        </span>
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                                    >
                                        ใช้
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md flex-shrink-0">
                            <CalendarClock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2 flex-wrap">
                                กำหนดเวลายกเลิกงาน (สำหรับเจ้าหน้าที่รถและจิตอาสาแคร์ยู)
                                {allowVolunteerCancelJob ? (
                                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                        เปิดให้ยกเลิกได้ (ล่วงหน้าอย่างน้อย {volunteerCancelUnit === 'DAYS' ? (volunteerCancelValue === 1 ? '1 วันก่อนวันเริ่มงาน' : `${volunteerCancelValue} วันก่อนวันเริ่มงาน`) : `${volunteerCancelValue} ชม.`})
                                    </span>
                                ) : (
                                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                        ปิดการยกเลิกเอง (ต้องติดต่อเทศบาล)
                                    </span>
                                )}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
                                ควบคุมว่าเจ้าหน้าที่รถและจิตอาสาแคร์ยูสามารถกดยกเลิกงานที่ได้รับมอบหมายได้หรือไม่ และต้องยกเลิกล่วงหน้าอย่างน้อยกี่วันก่อนวันเริ่มงาน หรือกี่ชั่วโมงก่อนเวลานัดหมาย
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleToggleAllowVolunteerCancelJob}
                            disabled={isSavingVolunteerCancellationSetting}
                            className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${allowVolunteerCancelJob ? 'bg-amber-500' : 'bg-slate-300 dark:bg-gray-600'}`}
                            aria-pressed={allowVolunteerCancelJob}
                            aria-label={allowVolunteerCancelJob ? 'ปิดการยกเลิกงาน' : 'เปิดการยกเลิกงาน'}
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${allowVolunteerCancelJob ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>
                </div>

                {allowVolunteerCancelJob && (
                    <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-slate-100 dark:border-gray-700/60 bg-amber-50/40 dark:bg-amber-950/10 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-gray-200 font-medium">
                                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                                <span>หน่วยการนับเวลา:</span>
                            </div>
                            <div className="inline-flex p-1 bg-slate-200/70 dark:bg-gray-700 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => handleSaveVolunteerCancellation('DAYS', volunteerCancelUnit === 'DAYS' ? volunteerCancelValue : 1)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${volunteerCancelUnit === 'DAYS'
                                            ? 'bg-amber-500 text-white shadow-sm'
                                            : 'text-slate-600 dark:text-gray-300 hover:text-amber-500'
                                        }`}
                                >
                                    <Calendar className="w-3.5 h-3.5" />
                                    นับเป็นวัน (ก่อนวันเริ่มงาน)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSaveVolunteerCancellation('HOURS', volunteerCancelUnit === 'HOURS' ? volunteerCancelValue : 24)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${volunteerCancelUnit === 'HOURS'
                                            ? 'bg-amber-500 text-white shadow-sm'
                                            : 'text-slate-600 dark:text-gray-300 hover:text-amber-500'
                                        }`}
                                >
                                    <Clock className="w-3.5 h-3.5" />
                                    นับเป็นชั่วโมง
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-amber-100 dark:border-amber-900/30">
                            <span className="text-xs text-slate-600 dark:text-gray-300 font-medium">
                                {volunteerCancelUnit === 'DAYS' ? 'เลือกจำนวนวันก่อนวันเริ่มงาน:' : 'เลือกจำนวนชั่วโมงล่วงหน้า:'}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                                {volunteerCancelUnit === 'DAYS' ? (
                                    <>
                                        {[
                                            { label: '1 วันก่อนวันเริ่มงาน ', value: 1 },
                                            { label: '2 วันก่อน', value: 2 },
                                            { label: '3 วันก่อน', value: 3 },
                                            { label: '5 วันก่อน', value: 5 },
                                            { label: '7 วันก่อน', value: 7 },
                                        ].map((preset) => (
                                            <button
                                                key={preset.value}
                                                type="button"
                                                onClick={() => handleSaveVolunteerCancellation('DAYS', preset.value)}
                                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${volunteerCancelValue === preset.value
                                                        ? 'bg-amber-500 text-white shadow-sm'
                                                        : 'bg-white dark:bg-gray-700 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-600 hover:bg-amber-100/50'
                                                    }`}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </>
                                ) : (
                                    <>
                                        {[
                                            { label: '1 ชม.', value: 1 },
                                            { label: '2 ชม.', value: 2 },
                                            { label: '6 ชม.', value: 6 },
                                            { label: '12 ชม.', value: 12 },
                                            { label: '24 ชม.', value: 24 },
                                        ].map((preset) => (
                                            <button
                                                key={preset.value}
                                                type="button"
                                                onClick={() => handleSaveVolunteerCancellation('HOURS', preset.value)}
                                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${volunteerCancelValue === preset.value
                                                        ? 'bg-amber-500 text-white shadow-sm'
                                                        : 'bg-white dark:bg-gray-700 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-600 hover:bg-amber-100/50'
                                                    }`}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </>
                                )}

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const num = parseInt(customVolunteerCancelInput, 10);
                                        if (!isNaN(num) && num >= 0) {
                                            handleSaveVolunteerCancellation(volunteerCancelUnit, num);
                                        }
                                    }}
                                    className="flex items-center gap-1.5 ml-auto"
                                >
                                    <span className="text-xs text-slate-500 dark:text-gray-400 font-medium">กำหนดเอง:</span>
                                    <div className="flex items-center gap-1 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg px-2 py-0.5 shadow-sm">
                                        <input
                                            type="number"
                                            min="0"
                                            max={volunteerCancelUnit === 'DAYS' ? 90 : 720}
                                            value={customVolunteerCancelInput}
                                            onChange={(e) => setCustomVolunteerCancelInput(e.target.value)}
                                            className="w-12 text-xs font-bold text-center text-slate-800 dark:text-white bg-transparent outline-none"
                                            placeholder={volunteerCancelUnit === 'DAYS' ? '1' : '24'}
                                        />
                                        <span className="text-xs text-slate-500 dark:text-gray-300 font-medium">
                                            {volunteerCancelUnit === 'DAYS' ? 'วัน' : 'ชม.'}
                                        </span>
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                                    >
                                        ใช้
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
                            <CalendarClock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2 flex-wrap">
                                กำหนดเวลาจองคิวล่วงหน้า (สำหรับประชาชน)
                                {advanceBookingLimitEnabled ? (
                                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                        ต้องจองล่วงหน้าอย่างน้อย {advanceBookingUnit === 'DAYS' ? (advanceBookingValue === 1 ? '1 วัน (เริ่มจองได้ตั้งแต่วันถัดไป)' : `${advanceBookingValue} วัน`) : `${advanceBookingValue} ชั่วโมง`}
                                    </span>
                                ) : (
                                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                        จองวันเดียวกันได้ทันที
                                    </span>
                                )}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
                                เปิด/ปิดการจำกัดเวลาจองล่วงหน้า สามารถเลือกกำหนดเป็นวัน (วันถัดไป) หรือกำหนดเป็นชั่วโมงได้ตามต้องการ
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleToggleAdvanceBookingLimit}
                            disabled={isSavingAdvanceBookingSetting}
                            className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${advanceBookingLimitEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-gray-600'}`}
                            aria-pressed={advanceBookingLimitEnabled}
                            aria-label={advanceBookingLimitEnabled ? 'ปิดการจำกัดเวลาจองล่วงหน้า' : 'เปิดการจำกัดเวลาจองล่วงหน้า'}
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${advanceBookingLimitEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>
                </div>

                {advanceBookingLimitEnabled && (
                    <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-slate-100 dark:border-gray-700/60 bg-blue-50/40 dark:bg-blue-950/10 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-gray-200 font-medium">
                                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                                <span>หน่วยการนับเวลา:</span>
                            </div>
                            <div className="inline-flex p-1 bg-slate-200/70 dark:bg-gray-700 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => handleSaveAdvanceBooking('DAYS', advanceBookingUnit === 'DAYS' ? advanceBookingValue : 1)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${advanceBookingUnit === 'DAYS'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-slate-600 dark:text-gray-300 hover:text-blue-600'
                                        }`}
                                >
                                    <CalendarDays className="w-3.5 h-3.5" />
                                    <span>นับเป็นวัน (วันถัดไป)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSaveAdvanceBooking('HOURS', advanceBookingUnit === 'HOURS' ? advanceBookingValue : 1)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${advanceBookingUnit === 'HOURS'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-slate-600 dark:text-gray-300 hover:text-blue-600'
                                        }`}
                                >
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>นับเป็นชั่วโมง</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-gray-700/40">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-slate-500 dark:text-gray-400 font-medium">ตัวเลือกด่วน:</span>
                                {advanceBookingUnit === 'DAYS' ? (
                                    [
                                        { label: '1 วันถัดไป', val: 1 },
                                        { label: '2 วันถัดไป', val: 2 },
                                        { label: '3 วันถัดไป', val: 3 },
                                        { label: '5 วันถัดไป', val: 5 },
                                        { label: '7 วันถัดไป', val: 7 },
                                    ].map((preset) => (
                                        <button
                                            key={preset.val}
                                            type="button"
                                            onClick={() => handleSaveAdvanceBooking('DAYS', preset.val)}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${advanceBookingValue === preset.val
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'bg-white dark:bg-gray-700 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-600 hover:bg-blue-100/50'
                                                }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))
                                ) : (
                                    [
                                        { label: '1 ชม.', val: 1 },
                                        { label: '2 ชม.', val: 2 },
                                        { label: '3 ชม.', val: 3 },
                                        { label: '4 ชม.', val: 4 },
                                        { label: '5 ชม.', val: 5 },
                                        { label: '6 ชม.', val: 6 },
                                        { label: '12 ชม.', val: 12 },
                                        { label: '24 ชม.', val: 24 },
                                    ].map((preset) => (
                                        <button
                                            key={preset.val}
                                            type="button"
                                            onClick={() => handleSaveAdvanceBooking('HOURS', preset.val)}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${advanceBookingValue === preset.val
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'bg-white dark:bg-gray-700 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-600 hover:bg-blue-100/50'
                                                }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))
                                )}
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const num = parseInt(customAdvanceInput, 10);
                                    if (!isNaN(num) && num > 0) {
                                        handleSaveAdvanceBooking(advanceBookingUnit, num);
                                    }
                                }}
                                className="flex items-center gap-2"
                            >
                                <span className="text-xs text-slate-500 dark:text-gray-400 font-medium">กำหนดเอง:</span>
                                <div className="flex items-center gap-1.5 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg px-2.5 py-1 shadow-sm">
                                    <input
                                        type="number"
                                        min="1"
                                        max="720"
                                        value={customAdvanceInput}
                                        onChange={(e) => setCustomAdvanceInput(e.target.value)}
                                        className="w-14 text-xs font-bold text-center text-slate-800 dark:text-white bg-transparent outline-none"
                                        placeholder="1"
                                    />
                                    <span className="text-xs text-slate-500 dark:text-gray-300 font-medium">
                                        {advanceBookingUnit === 'DAYS' ? 'วัน' : 'ชม.'}
                                    </span>
                                </div>
                                <button
                                    type="submit"
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                                >
                                    ใช้
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
