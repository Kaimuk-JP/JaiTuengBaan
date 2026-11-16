'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '@/lib/auth';

export default function ServerErrorPage() {
    const router = useRouter();
    const [isServerOnline, setIsServerOnline] = useState(false);

    useEffect(() => {
        const checkServerStatus = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL;
                const res = await fetch(`${API_URL}/auth/profile`, { method: 'HEAD' }).catch(() => null);

                if (res) {
                    setIsServerOnline(true);
                    setTimeout(() => {
                        router.push('/');
                    }, 5000);
                }
            } catch (error) {
            }
        };

        const interval = setInterval(checkServerStatus, 5000);
        checkServerStatus();

        return () => clearInterval(interval);
    }, [router]);

    return (
        <div className={`min-h-screen ${isServerOnline ? 'bg-blue-50' : 'bg-green-50'} flex items-center justify-center p-4 transition-colors duration-500`}>
            <div className="text-center max-w-lg mx-auto">
                <div className="relative mb-8">
                    {}
                    <div className="absolute top-0 left-10 w-4 h-4 border-2 border-orange-300 rounded-sm transform rotate-12"></div>
                    <div className="absolute bottom-10 right-10 w-6 h-6 border-2 border-orange-400 rounded-full"></div>

                    {}
                    <h1 className={`text-[9.375rem] font-black leading-none tracking-tighter relative z-10 transition-colors duration-500 ${isServerOnline ? 'text-green-500' : 'text-black'}`}>
                        {isServerOnline ? '200' : '500'}
                    </h1>

                    {}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -mt-8">
                        <span className={`text-3xl font-bold transition-colors duration-500 ${isServerOnline ? 'text-green-600' : 'text-black'}`}>
                            {isServerOnline ? 'System Online!' : 'Oops!'}
                        </span>
                    </div>

                    {}
                    <div className={`relative h-40 w-40 mx-auto mt-[-40px] z-20 ${isServerOnline ? 'bg-green-500' : 'bg-purple-600'} rounded-xl flex items-center justify-center shadow-xl border-4 border-white animate-[float_3s_ease-in-out_infinite] transition-colors duration-500`}>
                        <style jsx>{`
                            @keyframes float {
                                0% { transform: translate(0, 0) rotate(0deg); }
                                25% { transform: translate(-5px, -5px) rotate(-3deg); }
                                50% { transform: translate(0, -10px) rotate(0deg); }
                                75% { transform: translate(5px, -5px) rotate(3deg); }
                                100% { transform: translate(0, 0) rotate(0deg); }
                            }
                        `}</style>
                        <div className="text-white text-center">
                            {}
                            <div className="flex justify-center gap-4 mb-2">
                                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center overflow-hidden">
                                    {isServerOnline ? (
                                        <div className="w-3 h-3 bg-white rounded-full"></div>
                                    ) : (
                                        <span className="text-green-400 text-xl">×</span>
                                    )}
                                </div>
                                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center overflow-hidden">
                                    {isServerOnline ? (
                                        <div className="w-3 h-3 bg-white rounded-full"></div>
                                    ) : (
                                        <span className="text-green-400 text-xl">×</span>
                                    )}
                                </div>
                            </div>

                            {}
                            {isServerOnline ? (
                                <div className="w-16 h-8 border-b-4 border-black rounded-full mx-auto -mt-2"></div>
                            ) : (
                                <div className="w-16 h-2 bg-black rounded-full mx-auto mt-4"></div>
                            )}
                        </div>

                        {}
                        <div className={`absolute -left-8 top-10 w-8 h-2 ${isServerOnline ? 'bg-green-500' : 'bg-purple-600'} transform rotate-45 transition-colors duration-500`}></div>
                        <div className={`absolute -right-8 top-10 w-8 h-2 ${isServerOnline ? 'bg-green-500' : 'bg-purple-600'} transform -rotate-45 transition-colors duration-500`}></div>
                        <div className={`absolute -top-6 left-1/2 w-1 h-6 ${isServerOnline ? 'bg-green-500' : 'bg-purple-600'} transform -translate-x-1/2 transition-colors duration-500`}></div>
                        <div className={`absolute -top-8 left-1/2 w-3 h-3 ${isServerOnline ? 'bg-green-400' : 'bg-orange-400'} rounded-full transform -translate-x-1/2 animate-pulse transition-colors duration-500`}></div>
                    </div>

                    {}
                    <div className="absolute top-1/2 right-0 transform translate-x-1/4 -translate-y-1/2 bg-white px-4 py-2 rounded-full border-2 border-black shadow-lg">
                        <span className={`font-bold ${isServerOnline ? 'text-green-600' : 'text-red-600'}`}>
                            {isServerOnline ? 'OK!' : 'ERROR'}
                        </span>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    {isServerOnline ? 'ระบบกลับมาทำงานปกติแล้วครับ' : 'ขออภัย ระบบขัดข้องชั่วคราว'}
                </h2>
                <p className="text-gray-600 mb-8">
                    {isServerOnline
                        ? 'กำลังพาท่านกลับเข้าสู่ระบบ...'
                        : 'Server มีปัญหากรุณารอสักครู่... ทางเรากำลังตรวจสอบและแก้ไข ระบบจะทำการเชื่อมต่อใหม่อัตโนมัติ'
                    }
                </p>

                {!isServerOnline && (
                    <div className="space-x-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
                        >
                            ลองอีกครั้ง
                        </button>

                    </div>
                )}
            </div>
        </div>
    );
}
