
export interface Mystery {
  title: string;
  surfaceSituation: string;
  hiddenTruth: string;
  redTruths: string[];
  magicList: string[];
}

export type MessageType = 'human' | 'witch' | 'system' | 'error' | 'red-truth' | 'blue-truth' | 'tutorial' | 'witch-truth';

export interface ChatMessage {
  type: MessageType;
  text: string;
}

export interface GameState {
  mystery: Mystery;
  chatHistory: ChatMessage[];
  usedRedTruths: string[];
}

export type GameStage = 'start' | 'loading' | 'playing' | 'finished' | 'tutorial';

export interface MysteryStreamChunk {
    thought?: string;
    mystery?: Mystery;
}

export interface WitchResponse {
  reply: string;
  redTruth?: string;
}

export interface WitchStreamChunk {
    thought?: string;
    response?: WitchResponse;
}

export interface BlueTruthResult {
    status: 'refuted' | 'accepted' | 'mocked' | 'incomplete';
    redTruth?: string; // Optional: for 'refuted' status
    message?: string; // Optional: A message from the witch corresponding to the status.
}


export interface BlueTruthStreamChunk {
    thought?: string;
    result?: BlueTruthResult;
}

export interface ForfeitStreamChunk {
    thought?: string;
    response?: {
        taunt: string;
        magicalTruth: string;
    };
}

export interface TutorialStreamChunk {
    thought?: string;
    response?: {
        message: string;
        redTruth?: string;
    };
}