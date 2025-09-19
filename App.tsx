
import React, { useState, useCallback, useEffect } from 'react';
import { StartScreen } from './components/StartScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { GameScreen } from './components/GameScreen';
import { TutorialScreen } from './components/TutorialScreen';
import { generateMysteryStream, sendMessageToWitch, judgeBlueTruthStream, generateForfeitScenarioStream } from './services/geminiService';
import type { GameState, Mystery, ChatMessage, GameStage, BlueTruthResult } from './types';
import { useGameSounds } from './hooks/useGameSounds';

const App: React.FC = () => {
  const [gameStage, setGameStage] = useState<GameStage>('start');
  const [loadingThoughts, setLoadingThoughts] = useState<string[]>([]);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [witchThought, setWitchThought] = useState<string | null>(null);

  const { playRedTruthSound, playBlueTruthSound } = useGameSounds();

  const handleNewGame = useCallback(async (theme: string) => {
    setGameStage('loading');
    setLoadingThoughts([]);
    setIsLoadingComplete(false);
    setGameState(null);

    try {
      const stream = generateMysteryStream(theme);
      let mysteryData: Mystery | null = null;
      for await (const chunk of stream) {
        if (chunk.thought) {
          setLoadingThoughts(prev => [...prev, chunk.thought]);
        }
        if (chunk.mystery) {
          mysteryData = chunk.mystery;
        }
      }

      if (mysteryData) {
        setIsLoadingComplete(true);
        setLoadingThoughts(prev => [...prev, '게임판 구성 완료. 진실의 문이 열립니다...']);
        
        const newGameState: GameState = {
          mystery: mysteryData,
          chatHistory: [
            { type: 'system', text: `게임 시작: ${mysteryData.title}` },
            { type: 'witch', text: mysteryData.surfaceSituation }
          ],
          usedRedTruths: [],
        };
        setGameState(newGameState);

        setTimeout(() => {
          setGameStage('playing');
        }, 1500);
      } else {
          throw new Error("Mystery data was not received from the stream.");
      }
    } catch (error) {
      console.error("Error generating mystery:", error);
      const errorGameState: GameState = {
        mystery: {
            title: "오류 발생",
            surfaceSituation: "마녀와의 연결이 끊겼습니다. 게임판을 생성할 수 없습니다.",
            hiddenTruth: "",
            redTruths: [],
            magicList: [],
        },
        chatHistory: [
            { type: 'error', text: '미스터리를 생성하는 데 실패했습니다. 페이지를 새로고침하고 다시 시도해주세요.' }
        ],
        usedRedTruths: [],
      };
      setGameState(errorGameState);
      setGameStage('finished');
    }
  }, []);

  const handleStartTutorial = useCallback(() => {
    setGameStage('tutorial');
  }, []);

  const handleEndTutorial = useCallback(() => {
    setGameStage('start');
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!gameState) return;

    const newHistory: ChatMessage[] = [...gameState.chatHistory, { type: 'human', text: message }];
    setGameState({ ...gameState, chatHistory: newHistory });
    setWitchThought("마녀가 당신의 말을 듣고 있습니다...");

    try {
      const stream = sendMessageToWitch(
        gameState.mystery.hiddenTruth,
        newHistory,
        message,
        gameState.mystery.redTruths,
        gameState.usedRedTruths,
        gameState.mystery.magicList
      );
      
      let finalResponse: { reply: string, redTruth?: string } | null = null;
      for await (const chunk of stream) {
        if (chunk.thought) {
            const maxLength = 80;
            const truncatedThought = chunk.thought.length > maxLength
                ? chunk.thought.substring(0, maxLength) + '...'
                : chunk.thought;
            setWitchThought(`베아트리체가 생각중... ${truncatedThought}`);
        }
        if (chunk.response) {
            finalResponse = chunk.response;
        }
      }

      setWitchThought(null);
      if (finalResponse) {
        const responseMessages: ChatMessage[] = [];
        if (finalResponse.redTruth) {
            responseMessages.push({ type: 'red-truth', text: finalResponse.redTruth });
            setGameState(prev => ({ ...prev!, usedRedTruths: [...prev!.usedRedTruths, finalResponse!.redTruth!] }));
            playRedTruthSound();
        }
        responseMessages.push({ type: 'witch', text: finalResponse.reply });
        
        setGameState(prev => ({ ...prev!, chatHistory: [...newHistory, ...responseMessages] }));
      }

    } catch (error) {
      console.error("Error sending message:", error);
      setWitchThought(null);
      setGameState(prev => ({ ...prev!, chatHistory: [...prev!.chatHistory, { type: 'error', text: '마녀와 통신 중 오류가 발생했습니다.' }] }));
    }
  }, [gameState, playRedTruthSound]);

  const handleDeclareBlueTruth = useCallback(async (hypothesis: string) => {
    if (!gameState) return;

    const newHistory: ChatMessage[] = [...gameState.chatHistory, { type: 'blue-truth', text: hypothesis }];
    setGameState({ ...gameState, chatHistory: newHistory });
    playBlueTruthSound();
    setWitchThought("마녀가 당신의 <푸른 진실>을 음미하고 있습니다...");

    try {
        const stream = judgeBlueTruthStream(
            gameState.mystery.hiddenTruth, 
            gameState.usedRedTruths, 
            hypothesis, 
            gameState.mystery.magicList, 
            gameState.chatHistory
        );
        
        let finalResult: BlueTruthResult | null = null;

        for await (const chunk of stream) {
            if (chunk.thought) {
                const maxLength = 80;
                const truncatedThought = chunk.thought.length > maxLength
                    ? chunk.thought.substring(0, maxLength) + '...'
                    : chunk.thought;
                setWitchThought(`베아트리체가 생각중... ${truncatedThought}`);
            }
            if (chunk.result) {
                finalResult = chunk.result;
            }
        }
        
        setWitchThought(null);

        if (finalResult) {
            let resultMessages: ChatMessage[] = [];
            switch (finalResult.status) {
                case 'refuted':
                    if (finalResult.redTruth) {
                        resultMessages = [
                            { type: 'red-truth', text: finalResult.redTruth },
                            { type: 'witch', text: finalResult.message || '훗, 네놈의 얄팍한 진실은 이 붉은 진실 앞에 산산조각날 뿐이다!' }
                        ];
                        setGameState(prev => ({ ...prev!, usedRedTruths: [...prev!.usedRedTruths, finalResult.redTruth!] }));
                        playRedTruthSound();
                    }
                    break;
                case 'accepted': // Win
                    if (finalResult.message) {
                        resultMessages = [
                            { type: 'witch', text: finalResult.message },
                            { type: 'system', text: '마녀는 자신의 존재를 부정당한 채 소멸했습니다. 당신의 승리입니다.' }
                        ];
                        setGameStage('finished');
                        playBlueTruthSound();
                    }
                    break;
                case 'mocked':
                case 'incomplete':
                    if (finalResult.message) {
                        resultMessages = [{ type: 'witch', text: finalResult.message }];
                    }
                    // The game continues, just show the witch's response.
                    break;
                default:
                    resultMessages = [{ type: 'error', text: '알 수 없는 진실 판정 결과입니다.' }];
            }

            if (resultMessages.length > 0) {
                 setGameState(prev => ({ ...prev!, chatHistory: [...newHistory, ...resultMessages] }));
            }
        }
    } catch (error) {
        console.error("Error judging blue truth:", error);
        setWitchThought(null);
        setGameState(prev => ({ ...prev!, chatHistory: [...prev!.chatHistory, { type: 'error', text: '진실 공방 중 오류가 발생했습니다.' }] }));
    }
  }, [gameState, playBlueTruthSound, playRedTruthSound]);

  const handleForfeit = useCallback(async () => {
    if (!gameState) return;

    setWitchThought("마녀가 당신의 포기를 비웃으며 진실을 재구축합니다...");

    let forfeitTaunt = '크크큭... 결국 네놈의 두뇌로는 내 게임판을 깨는 것은 불가능했나. 좋다, 자비로운 내가 마녀의 진실을 보여주지.';
    let magicalTruth = gameState.mystery.hiddenTruth;

    try {
        const stream = generateForfeitScenarioStream(
            gameState.mystery.surfaceSituation,
            gameState.mystery.hiddenTruth,
            gameState.usedRedTruths,
            gameState.mystery.magicList
        );

        let finalResponse: { taunt: string, magicalTruth: string } | null = null;
        for await (const chunk of stream) {
            if (chunk.thought) {
                const maxLength = 80;
                const truncatedThought = chunk.thought.length > maxLength
                    ? chunk.thought.substring(0, maxLength) + '...'
                    : chunk.thought;
                setWitchThought(`베아트리체가 생각중... ${truncatedThought}`);
            }
            if (chunk.response) {
                finalResponse = chunk.response;
            }
        }
        if (finalResponse) {
            forfeitTaunt = finalResponse.taunt;
            magicalTruth = finalResponse.magicalTruth;
        }
    } catch (error) {
        console.error("Error generating forfeit scenario:", error);
        // Fallback to the default messages and the original hidden truth
    }
    
    setWitchThought(null);

    const newHistory: ChatMessage[] = [
        ...gameState.chatHistory,
        { type: 'system', text: '플레이어가 게임을 포기했습니다.' },
        { type: 'witch', text: forfeitTaunt },
        { type: 'witch-truth', text: magicalTruth }
    ];
    setGameState({ ...gameState, chatHistory: newHistory });
    setGameStage('finished');
    playRedTruthSound(); // 마녀의 선언이므로 붉은 진실 사운드를 사용합니다.
  }, [gameState, playRedTruthSound]);

  const renderContent = () => {
    switch (gameStage) {
      case 'start':
        return <StartScreen onStart={handleNewGame} onStartTutorial={handleStartTutorial} />;
      case 'loading':
        return <LoadingScreen thoughts={loadingThoughts} isComplete={isLoadingComplete} />;
      case 'tutorial':
        return <TutorialScreen onEndTutorial={handleEndTutorial} />;
      case 'playing':
      case 'finished':
        if (gameState) {
          return (
            <GameScreen 
              gameState={gameState} 
              isFinished={gameStage === 'finished'}
              onSendMessage={handleSendMessage}
              onDeclareBlueTruth={handleDeclareBlueTruth}
              onForfeit={handleForfeit}
              onNewGame={() => handleNewGame('')}
              witchThought={witchThought}
            />
          );
        }
        return <StartScreen onStart={handleNewGame} onStartTutorial={handleStartTutorial} />; // Fallback
      default:
        return <StartScreen onStart={handleNewGame} onStartTutorial={handleStartTutorial} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 sm:bg-[url('https://www.transparenttextures.com/patterns/dark-denim-3.png')] sm:p-4 sm:flex sm:flex-col sm:items-center sm:justify-center">
      {renderContent()}
    </div>
  );
};

export default App;
