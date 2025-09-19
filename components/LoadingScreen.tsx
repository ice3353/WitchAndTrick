
import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  thoughts: string[];
  isComplete: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ thoughts, isComplete }) => {
  const [displayedThought, setDisplayedThought] = useState('');
  const [thoughtIndex, setThoughtIndex] = useState(0);

  useEffect(() => {
    if (thoughtIndex < thoughts.length) {
      const timer = setTimeout(() => {
        const fullThought = thoughts[thoughtIndex];
        const maxLength = 70; // Set a max length for the thought string
        const truncatedThought = fullThought.length > maxLength
          ? fullThought.substring(0, maxLength) + '...'
          : fullThought;
        setDisplayedThought(truncatedThought);
        setThoughtIndex(prev => prev + 1);
      }, 150); // Fast-paced update
      return () => clearTimeout(timer);
    }
  }, [thoughts, thoughtIndex]);

  return (
    <div className="w-full h-full flex flex-col justify-center text-center p-4 sm:p-8 sm:max-w-3xl bg-black sm:bg-opacity-70 sm:rounded-lg sm:shadow-2xl sm:border sm:border-yellow-500/30">
      <h2 className="text-2xl font-cinzel text-yellow-400 mb-4 animate-pulse">마녀가 게임판을 구축하는 중...</h2>
      <div className="h-8 mt-4 text-gray-300 font-mono transition-opacity duration-500">
        <p key={thoughtIndex}>{displayedThought}</p>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5 mt-6">
        <div 
            className="bg-red-600 h-2.5 rounded-full animate-pulse transition-all duration-500 ease-in-out" 
            style={{ width: isComplete ? '100%' : `${Math.min(95, (thoughts.length / 15) * 100)}%` }}>
        </div>
      </div>
       <p className="mt-4 text-sm text-gray-400">
        마녀가 체스판을 구축합니다. 스포일러 방지를 위해 요약된 내용만 표시됩니다.
      </p>
    </div>
  );
};
