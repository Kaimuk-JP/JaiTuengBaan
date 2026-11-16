"use client";

import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface PrivacyPolicyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
    variant?: 'caregiver' | 'patient' | 'volunteer' | 'staff';
}

export function PrivacyPolicyModal({
    isOpen,
    onClose,
    onAccept,
    variant = 'patient'
}: PrivacyPolicyModalProps) {
    useBodyScrollLock(isOpen);

    if (!isOpen) return null;

    const getVariantContent = () => {
        switch (variant) {
            case 'caregiver':
                return (
                    <>
                        <h5 className="text-sm font-semibold text-text-primary mt-3 mb-1">2.1 ข้อมูลผู้ดูแลประชาชน</h5>
                        <ul className="text-sm text-text-tertiary list-disc pl-5 mb-3 space-y-1">
                            <li><strong>ข้อมูลส่วนตัวและการติดต่อ:</strong> ชื่อ-นามสกุล, เพศ, วันเกิด, เลขบัตรประชาชน 13 หลัก, เบอร์โทรศัพท์, รูปโปรไฟล์</li>
                            <li><strong>ข้อมูลที่อยู่อาศัย:</strong> ที่อยู่, พิกัดตำแหน่งที่อยู่อาศัยบนแผนที่</li>
                            <li><strong>ข้อมูลประชาชนในความดูแล:</strong> รายชื่อผู้ป่วย/ผู้สูงอายุ, ความสัมพันธ์ (ครอบครัว, ญาติ, คนสนิท)</li>
                            <li><strong>เอกสารหลักฐาน:</strong> ภาพถ่ายเอกสารยืนยันความสัมพันธ์หรือหนังสือมอบอำนาจ</li>
                            <li><strong>ข้อมูลการใช้งาน:</strong> ประวัติการลงทะเบียนและจองคิวรับ-ส่งแทนประชาชน</li>
                        </ul>
                    </>
                );
            case 'volunteer':
                return (
                    <>
                        <h5 className="text-sm font-semibold text-text-primary mt-3 mb-1">2.1 ข้อมูลอาสาสมัครขับรถและผู้ดูแลระหว่างเดินทาง</h5>
                        <ul className="text-sm text-text-tertiary list-disc pl-5 mb-3 space-y-1">
                            <li><strong>ข้อมูลส่วนตัว:</strong> ชื่อ-นามสกุล, เพศ, วันเกิด, เลขบัตรประชาชน 13 หลัก, เบอร์โทรศัพท์, รูปโปรไฟล์</li>
                            <li><strong>ข้อมูลยานพาหนะ:</strong> ทะเบียนรถ, ยี่ห้อ, รุ่น, ประเภทรถ, บันทึกเลขไมล์ก่อนและหลังเดินทาง, ภาพส่งรถคืน</li>
                            <li><strong>ข้อมูลการเดินทางแบบเรียลไทม์:</strong> พิกัด GPS สดขณะปฏิบัติภารกิจรับ-ส่ง (JobLocationLog), ระยะทางจริง</li>
                            <li><strong>ผลงานและสิทธิประโยชน์:</strong> ประวัติรับงาน, คะแนนรีวิว, คะแนนสะสมความดี (Points), ประวัติการแลกของรางวัล</li>
                        </ul>
                    </>
                );
            case 'staff':
                return (
                    <>
                        <h5 className="text-sm font-semibold text-text-primary mt-3 mb-1">2.1 ข้อมูลเจ้าหน้าที่และผู้บริหาร</h5>
                        <ul className="text-sm text-text-tertiary list-disc pl-5 mb-3 space-y-1">
                            <li><strong>ข้อมูลส่วนตัว:</strong> ชื่อ-นามสกุล, เบอร์โทรศัพท์, หน่วยงาน/เทศบาลต้นสังกัด</li>
                            <li><strong>ข้อมูลการปฏิบัติงาน:</strong> บันทึกการตรวจสอบและอนุมัติคำขอคิว, บันทึกการจัดสรรงาน, บันทึกการจัดการคลังรางวัล</li>
                            <li><strong>ข้อมูลความมั่นคงปลอดภัย:</strong> สิทธิ์การเข้าถึงระบบ, บันทึกกิจกรรมระบบ (Activity Logs)</li>
                        </ul>
                    </>
                );
            default:
                return (
                    <>
                        <h5 className="text-sm font-semibold text-text-primary mt-3 mb-1">2.1 ข้อมูลประชาชนและผู้รับบริการ</h5>
                        <ul className="text-sm text-text-tertiary list-disc pl-5 mb-3 space-y-1">
                            <li><strong>ข้อมูลส่วนตัวและติดต่อ:</strong> ชื่อ-นามสกุล, เพศ, วันเกิด, เลขบัตรประชาชน 13 หลัก, เบอร์โทรศัพท์, เบอร์ติดต่อฉุกเฉิน/ญาติ, รูปโปรไฟล์</li>
                            <li><strong>ข้อมูลสุขภาพและความต้องการพิเศษ (ข้อมูลอ่อนไหว):</strong> โรคประจำตัว, ภาวะการเคลื่อนไหว (เดินได้/วีลแชร์/ติดเตียง), ความต้องการพิเศษ, อุปกรณ์ที่จำเป็น, ภาพใบนัดแพทย์, โรงพยาบาลและแผนกที่นัดตรวจ</li>
                            <li><strong>ข้อมูลที่อยู่และพิกัด:</strong> ที่อยู่, พิกัด GPS จุดรับ-ส่ง, ข้อมูลการยืนยันที่พักอาศัยผ่านระบบ IAM (Residence Claim)</li>
                            <li><strong>ข้อมูลผู้ดูแล:</strong> ชื่อและเบอร์โทรศัพท์ผู้ดูแลประชาชน, ความสัมพันธ์</li>
                            <li><strong>ข้อมูลการใช้งาน:</strong> ประวัติการจองคิว, ประวัติการเดินทาง, การประเมินความพึงพอใจการบริการเทศบาล (Municipal Rating)</li>
                        </ul>
                    </>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3x">
            <div className="bg-white rounded-square-hard shadow-smooth-high max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                { }
                <div className="bg-brand-primary text-white px-3x py-2x flex items-center justify-between">
                    <h2 className="typo-sub font-bold">ประกาศความเป็นส่วนตัว (Privacy Notice v2.0)</h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-fuji-light transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                { }
                <div className="overflow-y-auto flex-1 px-3x py-2x">
                    <div className="prose prose-sm max-w-none">
                        <h3 className="text-lg font-bold text-text-primary mb-2">ระบบ ใจส่งถึงบ้าน - ระบบบริหารจัดการอาสาสมัครรับ-ส่งประชาชนไปโรงพยาบาล</h3>
                        <p className="text-sm text-text-tertiary mb-4">วันที่มีผลบังคับใช้: 1 กันยายน 2569 (เวอร์ชัน 2.0)</p>

                        <h4 className="text-base font-bold text-text-primary mt-4 mb-2">1. บทนำ</h4>
                        <p className="text-sm text-gray-700 mb-3">
                            ระบบ ใจส่งถึงบ้าน ("เรา" หรือ "ระบบของเรา") ให้ความสำคัญกับความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคลของท่าน
                            ประกาศความเป็นส่วนตัวฉบับนี้จัดทำขึ้นเพื่ออธิบายให้ท่านทราบถึงวิธีการที่เราเก็บรวบรวม ใช้ เปิดเผย และคุ้มครองข้อมูลส่วนบุคคลของท่าน
                            ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
                        </p>

                        <h4 className="text-base font-bold text-text-primary mt-4 mb-2">2. ข้อมูลส่วนบุคคลที่เราเก็บรวบรวม</h4>
                        {getVariantContent()}

                        <h4 className="text-base font-bold text-text-primary mt-4 mb-2">3. วัตถุประสงค์ในการเก็บรวบรวมและใช้ข้อมูล</h4>
                        <p className="text-sm text-text-tertiary mb-2">เราเก็บรวบรวมและใช้ข้อมูลส่วนบุคคลของท่านเพื่อวัตถุประสงค์ดังต่อไปนี้:</p>
                        <ul className="text-sm text-text-tertiary list-disc pl-5 mb-3 space-y-1">
                            <li>จัดการระบบจองคิวโรงพยาบาลและจัดเตรียมอุปกรณ์การแพทย์สำหรับประชาชน</li>
                            <li>จัดหา จัดสรร และมอบหมายงานแก่อาสาสมัครขับรถ และผู้ดูแลระหว่างเดินทาง</li>
                            <li>ติดตามตำแหน่งยานพาหนะแบบเรียลไทม์ (Real-time GPS Tracking) เพื่อความปลอดภัยในการเดินทาง</li>
                            <li>ยืนยันความสัมพันธ์ระหว่างผู้ดูแลประชาชนและประชาชน พร้อมตรวจสอบสิทธิ์ภูมิลำเนา (IAM SSO / Residence Claim)</li>
                            <li>บริหารจัดการระบบคะแนนสะสมและของรางวัลสำหรับอาสาสมัคร</li>
                            <li>ประเมินคุณภาพและความพึงพอใจการให้บริการขององค์กรปกครองส่วนท้องถิ่น (Municipal Rating)</li>
                        </ul>

                        <h4 className="text-base font-bold text-text-primary mt-4 mb-2">4. การรักษาความมั่นคงปลอดภัยของข้อมูล</h4>
                        <p className="text-sm text-text-tertiary mb-2">เรามีมาตรการรักษาความมั่นคงปลอดภัยของข้อมูลส่วนบุคคล ดังนี้:</p>
                        <ul className="text-sm text-text-tertiary list-disc pl-5 mb-3 space-y-1">
                            <li>เข้ารหัสข้อมูลสำคัญและการรับส่งข้อมูลผ่าน HTTPS (TLS) และ Bcrypt Hashing</li>
                            <li>จำกัดการเข้าถึงข้อมูลตามบทบาทหน้าที่ (Role-Based Access Control - RBAC)</li>
                            <li>ระบบ Authentication และ Session Security ป้องกันการเข้าถึงโดยมิชอบ</li>
                            <li>การล้างข้อมูล Metadata และบีบอัดไฟล์ภาพก่อนจัดเก็บ (Image Sanitization)</li>
                            <li>การบันทึก Activity Logs ละเอียดเพื่อการตรวจสอบย้อนหลัง (Audit Trail) และการสำรองข้อมูลสม่ำเสมอ</li>
                        </ul>

                        <h4 className="text-base font-bold text-text-primary mt-4 mb-2">5. สิทธิของเจ้าของข้อมูลส่วนบุคคลตาม PDPA (8 ประการ)</h4>
                        <p className="text-sm text-text-tertiary mb-2">ท่านมีสิทธิตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล ดังนี้:</p>
                        <ul className="text-sm text-text-tertiary list-disc pl-5 mb-3 space-y-1">
                            <li>สิทธิในการเข้าถึงและขอรับสำเนาข้อมูล (Right of Access)</li>
                            <li>สิทธิในการขอแก้ไขข้อมูลให้ถูกต้องเป็นปัจจุบัน (Right to Rectification)</li>
                            <li>สิทธิในการขอลบหรือทำลายข้อมูล (Right to Erasure)</li>
                            <li>สิทธิในการขอให้ระงับการใช้ข้อมูล (Right to Restriction)</li>
                            <li>สิทธิในการขอรับหรือโอนย้ายข้อมูล (Right to Data Portability)</li>
                            <li>สิทธิในการคัดค้านการประมวลผลข้อมูล (Right to Object)</li>
                            <li>สิทธิในการถอนความยินยอม (Right to Withdraw Consent)</li>
                            <li>สิทธิในการร้องเรียนต่อสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (Right to Lodge a Complaint)</li>
                        </ul>

                        <p className="text-sm text-text-tertiary italic mt-4">
                            สำหรับรายละเอียดเพิ่มเติม กรุณาอ่านประกาศความเป็นส่วนตัวฉบับเต็ม (PRIVACY_NOTICE.md Version 2.0)
                        </p>
                    </div>
                </div>

                { }
                <div className="border-t border-border-neutral px-3x py-2x flex justify-end gap-2x">
                    <button
                        onClick={() => {
                            onAccept();
                            onClose();
                        }}
                        className="bg-brand-primary hover:bg-btn-hover text-white typo-button-sm py-1x px-3x rounded-square transition-all"
                    >
                        ยอมรับและปิด
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-fuji-light hover:bg-fuji-soft text-text-primary typo-button-sm py-1x px-3x rounded-square transition-all"
                    >
                        ปิด
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PrivacyPolicyModal;
