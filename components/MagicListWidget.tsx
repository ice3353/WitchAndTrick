
import React from 'react';

interface MagicListWidgetProps {
  magicList: string[];
  onClose: () => void;
}

export const MagicListWidget: React.FC<MagicListWidgetProps> = ({ magicList, onClose }) => {
  return (
    <aside className="w-full h-full flex flex-col bg-gray-900 border-l border-gray-700 p-4 shadow-2xl">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-purple-500/30">
        <h2 className="text-lg font-cinzel text-purple-400">
          &lt;마법 목록&gt;
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="마법 목록 닫기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {magicList.length > 0 ? (
          <ul className="space-y-3">
            {magicList.map((magic, index) => (
              <li key={index} className="text-purple-300 text-sm font-sans leading-relaxed">
                <span className="text-purple-500 mr-2">◆</span>{magic}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center text-sm italic mt-4">
            정의된 마법이 없습니다.
          </p>
        )}
      </div>
       <p className="text-xs text-gray-500 mt-2 text-center border-t border-gray-700 pt-2">
        이 목록의 모든 '마법'이 인간의 소행임을 증명하면 당신의 승리입니다.
      </p>
    </aside>
  );
};