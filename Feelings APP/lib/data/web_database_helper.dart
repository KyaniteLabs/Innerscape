import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'database_interface.dart';

/// APEX Web Database
/// Web-compatible database using SharedPreferences/localStorage.
/// Data is stored as JSON in browser storage.
class WebDatabaseHelper implements DatabaseInterface {
  static const String _storageKey = 'soma_database';
  Map<String, List<Map<String, dynamic>>> _tables = {};
  bool _initialized = false;

  @override
  Future<void> initialize() async {
    if (_initialized) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      final data = prefs.getString(_storageKey);
      if (data != null) {
        final decoded = json.decode(data) as Map<String, dynamic>;
        _tables = decoded.map((key, value) => MapEntry(
              key,
              (value as List)
                  .map((e) => Map<String, dynamic>.from(e as Map))
                  .toList(),
            ));
      }
      _initialized = true;
      debugPrint('[APEX] Web database initialized');
    } catch (e) {
      debugPrint('[APEX] Web database init error: $e');
      _tables = {};
      _initialized = true;
    }
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, json.encode(_tables));
  }

  @override
  Future<int> insert(String table, Map<String, dynamic> values) async {
    _tables.putIfAbsent(table, () => []);
    final id = DateTime.now().millisecondsSinceEpoch;
    final record = {...values, 'id': values['id'] ?? id.toString()};
    _tables[table]!.add(record);
    await _persist();
    return id;
  }

  @override
  Future<List<Map<String, dynamic>>> query(
    String table, {
    String? where,
    List<dynamic>? whereArgs,
    String? orderBy,
    int? limit,
  }) async {
    final records = _tables[table] ?? [];
    // Simple filtering - supports basic 'column = ?' patterns.
    if (where != null && whereArgs != null && whereArgs.isNotEmpty) {
      final column = where.split(' ')[0];
      return records.where((r) => r[column] == whereArgs[0]).toList();
    }
    if (limit != null) {
      return records.take(limit).toList();
    }
    return List.from(records);
  }

  @override
  Future<int> update(
    String table,
    Map<String, dynamic> values, {
    String? where,
    List<dynamic>? whereArgs,
  }) async {
    final records = _tables[table] ?? [];
    var count = 0;
    if (where != null && whereArgs != null && whereArgs.isNotEmpty) {
      final column = where.split(' ')[0];
      for (var i = 0; i < records.length; i++) {
        if (records[i][column] == whereArgs[0]) {
          records[i] = {...records[i], ...values};
          count++;
        }
      }
    }
    await _persist();
    return count;
  }

  @override
  Future<int> delete(
    String table, {
    String? where,
    List<dynamic>? whereArgs,
  }) async {
    final records = _tables[table] ?? [];
    var count = 0;
    if (where != null && whereArgs != null && whereArgs.isNotEmpty) {
      final column = where.split(' ')[0];
      final originalLength = records.length;
      _tables[table] = records.where((r) => r[column] != whereArgs[0]).toList();
      count = originalLength - _tables[table]!.length;
    } else {
      count = records.length;
      _tables[table] = [];
    }
    await _persist();
    return count;
  }

  @override
  Future<void> close() async {
    await _persist();
  }

  @override
  Future<void> backup() async {
    // Web backup is automatic via _persist().
    debugPrint('[APEX] Web database backup (no-op, auto-persisted)');
  }

  @override
  Future<void> restore() async {
    await initialize();
  }
}
