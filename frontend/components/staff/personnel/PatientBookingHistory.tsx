import React, { useState } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import BookingDetailModal from '../history/BookingDetailModal';

interface BookingHistoryProps {
    queues: any[];
}

const statusMap: Record<string, { label: string; color: string }> = {
    PENDING_MUNICIPAL: { label: 'รอตรวจสอบ', color: 'bg-yellow-100 text-yellow-800' },
    PENDING: { label: 'รอตรวจสอบ', color: 'bg-amber-100 text-amber-700' },
    APPROVED: { label: 'อนุมัติ', color: 'bg-green-100 text-green-700' },
    PENDING_EXECUTIVE: { label: 'รอผู้บริหารอนุมัติ', color: 'bg-orange-100 text-orange-700' },
    CONFIRMED: { label: 'ยืนยันแล้ว', color: 'bg-green-100 text-green-700' },
    OPEN: { label: 'รอให้บริการ', color: 'bg-yellow-100 text-yellow-700' },
    ASSIGNED: { label: 'รอให้บริการ', color: 'bg-yellow-100 text-yellow-700' },
    ACCEPTED: { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-700' },
    PICKING_UP: { label: 'กำลังไปรับประชาชน', color: 'bg-orange-100 text-orange-700' },
    PICKED_UP: { label: 'รับประชาชนแล้ว', color: 'bg-sky-100 text-sky-700' },
    IN_TRANSIT: { label: 'กำลังเดินทางไปโรงพยาบาล', color: 'bg-sky-100 text-sky-700' },
    RETURN_HOME: { label: 'กำลังพาประชาชนกลับบ้าน', color: 'bg-purple-100 text-purple-700' },
    RETURN_OFFICE: { label: 'กำลังกลับศูนย์', color: 'bg-indigo-100 text-indigo-700' },
    COMPLETED: { label: 'เสร็จสิ้น', color: 'bg-brand-primary text-white' },
    REJECTED: { label: 'ปฏิเสธ', color: 'bg-red-100 text-red-700' },
    CANCELLED: { label: 'ยกเลิก', color: 'bg-gray-100 text-gray-700' },
    CANCELLED_BY_USER: { label: 'ผู้ใช้ยกเลิก', color: 'bg-gray-100 text-gray-700' },
    CANCELLED_BY_MUNICIPAL: { label: 'เทศบาลยกเลิก', color: 'bg-rose-100 text-rose-700' },
    CANCELLED_BY_STAFF: { label: 'เจ้าหน้าที่ยกเลิก', color: 'bg-rose-100 text-rose-700' },
};

export default function PatientBookingHistory({ queues }: BookingHistoryProps) {
    const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);

    if (!queues || queues.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500">
                ยังไม่มีประวัติการจอง
            </div>
        );
    }

    const sortedQueues = [...queues].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead className="bg-[#F8FAFC] border-b border-[#C8CEDD]">
                    <tr>
                        <th className="px-4 py-3 text-left text-sm font-normal text-[#314158]">ชื่อประชาชน</th>
                        <th className="px-4 py-3 text-left text-sm font-normal text-[#314158]">วันที่</th>
                        <th className="px-4 py-3 text-left text-sm font-normal text-[#314158]">ช่วงเวลาการจอง</th>
                        <th className="px-4 py-3 text-left text-sm font-normal text-[#314158]">รายละเอียด</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {sortedQueues.map((queue) => {
                        const patientName = queue.user
                            ? `${queue.user.firstName || ''} ${queue.user.lastName || ''}`.trim() || queue.user.displayName
                            : '-';
                        const statusConfig = statusMap[queue.status] || { label: queue.status, color: 'bg-gray-100 text-gray-800' };

                        return (
                            <tr key={queue.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4 text-sm text-text-primary">
                                    {patientName}
                                </td>
                                <td className="px-4 py-4 text-sm text-text-primary">
                                    {queue.requestDate
                                        ? format(new Date(queue.requestDate), 'dd/MM/yyyy', { locale: th })
                                        : '-'}
                                </td>
                                <td className="px-4 py-4 text-sm text-text-primary">
                                    {queue.bookingTime || '-'}
                                </td>

                                <td className="px-4 py-4 text-sm">
                                    <button
                                        onClick={() => setSelectedQueueId(queue.id.toString())}
                                        className="px-4 py-1.5 bg-[#1F7A53] hover:bg-[#186241] text-white rounded-full text-sm font-normal transition-colors whitespace-nowrap"
                                    >
                                        ตรวจสอบ
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {selectedQueueId && (
                <BookingDetailModal
                    queueId={selectedQueueId}
                    onClose={() => setSelectedQueueId(null)}
                />
            )}
        </div>
    );
}
