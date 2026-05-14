import axios from 'axios';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { AppError } from './auth.service';

type AiProvider = 'gemini' | 'bedrock';

interface GenerateTextOptions {
  temperature?: number;
  maxOutputTokens?: number;
}

const getProvider = (): AiProvider => {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  return provider === 'bedrock' ? 'bedrock' : 'gemini';
};

const getGeminiApiKey = () => process.env.GEMINI_API_KEY || '';
const getGeminiModel = () => process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const getBedrockRegion = () => process.env.BEDROCK_REGION || process.env.AWS_REGION || 'ap-northeast-2';
const getBedrockModelId = () => process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0';

async function callGemini(systemPrompt: string, userPrompt: string, options: GenerateTextOptions): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new AppError(500, 'AI_NOT_CONFIGURED', 'Gemini API 키가 설정되지 않았습니다');
  }

  const model = getGeminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await axios.post(url, {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 4096,
    },
  }, { timeout: 30000 });

  return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callBedrock(systemPrompt: string, userPrompt: string, options: GenerateTextOptions): Promise<string> {
  const client = new BedrockRuntimeClient({ region: getBedrockRegion() });
  const command = new ConverseCommand({
    modelId: getBedrockModelId(),
    system: [{ text: systemPrompt }],
    messages: [{
      role: 'user',
      content: [{ text: userPrompt }],
    }],
    inferenceConfig: {
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxOutputTokens ?? 4096,
    },
  });

  const response = await client.send(command);
  return response.output?.message?.content
    ?.map(part => part.text || '')
    .join('')
    .trim() || '';
}

export async function generateAiText(
  systemPrompt: string,
  userPrompt: string,
  options: GenerateTextOptions = {},
): Promise<string> {
  if (getProvider() === 'bedrock') {
    return callBedrock(systemPrompt, userPrompt, options);
  }

  return callGemini(systemPrompt, userPrompt, options);
}

