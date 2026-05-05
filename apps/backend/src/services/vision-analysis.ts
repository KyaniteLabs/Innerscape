/**
 * ML Vision Analysis Service — replaces Declutter's 5 Python LLM adapters.
 *
 * Uses Vercel AI SDK for unified provider access. Supports:
 * - openai (and compatible: groq, together, etc.)
 * - anthropic
 * - mock (for testing)
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export interface DetectedItem {
  label: string;
  confidence: number;
  estimated_value_usd: number;
}

export interface AnalysisResult {
  items: DetectedItem[];
  total_estimated_value_usd: number;
  engine: string;
}

type Provider = 'openai' | 'anthropic' | 'mock';

const SYSTEM_PROMPT = `You are a clutter analysis expert. Analyze the provided image of a room or space and identify distinct items visible in it.

Respond with a JSON object containing an "items" array. Each item must have:
- "label": a short description of the item (max 80 chars)
- "confidence": how certain you are this item exists (0.0 to 1.0)
- "estimated_value_usd": estimated resale value in USD (0.0 to 50000.0)

Return at most 8 items. Only include items you are confident about.`;

function getProvider(): Provider {
  const p = (process.env.DECLUTTER_ANALYSIS_PROVIDER || process.env.DECLUTTER_MODEL_PROVIDER || 'mock').toLowerCase();
  if (['anthropic', 'claude'].includes(p)) return 'anthropic';
  if (['mock'].includes(p)) return 'mock';
  if (p) return 'openai';
  return 'mock';
}

function getModel() {
  const provider = getProvider();
  const model = process.env.DECLUTTER_INFERENCE_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';

  switch (provider) {
    case 'anthropic': {
      const apiKey = process.env.DECLUTTER_INFERENCE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
      const baseURL = process.env.DECLUTTER_INFERENCE_BASE_URL || process.env.ANTHROPIC_BASE_URL;
      const anthropic = createAnthropic({ apiKey, baseURL });
      return anthropic(model);
    }
    case 'openai': {
      const apiKey = process.env.DECLUTTER_INFERENCE_API_KEY || process.env.OPENAI_API_KEY || '';
      const baseURL = process.env.DECLUTTER_INFERENCE_BASE_URL || process.env.OPENAI_BASE_URL;
      const openai = createOpenAI({ apiKey, baseURL });
      return openai(model);
    }
    default:
      return null;
  }
}

async function imageToDataUri(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  const base64 = buffer.toString('base64');
  const ext = filePath.split('.').pop()?.toLowerCase();
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mime};base64,${base64}`;
}

function parseItems(raw: string): DetectedItem[] {
  let jsonStr = raw;

  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1];

  const braceStart = jsonStr.indexOf('{');
  const braceEnd = jsonStr.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd !== -1) {
    jsonStr = jsonStr.slice(braceStart, braceEnd + 1);
  }

  const parsed = JSON.parse(jsonStr);
  const rawItems = Array.isArray(parsed?.items) ? parsed.items : [];

  return rawItems.slice(0, 8).map((item: any) => ({
    label: String(item.label || 'unknown item').slice(0, 80),
    confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0.5)),
    estimated_value_usd: Math.max(0, Math.min(50000, Number(item.estimated_value_usd) || 0)),
  }));
}

export async function runAnalysis(imagePath: string): Promise<AnalysisResult> {
  const provider = getProvider();

  if (provider === 'mock' || !existsSync(imagePath)) {
    return runMockAnalysis(imagePath);
  }

  const model = getModel();
  if (!model) return runMockAnalysis(imagePath);

  const dataUri = await imageToDataUri(imagePath);

  const result = await generateText({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'image', image: dataUri },
          { type: 'text', text: 'Identify all distinct items visible in this image and estimate their resale value.' },
        ],
      },
    ],
    maxOutputTokens: 1024,
  });

  const items = parseItems(result.text);
  const total = items.reduce((sum, i) => sum + i.estimated_value_usd, 0);
  const engine = `${provider}:${process.env.DECLUTTER_INFERENCE_MODEL || 'default'}`;

  return { items, total_estimated_value_usd: Math.round(total * 100) / 100, engine };
}

function runMockAnalysis(imagePath: string): AnalysisResult {
  const hash = imagePath.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const pool = ['clothing', 'electronics', 'paper clutter', 'toy', 'book', 'kitchen item', 'furniture', 'accessory'];
  const count = 2 + (hash % 4);
  const items: DetectedItem[] = [];

  for (let i = 0; i < count; i++) {
    items.push({
      label: pool[(hash + i * 3) % pool.length],
      confidence: 0.6 + ((hash + i) % 4) * 0.1,
      estimated_value_usd: 5 + ((hash + i * 7) % 45),
    });
  }

  const total = items.reduce((sum, i) => sum + i.estimated_value_usd, 0);
  return { items, total_estimated_value_usd: total, engine: 'mock:deterministic' };
}
