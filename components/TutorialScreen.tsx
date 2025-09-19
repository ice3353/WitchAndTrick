
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChatLog } from './ChatLog';
import { useGameSounds } from '../hooks/useGameSounds';
import type { ChatMessage } from '../types';
import { generateTutorialWitchResponseStream } from '../services/geminiService';

interface TutorialScreenProps {
    onEndTutorial: () => void;
}

type TutorialStep = 
    | { type: 'tutorial', text: string }
    | { type: 'witch_generative', context: 'introduction' | 'response_to_question' | 'defeat' }
    | { type: 'action', action: 'ask' | 'declare' | 'end', prefill?: string };

const tutorialSteps: TutorialStep[] = [
    { type: 'tutorial', text: '튜토리얼에 오신 것을 환영합니다. 이 게임의 목표는 마녀와의 논리 대결에서 승리하는 것입니다.' },
    { type: 'witch_generative', context: 'introduction' },
    { type: 'tutorial', text: '마녀가 미스터리를 제시했습니다. 먼저 "질문"을 사용해 정보를 수집해봅시다. 아래 입력창은 자동으로 채워집니다. [질문] 버튼을 누르세요.' },
    { type: 'action', action: 'ask', prefill: "너가 범인 아닌가?" },
    { type: 'witch_generative', context: 'response_to_question' },
    { type: 'tutorial', text: '마녀가 <붉은 진실>을 선언했습니다. <붉은 진실>은 게임 내에서 절대적인 사실이며, 당신의 모든 추리는 이 진실과 모순되어서는 안 됩니다.' },
    { type: 'tutorial', text: "마녀의 논리에 허점이 있는 것 같습니다. '마녀는 거짓말을 하지 않는다'는 말은... 그녀가 정말 '마녀'일 때만 유효합니다. 이제 당신의 추리를 '<푸른 진실>'로 선언하여 반격할 시간입니다." },
    { type: 'action', action: 'declare', prefill: "'마녀는 거짓말을 하지 않는다'는 것은 진실이다. 하지만 당신은 마녀가 아니므로, 이 문장은 당신에게 적용되지 않는다." },
    { type: 'witch_generative', context: 'defeat' },
    { type: 'tutorial', text: '축하합니다! 마녀를 굴복시키고 진실을 쟁취했습니다. 이제 당신은 실제 게임판에 도전할 준비가 되었습니다.' },
    { type: 'action', action: 'end' },
];

export const TutorialScreen: React.FC<TutorialScreenProps> = ({ onEndTutorial }) => {
    const [step, setStep] = useState(0);
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [currentAction, setCurrentAction] = useState<'ask' | 'declare' | 'end' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [witchThought, setWitchThought] = useState<string | null>(null);

    const { playRedTruthSound, playBlueTruthSound } = useGameSounds();
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, witchThought]);
    
    const nextStep = useCallback(async () => {
        if (step >= tutorialSteps.length || isSubmitting) return;

        const currentStepData = tutorialSteps[step];
        
        if (currentStepData.type === 'witch_generative') {
            setIsSubmitting(true);
            setWitchThought("마녀가 당신의 행동을 지켜보고 있습니다...");
            try {
                const stream = generateTutorialWitchResponseStream(currentStepData.context);
                let finalResponse: { message: string, redTruth?: string } | null = null;
                
                for await (const chunk of stream) {
                    if (chunk.thought) {
                         setWitchThought(`베아트리체가 생각중... ${chunk.thought.substring(0, 80)}`);
                    }
                    if (chunk.response) {
                        finalResponse = chunk.response;
                    }
                }
                
                if (finalResponse) {
                    const newMessages: ChatMessage[] = [];
                    newMessages.push({ type: 'witch', text: finalResponse.message });
                    if (finalResponse.redTruth) {
                        newMessages.push({ type: 'red-truth', text: finalResponse.redTruth });
                        playRedTruthSound();
                    }
                    setHistory(prev => [...prev, ...newMessages]);
                }
            } catch (error) {
                console.error("Tutorial AI error:", error);
                setHistory(prev => [...prev, { type: 'error', text: '튜토리얼 진행 중 오류가 발생했습니다.' }]);
            } finally {
                setWitchThought(null);
                setIsSubmitting(false);
                setStep(prev => prev + 1);
            }
        } else if (currentStepData.type === 'action') {
            setCurrentAction(currentStepData.action);
            if (currentStepData.prefill) {
                setUserInput(currentStepData.prefill);
            }
        } else { // tutorial text
             setHistory(prev => [...prev, {type: currentStepData.type, text: currentStepData.text}]);
             setTimeout(() => setStep(prev => prev + 1), 500);
        }

    }, [step, playRedTruthSound, playBlueTruthSound, isSubmitting]);

    useEffect(() => {
        const currentStepData = tutorialSteps[step];
        if (currentStepData && currentStepData.type !== 'action') {
            const timer = setTimeout(() => {
                nextStep();
            }, 1000);
            return () => clearTimeout(timer);
        } else if (currentStepData && currentStepData.type === 'action') {
            nextStep();
        }
    }, [step, nextStep]);

    const handleAction = (actionType: 'ask' | 'declare') => {
        if (isSubmitting || currentAction !== actionType) return;
        setIsSubmitting(true);
        
        if (actionType === 'ask') {
            setHistory(prev => [...prev, { type: 'human', text: userInput }]);
        } else if (actionType === 'declare') {
            playBlueTruthSound();
            setHistory(prev => [...prev, { type: 'blue-truth', text: userInput }]);
        }

        setUserInput('');
        setCurrentAction(null);
        
        setTimeout(() => {
            setStep(prev => prev + 1);
            setIsSubmitting(false);
        }, 500);
    };

    return (
        <div className="w-full sm:max-w-5xl h-screen sm:h-[90vh] flex flex-col bg-black sm:bg-opacity-60 rounded-none sm:rounded-xl shadow-none sm:shadow-2xl border-none sm:border sm:border-gray-700 overflow-hidden">
            <header className="p-4 bg-gray-900/50 border-b border-gray-700 text-center">
                <h1 className="text-xl font-cinzel text-yellow-400">튜토리얼: 사라진 쿠키의 진실</h1>
            </header>
            
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                <ChatLog chatHistory={history} witchThought={witchThought} />
                <div ref={endOfMessagesRef} />
            </div>
            
            <footer className="p-2 sm:p-4 bg-gray-900/50 border-t border-gray-700">
                {currentAction === 'end' ? (
                    <div className="text-center">
                        <button onClick={onEndTutorial} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors">
                            튜토리얼 종료
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            value={userInput}
                            readOnly
                            placeholder={isSubmitting ? "마녀가 반응하고 있습니다..." : "마녀의 지시를 기다리십시오..."}
                            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-not-allowed"
                        />
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleAction('ask')} 
                                disabled={currentAction !== 'ask' || isSubmitting} 
                                className={`flex-1 px-4 py-2 bg-blue-600 rounded-lg font-bold transition-colors ${currentAction === 'ask' && !isSubmitting ? 'hover:bg-blue-500 animate-pulse' : 'bg-gray-500 cursor-not-allowed'}`}
                            >
                                질문
                            </button>
                            <button 
                                onClick={() => handleAction('declare')} 
                                disabled={currentAction !== 'declare' || isSubmitting} 
                                className={`flex-1 px-4 py-2 bg-green-600 rounded-lg font-bold transition-colors ${currentAction === 'declare' && !isSubmitting ? 'hover:bg-green-500 animate-pulse' : 'bg-gray-500 cursor-not-allowed'}`}
                            >
                                &lt;푸른 진실&gt; 선언
                            </button>
                        </div>
                    </div>
                )}
            </footer>
        </div>
    );
};
