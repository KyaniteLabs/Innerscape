import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:soma/data/encrypted_database_helper.dart';
import 'package:sqflite_sqlcipher/sqflite.dart';

class MockDatabase extends Mock implements Database {}
class MockTransaction extends Mock implements Transaction {}

void main() {
  late EncryptedDatabaseHelper dbHelper;
  late MockDatabase mockDatabase;
  late MockTransaction mockTransaction;

  setUp(() {
    dbHelper = EncryptedDatabaseHelper();
    mockDatabase = MockDatabase();
    mockTransaction = MockTransaction();
    dbHelper.setDatabaseForTesting(mockDatabase);
    
    // Default mock for transaction to avoid Null subtype errors
    when(() => mockDatabase.transaction<void>(any()))
        .thenAnswer((invocation) async {
      final callback = invocation.positionalArguments[0] as Function;
      return await callback(mockTransaction);
    });

    when(() => mockDatabase.transaction<Null>(any()))
        .thenAnswer((invocation) async {
      final callback = invocation.positionalArguments[0] as Function;
      return await callback(mockTransaction);
    });
  });

  group('EncryptedDatabaseHelper', () {
    test('insert calls db.insert with correct parameters', () async {
      final data = {'id': '1', 'name': 'test'};
      when(() => mockDatabase.insert(
            any(),
            any(),
            conflictAlgorithm: any(named: 'conflictAlgorithm'),
          )).thenAnswer((_) async => 1);

      await dbHelper.insert('test_table', data);

      verify(() => mockDatabase.insert(
            'test_table',
            data,
            conflictAlgorithm: ConflictAlgorithm.abort,
          )).called(1);
    });

    test('queryAll calls db.query with correct parameters', () async {
      final expectedData = [{'id': '1', 'timestamp': '2026-01-24T12:00:00Z'}];
      when(() => mockDatabase.query(
            any(),
            orderBy: any(named: 'orderBy'),
          )).thenAnswer((_) async => expectedData);

      final result = await dbHelper.queryAll('test_table');

      expect(result, expectedData);
      verify(() => mockDatabase.query(
            'test_table',
            orderBy: 'timestamp DESC',
          )).called(1);
    });

    test('delete calls db.delete with correct parameters', () async {
      when(() => mockDatabase.delete(
            any(),
            where: any(named: 'where'),
            whereArgs: any(named: 'whereArgs'),
          )).thenAnswer((_) async => 1);

      await dbHelper.delete('test_table', where: 'id = ?', whereArgs: ['1']);

      verify(() => mockDatabase.delete(
            'test_table',
            where: 'id = ?',
            whereArgs: ['1'],
          )).called(1);
    });

    test('withTransaction commits on success', () async {
      when(() => mockDatabase.transaction<int>(any()))
          .thenAnswer((invocation) async {
        final callback = invocation.positionalArguments[0] as Future<int> Function(Transaction);
        return await callback(mockTransaction);
      });

      final result = await dbHelper.withTransaction((txn) async {
        return 123;
      });

      expect(result, 123);
      verify(() => mockDatabase.transaction<int>(any())).called(1);
    });

    test('withTransaction rolls back and rethrows on error', () async {
      when(() => mockDatabase.transaction<void>(any()))
          .thenAnswer((invocation) async {
        final callback = invocation.positionalArguments[0] as Future<void> Function(Transaction);
        return await callback(mockTransaction);
      });

      expect(
        () => dbHelper.withTransaction<void>((txn) async {
          throw Exception('test error');
        }),
        throwsA(isA<Exception>()),
      );
    });

    test('backupTable returns all rows from table', () async {
      final expectedData = [{'id': '1'}, {'id': '2'}];
      when(() => mockDatabase.query('test_table'))
          .thenAnswer((_) async => expectedData);

      final result = await dbHelper.backupTable('test_table');

      expect(result, expectedData);
      verify(() => mockDatabase.query('test_table')).called(1);
    });

    test('restoreTable clears and inserts backup data within transaction', () async {
      final backupData = [{'id': '1'}, {'id': '2'}];
      
      when(() => mockTransaction.delete('test_table'))
          .thenAnswer((_) async => 0);
      when(() => mockTransaction.insert(
            any(),
            any(),
            conflictAlgorithm: any(named: 'conflictAlgorithm'),
          )).thenAnswer((_) async => 1);

      await dbHelper.restoreTable('test_table', backupData);

      verify(() => mockTransaction.delete('test_table')).called(1);
      verify(() => mockTransaction.insert(
            'test_table',
            backupData[0],
            conflictAlgorithm: ConflictAlgorithm.replace,
          )).called(1);
      verify(() => mockTransaction.insert(
            'test_table',
            backupData[1],
            conflictAlgorithm: ConflictAlgorithm.replace,
          )).called(1);
    });
  });
}
