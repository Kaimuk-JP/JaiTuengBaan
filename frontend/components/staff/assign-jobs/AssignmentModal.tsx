'use client';

interface Volunteer {
    id: number;
    displayName: string;
    phone?: string;
    pointsBalance: number;
}

interface Queue {
    id: number;
    requiredVolunteers: number;
    user: {
        displayName: string;
    };
    hospitalName?: string;
    hospital?: {
        name: string;
    };
}

interface AssignmentModalProps {
    queue: Queue;
    volunteers: Volunteer[];
    selectedVolunteers: number[];
    onVolunteerToggle: (vltId: number) => void;
    onAssign: () => void;
    onClose: () => void;
    isLoading?: boolean;
}

export default function AssignmentModal({
    queue,
    volunteers,
    selectedVolunteers,
    onVolunteerToggle,
    onAssign,
    onClose,
    isLoading = false,
}: AssignmentModalProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                    เลือกจิตอาสาสำหรับคิว #{queue.id}
                </h2>

                { }
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                        <strong>ประชาชน:</strong> {queue.user.displayName}
                    </p>
                    <p className="text-sm text-gray-700">
                        <strong>โรงพยาบาล:</strong> {queue.hospital?.name || queue.hospitalName || '-'}
                    </p>
                    <p className="text-sm font-medium text-blue-600 mt-2">
                        ต้องการจิตอาสา: {queue.requiredVolunteers} คน
                    </p>
                    <p className="text-sm text-gray-600">
                        เลือกแล้ว: {selectedVolunteers.length} คน
                    </p>
                </div>

                { }
                <div className="space-y-2 mb-6">
                    {volunteers.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">ไม่พบจิตอาสาในระบบ</p>
                    ) : (
                        volunteers.map((volunteer) => (
                            <div
                                key={volunteer.id}
                                onClick={() => onVolunteerToggle(volunteer.id)}
                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedVolunteers.includes(volunteer.id)
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800">{volunteer.displayName}</p>
                                        <p className="text-sm text-gray-600">โทร: {volunteer.phone || '-'}</p>
                                        <p className="text-sm text-brand-primary">แต้มสะสม: {volunteer.pointsBalance} แต้ม</p>
                                    </div>
                                    {selectedVolunteers.includes(volunteer.id) && (
                                        <div className="text-blue-600 text-2xl">✓</div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                { }
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={onAssign}
                        disabled={selectedVolunteers.length === 0 || isLoading}
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                กำลังมอบหมาย...
                            </span>
                        ) : (
                            ` มอบหมายงาน (${selectedVolunteers.length})`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
