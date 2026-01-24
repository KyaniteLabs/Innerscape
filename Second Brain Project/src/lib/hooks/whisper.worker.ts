// Transcriber type from @xenova/transformers (dynamic import)
type TranscriberFn = (audio: Float32Array, options: Record<string, unknown>) => Promise<{ text: string }>;

let transcriberPromise: Promise<TranscriberFn> | null = null;

async function getTranscriber(): Promise<TranscriberFn> {
    if (!transcriberPromise) {
        transcriberPromise = (async () => {
            const { pipeline, env } = await import('@xenova/transformers');
            env.allowLocalModels = false;
            return await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en') as TranscriberFn;
        })();
    }
    return transcriberPromise;
}

self.onmessage = async (event: MessageEvent) => {
    const { audio } = event.data;

    try {
        const transcriber = await getTranscriber();
        const output = await transcriber(audio, {
            chunk_length_s: 30,
            stride_length_s: 5,
            task: 'transcribe',
            language: 'english',
        });

        self.postMessage({
            status: 'complete',
            transcript: output.text,
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown transcription error";
        console.error('[APEX] [WhisperWorker] Processing error:', error);
        self.postMessage({
            status: 'error',
            error: errorMessage,
        });
    }
};
