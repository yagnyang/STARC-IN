import React, { useState } from 'react';

interface ESASkyModalProps {
    onClose: () => void;
}

const ESASkyModal: React.FC<ESASkyModalProps> = ({ onClose }) => {
    const [status, setStatus] = useState('Loading ESASky...');

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#0a0a0f]">
            {/* Top Bar */}
            <div className="flex flex-shrink-0 items-center justify-between px-6 py-4 bg-[#131318]/90 border-b border-[#00d4ff]/20">
                <h2 className="text-white font-bold tracking-widest uppercase flex items-center gap-3">
                    ESA Sky — European Space Agency
                    <span className="text-[#00d4ff] text-sm font-mono ml-4 lowercase border border-[#00d4ff]/20 px-2 py-1 bg-[#00d4ff]/10">
                        {status}
                    </span>
                </h2>
                <button
                    onClick={onClose}
                    className="text-white hover:text-[#00d4ff] transition-colors p-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            {/* Content */}
            <div className="relative flex-1 w-full bg-black overflow-hidden">
                <iframe
                    src="https://sky.esa.int/"
                    className="w-full h-full border-0"
                    title="ESA Sky"
                    onLoad={() => setStatus('Ready')}
                    allowFullScreen
                />
            </div>
        </div>
    );
};

export default ESASkyModal;
