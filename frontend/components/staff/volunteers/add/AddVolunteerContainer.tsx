'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/auth';
import Swal from '@/lib/swal';
import WebcamModal from './WebcamModal';
import UserSearch from './UserSearch';
import ProfileImageUpload from './ProfileImageUpload';
import VolunteerForm from './VolunteerForm';

export default function AddVolunteerContainer() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    useEffect(() => {
        const requestCameraPermission = async () => {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    stream.getTracks().forEach(track => track.stop());
                } catch (error) {
                }
            }
        };

        requestCameraPermission();
    }, []);

    const [profileImage, setProfileImage] = useState<string | null>(null);

    const [showWebcamModal, setShowWebcamModal] = useState(false);
    const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);

    const [formData, setFormData] = useState({
        iamUserId: '',
        firstName: '',
        lastName: '',
        phone: '',
        gender: '',
        birthDate: '',
        houseNo: '',
        moo: '',
        villageName: '',
        provinceName: '',
        districtName: '',
        subdistrictName: '',
    });

    const handleSelectUser = (user: any) => {
        setSelectedUser(user);
        setFormData(prev => ({
            ...prev,
            iamUserId: user.iamUserId,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            phone: user.phone || '',
            gender: user.gender || '',
        }));
    };

    const handleClearSelection = () => {
        setSelectedUser(null);
        setFormData({
            iamUserId: '',
            firstName: '',
            lastName: '',
            phone: '',
            gender: '',
            birthDate: '',
            houseNo: '',
            moo: '',
            villageName: '',
            provinceName: '',
            districtName: '',
            subdistrictName: '',
        });
        setProfileImage(null);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const startWebcam = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            await Swal.fire({
                icon: 'error',
                title: 'ไม่สามารถใช้งานกล้องได้',
                text: 'อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับการเข้าถึงกล้อง (อาจต้องใช้ HTTPS)',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            setWebcamStream(stream);
            setShowWebcamModal(true);
        } catch (error: any) {
            console.error('Error accessing webcam:', error);

            let errorText = 'กรุณาอนุญาตให้เข้าถึงกล้อง หรือตรวจสอบว่ากล้องถูกเชื่อมต่ออยู่';

            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorText = 'การเข้าถึงกล้องถูกปฏิเสธ กรุณาตรวจสอบการตั้งค่าอนุญาตของเบราว์เซอร์';
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorText = 'ไม่พบกล้องที่เชื่อมต่ออยู่';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorText = 'กล้องอาจถูกใช้งานโดยแอปพลิเคชันอื่นอยู่';
            }

            await Swal.fire({
                icon: 'error',
                title: 'ไม่สามารถเปิดกล้องได้',
                text: errorText,
                footer: `<span class="text-sm text-gray-500">Error: ${error.name || error.message}</span>`,
                confirmButtonColor: '#1E7D55',
            });
        }
    };

    const stopWebcam = () => {
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
            setWebcamStream(null);
        }
        setShowWebcamModal(false);
    };

    const capturePhoto = (videoRef: React.RefObject<HTMLVideoElement | null>, canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const imageData = canvas.toDataURL('image/jpeg', 0.9);
                setProfileImage(imageData);
                stopWebcam();
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'phone') {
            const onlyNums = value.replace(/[^0-9]/g, '');
            if (onlyNums.length <= 10) {
                setFormData(prev => ({ ...prev, [name]: onlyNums }));
            }
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormDataChange = (updates: Record<string, string>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.iamUserId.trim()) {
            await Swal.fire({
                icon: 'warning',
                title: 'กรุณาเลือกประชาชน',
                text: 'ต้องเลือกประชาชนจากระบบเพื่อเพิ่มเป็นจิตอาสา',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        if (
            !formData.firstName.trim() ||
            !formData.lastName.trim() ||
            !formData.gender ||
            !formData.birthDate ||
            !formData.houseNo.trim() ||
            !formData.moo.trim() ||
            !formData.villageName.trim() ||
            !formData.provinceName.trim() ||
            !formData.districtName.trim() ||
            !formData.subdistrictName.trim()
        ) {
            await Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ครบถ้วน',
                text: 'กรุณากรอกข้อมูลให้ครบทุกช่อง',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        const phoneDigits = formData.phone.replace(/[^0-9]/g, '');
        if (!formData.phone.trim() || phoneDigits.length !== 10) {
            await Swal.fire({
                icon: 'warning',
                title: 'เบอร์โทรศัพท์ไม่ถูกต้อง',
                text: 'กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        try {
            setLoading(true);

            const roleResponse = await fetchWithAuth('/auth/user/update-role', {
                method: 'POST',
                body: JSON.stringify({
                    iamUserId: selectedUser.iamUserId,
                    role: 'DRIVE',
                }),
            });

            if (!roleResponse.ok) {
                const errorData = await roleResponse.json();
                throw new Error(errorData.message || 'ไม่สามารถเปลี่ยน role เป็นเจ้าหน้าที่รถได้');
            }

            const profileResponse = await fetchWithAuth(`/users/${selectedUser.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    gender: formData.gender,
                    birthDate: formData.birthDate || undefined,
                }),
            });

            if (!profileResponse.ok) {
                const errorData = await profileResponse.json();
                throw new Error(errorData.message || 'ไม่สามารถอัพเดทข้อมูลได้');
            }


            await Swal.fire({
                icon: 'success',
                title: 'เพิ่มจิตอาสาสำเร็จ!',
                text: 'ข้อมูลจิตอาสาถูกบันทึกเรียบร้อยแล้ว',
                confirmButtonColor: '#1E7D55',
                timer: 2000,
            });

            router.push('/staff/volunteers');
        } catch (error: any) {
            console.error('Error adding volunteer:', error);
            await Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถเพิ่มจิตอาสาได้',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <WebcamModal
                isOpen={showWebcamModal}
                stream={webcamStream}
                onClose={stopWebcam}
                onCapture={capturePhoto}
            />

            <div className="p-6">
                { }
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-glacier-light rounded-lg flex items-center justify-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M20 8V14" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M23 11H17" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-text-primary">เพิ่มข้อมูลจิตอาสา</h1>
                    </div>
                </div>

                { }
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <ProfileImageUpload
                        profileImage={profileImage}
                        originalPictureUrl={selectedUser?.pictureUrl}
                        onImageSelect={handleImageSelect}
                        onStartWebcam={startWebcam}
                    />

                    { }
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-text-primary">ข้อมูลสมาชิกจิตอาสา</h2>
                    </div>

                    <UserSearch
                        onSelectUser={handleSelectUser}
                        selectedUser={selectedUser}
                        onClearSelection={handleClearSelection}
                    />

                    <VolunteerForm
                        formData={formData}
                        handleChange={handleChange}
                        onFormDataChange={handleFormDataChange}
                        onSubmit={handleSubmit}
                        loading={loading}
                        onCancel={() => router.back()}
                    />
                </div>
            </div>
        </>
    );
}
