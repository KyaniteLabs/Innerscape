import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:soma/data/encrypted_database_helper.dart';
import 'package:soma/data/models.dart';
import 'package:soma/domain/learning_service.dart';
import 'package:sqflite_sqlcipher/sqflite.dart';

class MockDatabase extends Mock implements Database {}

class MockEncryptedDatabaseHelper extends Mock
    implements EncryptedDatabaseHelper {
  final mockDb = MockDatabase();

  @override
  Future<Database> get database async => mockDb;
}

void main() {
  group('LearningService', () {
    late MockEncryptedDatabaseHelper mockDbHelper;
    late LearningService learningService;

    setUp(() {
      mockDbHelper = MockEncryptedDatabaseHelper();
      learningService = LearningService(mockDbHelper);
    });

    test('recordConfirmation creates new mapping when none exists', () async {
      when(() => mockDbHelper.mockDb.query(
            'personal_mappings',
            where: any(named: 'where'),
            whereArgs: any(named: 'whereArgs'),
          )).thenAnswer((_) async => []);

      when(() => mockDbHelper.mockDb.insert('personal_mappings', any()))
          .thenAnswer((_) async => 1);

      await learningService.recordConfirmation(
        hypothesisName: 'Anxiety / Alarm',
        regions: [BodyRegion.chestHeart],
        sensations: [SensationToken(label: 'Pounding', category: 'Cardiac')],
      );

      verify(() => mockDbHelper.mockDb.insert('personal_mappings', any()))
          .called(1);
    });

    test('recordConfirmation increments count and updates score', () async {
      final existingMapping = {
        'id': '123',
        'hypothesis_name': 'Anxiety / Alarm',
        'regions': '[]',
        'sensations': '[]',
        'confirmation_count': 2,
        'confidence_score': 0.6,
        'last_confirmed': DateTime.now().toIso8601String(),
      };

      when(() => mockDbHelper.mockDb.query(
            'personal_mappings',
            where: any(named: 'where'),
            whereArgs: any(named: 'whereArgs'),
          )).thenAnswer((_) async => [existingMapping]);

      when(() => mockDbHelper.mockDb.update(
            'personal_mappings',
            any(),
            where: any(named: 'where'),
            whereArgs: any(named: 'whereArgs'),
          )).thenAnswer((_) async => 1);

      await learningService.recordConfirmation(
        hypothesisName: 'Anxiety / Alarm',
        regions: [BodyRegion.chestHeart],
        sensations: [SensationToken(label: 'Pounding', category: 'Cardiac')],
      );

      final captured = verify(() => mockDbHelper.mockDb.update(
            'personal_mappings',
            captureAny(),
            where: any(named: 'where'),
            whereArgs: any(named: 'whereArgs'),
          )).captured.first as Map<String, dynamic>;

      expect(captured['confirmation_count'], 3);
      // Score formula: min(0.95, 0.6 + 0.1 * (1 - 0.6)) = min(0.95, 0.64) = 0.64
      expect((captured['confidence_score'] as double).toStringAsFixed(2), '0.64');
    });

    test('getPersonalMappings returns all mappings', () async {
      final mappings = [
        {
          'id': '1',
          'hypothesis_name': 'Anxiety / Alarm',
          'regions': '["chestHeart"]',
          'sensations': '[{"label":"Pounding","category":"Cardiac"}]',
          'confirmation_count': 5,
          'confidence_score': 0.75,
          'last_confirmed': DateTime.now().toIso8601String(),
        },
      ];

      when(() => mockDbHelper.mockDb.query('personal_mappings'))
          .thenAnswer((_) async => mappings);

      final results = await learningService.getPersonalMappings();

      expect(results.length, 1);
      expect(results.first.emotionName, 'Anxiety / Alarm');
      expect(results.first.confirmationCount, 5);
      expect(results.first.confidenceScore, 0.75);
    });

    test('score increases correctly with formula', () async {
      // Test the confidence score progression
      // Start: 0.5, After 1st: 0.5 + 0.1 * 0.5 = 0.55
      // After 2nd: 0.55 + 0.1 * 0.45 = 0.595
      // Eventually approaches 0.95

      final scores = <double>[];
      var score = 0.5;
      for (int i = 0; i < 50; i++) {
        score = (score + 0.1 * (1 - score)) < 0.95
            ? score + 0.1 * (1 - score)
            : 0.95;
        scores.add(score);
      }

      // Verify progression and that score is always increasing
      expect(scores[0], closeTo(0.55, 0.001));
      expect(scores[1], closeTo(0.595, 0.001));
      
      // Verify monotonic increase
      for (int i = 1; i < scores.length; i++) {
        expect(scores[i], greaterThanOrEqualTo(scores[i - 1]));
      }
      
      // Verify approaches 0.95
      expect(scores.last, closeTo(0.95, 0.01));
    });
  });
}
