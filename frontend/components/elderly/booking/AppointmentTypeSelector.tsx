interface AppointmentTypeSelectorProps {
    hasAppointment: boolean;
    onSelect: (hasAppointment: boolean) => void;
}

export function AppointmentTypeSelector({ hasAppointment, onSelect }: AppointmentTypeSelectorProps) {
    return (
        <div className="grid grid-cols-2 gap-3 mb-6">
            <button
                type="button"
                onClick={() => onSelect(true)}
                className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 overflow-hidden group ${hasAppointment
                    ? "bg-brand-primary/10 border-brand-primary shadow-sm"
                    : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-brand-primary/30 hover:bg-brand-primary/5"
                    }`}
            >
                {hasAppointment && (
                    <div className="absolute top-2 right-2">
                        <svg className="w-5 h-5 text-brand-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>
                )}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${hasAppointment ? 'bg-brand-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 group-hover:text-brand-primary'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className={`text-base font-bold mb-1 ${hasAppointment ? 'text-brand-primary' : 'text-gray-700 dark:text-gray-200'}`}>มีใบนัดแพทย์</h3>
                <p className={`text-[11px] text-center px-2 leading-tight ${hasAppointment ? 'text-brand-primary/80' : 'text-gray-400'}`}>มีเอกสารนัดหมายจากโรงพยาบาล</p>
            </button>
            <button
                type="button"
                onClick={() => onSelect(false)}
                className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 overflow-hidden group ${!hasAppointment
                    ? "bg-brand-primary/10 border-brand-primary shadow-sm"
                    : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-brand-primary/30 hover:bg-brand-primary/5"
                    }`}
            >
                {!hasAppointment && (
                    <div className="absolute top-2 right-2">
                        <svg className="w-5 h-5 text-brand-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>
                )}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${!hasAppointment ? 'bg-brand-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 group-hover:text-brand-primary'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className={`text-base font-bold mb-1 ${!hasAppointment ? 'text-brand-primary' : 'text-gray-700 dark:text-gray-200'}`}>ไม่มีใบนัด</h3>
                <p className={`text-[11px] text-center px-2 leading-tight ${!hasAppointment ? 'text-brand-primary/80' : 'text-gray-400'}`}>ต้องการไปพบแพทย์ด้วยตนเอง</p>
            </button>
        </div>
    );
}