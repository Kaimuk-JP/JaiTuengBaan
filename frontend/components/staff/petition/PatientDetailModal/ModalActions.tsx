interface ModalActionsProps {
    isEditMode: boolean;
    queueStatus?: string;
    userRole?: string;
    executiveApprovalEnabled?: boolean;
    onCancel: () => void;
    onSave: () => void;
    onReject: () => void;
    onApprove: () => void;
    onResubmitToExecutive?: () => void;
    onClose?: () => void;
}

export default function ModalActions({
    isEditMode,
    queueStatus,
    userRole,
    executiveApprovalEnabled = true,
    onCancel,
    onSave,
    onReject,
    onApprove,
    onResubmitToExecutive,
    onClose,
}: ModalActionsProps) {
    return (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-center gap-4 rounded-b-2xl">
            {isEditMode ? (
                <>
                    <button
                        onClick={onCancel}
                        className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={onSave}
                        className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        บันทึก
                    </button>
                </>
            ) : queueStatus === 'PENDING_MUNICIPAL' && userRole !== 'EXECUTIVE' ? (
                <>
                    <button
                        onClick={onApprove}
                        className="px-6 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-lg hover:bg-btn-hover transition-colors"
                    >
                        รับคำร้อง
                    </button>
                </>
            ) : queueStatus === 'EXECUTIVE_REJECTED' && userRole !== 'EXECUTIVE' ? (
                <>
                    <button
                        onClick={onResubmitToExecutive}
                        className="px-6 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
                    >
                        {executiveApprovalEnabled ? 'ส่งกลับผู้บริหารอนุมัติ' : 'ยืนยันคำร้อง'}
                    </button>
                </>
            ) : queueStatus === 'PENDING_EXECUTIVE' && (userRole === 'EXECUTIVE' || userRole === 'ADMIN') && executiveApprovalEnabled ? (
                <>
                    <button
                        onClick={onReject}
                        className="px-6 py-2.5 border-2 border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
                    >
                        ส่งกลับแก้ไข
                    </button>
                    <button
                        onClick={onApprove}
                        className="px-6 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
                    >
                        อนุมัติผู้บริหาร
                    </button>
                </>
            ) : (
                <button
                    onClick={onClose || onCancel}
                    className="px-8 py-2.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                    ปิด
                </button>
            )}
        </div>
    );
}
