
import React, { useState } from 'react';

interface StartScreenProps {
  onStart: (theme: string) => void;
  onStartTutorial: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, onStartTutorial }) => {
  const [theme, setTheme] = useState('');
  
  return (
    <div className="w-full h-full flex flex-col justify-center text-center p-4 sm:p-8 sm:max-w-2xl sm:mx-auto bg-black sm:bg-opacity-50 sm:rounded-lg sm:shadow-2xl sm:border sm:border-yellow-500/30">
      <h1 className="text-4xl font-bold font-cinzel text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">마녀와 추리의 윤무곡</h1>
      <h2 className="text-2xl font-cinzel text-red-500 mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">생성형 텍스트 어드벤쳐</h2>
      <p className="mb-6 text-gray-300">
        무한의 마녀, 베아트리체가 새로운 게임판을 준비했습니다.
        그녀가 만든 미스터리가 '마법'이 아닌 '인간의 트릭'으로 설명 가능함을 증명하고, 진실을 차지하십시오.
      </p>

      <div className="mb-6">
        <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="원하는 게임 테마를 입력하세요 (예: 우주 정거장의 살인)"
            aria-label="Custom game theme"
            className="w-full max-w-md mx-auto px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-center text-white placeholder-gray-500 transition-all"
        />
        <p className="text-xs text-gray-500 mt-2">비워두면 무작위 테마가 생성됩니다.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => onStart(theme)}
          className="px-8 py-3 bg-yellow-600 text-white font-bold rounded-lg hover:bg-yellow-500 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg font-cinzel"
        >
          새로운 게임 시작
        </button>
        <button
          onClick={onStartTutorial}
          className="px-8 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
        >
          게임 방법 학습 (튜토리얼)
        </button>
      </div>
    </div>
  );
};
