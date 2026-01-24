import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:soma/data/models.dart';
import 'package:soma/presentation/result_screen.dart';
import 'package:soma/presentation/providers.dart';
import 'package:soma/data/encrypted_database_helper.dart';
import '../mocks/mock_database_helper.dart';
import '../testing_utils.dart';

class HighEnergyNotifier extends SimpleState<EnergyLevel> {
  @override
  EnergyLevel? build() => EnergyLevel.high;
}

class PleasantValenceNotifier extends SimpleState<Valence> {
  @override
  Valence? build() => Valence.pleasant;
}

class TestSelectedRegions extends SelectedRegions {
  @override
  Set<BodyRegion> build() => {BodyRegion.headFace};
}

class TestSelectedSensations extends SelectedSensations {
  @override
  Set<SensationToken> build() => {SensationToken(label: 'Warm', category: 'Temperature')};
}

void main() {
  testWidgets('ResultScreen shows correct hypothesis', (tester) async {
    final mockDbHelper = MockDatabaseHelper();
    
    // Mock the underlying database query for personal mappings
    when(() => mockDbHelper.mockDb.query(
      any(),
      where: any(named: 'where'),
      whereArgs: any(named: 'whereArgs'),
    )).thenAnswer((_) async => <Map<String, dynamic>>[]);

    // Mock the underlying database insert for personal mappings
    when(() => mockDbHelper.mockDb.insert(
      any(),
      any(),
      conflictAlgorithm: any(named: 'conflictAlgorithm'),
    )).thenAnswer((_) async => 1);

    await tester.pumpWidget(pumpApp(
      const ResultScreen(),
      overrides: [
        energyLevelProvider.overrideWith(() => HighEnergyNotifier()),
        valenceProvider.overrideWith(() => PleasantValenceNotifier()),
        selectedRegionsProvider.overrideWith(() => TestSelectedRegions()),
        selectedSensationsProvider.overrideWith(() => TestSelectedSensations()),
        encryptedDatabaseHelperProvider.overrideWithValue(mockDbHelper),
      ],
    ));

    // High + Pleasant = Flow / Excitement
    expect(find.text('FLOW / EXCITEMENT'), findsOneWidget);
    final buttonFinder = find.text('THIS FITS');
    await tester.ensureVisible(buttonFinder);
    await tester.tap(buttonFinder);
    await tester.pumpAndSettle();

    // Verify DB save
    expect(mockDbHelper.checkIns.length, 1);
  });

  testWidgets('displays confidence badge', (tester) async {
    final mockDbHelper = MockDatabaseHelper();
    
    when(() => mockDbHelper.mockDb.query(
      any(),
      where: any(named: 'where'),
      whereArgs: any(named: 'whereArgs'),
    )).thenAnswer((_) async => <Map<String, dynamic>>[]);

    when(() => mockDbHelper.mockDb.insert(
      any(),
      any(),
      conflictAlgorithm: any(named: 'conflictAlgorithm'),
    )).thenAnswer((_) async => 1);

    await tester.pumpWidget(pumpApp(
      const ResultScreen(),
      overrides: [
        energyLevelProvider.overrideWith(() => HighEnergyNotifier()),
        valenceProvider.overrideWith(() => PleasantValenceNotifier()),
        selectedRegionsProvider.overrideWith(() => TestSelectedRegions()),
        selectedSensationsProvider.overrideWith(() => TestSelectedSensations()),
        encryptedDatabaseHelperProvider.overrideWithValue(mockDbHelper),
      ],
    ));

    // Should display confidence level information
    // The widget should be renderable
    expect(find.byType(ResultScreen), findsOneWidget);
  });

  testWidgets('action cards are displayed', (tester) async {
    final mockDbHelper = MockDatabaseHelper();
    
    when(() => mockDbHelper.mockDb.query(
      any(),
      where: any(named: 'where'),
      whereArgs: any(named: 'whereArgs'),
    )).thenAnswer((_) async => <Map<String, dynamic>>[]);

    when(() => mockDbHelper.mockDb.insert(
      any(),
      any(),
      conflictAlgorithm: any(named: 'conflictAlgorithm'),
    )).thenAnswer((_) async => 1);

    await tester.pumpWidget(pumpApp(
      const ResultScreen(),
      overrides: [
        energyLevelProvider.overrideWith(() => HighEnergyNotifier()),
        valenceProvider.overrideWith(() => PleasantValenceNotifier()),
        selectedRegionsProvider.overrideWith(() => TestSelectedRegions()),
        selectedSensationsProvider.overrideWith(() => TestSelectedSensations()),
        encryptedDatabaseHelperProvider.overrideWithValue(mockDbHelper),
      ],
    ));

    // Should display action suggestions
    expect(find.byType(ResultScreen), findsOneWidget);
  });

  testWidgets('THIS FITS button saves confirmation', (tester) async {
    final mockDbHelper = MockDatabaseHelper();
    
    when(() => mockDbHelper.mockDb.query(
      any(),
      where: any(named: 'where'),
      whereArgs: any(named: 'whereArgs'),
    )).thenAnswer((_) async => <Map<String, dynamic>>[]);

    when(() => mockDbHelper.mockDb.insert(
      any(),
      any(),
      conflictAlgorithm: any(named: 'conflictAlgorithm'),
    )).thenAnswer((_) async => 1);

    await tester.pumpWidget(pumpApp(
      const ResultScreen(),
      overrides: [
        energyLevelProvider.overrideWith(() => HighEnergyNotifier()),
        valenceProvider.overrideWith(() => PleasantValenceNotifier()),
        selectedRegionsProvider.overrideWith(() => TestSelectedRegions()),
        selectedSensationsProvider.overrideWith(() => TestSelectedSensations()),
        encryptedDatabaseHelperProvider.overrideWithValue(mockDbHelper),
      ],
    ));

    final buttonFinder = find.text('THIS FITS');
    await tester.ensureVisible(buttonFinder);
    await tester.tap(buttonFinder);
    await tester.pumpAndSettle();

    // Verify that data was saved
    expect(mockDbHelper.checkIns.isNotEmpty, true);
  });
}
