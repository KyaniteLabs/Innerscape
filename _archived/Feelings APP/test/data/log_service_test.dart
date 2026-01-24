import 'package:flutter_test/flutter_test.dart';
import 'package:soma/data/encrypted_database_helper.dart';
import 'package:soma/data/log_service.dart';
import 'package:soma/data/models.dart';
import '../mocks/mock_database_helper.dart';
import '../testing_utils.dart';

void main() {
  late MockDatabaseHelper mockDb;
  late LogService logService;

  setUp(() {
    mockDb = MockDatabaseHelper();
    final container = createContainer(overrides: [
      encryptedDatabaseHelperProvider.overrideWithValue(mockDb),
    ]);
    logService = container.read(logServiceProvider);
  });

  group('LogService', () {
    test('saveCheckIn() calls database insert', () async {
      await logService.saveCheckIn(
        regions: [BodyRegion.headFace],
        sensations: {SensationToken(label: 'Warm', category: 'Temperature')},
        energy: EnergyLevel.high,
        valence: Valence.pleasant,
        source: 'Inside',
        context: ContextCategory.social,
      );

      expect(mockDb.checkIns.length, 1);
      final saved = mockDb.checkIns.first;
      expect(saved['energy'], 'high');
      expect(saved['valence'], 'pleasant');
      expect(saved['context'], 'social');
      expect(saved['id'], isNotNull);
    });

    test('saveReflection() saves to reflections table', () async {
      await logService.saveReflection(
        checkInId: '550e8400-e29b-41d4-a716-446655440000',
        helped: HelpfulnessRating.helped,
        postEnergy: EnergyLevel.low,
        postValence: Valence.neutral,
      );

      expect(mockDb.reflections.length, 1);
      final saved = mockDb.reflections.first;
      expect(saved['check_in_id'], '550e8400-e29b-41d4-a716-446655440000');
      expect(saved['helped'], 'helped');
      expect(saved['post_energy'], 'low');
    });

    test('getHistory() returns all check-ins', () async {
      mockDb.checkIns.add({'id': '1', 'energy': 'high'});
      mockDb.checkIns.add({'id': '2', 'energy': 'low'});

      final history = await logService.getHistory();
      expect(history.length, 2);
      expect(history.first['id'], '1');
    });
  });
}
