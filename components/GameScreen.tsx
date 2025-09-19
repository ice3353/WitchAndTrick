
import React, { useState, useRef, useEffect } from 'react';
import type { GameState } from '../types';
import { ChatLog } from './ChatLog';
import { RedTruthsWidget } from './RedTruthsWidget';
import { MagicListWidget } from './MagicListWidget';

interface GameScreenProps {
  gameState: GameState;
  isFinished: boolean;
  onSendMessage: (message: string) => void;
  onDeclareBlueTruth: (hypothesis: string) => void;
  onForfeit: () => void;
  onNewGame: (theme: string) => void;
  witchThought: string | null;
}

export const GameScreen: React.FC<GameScreenProps> = ({ gameState, isFinished, onSendMessage, onDeclareBlueTruth, onForfeit, onNewGame, witchThought }) => {
  const [userInput, setUserInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedTruthsVisible, setIsRedTruthsVisible] = useState(false);
  const [isMagicListVisible, setIsMagicListVisible] = useState(false);
  const [isTruthVisible, setIsTruthVisible] = useState(false);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.chatHistory, witchThought]);

  const handleQuestion = async () => {
    if (userInput.trim() && !isSubmitting && !isFinished) {
      setIsSubmitting(true);
      await onSendMessage(userInput);
      setUserInput('');
      setIsSubmitting(false);
    }
  };
  
  const handleDeclaration = async () => {
    if (userInput.trim() && !isSubmitting && !isFinished) {
      setIsSubmitting(true);
      await onDeclareBlueTruth(userInput);
      setUserInput('');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full sm:max-w-7xl h-screen sm:h-[90vh] relative bg-black sm:bg-opacity-60 rounded-none sm:rounded-xl shadow-none sm:shadow-2xl border-none sm:border sm:border-gray-700 overflow-hidden">
      {/* Main Game Panel */}
      <main className="w-full h-full flex flex-col">
        <header className="relative p-4 bg-gray-900/50 border-b border-gray-700 text-center">
          <h1 className="text-xl font-cinzel text-yellow-400">{gameState.mystery.title}</h1>
          <button
            onClick={() => setIsTruthVisible(true)}
            className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-500 hover:text-yellow-400 transition-colors p-1"
            title="사건의 진실 보기 (스포일러)"
            aria-label="사건의 진실 보기 (스포일러)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </button>
        </header>
        
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <ChatLog chatHistory={gameState.chatHistory} witchThought={witchThought} />
          <div ref={endOfMessagesRef} />
        </div>
        
        <footer className="p-2 sm:p-4 bg-gray-900/50 border-t border-gray-700">
          {isFinished ? (
              <div className="flex justify-center items-center gap-4">
                  <p className="font-cinzel text-yellow-400">게임 종료</p>
                  <button onClick={() => onNewGame('')} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors">새 게임 시작</button>
              </div>
          ) : (
            <div className="space-y-2">
               <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleQuestion()}
                  placeholder="마녀에게 말을 걸거나, 진실을 선언하십시오..."
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <div className="flex gap-2">
                    <button onClick={handleQuestion} disabled={isSubmitting || !userInput.trim()} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">질문</button>
                    <button onClick={handleDeclaration} disabled={isSubmitting || !userInput.trim()} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-bold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">&lt;푸른 진실&gt; 선언</button>
                </div>
              </div>
               <div className="text-center">
                   <button onClick={onForfeit} disabled={isSubmitting} className="text-sm text-gray-500 hover:text-red-500 transition-colors">게임 포기</button>
               </div>
            </div>
          )}
        </footer>
      </main>

      {/* Widget Toggles Container */}
      <div className="absolute top-1/2 right-0 flex flex-col gap-2 transform -translate-y-1/2 z-20">
        {!isRedTruthsVisible && (
            <button
              onClick={() => setIsRedTruthsVisible(true)}
              className="w-8 h-28 bg-red-900/80 hover:bg-red-800/90 rounded-l-lg flex items-center justify-center transition-all duration-300 shadow-lg"
              aria-label="붉은 진실 목록 열기"
            >
              <span className="text-white font-cinzel text-sm" style={{ writingMode: 'vertical-rl' }}>
                &lt;붉은 진실&gt;
              </span>
            </button>
        )}
        {!isMagicListVisible && (
             <button
              onClick={() => setIsMagicListVisible(true)}
              className="w-8 h-28 bg-purple-900/80 hover:bg-purple-800/90 rounded-l-lg flex items-center justify-center transition-all duration-300 shadow-lg"
              aria-label="마법 목록 열기"
            >
              <span className="text-white font-cinzel text-sm" style={{ writingMode: 'vertical-rl' }}>
                &lt;마법 목록&gt;
              </span>
            </button>
        )}
      </div>

      {/* Red Truths Widget */}
      <div className={`absolute top-0 right-0 h-full w-full sm:w-1/3 transform transition-transform duration-500 ease-in-out z-30 ${isRedTruthsVisible ? 'translate-x-0' : 'translate-x-full'}`}>
        <RedTruthsWidget
          usedRedTruths={gameState.usedRedTruths}
          onClose={() => setIsRedTruthsVisible(false)}
        />
      </div>

      {/* Magic List Widget */}
      <div className={`absolute top-0 right-0 h-full w-full sm:w-1/3 transform transition-transform duration-500 ease-in-out z-30 ${isMagicListVisible ? 'translate-x-0' : 'translate-x-full'}`}>
        <MagicListWidget
          magicList={gameState.mystery.magicList}
          onClose={() => setIsMagicListVisible(false)}
        />
      </div>

      {/* Hidden Truth Panel */}
      {isTruthVisible && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in-up"
          style={{ animationDuration: '0.3s' }}
          onClick={() => setIsTruthVisible(false)}
        >
          <div 
            className="w-full max-w-2xl bg-gray-900 border-2 border-purple-500 rounded-lg p-6 shadow-2xl animate-purple-glow flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h2 className="text-xl font-cinzel text-purple-300">&lt;마녀가 감춘 진실&gt;</h2>
              <button onClick={() => setIsTruthVisible(false)} className="text-gray-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{gameState.mystery.hiddenTruth}</p>
            </div>
            <p className="text-xs text-center text-gray-500 mt-4 flex-shrink-0">이것은 게임의 정답입니다. 이 창을 닫고 게임을 계속할 수 있습니다.</p>
          </div>
        </div>
      )}
    </div>
  );
};
