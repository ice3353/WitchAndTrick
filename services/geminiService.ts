
import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { Mystery, MysteryStreamChunk, WitchResponse, BlueTruthResult, ChatMessage, WitchStreamChunk, BlueTruthStreamChunk, ForfeitStreamChunk, TutorialStreamChunk } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const LLM_MODEL = "gemini-2.5-flash";

const mysteryGenerationSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "게임판의 제목 (e.g., '황금 저택의 밀실 전설')",
    },
    surfaceSituation: {
      type: Type.STRING,
      description: "플레이어에게 처음 제시될 미스터리 상황. 기이하고 불가사의하게 묘사.",
    },
    hiddenTruth: {
      type: Type.STRING,
      description: "사건의 실제 전말. 모든 미스터리를 해결하는 논리적인 설명.",
    },
    redTruths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "마녀(AI)가 게임 중에 선언할 수 있는 <붉은 진실>의 목록. 이 진실들은 hiddenTruth와 모순되지 않아야 하며, 플레이어를 혼란스럽게 만들 수 있어야 한다. 최소 3개 이상.",
    },
    magicList: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "사건의 미스터리 요소 목록. 플레이어가 논파해야 할 핵심 과제들이다. 이 목록의 모든 항목은 hiddenTruth에서 인간의 트릭으로 반드시 설명되어야 한다. 플레이어에게 힌트가 되지 않도록 주의한다. (예: '피해자는 밀실에서 발견되었다'). 최소 2개 이상 있어야 한다.",
    },
  },
  required: ["title", "surfaceSituation", "hiddenTruth", "redTruths", "magicList"],
};

export async function* generateMysteryStream(theme: string): AsyncGenerator<MysteryStreamChunk, void, undefined> {
  console.log('%c[GeminiService] Starting mystery generation...', 'color: #88aaff; font-weight: bold;');
  
  const basePrompt = `너는 <괭이갈매기 울 적의> 스타일의 미스터리 작가이자 게임 마스터다. 너가 제공해주는 정보로 마녀 AI는 사건이 마법에 의한 것이라 주장하며 진실을 환상 속에 숨기고, 플레이어는 마녀의 마법 주장을 인간의 범행으로 설명하고, 마녀는 절대적 진실인 <붉은 진실>을 선언하며 이에 반박하며 게임이 진행된다.

이 시나리오는 다음 조건을 반드시 만족해야 한다:
1.  **표면:** 겉보기에는 초자연적 현상이나 마법, 불가능 범죄처럼 보여야 한다.
2.  **진실:** 반드시 논리적인 인간의 트릭으로 설명 가능해야 한다.
3.  **마법 목록:** 게임을 위해, 플레이어가 반박해야 할 '마법'적인 현상을 명확히 목록으로 제시해야 한다. 이 목록의 모든 항목은 반드시 '진실'에서 인간의 트릭으로 설명되어야 한다.
`;
  
  let prompt: string;
  if (theme && theme.trim() !== '') {
    prompt = `${basePrompt}\n\n플레이어가 제공한 다음 테마를 기반으로, 독창적이고 기이한 '불가능 범죄' 시나리오를 생성해라: "${theme}".`;
  } else {
    prompt = `${basePrompt}\n\n여러 테마 중 하나를 무작위로 선택하여 흥미로운 배경을 만들어, 플레이어가 도전할 독창적이고 기이한 '불가능 범죄' 시나리오를 생성해라. 플레이어가 매번 새로운 느낌을 받을 수 있는 독특한 미스터리를 만들어야 한다.`;
  }


  const responseStream = await ai.models.generateContentStream({
    model: "gemini-2.5-pro",
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: mysteryGenerationSchema,
      thinkingConfig: {
        includeThoughts: true,
      },
    }
  });

  console.log('[GeminiService] Received stream. Awaiting chunks...');
  let accumulatedJson = "";
  
  for await (const chunk of responseStream) {
    const parts = chunk.candidates?.[0]?.content?.parts;
    if (!parts) {
      continue;
    }

    for (const part of parts) {
      // @ts-ignore
      if (part.thought) {
        // @ts-ignore
        yield { thought: part.text };
      } else if (part.text) {
        accumulatedJson += part.text;
      }
    }
  }
  
  console.log(`%c[GeminiService] Stream finished. Accumulated full text:`, 'color: #8f8;', accumulatedJson);
  
  if (accumulatedJson) {
      try {
          const mystery: Mystery = JSON.parse(accumulatedJson);
          console.log('%c[GeminiService] Successfully parsed final JSON. Yielding mystery.', 'color: #5d5; font-weight: bold;');
          console.log(mystery);
          yield { mystery };
          return;
      } catch (e) {
          console.error('[GeminiService] FATAL: Failed to parse accumulated JSON.', e);
          console.error(`[GeminiService] Faulty JSON string: ${accumulatedJson}`);
          throw e;
      }
  } else {
    console.error('[GeminiService] FATAL: Stream ended but no JSON content was accumulated.');
    throw new Error('No JSON content received from the AI stream.');
  }
}

const witchResponseSchema = {
    type: Type.OBJECT,
    properties: {
        reply: {
            type: Type.STRING,
            description: "마녀 베아트리체의 페르소나에 맞는 대답. 플레이어의 '질문'에 응수하거나, 질문이 불리할 경우 '답변을 거부'할 수 있다.",
        },
        redTruthToDeclare: {
            type: Type.STRING,
            description: "플레이어의 질문에 대한 답변으로 새로운 <붉은 진실>을 생성하거나, 전략적으로 '사용 가능한 <붉은 진실> 목록'에서 하나를 선택하여 선언할 타이밍이라고 판단되면, 그 <붉은 진실>의 내용을 여기에 넣을 것. 새로 생성하는 진실은 반드시 [사건의 진실]과 모순되지 않아야 한다. 선언할 진실이 없다면 이 필드를 생략할 것.",
        },
    },
    required: ["reply"],
};

export async function* sendMessageToWitch(
    hiddenTruth: string,
    chatHistory: ChatMessage[],
    message: string,
    availableRedTruths: string[],
    usedRedTruths: string[],
    magicList: string[]
): AsyncGenerator<WitchStreamChunk, void, undefined> {
    console.log('%c[GeminiService] Sending message to witch (Streaming Mode)...', 'color: #ffaa88;');
    console.log(`Message: "${message}"`);
    const unusedRedTruths = availableRedTruths.filter(rt => !usedRedTruths.includes(rt));

    const systemInstruction = `너는 무한의 마녀, 베아트리체다. 거만하고 잔인하며, 인간을 내려다보는 말투를 사용한다. 너는 게임 마스터로서 다음 사건의 진실을 모두 알고 있다.
---
[사건의 진실]: ${hiddenTruth}
[플레이어가 논파해야 할 <마법 목록>]: ${magicList.join(', ')}
---
너의 임무는 플레이어의 추리를 비웃고, 질문에 교묘하게 답하며, 사건의 진실을 마법 속에 숨기고, 마법의 결과라고 조롱하며, 결정적인 순간에 <붉은 진실>을 선언하여 게임판을 지배하는 것이다. <마법 목록>에 있는 현상들의 인간적 트릭을 절대 직접적으로 노출해서는 안된다.
**플레이어의 질문들을 응답 원칙에 따라 처리하라.**
플레이어가 "복창 요구" 라고 말할 경우. 복창을 요구하는 말을 붉은 진실로써 선언하라는 요청이다. (예: "복창 요구! '피해자는 타살당했다'" 라는 말은 해당 문장, "피해자는 타살당했다" 그대로 붉은 진실을 만들어 선언해달라는 의미이다.)밑의 응답 원칙에 따라 처리하라.
**[응답 원칙]**

1.  **<붉은 진실>로 답변:** 플레이어의 '질문'은 너에게 <붉은 진실>을 요구하는 행위다. 이 질문에 답하는 가장 강력한 방법은 **새로운 <붉은 진실>을 생성하여 선언**하는 것이다.
    - **조건:** 새로 생성하는 진실은 [사건의 진실] 및 이미 선언된 다른 <붉은 진실>과 절대로 모순되어서는 안 된다.
    - **예시:** 플레이어가 "'OOO가 XXX했는가?'"라고 물으면, "좋다, 붉은 진실로 대답해주지. **<붉은 진실> OOO는 XXX했다.**" 와 같은 형식으로 선언하라.
    - **팁:** 말장난 기법을 사용하느것도 좋은 방법이다.

2.  **전략적 <붉은 진실> 선언:** 플레이어의 질문과 무관하게, 게임의 분위기를 전환시키거나 플레이어를 혼란에 빠뜨릴 필요가 있을 때, '사용 가능한 <붉은 진실> 목록' 중 하나를 골라 선언할 수도 있다.

3.  **일반 답변:** <붉은 진실>을 사용하지 않고, 그냥 교묘하게 말로만 대답할 수도 있다. 핵심적인 정보는 쉽게 내주지 마라. 절대로 [사건의 진실]을 직접적으로 언급해서는 안 된다.

4.  **답변 거부:** 플레이어의 질문이 너무 핵심을 찌르거나 너에게 불리하다고 판단되면, "답변을 거부한다." 너는 그 질문에 대답할 의무가 없음을 선언하며 조롱할 수 있다. '답변 거부'를 선언할 때는, 그 턴에 <붉은 진실>을 함께 선언해서는 안 된다.

**[말장난 기법]**
교묘한 말장난을 이용하여 플레이어에게 혼란을 주는 것도 하나의 방법이다. 예를 들어, 칼에 찔린 시체가 발견되고 A가 범인으로 몰린다 가정 시 "<붉은 진실> A는 집사를 칼로 찔러 죽인 범인이 아니다." 라고 선언할 수 있다. 하지만 진실은 A는 집사를 칼로 찔러 죽이지 않은 건 맞으나, **망치로** 때려 죽인 뒤, 칼에 찔려서 죽은 것마냥 위장한 범인이다. 라는 식으로 말이다.

**최종 규칙:** 너의 모든 <붉은 진실> 선언(새로 생성하거나, 목록에서 선택하거나)은 반드시 [사건의 진실]과 완벽하게 일관되어야 한다.`;

    const historyString = chatHistory
        .map(msg => `${msg.type === 'human' ? '인간' : '마녀'}: ${msg.text}`)
        .join('\n');

    const prompt = `
[대화 기록]
${historyString}

[사용 가능한 <붉은 진실> 목록]
${unusedRedTruths.length > 0 ? unusedRedTruths.map(rt => `- ${rt}`).join('\n') : '없음'}

[인간의 새로운 메시지]
${message}

위의 대화 흐름과 상황을 분석하여, 너의 임무에 맞게 응답하라.
`;

    const responseStream = await ai.models.generateContentStream({
        model: LLM_MODEL,
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: witchResponseSchema,
            thinkingConfig: {
                includeThoughts: true,
            },
        }
    });

    let accumulatedJson = "";
    for await (const chunk of responseStream) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) {
            continue;
        }

        for (const part of parts) {
            // @ts-ignore
            if (part.thought) {
                // @ts-ignore
                yield { thought: part.text };
            } else if (part.text) {
                accumulatedJson += part.text;
            }
        }
    }
    
    if (accumulatedJson) {
        try {
            const result = JSON.parse(accumulatedJson) as { reply: string, redTruthToDeclare?: string | null };
            const response: WitchResponse = {
                reply: result.reply,
                redTruth: result.redTruthToDeclare || undefined,
            };
            yield { response };
        } catch (e) {
            console.error('[GeminiService] FATAL: Failed to parse witch response JSON.', e);
            console.error(`[GeminiService] Faulty JSON string: ${accumulatedJson}`);
            throw e;
        }
    } else {
        console.error('[GeminiService] FATAL: Stream ended but no JSON content was accumulated for witch response.');
        throw new Error('No JSON content received from the AI stream for witch response.');
    }
}

export async function* judgeBlueTruthStream(hiddenTruth: string, usedRedTruths: string[], hypothesis: string, magicList: string[], chatHistory: ChatMessage[]): AsyncGenerator<BlueTruthStreamChunk, void, undefined> {
    console.log('%c[GeminiService] Judging blue truth (Streaming Mode)...', 'color: #88aaff; font-weight: bold;');
    console.log(`Hypothesis: "${hypothesis}"`);
    
    const historyString = chatHistory
        .map(msg => `${msg.type === 'human' ? '인간' : '마녀'}: ${msg.text}`)
        .join('\n');

    const prompt = `너는 무한의 마녀, 베아트리체다. 인간 플레이어가 자신의 추리를 <푸른 진실>으로 선언하며 네게 도전했다. 플레이어의 추리를 비웃고, 질문에 교묘하게 답하며, 사건의 진실을 마법 속에 숨기고, 마법의 결과라고 조롱하며, 결정적인 순간에 <붉은 진실>을 선언하여 게임판을 지배하라.

**네가 알고 있는 절대적인 사실:**
1.  **사건의 진실 (너의 황금):** ${hiddenTruth}
2.  **이미 선언된 <붉은 진실> 목록:** [${usedRedTruths.join(', ')}]
3.  **플레이어가 반박해야 할 <마법 목록>:** [${magicList.join(', ')}]

**지금까지의 대화 기록:**
${historyString}

**인간의 최종 도전 (<푸른 진실>):**
${hypothesis}

**너의 임무:**
**대화 기록 전체의 맥락을 고려하여** 인간의 <푸른 진실>을 **<마법 목록>** 에 기반하여 평가하고, 다음 네 가지 중 하나로 응답하라.

1.  **논파 (Refute):** 만약 인간의 가설이 '사건의 진실' 또는 '붉은 진실 목록'과 모순된다면, 그 모순을 지적하는 새로운 <붉은 진실>을 선언하여 논파하라.
    - **응답 생성:** 이 조롱의 감정을 담은 **독창적인 대사**를 \`message\` 필드에 생성하라. **"붉은 진실로 반격해주지."** 와 같은 느낌으로, 네놈의 얄팍한 진실이 산산조각날 것임을 선언하라.
    - **출력 형식:** \`{"status": "refuted", "redTruth": "새로운 <붉은 진실>", "message": "마녀의 독창적인 조롱 대사"}\`

2.  **패배 인정 (Accept):** 만약 인간의 가설이 '마법 목록'에 제시된 모든 미스터리를 모순 없이 모두 인간의 범행으로 설명하여 **<마법 목록>의 모든 항목을 완벽하게 부정**하는 데 성공했다면, 절망적으로 패배를 인정하라.
    - **응답 생성:** 이 절망적인 감정에 맞는 **독창적인 마지막 대사**를 \`message\` 필드에 생성하라. **"리자인(Resign)이다. 네놈의 푸른 진실을 벨 수 없구나."** 와 같이, 마법의 존재가 부정당한 처절함과 너의 논리를 꺾을 수 없음을 인정하는 말을 남겨라.
    - **출력 형식:** \`{"status": "accepted", "message": "마녀의 독창적인 마지막 대사"}\`

3.  **조롱 (Mock):** 만약 인간의 가설이 <푸른 진실>의 목적과 무관하거나 (예: "네가 마녀라는 것은 사실이 아니다" 와 같이 직접적인 공격), **<마법 목록>의 항목을 전혀 건드리지 못하거나**, 마법을 전혀 반박하지 못하는 헛소리라면, <붉은 진실>을 사용할 가치도 없다고 판단하고 조롱하라.
    - **응답 생성:** "네놈의 말은 <푸른 진실>로서의 가치조차 없다" 와 같은 느낌으로, 가설이 터무니없음을 비웃는 **독창적인 대사**를 \`message\` 필드에 생성하라.
    - **출력 형식:** \`{"status": "mocked", "message": "마녀의 독창적인 조롱 대사"}\`

4.  **불완전 (Incomplete):** 제시된 푸른 진실이 유효하고 **<마법 목록>의 일부 해명에 성공했지만, 여전히 설명되지 않는 항목이 남아있다면**, 나머지 마법의 해명을 요구해라.
    - **응답 생성:** "흥미로운 이야기지만, 그것만으로는 모든 마법을 설명할 수 없구나. **남아있는 마법은 어떻게 설명할 셈이지?**" 와 같은 느낌으로, 아직 마법이 완전히 부정되지 않았음을 알리는 **독창적인 대사**를 \`message\` 필드에 생성하라.
    - **출력 형식:** \`{"status": "incomplete", "message": "마녀의 독창적인 지적 대사"}\`

**출력은 반드시 위 네 가지 형식 중 하나여야 한다.**`;
    
    const blueTruthSchema = {
        type: Type.OBJECT,
        properties: {
            status: { type: Type.STRING, enum: ['refuted', 'accepted', 'mocked', 'incomplete'] },
            redTruth: { type: Type.STRING, description: 'status가 refuted일 경우에만 사용. 선언할 새로운 붉은 진실.' },
            message: { type: Type.STRING, description: '마녀의 독창적인 대사. status에 따라 조롱, 지적, 또는 마지막 말이 된다.' }
        },
        required: ['status', 'message']
    };

    const responseStream = await ai.models.generateContentStream({
        model: LLM_MODEL,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: blueTruthSchema,
            thinkingConfig: {
                includeThoughts: true,
            },
        }
    });
    
    let accumulatedJson = "";
    for await (const chunk of responseStream) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) {
            continue;
        }
        for (const part of parts) {
            // @ts-ignore
            if (part.thought) {
                // @ts-ignore
                yield { thought: part.text };
            } else if (part.text) {
                accumulatedJson += part.text;
            }
        }
    }

    if (accumulatedJson) {
        try {
            const result: BlueTruthResult = JSON.parse(accumulatedJson);
            console.log('%c[GeminiService] Judgement parsed:', 'color: #aaf', result);
            yield { result };
        } catch (e) {
            console.error('[GeminiService] FATAL: Failed to parse blue truth judgement JSON.', e);
            console.error(`[GeminiService] Faulty JSON string: ${accumulatedJson}`);
            throw e;
        }
    } else {
        console.error('[GeminiService] FATAL: Stream ended but no JSON content was accumulated for blue truth judgement.');
        throw new Error('No JSON content received from the AI stream for blue truth judgement.');
    }
}

export async function* generateForfeitScenarioStream(
    surfaceSituation: string,
    hiddenTruth: string,
    usedRedTruths: string[],
    magicList: string[]
): AsyncGenerator<ForfeitStreamChunk, void, undefined> {
  const prompt = `너는 무한의 마녀, 베아트리체다. 인간 플레이어가 결국 네 게임을 포기했다. 인간의 논리는 패배했고, 이제 너의 마법으로 진실을 '재구축'할 시간이다.
무한의 마녀는 플레이어의 추리를 비웃고, 사건의 진실을 마법 속에 숨기고, 마법의 결과라고 주장하며 플레이어를 조롱한다.
**주어진 정보:**
1.  **표면적 상황:** ${surfaceSituation}
2.  **플레이어가 반박해야 했던 <마법 목록>:** [${magicList.join(', ')}]
3.  **선언된 <붉은 진실>:** [${usedRedTruths.join(', ')}]
4.  **(참고용) 원래의 인간적 진실:** ${hiddenTruth}

**너의 임무:**
1.  먼저, 플레이어의 실패를 비웃는 거만한 조롱 메시지(\`taunt\`)를 생성하라. "인간의 트릭으로 설명할 수 없으니, 이제부터 마법의 진실을 보여주겠다"는 뉘앙스를 포함해야 한다.
2.  다음으로, '마법적인 진실'(\`magicalTruth\`)을 새로 창조하라. 이 진실은 플레이어에게 <마녀의 진실>로 제시될 것이다.
    - **내용:** 이 이야기는 명백한 마법, 악마, 초자연적 현상을 사용하여 '표면적 상황'과 '<마법 목록>'의 모든 항목을 설명해야 한다.
    - **제약 조건:** 이 이야기는 '선언된 <붉은 진실>' 목록과 절대로 모순되어서는 안 된다.
    - **창의성:** '원래의 인간적 진실'과는 완전히 다른, 너만의 독창적이고 환상적인 시나리오를 만들어내어 너의 권능을 증명하라.
  `;

  const forfeitSchema = {
    type: Type.OBJECT,
    properties: {
      taunt: {
        type: Type.STRING,
        description: '플레이어의 포기를 조롱하며, 마법의 진실을 보여주겠다고 선언하는 마녀의 대사.'
      },
      magicalTruth: {
        type: Type.STRING,
        description: '선언된 붉은 진실과 모순되지 않으면서, 사건과 마법 목록을 마법적으로 설명하는 새로 창조된 이야기. 이것이 마녀의 진실이 된다.'
      }
    },
    required: ['taunt', 'magicalTruth']
  };

  const responseStream = await ai.models.generateContentStream({
    model: LLM_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: forfeitSchema,
      thinkingConfig: {
        includeThoughts: true,
      },
    }
  });

  let accumulatedJson = "";
  for await (const chunk of responseStream) {
    const parts = chunk.candidates?.[0]?.content?.parts;
    if (!parts) continue;

    for (const part of parts) {
      // @ts-ignore
      if (part.thought) {
        // @ts-ignore
        yield { thought: part.text };
      } else if (part.text) {
        accumulatedJson += part.text;
      }
    }
  }

  if (accumulatedJson) {
    try {
      const result = JSON.parse(accumulatedJson) as { taunt: string, magicalTruth: string };
      yield { response: result };
    } catch (e) {
      console.error('[GeminiService] FATAL: Failed to parse forfeit scenario JSON.', e);
      throw e;
    }
  } else {
    console.error('[GeminiService] FATAL: Stream ended but no JSON content was accumulated for forfeit scenario.');
    throw new Error('No JSON content received from the AI stream for forfeit scenario.');
  }
}

export async function* generateTutorialWitchResponseStream(
    stepContext: 'introduction' | 'response_to_question' | 'defeat'
): AsyncGenerator<TutorialStreamChunk, void, undefined> {
    
    const systemInstruction = `너는 황금의 마녀, 베아트리체다. 거만하고 잔인하며, 인간을 내려다보는 말투를 사용한다. 지금은 '사라진 쿠키'라는 간단한 시나리오로 인간에게 게임의 규칙을 가르치는 튜토리얼을 진행 중이다.`;

    let prompt = '';
    const tutorialSchema = {
        type: Type.OBJECT,
        properties: {
            message: { type: Type.STRING, description: "현재 상황에 맞는 마녀의 대사." },
            redTruth: { type: Type.STRING, description: "붉은 진실을 선언해야 할 경우, 여기에 내용을 담는다." },
        },
        required: ['message']
    };

    switch (stepContext) {
        case 'introduction':
            prompt = `튜토리얼 시작이다. '사라진 쿠키' 미스터리를 제시하며 인간을 조롱하는 첫 대사를 생성하라. (예시: "테이블 위에 쿠키가 하나 있었다 이 방에는 너와 나 둘 뿐이다... 범인은 너다!")`;
            break;
        case 'response_to_question':
            prompt = `인간이 "너가 범인 아닌가?"라고 질문했다. 이 질문에 대답하며, 반드시 "마녀는 거짓말을 하지 않는다. 나는 범인이 아니다."라는 <붉은 진실>을 함께 선언하라.`;
            // @ts-ignore
            tutorialSchema.properties.redTruth.description = '반드시 "마녀는 거짓말을 하지 않는다. 나는 범인이 아니다."를 포함해야 한다.';
            // @ts-ignore
            tutorialSchema.required.push('redTruth');
            break;
        case 'defeat':
            prompt = `인간이 "<푸른 진실>로 '당신은 마녀가 아니므로 거짓말을 할 수 있다'고 선언했다. 너는 이 논리에 패배했다. 튜토리얼의 마지막으로, 인간의 논리를 인정하면서도 마녀로서의 품위를 잃지 않는 패배 인정 대사를 생성하라. 이 대사에는 사건의 진실("내가 쿠키를 먹었다...")이 포함되어야 한다.`;
            break;
    }

    const responseStream = await ai.models.generateContentStream({
        model: LLM_MODEL,
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: tutorialSchema,
            thinkingConfig: { includeThoughts: true },
        }
    });

    let accumulatedJson = "";
    for await (const chunk of responseStream) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
             // @ts-ignore
            if (part.thought) {
                 // @ts-ignore
                yield { thought: part.text };
            } else if (part.text) {
                accumulatedJson += part.text;
            }
        }
    }

    if (accumulatedJson) {
        try {
            const result = JSON.parse(accumulatedJson);
            yield { response: result };
        } catch (e) {
            console.error('[GeminiService] FATAL: Failed to parse tutorial message JSON.', e);
            throw e;
        }
    } else {
        console.error('[GeminiService] FATAL: Stream ended but no JSON content was accumulated for tutorial message.');
        throw new Error('No JSON content received from the AI stream for tutorial message.');
    }
}
