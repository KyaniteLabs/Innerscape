import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/error_handler.dart';

class DatabaseHelper {
  // Real persistence using SharedPreferences (Web compatible)
  static final DatabaseHelper _instance = DatabaseHelper._internal();
  factory DatabaseHelper() => _instance;
  DatabaseHelper._internal();

  /// Inserts data into the specified table.
  /// 
  /// This method adds a new record to the table by encoding the data as JSON
  /// and appending it to the existing list of records.
  /// 
  /// Parameters:
  /// - [table]: The name of the table to insert into
  /// - [data]: The data to insert as a key-value map
  /// 
  /// Note: Errors are logged but not thrown to maintain compatibility with
  /// existing code that doesn't handle exceptions.
  Future<void> insert(String table, Map<String, dynamic> data) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final List<String> currentList = prefs.getStringList(table) ?? [];
      currentList.add(json.encode(data));
      await prefs.setStringList(table, currentList);
    } catch (e, stackTrace) {
      debugPrint('[APEX] Database insert error for table "$table": $e');
      throw DatabaseException(
        message: 'Failed to insert data into table "$table"',
        originalError: e,
        stackTrace: stackTrace,
      );
    }
  }

  /// Queries all records from the specified table.
  /// 
  /// This method retrieves all records from the table and decodes them from JSON
  /// format into a list of key-value maps.
  /// 
  /// Parameters:
  /// - [table]: The name of the table to query
  /// 
  /// Returns: A list of all records in the table, or an empty list if an error occurs
  /// 
  /// Note: Errors are logged and an empty list is returned to maintain compatibility
  /// with existing code that doesn't handle exceptions.
  Future<List<Map<String, dynamic>>> queryAll(String table) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final List<String> list = prefs.getStringList(table) ?? [];
      return list.map((e) => json.decode(e) as Map<String, dynamic>).toList();
    } catch (e, stackTrace) {
      debugPrint('[APEX] Database query error for table "$table": $e');
      throw DatabaseException(
        message: 'Failed to query table "$table"',
        originalError: e,
        stackTrace: stackTrace,
      );
    }
  }

  /// Executes an operation with automatic rollback capability using backup/restore pattern.
  /// 
  /// This method provides transaction-like behavior for SharedPreferences by creating
  /// a backup before the operation and restoring it if the operation fails.
  /// 
  /// Parameters:
  /// - [table]: The name of the table to operate on
  /// - [operation]: A function that performs the operation
  /// 
  /// Returns: The result of the operation
  /// 
  /// Throws: The original exception if the operation fails
  Future<T> withTransaction<T>(String table, Future<T> Function() operation) async {
    // Create backup
    final backup = await backupTable(table);

    try {
      return await operation();
    } catch (e, stackTrace) {
      debugPrint('[APEX] Transaction failed for table "$table", rolling back: $e');
      // Restore backup
      await restoreTable(table, backup);
      throw DatabaseException(
        message: 'Transaction failed for table "$table"',
        originalError: e,
        stackTrace: stackTrace,
      );
    }
  }

  /// Creates a backup of a table's data.
  /// 
  /// This method creates a backup of all data in the specified table, which can be
  /// used for recovery purposes.
  /// 
  /// Parameters:
  /// - [table]: The name of the table to backup
  /// 
  /// Returns: A list of all rows in the table
  Future<List<String>> backupTable(String table) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final backup = prefs.getStringList(table) ?? [];
      debugPrint('[APEX] Backed up ${backup.length} rows from table "$table"');
      return backup;
    } catch (e, stackTrace) {
      debugPrint('[APEX] Backup failed for table "$table": $e');
      throw DatabaseException(
        message: 'Failed to backup table "$table"',
        originalError: e,
        stackTrace: stackTrace,
      );
    }
  }

  /// Restores data to a table from a backup.
  /// 
  /// This method restores data to a table from a previously created backup.
  /// The table is cleared before restoring the data.
  /// 
  /// Parameters:
  /// - [table]: The name of the table to restore
  /// - [backupData]: The backup data to restore
  Future<void> restoreTable(String table, List<String> backupData) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(table, backupData);
      debugPrint('[APEX] Restored ${backupData.length} rows to table "$table"');
    } catch (e, stackTrace) {
      debugPrint('[APEX] Restore failed for table "$table": $e');
      throw DatabaseException(
        message: 'Failed to restore table "$table"',
        originalError: e,
        stackTrace: stackTrace,
      );
    }
  }

  // TODO: [APEX] Add unit tests for transaction rollback scenarios
  // TODO: [APEX] Consider implementing batch operations for better performance
}

final databaseHelperProvider = Provider((ref) => DatabaseHelper());
