import 'package:mocktail/mocktail.dart';
import 'package:soma/data/encrypted_database_helper.dart';
import 'package:sqflite_sqlcipher/sqflite.dart';

class MockDatabase extends Mock implements Database {}

class MockDatabaseHelper extends Mock implements EncryptedDatabaseHelper {
  final List<Map<String, dynamic>> checkIns = [];
  final List<Map<String, dynamic>> reflections = [];
  final mockDb = MockDatabase();

  @override
  Future<Database> get database async => mockDb;

  @override
  Future<void> insert(String table, Map<String, dynamic> data) async {
    if (table == 'check_ins') {
      checkIns.add(data);
    } else if (table == 'reflections') {
      reflections.add(data);
    }
  }

  @override
  Future<List<Map<String, dynamic>>> queryAll(String table) async {
    if (table == 'check_ins') {
      return checkIns;
    } else if (table == 'reflections') {
      return reflections;
    }
    return [];
  }

  void reset() {
    checkIns.clear();
    reflections.clear();
  }
}
