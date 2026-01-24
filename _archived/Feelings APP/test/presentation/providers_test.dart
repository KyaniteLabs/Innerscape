import 'package:flutter_test/flutter_test.dart';
import 'package:soma/data/models.dart';
import 'package:soma/presentation/providers.dart';
import '../testing_utils.dart';

void main() {
  group('SelectedSensations', () {
    test('initial state is empty set', () {
      final container = createContainer();
      expect(container.read(selectedSensationsProvider), isEmpty);
    });

    test('toggle() adds sensation to set', () {
      final container = createContainer();
      final token = SensationToken(label: 'Buzzing', category: 'Vibration');
      
      container.read(selectedSensationsProvider.notifier).toggle(token);
      expect(container.read(selectedSensationsProvider), contains(token));
    });

    test('toggle() removes sensation if already present', () {
      final container = createContainer();
      final token = SensationToken(label: 'Buzzing', category: 'Vibration');
      
      container.read(selectedSensationsProvider.notifier).toggle(token);
      container.read(selectedSensationsProvider.notifier).toggle(token);
      expect(container.read(selectedSensationsProvider), isEmpty);
    });
  });

  group('SelectedRegions', () {
    test('initial state is empty set', () {
      final container = createContainer();
      expect(container.read(selectedRegionsProvider), isEmpty);
    });

    test('toggle() adds region and second toggle removes it', () {
      final container = createContainer();
      
      container.read(selectedRegionsProvider.notifier).toggle(BodyRegion.chestHeart);
      expect(container.read(selectedRegionsProvider), contains(BodyRegion.chestHeart));
      
      container.read(selectedRegionsProvider.notifier).toggle(BodyRegion.chestHeart);
      expect(container.read(selectedRegionsProvider), isEmpty);
    });
  });

  group('SimpleState providers', () {
    test('energyLevelProvider starts null and updates', () {
      final container = createContainer();
      expect(container.read(energyLevelProvider), isNull);
      
      container.read(energyLevelProvider.notifier).set(EnergyLevel.high);
      expect(container.read(energyLevelProvider), EnergyLevel.high);
    });

    test('valenceProvider starts null and updates', () {
      final container = createContainer();
      expect(container.read(valenceProvider), isNull);
      
      container.read(valenceProvider.notifier).set(Valence.pleasant);
      expect(container.read(valenceProvider), Valence.pleasant);
    });

    test('contextCategoryProvider updates', () {
      final container = createContainer();
      container.read(contextCategoryProvider.notifier).set(ContextCategory.sensory);
      expect(container.read(contextCategoryProvider), ContextCategory.sensory);
    });

    test('sourceProvider updates', () {
      final container = createContainer();
      container.read(sourceProvider.notifier).set('Outside');
      expect(container.read(sourceProvider), 'Outside');
    });
  });
}
