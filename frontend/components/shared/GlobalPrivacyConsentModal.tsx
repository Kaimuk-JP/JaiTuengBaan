'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth, logout } from '@/lib/auth';
import { usePathname } from 'next/navigation';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import LockIcon from '@mui/icons-material/Lock';
import Swal from '@/lib/swal';

export default function GlobalPrivacyConsentModal() {
    const { user, loading, refreshUser } = useAuth();
    const pathname = usePathname();

    const [isOpen, setIsOpen] = useState(false);
    const [hasAgreed, setHasAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isPublicRoute =
        !pathname ||
        pathname === '/login' ||
        pathname === '/' ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/register');

    useEffect(() => {
        if (loading || !user || isPublicRoute) {
            setIsOpen(false);
            return;
        }

        if (!user.privacyAcceptedAt) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [user, loading, pathname, isPublicRoute]);

    if (!isOpen || !user) return null;

    const handleAccept = async () => {
        if (!hasAgreed || isSubmitting) return;

        try {
            setIsSubmitting(true);
            const nowIso = new Date().toISOString();

            const res = await fetchWithAuth('/users/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    privacyAcceptedAt: nowIso,
                    privacyVersion: '2.0',
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'ไม่สามารถบันทึกการยินยอมได้');
            }

            await refreshUser();
            setIsOpen(false);

            await Swal.fire({
                icon: 'success',
                title: 'ยอมรับนโยบายสำเร็จ',
                text: 'ยินดีต้อนรับเข้าสู่ระบบ ใจส่งถึงบ้าน (เวอร์ชัน 2.0)',
                timer: 1800,
                showConfirmButton: false,
                confirmButtonColor: '#1E7D55',
            });
        } catch (error: any) {
            console.error('Error accepting privacy policy:', error);
            await Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error?.message || 'กรุณาลองใหม่อีกครั้ง',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'ปฏิเสธและออกจากระบบ?',
            text: 'หากไม่ยินยอมรับนโยบายความเป็นส่วนตัว จะไม่สามารถเข้าใช้งานระบบได้',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'ออกจากระบบ',
            cancelButtonText: 'กลับไปอ่านนโยบาย',
        });

        if (result.isConfirmed) {
            await logout();
            window.location.href = '/login';
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-gray-800">
                <div className="bg-gradient-to-r from-[#1E7D55] via-[#166D45] to-[#0D4D2E] text-white px-5 sm:px-8 py-5 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
                            <ShieldIcon fontSize="medium" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                                    ประกาศความเป็นส่วนตัว (Privacy Notice)
                                </h2>
                                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
                                    PDPA v2.0
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
                                ระบบ ใจส่งถึงบ้าน - ระบบบริหารจัดการอาสาสมัครรับ-ส่งประชาชนไปโรงพยาบาล
                            </p>
                        </div>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 px-5 sm:px-8 py-6 text-slate-700 dark:text-gray-200 space-y-6 text-sm sm:text-base leading-relaxed scrollbar-thin">
                    <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                                ประกาศความเป็นส่วนตัว (Privacy Notice)
                            </h3>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                                วันที่มีผลบังคับใช้: 1 กันยายน 2569 (เวอร์ชัน 2.0)
                            </span>
                        </div>
                        <p className="text-sm mt-2 text-slate-600 dark:text-gray-300">
                            ระบบ ใจส่งถึงบ้าน ("เรา" หรือ "ระบบของเรา") ดำเนินการเพื่อสนับสนุนภารกิจบริการสาธารณะขององค์กรปกครองส่วนท้องถิ่นในการรับ-ส่งประชาชนไปสถานพยาบาล ให้ความสำคัญอย่างยิ่งต่อการคุ้มครองข้อมูลส่วนบุคคลของท่านตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
                        </p>
                    </div>

                    <section className="space-y-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">1</span>
                            บทนำและขอบเขตการใช้งาน
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 pl-8">
                            ครอบคลุมการใช้งานระบบ ใจส่งถึงบ้าน ผ่านทุกช่องทาง ได้แก่ Web Application, LINE LIFF/LINE Login/LINE Messaging API, ระบบ SSO ภาครัฐ (IAM-GOV) และระบบศูนย์ควบคุมขององค์กรปกครองส่วนท้องถิ่น
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">2</span>
                            ข้อมูลส่วนบุคคลที่เราเก็บรวบรวมตามบทบาท
                        </h4>
                        <div className="pl-8 space-y-3 text-xs sm:text-sm text-slate-600 dark:text-gray-300">
                            <div className="p-3.5 bg-slate-50 dark:bg-gray-800/50 rounded-xl border border-slate-100 dark:border-gray-800">
                                <h5 className="font-bold text-slate-800 dark:text-gray-100 mb-1.5">2.1 ประชาชนและผู้รับบริการ</h5>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>ข้อมูลระบุตัวตนและติดต่อ:</strong> ชื่อ-นามสกุล, เพศ, วันเกิด, เลขบัตรประชาชน 13 หลัก, เบอร์โทรศัพท์, เบอร์ติดต่อฉุกเฉิน/ญาติ, รูปโปรไฟล์</li>
                                    <li><strong>ข้อมูลสุขภาพและความต้องการพิเศษ (Sensitive Data):</strong> โรคประจำตัว, ภาวะการเคลื่อนไหว (เดินได้/วีลแชร์/ติดเตียง), ความต้องการพิเศษ, อุปกรณ์ที่จำเป็น, ภาพใบนัดแพทย์, โรงพยาบาลและแผนกปลายทาง, ระดับความรุนแรง (เขียว/เหลือง/แดง)</li>
                                    <li><strong>ข้อมูลที่อยู่อาศัย:</strong> ที่อยู่, พิกัด GPS, ข้อมูลยืนยันที่พักอาศัยผ่าน IAM (Residence Claim)</li>
                                    <li><strong>ประวัติการใช้งาน:</strong> ประวัติการจองคิว, การประเมินความพึงพอใจเทศบาล (Municipal Rating)</li>
                                </ul>
                            </div>

                            <div className="p-3.5 bg-slate-50 dark:bg-gray-800/50 rounded-xl border border-slate-100 dark:border-gray-800">
                                <h5 className="font-bold text-slate-800 dark:text-gray-100 mb-1.5">2.2 ข้อมูลผู้ดูแลประชาชน</h5>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>ข้อมูลส่วนตัว:</strong> ชื่อ-นามสกุล, เลขบัตรประชาชน, เบอร์โทรศัพท์, ที่อยู่, รูปโปรไฟล์</li>
                                    <li><strong>ความสัมพันธ์และการจองแทน:</strong> ความสัมพันธ์กับผู้ป่วย, เอกสารยืนยันความสัมพันธ์, ประวัติการจองคิวและดูแลผู้ป่วย</li>
                                </ul>
                            </div>

                            <div className="p-3.5 bg-slate-50 dark:bg-gray-800/50 rounded-xl border border-slate-100 dark:border-gray-800">
                                <h5 className="font-bold text-slate-800 dark:text-gray-100 mb-1.5">2.3 ข้อมูลอาสาสมัครขับรถ และผู้ดูแลระหว่างเดินทาง</h5>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>ข้อมูลส่วนตัวและยานพาหนะ:</strong> ชื่อ-นามสกุล, เลขบัตรประชาชน, เบอร์โทร, ข้อมูลรถ (ทะเบียน, ยี่ห้อ, เลขไมล์ก่อน-หลัง), ภาพหลักฐานส่งรถคืน</li>
                                    <li><strong>ข้อมูลการเดินทางแบบเรียลไทม์:</strong> พิกัด GPS สดขณะปฏิบัติภารกิจรับ-ส่ง (JobLocationLog), ระยะทางจริง (Km)</li>
                                    <li><strong>ผลงานและสิทธิประโยชน์:</strong> ประวัติรับงาน, คะแนนรีวิว, แต้มสะสมความดี (Points), ประวัติแลกของรางวัล (Rewards)</li>
                                </ul>
                            </div>

                            <div className="p-3.5 bg-slate-50 dark:bg-gray-800/50 rounded-xl border border-slate-100 dark:border-gray-800">
                                <h5 className="font-bold text-slate-800 dark:text-gray-100 mb-1.5">2.4 ข้อมูลเจ้าหน้าที่, ผู้บริหาร และผู้ดูแลระบบ</h5>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>ข้อมูลประจำตำแหน่ง, สิทธิ์ในระบบ, บันทึกการอนุมัติคิว/งบประมาณ, บันทึกการจัดการคลังของรางวัล, Activity Logs และ Audit Trail</li>
                                </ul>
                            </div>

                            <div className="p-3.5 bg-slate-50 dark:bg-gray-800/50 rounded-xl border border-slate-100 dark:border-gray-800">
                                <h5 className="font-bold text-slate-800 dark:text-gray-100 mb-1.5">2.5 ข้อมูลการเชื่อมต่อภายนอกและทางเทคนิค</h5>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>LINE User ID / Messaging Profile, IAM-GOV SSO User ID, IP Address, Device Model, Cookies, Session Tokens, Activity Log ก่อน-หลังการเปลี่ยนแปลง</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">3</span>
                            วัตถุประสงค์ในการประมวลผลข้อมูล
                        </h4>
                        <div className="pl-8 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-gray-300">
                            <p><strong>3.1 การให้บริการรับ-ส่ง:</strong> จองคิวโรงพยาบาล, จัดสรรรถและอาสาสมัคร, จัดเตรียมอุปกรณ์การแพทย์ที่จำเป็น</p>
                            <p><strong>3.2 ความปลอดภัยและการติดตามสด:</strong> ติดตามตำแหน่ง GPS รถแบบเรียลไทม์เพื่อความปลอดภัยและประสานงานกรณีฉุกเฉิน</p>
                            <p><strong>3.3 การบริหารจัดการองค์กร:</strong> อนุมัติคำขอคิวโดยเจ้าหน้าที่และผู้บริหาร, จัดการยานพาหนะและเลขไมล์, จัดทำรายงานการเบิกจ่าย</p>
                            <p><strong>3.4 การแจ้งเตือนและการสื่อสาร:</strong> แจ้งเตือนสถานะงานผ่าน LINE Messaging API และ Socket.IO</p>
                            <p><strong>3.5 รางวัลและการพัฒนาคุณภาพ:</strong> จัดการระบบแต้มและของรางวัลอาสาสมัคร, ประเมินความพึงพอใจการบริการของเทศบาล</p>
                        </div>
                    </section>

                    <section className="space-y-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">4</span>
                            ฐานทางกฎหมายในการประมวลผลข้อมูล (PDPA Lawful Bases)
                        </h4>
                        <ul className="pl-8 list-disc space-y-1 text-xs sm:text-sm text-slate-600 dark:text-gray-300">
                            <li><strong>ความยินยอมโดยชัดแจ้ง (Explicit Consent - มาตรา 26):</strong> ข้อมูลสุขภาพ, โรคประจำตัว, ภาวะเคลื่อนไหว, ภาพใบนัดแพทย์, พิกัด GPS เรียลไทม์</li>
                            <li><strong>การปฏิบัติตามสัญญา / คำขอ (Contract Performance - มาตรา 24(3)):</strong> การให้บริการจองคิว, การมอบหมายงานอาสาสมัคร, การแลกของรางวัล</li>
                            <li><strong>ภารกิจเพื่อประโยชน์สาธารณะ (Public Task - มาตรา 24(4)):</strong> การให้บริการสาธารณะและสวัสดิการสังคมขององค์กรปกครองส่วนท้องถิ่น</li>
                            <li><strong>ประโยชน์โดยชอบด้วยกฎหมาย (Legitimate Interest - มาตรา 24(5)):</strong> ความมั่นคงปลอดภัยของระบบ, การบันทึก Activity Log, การป้องกันการทุจริต</li>
                            <li><strong>การปฏิบัติตามกฎหมาย (Legal Obligation - มาตรา 24(6)):</strong> การจัดเก็บเอกสารและรายงานตามระเบียบการเงินการคลังภาครัฐ</li>
                        </ul>
                    </section>

                    <section className="space-y-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">5</span>
                            การเปิดเผยข้อมูลส่วนบุคคลและการมองเห็นข้อมูล
                        </h4>
                        <div className="pl-8 space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-gray-300">
                            <p><strong>5.1 สิทธิ์ภายในระบบ:</strong> อาสาสมัครมองเห็นเฉพาะข้อมูลผู้ป่วยในงานที่ตนรับผิดชอบ, ผู้ป่วย/ผู้ดูแลเห็นข้อมูลคนขับและตำแหน่งรถสด, เจ้าหน้าที่/ผู้บริหารเข้าถึงเพื่อการตรวจสอบและบริหาร</p>
                            <p><strong>5.2 ผู้ให้บริการภายนอก:</strong> LINE Platform (LINE Login & Messaging), ระบบ IAM-GOV SSO, บริการแผนที่ Mapbox/OpenStreetMap, ระบบ Cloud Server</p>
                            <p><strong>5.3 หน่วยงานภายนอก:</strong> โรงพยาบาลปลายทาง/หน่วยแพทย์ฉุกเฉิน (กรณีจำเป็น), หน่วยงานตรวจสอบภาครัฐตามกฎหมาย</p>
                        </div>
                    </section>

                    <section className="space-y-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">6</span>
                            การรักษาความมั่นคงปลอดภัยของข้อมูล
                        </h4>
                        <ul className="pl-8 list-disc space-y-1 text-xs sm:text-sm text-slate-600 dark:text-gray-300">
                            <li><strong>มาตรการทางเทคนิค:</strong> เข้ารหัสส่งข้อมูลผ่าน HTTPS (TLS), Hashing รหัสผ่าน/โทเคน (Bcrypt), ตรวจสอบสิทธิ์ RBAC, Helmet Headers, Throttler Rate Limiting, Sharp Image Sanitization</li>
                            <li><strong>มาตรการบริหารจัดการ:</strong> เซิร์ฟเวอร์มาตรฐานสากล, การสำรองข้อมูลสม่ำเสมอ, ตรวจสอบ Activity Log, จำกัดสิทธิ์เข้าถึงตามหน้าที่</li>
                        </ul>
                    </section>

                    <section className="space-y-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">7</span>
                            ระยะเวลาในการเก็บรักษาข้อมูล
                        </h4>
                        <ul className="pl-8 list-disc space-y-1 text-xs sm:text-sm text-slate-600 dark:text-gray-300">
                            <li><strong>ข้อมูลบัญชีผู้ใช้:</strong> ตลอดระยะเวลาใช้งาน + 2 ปี หลังปิดบัญชี</li>
                            <li><strong>ประวัติการจองและเดินทาง:</strong> 5 - 10 ปี (ตามระเบียบงานสารบรรณและการเงินการคลังภาครัฐ)</li>
                            <li><strong>ข้อมูลสุขภาพและภาพใบนัด:</strong> 5 ปี นับจากเสร็จสิ้นบริการ</li>
                            <li><strong>พิกัด GPS เรียลไทม์ (JobLocationLog):</strong> 90 วัน หลังเสร็จสิ้นภารกิจ</li>
                            <li><strong>คะแนนสะสมและของรางวัล:</strong> 3 ปี</li>
                            <li><strong>Activity Log:</strong> 1 - 2 ปี (ตาม พ.ร.บ. คอมพิวเตอร์ฯ)</li>
                        </ul>
                    </section>

                    <section className="space-y-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">8</span>
                            สิทธิของเจ้าของข้อมูลส่วนบุคคลตาม PDPA (8 ประการ)
                        </h4>
                        <div className="pl-8 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-700 dark:text-gray-300 pt-1">
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700">8.1 สิทธิขอเข้าถึงและรับสำเนาข้อมูล (Right to Access)</div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700">8.2 สิทธิขอแก้ไขข้อมูลให้ถูกต้อง (Right to Rectification)</div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700">8.3 สิทธิขอลบหรือทำลายข้อมูล (Right to Erasure)</div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700">8.4 สิทธิขอระงับการใช้ข้อมูล (Right to Restriction)</div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700">8.5 สิทธิขอรับหรือโอนย้ายข้อมูล (Right to Data Portability)</div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700">8.6 สิทธิคัดค้านการประมวลผล (Right to Object)</div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700">8.7 สิทธิถอนความยินยอม (Right to Withdraw Consent)</div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700">8.8 สิทธิร้องเรียนต่อ สคส. / PDPC (Right to Lodge a Complaint)</div>
                        </div>
                    </section>

                    <section className="space-y-2 border-t border-slate-100 dark:border-gray-800 pt-4 text-xs sm:text-sm text-slate-600 dark:text-gray-300">
                        <p><strong>9. การใช้ Cookies:</strong> เพื่อรักษาสถานะเข้าสู่ระบบและการตั้งค่าหน้าจอ</p>
                        <p><strong>10. การเชื่อมโยงภายนอก:</strong> เชื่อมต่อกับ LINE Platform, Mapbox, IAM-GOV ซึ่งมีนโยบายความเป็นส่วนตัวตามมาตรฐาน</p>
                        <p><strong>11. การโอนข้อมูลไปต่างประเทศ:</strong> ดำเนินการเฉพาะกับผู้ให้บริการที่มีมาตรฐานความปลอดภัยเทียบเท่า</p>
                        <p><strong>12. ข้อมูลผู้เยาว์และผู้มีภาวะพึ่งพิง:</strong> ต้องได้รับความยินยอมหรือทำรายการผ่านผู้แทนโดยชอบธรรมหรือผู้ดูแลประชาชน</p>
                        <p><strong>13. การแก้ไขประกาศ:</strong> ประกาศนี้ได้รับการปรับปรุงเป็นเวอร์ชัน 2.0 โดยมีผลบังคับใช้ตั้งแต่วันที่ 1 กันยายน 2569</p>
                        <p><strong>14. ช่องทางติดต่อ DPO / Data Controller:</strong> ติดต่อศูนย์บริการระบบ ใจส่งถึงบ้าน หรือเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO) โดยจะตอบกลับภายใน 30 วัน</p>
                        <p><strong>15. การให้ความยินยอม:</strong> การเข้าใช้งานระบบถือว่าท่านได้รับทราบและยินยอมรับประกาศความเป็นส่วนตัวฉบับนี้</p>
                    </section>
                </div>

                <div className="bg-slate-50 dark:bg-gray-800/80 p-4 sm:p-6 border-t border-slate-200 dark:border-gray-700 space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer select-none group">
                        <input
                            type="checkbox"
                            checked={hasAgreed}
                            onChange={(e) => setHasAgreed(e.target.checked)}
                            className="mt-1 w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-gray-600 text-brand-primary focus:ring-brand-primary/20 transition-all cursor-pointer shrink-0"
                        />
                        <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-gray-200 leading-snug group-hover:text-slate-900 dark:group-hover:text-white">
                            ข้าพเจ้าได้อ่าน เข้าใจ และยินยอมรับประกาศความเป็นส่วนตัว (Privacy Notice) และยินยอมให้ระบบ ใจส่งถึงบ้าน ประมวลผลข้อมูลส่วนบุคคลตามข้อกำหนดข้างต้น
                        </span>
                    </label>

                    <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-1">
                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all disabled:opacity-50"
                        >
                            <LogoutIcon fontSize="small" />
                            <span>ปฏิเสธและออกจากระบบ</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleAccept}
                            disabled={!hasAgreed || isSubmitting}
                            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 ${
                                hasAgreed && !isSubmitting
                                    ? 'bg-gradient-to-r from-[#1E7D55] to-[#146440] hover:from-[#196B49] hover:to-[#0F4E33] text-white cursor-pointer shadow-emerald-900/20'
                                    : 'bg-slate-300 dark:bg-gray-700 text-slate-500 dark:text-gray-400 cursor-not-allowed shadow-none'
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    <span>กำลังบันทึกข้อมูล...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircleIcon fontSize="small" />
                                    <span>ยินยอมและเริ่มเข้าใช้งาน</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
