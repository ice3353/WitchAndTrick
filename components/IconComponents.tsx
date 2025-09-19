
import React from 'react';

export const WitchIcon: React.FC = () => (
    <div className="w-full h-full rounded-full bg-red-900/50 flex items-center justify-center border-2 border-red-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3/5 h-3/5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a2 2 0 0 0-2 2c0 .55.23 1.05.6 1.4L6 10v3l-2 2v2h16v-2l-2-2v-3l-4.6-4.6c.37-.35.6-.85.6-1.4a2 2 0 0 0-2-2z"/>
            <path d="M12 15l-2 2h4l-2-2z"/>
            <path d="M12 5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
        </svg>
    </div>
);

export const HumanIcon: React.FC = () => (
    <div className="w-full h-full rounded-full bg-blue-900/50 flex items-center justify-center border-2 border-blue-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3/5 h-3/5 text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.3 14.3 0 0 0-7.6 20.1" />
            <path d="M12 22a14.3 14.3 0 0 0 7.6-20.1" />
            <path d="M2 12h20" />
            <path d="M12 2a10 10 0 0 0-3.8 19.3" />
            <path d="M12 2a10 10 0 0 1 3.8 19.3" />
        </svg>
    </div>
);