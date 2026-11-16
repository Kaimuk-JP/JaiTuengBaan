interface EmptyQueueStateProps {
    onBookNew: () => void;
}

export function EmptyQueueState({ onBookNew }: EmptyQueueStateProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-square-hard shadow-smooth-low border border-border-neutral dark:border-gray-700 p-4x text-center">
            <div className="flex justify-center mb-2x">
                <svg width="143" height="143" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="none">
                    <g>
                        <polyline points="327.67 340.13 253.67 321.26 180.42 340.13 253.67 360.57" fill="none" stroke="#808285" strokeWidth="5.12" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M230.02,353.97c.72-2.38,1.85-4.58,3.29-6.54-.1-.12-.16-.26-.17-.43l-.47-10.48c-.03-.59,.59-.98,1.12-.71l8.57,4.45c2.63-1.13,5.53-1.75,8.58-1.75s5.85,.6,8.45,1.69l8.47-4.39c.52-.27,1.14,.12,1.12,.71l-.48,10.48c0,.09-.02,.18-.06,.26,1.8,2.39,3.12,5.16,3.82,8.17" fill="none" stroke="#808285" strokeWidth="5.12" strokeMiterlimit="10"/>
                        <polyline points="180.42 375.02 180.42 419.9 253.67 440.34 253.67 382.12 253.67 360.57 230.02 353.97 180.42 340.13" fill="none" stroke="#808285" strokeWidth="5.12" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="253.67 382.12 253.67 440.34 327.67 419.9 327.67 373.45" fill="none" stroke="#808285" strokeWidth="5.12" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="327.67 340.13 272.26 355.43 253.67 360.57 270.92 369.34" fill="none" stroke="#808285" strokeWidth="5.12" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="272.26 355.43 327.67 340.13 368.86 362.63 327.67 373.45 295.61 381.88 270.92 369.34" fill="none" stroke="#808285" strokeWidth="5.12" strokeLinecap="round" strokeLinejoin="round"/>
                        <polygon points="253.67 321.26 180.42 340.13 139.24 322.3 212.48 303.05 253.67 321.26" fill="none" stroke="#808285" strokeWidth="5.12" strokeLinecap="round" strokeLinejoin="round"/>
                        <polygon points="139.24 364.2 212.48 383.45 253.67 360.57 180.42 340.13 139.24 364.2" fill="none" stroke="#808285" strokeWidth="5.12" strokeLinecap="round" strokeLinejoin="round"/>
                        <polygon points="253.67 321.26 327.31 340.04 372.76 319.52 299.52 300.27 253.67 321.26" fill="none" stroke="#808285" strokeWidth="5.12" strokeLinecap="round" strokeLinejoin="round"/>
                    </g>
                    <path d="M253.21,71.66c-10.81,0-32.42,2.77-32.42,12.74,0,3.88,3.05,7.48,7.48,7.48,.83,0,1.94-.27,3.05-.55,7.48-2.77,14.68-4.16,21.33-4.16,27.43,0,47.37,20.78,47.37,42.11,0,14.4-9.14,28.81-30.75,37.4-24.93,9.97-29.64,17.17-29.64,39.33,0,8.87,.56,15.8,8.59,15.8,4.15,0,8.59-3.05,8.59-9.42v-.56c-.28-2.49-.28-4.98-.28-6.92,0-14.68,4.16-17.46,20.78-24.38,29.08-12.47,41.27-31.86,41.27-50.97,0-29.37-28.25-57.9-65.37-57.9Z" fill="none" stroke="#808285" strokeWidth="5.12" strokeMiterlimit="10"/>
                    <circle cx="249.74" cy="259.07" r="11.32" fill="none" stroke="#808285" strokeWidth="5.12" strokeMiterlimit="10"/>
                </svg>
            </div>
            <h3 className="typo-body font-bold text-text-primary mb-1x">ยังไม่มีการจอง</h3>
            <p className="typo-menu text-text-tertiary mb-3x">คุณยังไม่มีคิวที่จองไว้</p>
            <button
                onClick={onBookNew}
                className="bg-brand-primary hover:bg-btn-hover text-white px-3x py-1x rounded-square typo-button-sm transition-colors"
            >
                <span className="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                        <defs>
                            <mask id="notebook-mask">
                                <rect width="24" height="24" fill="white" />

                                <rect x="7.5" y="6" width="9" height="2.5" rx="1" fill="black" />
                                <rect x="7.5" y="11.5" width="9" height="2.5" rx="1" fill="black" />
                                <rect x="7.5" y="17" width="5.5" height="2.5" rx="1" fill="black" />

                                <path d="M 14.5 15 L 23 6.5" stroke="black" strokeWidth="3" strokeLinecap="round" />
                                <path d="M 15 15 C 13 17 12.5 22 17.5 21.5" stroke="black" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                            </mask>
                        </defs>

                        <path d="M 2 5.5 C 2 4.5 2.8 4 4 4 V 7 C 2.8 7 2 6.5 2 5.5 Z" fill="currentColor" />
                        <path d="M 2 12 C 2 11 2.8 10.5 4 10.5 V 13.5 C 2.8 13.5 2 13 2 12 Z" fill="currentColor" />
                        <path d="M 2 18.5 C 2 17.5 2.8 17 4 17 V 20 C 2.8 20 2 19.5 2 18.5 Z" fill="currentColor" />

                        <rect x="4" y="2" width="15" height="20" rx="2" fill="currentColor" mask="url(#notebook-mask)" />

                        <path d="M 21.7 6.8 L 15.2 13.3 V 15.5 H 17.4 L 23.9 9 C 24.3 8.6 24.3 8 23.9 7.6 L 23 6.7 C 22.6 6.3 22.1 6.3 21.7 6.8 Z" fill="currentColor" />
                    </svg>
                    จองคิวใหม่
                </span>
            </button>
        </div>
    );
}
