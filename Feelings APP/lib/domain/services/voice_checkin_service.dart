// lib/domain/services/voice_checkin_service.dart
import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_to_text.dart';

/**
 * APEX Contract: Soma Voice-Guided Check-in
 * Purpose: Eyes-closed emotional check-in flow
 */

class VoiceCheckInService {
  final FlutterTts _tts = FlutterTts();
  final SpeechToText _stt = SpeechToText();

  Future<void> startGuidedFlow() async {
    print('[APEX] Starting voice-guided check-in');
    
    await _tts.setLanguage("en-US");
    await _tts.speak("Let's do a quick body scan. Close your eyes and notice any sensations in your chest or stomach.");
    
    await Future.delayed(Duration(seconds: 5));
    
    await _tts.speak("How would you describe the feeling? Use one word like 'tense', 'warm', or 'fluttery'.");
    
    bool available = await _stt.initialize();
    if (available) {
      _stt.listen(onResult: (result) {
        print('[APEX] User said: ${result.recognizedWords}');
        // Logic to process recognition and save check-in
      });
    }
    
    await Future.delayed(Duration(seconds: 5));
    await _tts.speak("Thank you. I've recorded your check-in. Open your eyes when you're ready.");
  }
}
