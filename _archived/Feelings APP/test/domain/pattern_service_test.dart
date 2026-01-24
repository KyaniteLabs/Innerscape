import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:soma/data/log_service.dart';
import 'package:soma/domain/pattern_service.dart';

class MockLogService extends Mock implements LogService {}

void main() {
  group('PatternService.analyzePatterns', () {
    late MockLogService mockLogService;
    late PatternService patternService;

    setUp(() {
      mockLogService = MockLogService();
      patternService = PatternService(mockLogService);
    });

    test('returns empty summary when no history', () async {
      when(() => mockLogService.getHistory()).thenAnswer((_) async => []);

      final result = await patternService.analyzePatterns();

      expect(result.totalCheckIns, 0);
      expect(result.mostCommonHypothesis, isNull);
      expect(result.mostCommonSensations, isEmpty);
    });

    test('calculates most common hypothesis correctly', () async {
      final history = [
        {
          'energy': 'high',
          'valence': 'unpleasant',
          'source': 'Inside',
          'context': null,
          'sensations': [],
          'selected_action': null,
          'helped': null,
        },
        {
          'energy': 'high',
          'valence': 'unpleasant',
          'source': 'Inside',
          'context': null,
          'sensations': [],
          'selected_action': null,
          'helped': null,
        },
        {
          'energy': 'high',
          'valence': 'unpleasant',
          'source': 'Inside',
          'context': null,
          'sensations': [],
          'selected_action': null,
          'helped': null,
        },
        {
          'energy': 'low',
          'valence': 'pleasant',
          'source': null,
          'context': null,
          'sensations': [],
          'selected_action': null,
          'helped': null,
        },
      ];

      when(() => mockLogService.getHistory()).thenAnswer((_) async => history);

      final result = await patternService.analyzePatterns();

      expect(result.mostCommonHypothesis, 'Anxiety / Alarm');
      expect(result.mostCommonHypothesisCount, 3);
      expect(result.totalCheckIns, 4);
    });

    test('requires minimum data for pattern analysis', () async {
      final history = [
        {
          'energy': 'high',
          'valence': 'pleasant',
          'source': null,
          'context': null,
          'sensations': [],
          'selected_action': null,
          'helped': null,
        },
      ];

      when(() => mockLogService.getHistory()).thenAnswer((_) async => history);

      final result = await patternService.analyzePatterns();

      expect(result.totalCheckIns, 1);
      expect(result.mostCommonHypothesis, 'Flow / Excitement');
    });

    test('tracks helpful actions correctly', () async {
      final history = [
        {
          'energy': 'high',
          'valence': 'unpleasant',
          'source': 'Inside',
          'context': null,
          'sensations': [],
          'selected_action': 'Box breathing',
          'helped': 'helped',
        },
        {
          'energy': 'high',
          'valence': 'unpleasant',
          'source': 'Inside',
          'context': null,
          'sensations': [],
          'selected_action': 'Box breathing',
          'helped': 'helped',
        },
        {
          'energy': 'high',
          'valence': 'unpleasant',
          'source': 'Inside',
          'context': null,
          'sensations': [],
          'selected_action': 'Cold water on wrists',
          'helped': 'didntHelp',
        },
      ];

      when(() => mockLogService.getHistory()).thenAnswer((_) async => history);

      final result = await patternService.analyzePatterns();

      expect(result.mostHelpfulAction, 'Box breathing');
      expect(result.helpedCount, 2);
      expect(result.didntHelpCount, 1);
    });
  });
}
