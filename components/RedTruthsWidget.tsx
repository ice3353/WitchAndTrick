import React from 'react';

interface RedTruthsWidgetProps {
  usedRedTruths: string[];
  onClose: () => void;
}

export const RedTruthsWidget: React.FC<RedTruthsWidgetProps> = ({ usedRedTruths, onClose }) => {
  return (
    <aside className="w-full h-full flex flex-col bg-gray-900 border-l border-gray-700 p-4 shadow-2xl">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-red-500/30">
        <h2 className="text-lg font-cinzel text-red-500">
          &lt;붉은 진실 목록&gt;
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="붉은 진실 목록 닫기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {usedRedTruths.length > 0 ? (
          <ul className="space-y-3">
            {usedRedTruths.map((truth, index) => (
              <li key={index} className="text-red-400 text-sm font-sans leading-relaxed">
                <span className="text-red-600 mr-2">◆</span>{truth}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center text-sm italic mt-4">
            아직 선언된 붉은 진실이 없습니다.
          </p>
        )}
      </div>
    </aside>
  );
};