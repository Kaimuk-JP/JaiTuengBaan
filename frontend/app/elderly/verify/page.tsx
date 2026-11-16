'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import Swal from '@/lib/swal';
import {
    ShieldCheck,
    Smartphone,
    IdCard,
    ChevronRight,
    Loader2
} from 'lucide-react';


function VerifyContent() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    const [idCard, setIdCard] = useState('');
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    useEffect(() => {
        if (user?.phone) {
            if (user?.role === 'CAREGIVER') {
                router.push('/caregiver/home');
            } else {
                router.push('/elderly/home');
            }
        }
    }, [user, router]);

    const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 13);
        setIdCard(value);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
        setPhone(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (idCard.length !== 13) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ถูกต้อง',
                text: 'เลขบัตรประชาชนต้องมี 13 หลัก',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        if (phone.length !== 10) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ถูกต้อง',
                text: 'เบอร์โทรศัพท์ต้องมี 10 หลัก',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${getApiUrl()}/auth/verify-and-link`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idCard, phone }),
            });

            const result = await response.json();

            if (result.success) {
                if (result.matched) {
                    await Swal.fire({
                        icon: 'success',
                        title: 'ยืนยันตัวตนสำเร็จ!',
                        html: `
                            <p style="margin-bottom: 8px;">พบข้อมูลที่ลงทะเบียนไว้ในระบบ</p>
                            <p style="color: #666; font-size: 14px;">ระบบจะพาคุณไปยังหน้าหลัก</p>
                        `,
                        confirmButtonColor: '#1E7D55',
                        timer: 2000,
                        showConfirmButton: false,
                    });
                    await refreshUser();
                    const targetRole = result.user?.role || user?.role;
                    if (targetRole === 'DRIVE') {
                        router.push('/volunteer/driver');
                    } else if (targetRole === 'CAREU') {
                        router.push('/volunteer/careu');
                    } else if (targetRole === 'CAREGIVER') {
                        router.push('/caregiver/home');
                    } else {
                        router.push('/elderly/home');
                    }
                } else {
                    await Swal.fire({
                        icon: 'info',
                        title: 'ไม่พบข้อมูลที่ลงทะเบียนไว้',
                        html: `
                            <p style="margin-bottom: 8px;">ไม่พบข้อมูลที่ตรงกับเลขบัตรประชาชนและเบอร์โทรที่กรอก</p>
                            <p style="color: #666; font-size: 14px;">กรุณากรอกข้อมูลเพื่อลงทะเบียนใหม่</p>
                        `,
                        confirmButtonColor: '#1E7D55',
                        confirmButtonText: 'ไปลงทะเบียน',
                    });
                    if (user?.role === 'CAREGIVER') {
                        router.push(`/caregiver/register?idCard=${idCard}&phone=${phone}`);
                    } else {
                        router.push(`/elderly/register?idCard=${idCard}&phone=${phone}`);
                    }
                }
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    text: result.message || 'ไม่สามารถยืนยันตัวตนได้',
                    confirmButtonColor: '#1E7D55',
                });
            }
        } catch (error) {
            console.error('Verify error:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkip = () => {
        if (user?.role === 'CAREGIVER') {
            router.push(`/caregiver/register?idCard=${idCard}&phone=${phone}`);
        } else {
            router.push(`/elderly/register?idCard=${idCard}&phone=${phone}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-900 flex flex-col justify-center font-sans text-[#1E293B] dark:text-gray-100 transition-colors">
            <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-[#E2F2E9] to-transparent dark:from-emerald-950/30 dark:to-transparent -z-10" />

            <main className="px-5 py-8 max-w-lg mx-auto w-full">
                <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700 flex items-center justify-center">
                        <ShieldCheck size={28} className="text-[#1E7D55] dark:text-emerald-400" />
                    </div>
                </div>

                <section className="text-center mb-6">
                    <h1 className="text-2xl font-extrabold text-[#1E293B] dark:text-white mb-2">
                        ยืนยันตัวตน
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">
                        หากเจ้าหน้าที่หรือผู้ดูแลประชาชนเคยลงทะเบียนให้ท่านไว้แล้ว<br />
                        ระบบจะดึงข้อมูลมาให้โดยไม่ต้องกรอกใหม่
                    </p>
                </section>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="flex items-center gap-2 text-base font-bold mb-2 text-slate-700 dark:text-gray-200">
                            <IdCard size={18} className="text-[#1E7D55] dark:text-emerald-400" />
                            เลขบัตรประจำตัวประชาชน
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={idCard}
                                onChange={handleIdCardChange}
                                onFocus={() => setFocusedField('id')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="0-0000-00000-00-0"
                                className={`w-full bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 px-4 py-3.5 rounded-xl text-xl font-semibold tracking-wider border-2 transition-all outline-none
                                    ${focusedField === 'id' 
                                        ? 'border-[#1E7D55] dark:border-emerald-500 ring-2 ring-[#1E7D55]/10 dark:ring-emerald-500/20' 
                                        : 'border-slate-200 dark:border-gray-700'}`}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 text-sm">
                                {idCard.length}/13
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-base font-bold mb-2 text-slate-700 dark:text-gray-200">
                            <Smartphone size={18} className="text-[#1E7D55] dark:text-emerald-400" />
                            เบอร์โทรศัพท์
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={phone}
                                onChange={handlePhoneChange}
                                onFocus={() => setFocusedField('phone')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="08X-XXX-XXXX"
                                className={`w-full bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 px-4 py-3.5 rounded-xl text-xl font-semibold tracking-wider border-2 transition-all outline-none
                                    ${focusedField === 'phone' 
                                        ? 'border-[#1E7D55] dark:border-emerald-500 ring-2 ring-[#1E7D55]/10 dark:ring-emerald-500/20' 
                                        : 'border-slate-200 dark:border-gray-700'}`}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 text-sm">
                                {phone.length}/10
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting || idCard.length !== 13 || phone.length !== 10}
                            className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 text-lg font-bold transition-all
                                ${isSubmitting || idCard.length !== 13 || phone.length !== 10
                                    ? 'bg-slate-200 text-slate-400 dark:bg-gray-800 dark:text-gray-600 dark:border dark:border-gray-700 cursor-not-allowed'
                                    : 'bg-[#1E7D55] hover:bg-[#166D45] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white active:scale-[0.98] shadow-md shadow-emerald-700/10'}`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>กำลังตรวจสอบ...</span>
                                </>
                            ) : (
                                <>
                                    <span>ยืนยันข้อมูล</span>
                                    <ChevronRight size={20} />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={handleSkip}
                        className="text-slate-600 dark:text-gray-400 font-medium text-base hover:text-slate-800 dark:hover:text-gray-200 transition-colors"
                    >
                        ยังไม่มีข้อมูล? <span className="text-[#1E7D55] dark:text-emerald-400 font-bold underline">ลงทะเบียนใหม่</span>
                    </button>
                </div>
            </main>
        </div>
    );
}

export default function ElderlyVerifyPage() {
    return (
        <ProtectedRoute allowedRoles={['USERS', 'CAREGIVER', 'ADMIN']}>
            <VerifyContent />
        </ProtectedRoute>
    );
}
