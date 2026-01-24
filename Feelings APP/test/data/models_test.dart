import 'package:flutter_test/flutter_test.dart';
import 'package:soma/data/models.dart';

void main() {
  group('SensationToken', () {
    test('toMap() produces valid structure', () {
      final token = SensationToken(label: 'Buzzing', category: 'Vibration');
      final map = token.toMap();
      expect(map, {'label': 'Buzzing', 'category': 'Vibration'});
    });

    test('fromMap() reconstructs object correctly', () {
      final map = {'label': 'Tight', 'category': 'Pressure'};
      final token = SensationToken.fromMap(map);
      expect(token.label, 'Tight');
      expect(token.category, 'Pressure');
    });
  });

  group('CheckIn', () {
    final now = DateTime.now();
    final checkIn = CheckIn(
      id: 'uuid-123',
      timestamp: now,
      regions: [BodyRegion.chestHeart],
      sensations: [SensationToken(label: 'Fast', category: 'Heart')],
      intensity: 4,
      energy: EnergyLevel.high,
      valence: Valence.unpleasant,
      context: ContextCategory.task,
      freeText: 'Test text',
    );

    test('toMap() includes all required fields', () {
      final map = checkIn.toMap();
      expect(map['id'], 'uuid-123');
      expect(map['timestamp'], now.toIso8601String());
      expect(map['regions'], ['chestHeart']);
      expect(map['intensity'], 4);
      expect(map['energy'], 'high');
      expect(map['valence'], 'unpleasant');
      expect(map['context'], 'task');
      expect(map['freeText'], 'Test text');
    });

    test('sensations serialize as list of maps', () {
      final map = checkIn.toMap();
      final sensations = map['sensations'] as List;
      expect(sensations.first, {'label': 'Fast', 'category': 'Heart'});
    });
  });

  group('Hypothesis', () {
    test('stores all properties correctly', () {
      final hypothesis = Hypothesis(
        name: 'Test',
        description: 'Desc',
        bodySignals: ['Signal'],
        actions: ['Action'],
      );
      expect(hypothesis.name, 'Test');
      expect(hypothesis.description, 'Desc');
      expect(hypothesis.bodySignals, ['Signal']);
      expect(hypothesis.actions, ['Action']);
    });
  });

  group('Enums', () {
    test('EnergyLevel has expected values', () {
      expect(EnergyLevel.values.length, 2);
      expect(EnergyLevel.high.name, 'high');
      expect(EnergyLevel.low.name, 'low');
    });

    test('Valence has expected values', () {
      expect(Valence.values.length, 3);
      expect(Valence.pleasant.name, 'pleasant');
      expect(Valence.unpleasant.name, 'unpleasant');
      expect(Valence.neutral.name, 'neutral');
    });

    test('BodyRegion has all 8 regions', () {
      expect(BodyRegion.values.length, 8);
    });

    test('ContextCategory has expected values', () {
      expect(ContextCategory.values.length, 4);
      expect(ContextCategory.social.name, 'social');
    });
  });
}
