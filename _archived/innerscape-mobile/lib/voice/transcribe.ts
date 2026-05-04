/**
 * APEX Contract: Audio Transcription Service
 * Inputs: audioUri (local file path)
 * Outputs: TranscriptionResult { text, confidence, words }
 * Errors: API failure, file read failure
 * Edge cases: Empty audio, network timeout
 */
import * as FileSystem from 'expo-file-system';

// Named constants (APEX: No Magic)
const DEEPGRAM_ENDPOINT = 'https://api.deepgram.com/v1/listen';
const DEEPGRAM_MODEL = 'nova-2';
const REQUEST_TIMEOUT_MS = 30000;

export interface TranscriptionResult {
  text: string;
  confidence: number;
  words?: Array<{ word: string; start: number; end: number }>;
}

export const transcribeAudio = async (
  audioUri: string,
  apiKey: string
): Promise<TranscriptionResult> => {
  // Input validation (APEX: validated inputs)
  if (!audioUri) {
    throw new Error('Audio URI is required');
  }
  if (!apiKey) {
    throw new Error('Deepgram API key is required');
  }

  try {
    console.log('[APEX] Starting transcription for:', audioUri);

    // Read audio file
    const file = new FileSystem.File(audioUri);
    const audioBase64 = await file.base64();

    // Convert to binary
    const binaryString = atob(audioBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Call Deepgram API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(
      `${DEEPGRAM_ENDPOINT}?model=${DEEPGRAM_MODEL}&smart_format=true`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'audio/m4a',
        },
        body: bytes,
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Deepgram API error: ${response.status}`);
    }

    const data = await response.json();
    const alternative = data.results?.channels?.[0]?.alternatives?.[0];

    // Safe defaults (APEX: Safe Defaults)
    const result: TranscriptionResult = {
      text: alternative?.transcript ?? '',
      confidence: alternative?.confidence ?? 0,
      words: alternative?.words,
    };

    console.log('[APEX] Transcription complete, confidence:', result.confidence);
    return result;

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transcription failed';
    console.error('[APEX] Transcription error:', message);
    throw new Error(message);
  }
};
