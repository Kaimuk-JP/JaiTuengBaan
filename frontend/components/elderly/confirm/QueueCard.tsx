interface QueueCardProps {
    queue: {
        id: string | number;
        status: string;
        requestDate?: string;
        department?: string;
        hospital?: {
            name: string;
        };
    };
    onClose: () => void;
}

export function QueueCard({ queue, onClose }: QueueCardProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-semibold text-lg">{queue.department || 'ไม่ระบุแผนก'}</h3>
                    <p className="text-gray-600">{queue.hospital?.name || 'ไม่ระบุโรงพยาบาล'}</p>
                    {queue.requestDate && (
                        <p className="text-sm text-gray-500">{formatDate(queue.requestDate)}</p>
                    )}
                </div>
                <span className={`px-2 py-1 rounded text-sm ${
                    queue.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    queue.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                }`}>
                    {queue.status}
                </span>
            </div>
            <button
                onClick={onClose}
                className="mt-4 w-full bg-brand-primary text-white py-2 rounded hover:bg-brand-primary/90"
            >
                ปิด
            </button>
        </div>
    );
}
