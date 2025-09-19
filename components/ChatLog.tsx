import React from 'react';
import type { ChatMessage, MessageType } from '../types';
import { WitchIcon, HumanIcon } from './IconComponents';

interface ChatLogProps {
  chatHistory: ChatMessage[];
  witchThought?: string | null;
}

const getBubbleStyle = (type: MessageType): string => {
    switch (type) {
      case 'human':
        return 'bg-blue-900/70 border-blue-600 text-left';
      case 'witch':
        return 'bg-red-900/70 border-red-700 text-left';
      default:
        return 'bg-gray-700 border-gray-500';
    }
};

const TruthMessage: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
    let style = '';
    let title = '';
    let animationClass = '';

    switch (msg.type) {
        case 'red-truth':
            style = 'font-bold text-red-400 font-cinzel text-lg p-4 border-2 border-red-500 bg-black bg-opacity-50 shadow-lg';
            title = '<붉은 진실>';
            animationClass = 'animate-red-glow';
            break;
        case 'blue-truth':
            style = 'font-bold text-blue-300 font-cinzel text-lg p-4 border-2 border-blue-400 bg-black bg-opacity-50 shadow-lg';
            title = '<푸른 진실> 선언';
            break;
        case 'witch-truth':
            style = 'font-bold text-purple-300 font-cinzel text-xl p-5 border-2 border-purple-500 bg-purple-900/40 shadow-2xl';
            title = '<마녀의 진실>';
            animationClass = 'animate-purple-glow';
            break;
        default:
            return null;
    }

    return (
        <div className={`self-center text-center my-4 w-full rounded-lg ${style} ${animationClass}`}>
            <p className="text-sm font-normal opacity-80 mb-2 font-sans">{title}</p>
            <p className="whitespace-pre-wrap font-sans">{msg.text}</p>
        </div>
    );
}

export const ChatLog: React.FC<ChatLogProps> = ({ chatHistory, witchThought }) => {
  return (
    <div className="flex flex-col space-y-4 p-2">
      {chatHistory.map((msg, index) => {
        const isTruth = msg.type === 'red-truth' || msg.type === 'blue-truth' || msg.type === 'witch-truth';
        const isSystem = msg.type === 'system' || msg.type === 'error' || msg.type === 'tutorial';

        if (isTruth) {
          return <div key={index} className="animate-fade-in-up"><TruthMessage msg={msg} /></div>;
        }

        if (isSystem) {
          let style = '';
          switch(msg.type) {
            case 'error':
              style = 'self-center text-center bg-red-600/80 border-red-500 text-white rounded-md px-4 py-2';
              break;
            case 'tutorial':
              style = 'self-center text-center bg-purple-900/80 border-purple-500 text-white rounded-md px-4 py-2';
              break;
            default:
              style = 'self-center text-center text-gray-400 italic text-sm';
              break;
          }
          return <div key={index} className={`my-2 w-full animate-fade-in-up ${style}`}>{msg.text}</div>;
        }

        const isHuman = msg.type === 'human';
        const bubbleStyle = getBubbleStyle(msg.type);

        const MessageBubble = () => (
            <div className={`rounded-lg px-4 py-2 border max-w-xl ${bubbleStyle}`}>
                <p className="whitespace-pre-wrap font-sans">{msg.text}</p>
            </div>
        );

        const Avatar = () => (
            isHuman ? <div className="w-10 h-10 shrink-0"><HumanIcon /></div> : <div className="w-10 h-10 shrink-0"><WitchIcon /></div>
        );

        return (
            <div
              key={index}
              className={`flex items-end gap-3 animate-fade-in-up ${isHuman ? 'justify-end' : 'justify-start'}`}
            >
                {!isHuman && <Avatar />}
                <MessageBubble />
                {isHuman && <Avatar />}
            </div>
        );
      })}

      {witchThought && (
        <div className="flex items-end gap-3 animate-fade-in-up justify-start">
            <div className="w-10 h-10 shrink-0"><WitchIcon /></div>
            <div className="rounded-lg px-4 py-2 border max-w-xl bg-red-900/70 border-red-700 text-left italic opacity-80">
                <p className="whitespace-pre-wrap font-sans animate-pulse">{witchThought}</p>
            </div>
        </div>
      )}
    </div>
  );
};