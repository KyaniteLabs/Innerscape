import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:soma/domain/migration_service.dart';
import 'package:soma/data/encrypted_database_helper.dart';

class MockDatabaseHelper extends Mock implements EncryptedDatabaseHelper {}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late DataMigrationService migrationService;
  late MockDatabaseHelper mockDb;

  setUp(() {
    mockDb = MockDatabaseHelper();
    migrationService = DataMigrationService(mockDb);
    SharedPreferences.setMockInitialValues({});
  });

  group('DataMigrationService', () {
    test('migrateFromSharedPreferences migrates valid data successfully', () async {
      final checkIns = [
        jsonEncode({'id': '550e8400-e29b-41d4-a716-446655440000', 'intensity': 3, 'timestamp': '2026-01-24T12:00:00Z'}),
      ];
      final reflections = [
        jsonEncode({'check_in_id': '550e8400-e29b-41d4-a716-446655440000', 'helped': 'yes'}),
      ];

      SharedPreferences.setMockInitialValues({
        'check_ins': checkIns,
        'reflections': reflections,
      });

      when(() => mockDb.insert(any(), any())).thenAnswer((_) async => {});

      await migrationService.migrateFromSharedPreferences();

      verify(() => mockDb.insert('check_ins', any())).called(1);
      verify(() => mockDb.insert('reflections', any())).called(1);

      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getBool('migration_v1_complete'), true);
    });

    test('migrateFromSharedPreferences handles empty source gracefully', () async {
      SharedPreferences.setMockInitialValues({});

      await migrationService.migrateFromSharedPreferences();

      verifyNever(() => mockDb.insert(any(), any()));
      
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getBool('migration_v1_complete'), true);
    });

    test('migrateFromSharedPreferences skips corrupt entries', () async {
      final checkIns = [
        'invalid-json',
        jsonEncode({'id': '550e8400-e29b-41d4-a716-446655440001', 'intensity': 4}),
      ];

      SharedPreferences.setMockInitialValues({
        'check_ins': checkIns,
      });

      when(() => mockDb.insert(any(), any())).thenAnswer((_) async => {});

      await migrationService.migrateFromSharedPreferences();

      // Should only call insert for the valid one
      verify(() => mockDb.insert('check_ins', any())).called(1);
      
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getBool('migration_v1_complete'), true);
    });

    test('migrateFromSharedPreferences rolls back on failure', () async {
      final checkIns = [
        jsonEncode({'id': '550e8400-e29b-41d4-a716-446655440002', 'intensity': 3}),
      ];

      SharedPreferences.setMockInitialValues({
        'check_ins': checkIns,
      });

      when(() => mockDb.insert(any(), any())).thenThrow(Exception('DB Failure'));

      expect(
        () => migrationService.migrateFromSharedPreferences(),
        throwsA(isA<Exception>()),
      );

      final prefs = await SharedPreferences.getInstance();
      // migration_v1_complete should NOT be set
      expect(prefs.getBool('migration_v1_complete'), isNot(true));
      // check_ins should still be there (restored from backup)
      expect(prefs.getStringList('check_ins'), checkIns);
    });

    test('isMigrationComplete returns correct status', () async {
      SharedPreferences.setMockInitialValues({'migration_v1_complete': true});
      expect(await migrationService.isMigrationComplete(), true);

      SharedPreferences.setMockInitialValues({'migration_v1_complete': false});
      expect(await migrationService.isMigrationComplete(), false);
    });
  });
}
