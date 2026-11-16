import Swal from '@/lib/swal';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function captureReturnEvidence(): Promise<File | null> {
    const isMobileDevice = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || (navigator.maxTouchPoints > 0 && /Macintosh/.test(navigator.userAgent));

    let file: File | null = null;

    if (isMobileDevice) {
        file = await new Promise<File | null>((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.setAttribute('capture', 'environment');
            input.style.display = 'none';
            document.body.appendChild(input);

            input.addEventListener('change', () => {
                const selectedFile = input.files?.[0] || null;
                input.remove();
                resolve(selectedFile);
            });

            input.addEventListener('cancel', () => {
                input.remove();
                resolve(null);
            });

            window.addEventListener('focus', function onFocus() {
                setTimeout(() => {
                    if (!input.files?.length) {
                        input.remove();
                        resolve(null);
                    }
                    window.removeEventListener('focus', onFocus);
                }, 500);
            });

            input.click();
        });
    } else {
        const result = await Swal.fire({
            title: 'ถ่ายรูปหลักฐาน',
            html: `
                <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
                    <video id="swal-webcam" autoplay playsinline style="width:100%;max-width:400px;border-radius:12px;background:#000;"></video>
                    <p style="font-size:14px;color:#666;">กรุณาถ่ายรูปผู้ป่วยที่บ้าน</p>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'ถ่ายรูป',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#1E7D55',
            didOpen: async () => {
                try {
                    const video = document.getElementById('swal-webcam') as HTMLVideoElement;
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                    video.srcObject = stream;
                } catch {
                    Swal.showValidationMessage('ไม่สามารถเปิดกล้องได้');
                }
            },
            willClose: () => {
                const video = document.getElementById('swal-webcam') as HTMLVideoElement;
                const stream = video?.srcObject as MediaStream;
                if (stream) stream.getTracks().forEach((t) => t.stop());
            },
            preConfirm: () => {
                const video = document.getElementById('swal-webcam') as HTMLVideoElement;
                if (!video?.videoWidth) {
                    Swal.showValidationMessage('กรุณารอให้กล้องพร้อม');
                    return false;
                }
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d')?.drawImage(video, 0, 0);
                return new Promise<File | false>((resolve) => {
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            Swal.showValidationMessage('ถ่ายรูปไม่สำเร็จ');
                            resolve(false);
                            return;
                        }
                        resolve(new File([blob], 'return-evidence.jpg', { type: 'image/jpeg' }));
                    }, 'image/jpeg', 0.85);
                });
            },
        });

        if (result.isConfirmed && result.value) {
            file = result.value as File;
        }
    }

    if (!file) return null;

    const previewUrl = URL.createObjectURL(file);
    const previewResult = await Swal.fire({
        title: 'ยืนยันรูปหลักฐาน',
        imageUrl: previewUrl,
        imageAlt: 'รูปหลักฐาน',
        showCancelButton: true,
        confirmButtonText: 'ใช้รูปนี้',
        cancelButtonText: 'ถ่ายใหม่',
        confirmButtonColor: '#1E7D55',
    }).finally(() => {
        URL.revokeObjectURL(previewUrl);
    });

    if (!previewResult.isConfirmed) {
        return captureReturnEvidence();
    }

    return file;
}

export async function uploadReturnEvidence(file: File): Promise<string> {
    Swal.fire({
        title: 'กำลังอัพโหลด...',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
    });

    const formData = new FormData();
    formData.append('file', file);

    const uploadRes = await fetch(`${API_BASE_URL}/upload/return-evidence`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
    });

    Swal.close();

    if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error(`อัพโหลดรูปล้มเหลว: ${errText}`);
    }

    const uploadData = await uploadRes.json();
    return uploadData.url;
}
