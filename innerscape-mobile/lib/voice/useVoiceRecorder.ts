/**
 * APEX Contract: Voice Recorder Hook
 * Inputs: None
 * Outputs: { isRecording, duration, startRecording, stopRecording, audioUri }
 * Errors: Permission denied, recording failure
 * Edge cases: Background interruption, permission changes
 */
import { useState, useRef, useCallback } from 'react';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';

// Named constants (APEX: No Magic)
const RECORDING_OPTIONS = RecordingPresets.HIGH_QUALITY;
const DURATION_INTERVAL_MS = 1000;

interface VoiceRecorderState {
  isRecording: boolean;
  duration: number;
  audioUri: string | null;
  error: string | null;
}

export const useVoiceRecorder = () => {
  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    duration: 0,
    audioUri: null,
    error: null,
  });

  const audioRecorder = useAudioRecorder(RECORDING_OPTIONS);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Request permissions
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        setState(s => ({ ...s, error: 'Microphone permission denied' }));
        console.log('[APEX] Recording permission denied');
        return;
      }

      // Start recording
      await audioRecorder.record();
      setState(s => ({ ...s, isRecording: true, duration: 0, audioUri: null, error: null }));

      // Duration counter
      intervalRef.current = setInterval(() => {
        setState(s => ({ ...s, duration: s.duration + 1 }));
      }, DURATION_INTERVAL_MS);

      console.log('[APEX] Recording started');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start recording';
      console.error('[APEX] Recording start error:', message);
      setState(s => ({ ...s, error: message }));
    }
  }, [audioRecorder]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const uri = await audioRecorder.stop();
      setState(s => ({ ...s, isRecording: false, audioUri: uri }));
      console.log('[APEX] Recording stopped, uri:', uri);
      return uri;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to stop recording';
      console.error('[APEX] Recording stop error:', message);
      setState(s => ({ ...s, isRecording: false, error: message }));
      return null;
    }
  }, [audioRecorder]);

  return {
    ...state,
    startRecording,
    stopRecording,
  };
};
