/**
 * APEX Contract: Voice Recorder Hook
 * Inputs: None
 * Outputs: { isRecording, duration, startRecording, stopRecording, audioUri }
 * Errors: Permission denied, recording failure
 * Edge cases: Background interruption, permission changes
 * Note: Uses expo-av (SDK 52 stable)
 */
import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

// Named constants (APEX: No Magic)
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

  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<any>(null);

  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        setState(s => ({ ...s, error: 'Microphone permission denied' }));
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setState(s => ({ ...s, isRecording: true, duration: 0, audioUri: null, error: null }));

      intervalRef.current = setInterval(() => {
        setState(s => ({ ...s, duration: s.duration + 1 }));
      }, DURATION_INTERVAL_MS);

      console.log('[APEX] Recording started');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start recording';
      console.error('[APEX] Recording start error:', message);
      setState(s => ({ ...s, error: message }));
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      if (!recordingRef.current) return null;
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      
      setState(s => ({ ...s, isRecording: false, audioUri: uri }));
      console.log('[APEX] Recording stopped, uri:', uri);
      
      return uri;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to stop recording';
      console.error('[APEX] Recording stop error:', message);
      setState(s => ({ ...s, isRecording: false, error: message }));
      return null;
    }
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
  };
};
