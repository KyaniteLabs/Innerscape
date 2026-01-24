import 'dart:convert';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:path/path.dart';
import 'package:sqflite_sqlcipher/sqflite.dart';
import '../core/platform_utils.dart';
import 'web_database_helper.dart';

class EncryptedDatabaseHelper {
  static final EncryptedDatabaseHelper _instance = EncryptedDatabaseHelper._internal();
  factory EncryptedDatabaseHelper() => _instance;
  EncryptedDatabaseHelper._internal();

  static bool get _useWebFallback => PlatformUtils.isWeb;
  static WebDatabaseHelper? _webHelper;

  Database? _database;
  static const _secureStorage = FlutterSecureStorage();
  static const _keyName = 'soma_db_encryption_key';

  @visibleForTesting
  void setDatabaseForTesting(Database db) {
    _database = db;
  }

  Future<Database> get database async {
    if (_useWebFallback) {
      throw UnsupportedError('Use webDatabase getter on web platform');
    }

    return _database ??= await _initDatabase();
  }

  /// Returns the web-compatible database for web platform.
  static Future<WebDatabaseHelper> get webDatabase async {
    if (_webHelper == null) {
      _webHelper = WebDatabaseHelper();
      await _webHelper!.initialize();
    }
    return _webHelper!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'soma_encrypted.db');

    // Get or generate encryption key
    String? password = await _secureStorage.read(key: _keyName);
    if (password == null) {
      password = _generateSecureKey();
      await _secureStorage.write(key: _keyName, value: password);
    }

    return await openDatabase(
      path,
      password: password,
      version: 2,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE check_ins (
            id TEXT PRIMARY KEY,
            timestamp TEXT,
            regions TEXT,
            sensations TEXT,
            intensity INTEGER,
            energy TEXT,
            valence TEXT,
            context TEXT,
            freeText TEXT,
            hypothesis_accepted INTEGER,
            custom_hypothesis TEXT,
            selected_action TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE reflections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            check_in_id TEXT,
            helped TEXT,
            post_energy TEXT,
            post_valence TEXT,
            timestamp TEXT,
            FOREIGN KEY (check_in_id) REFERENCES check_ins (id)
          )
        ''');
        await db.execute('''
          CREATE TABLE personal_mappings (
            id TEXT PRIMARY KEY,
            hypothesis_name TEXT,
            regions TEXT,
            sensations TEXT,
            confirmation_count INTEGER DEFAULT 1,
            confidence_score REAL DEFAULT 0.5,
            last_confirmed TEXT
          )
        ''');
      },
      onUpgrade: (db, oldVersion, newVersion) async {
        if (oldVersion < 2) {
          await db.execute('ALTER TABLE check_ins ADD COLUMN hypothesis_accepted INTEGER');
          await db.execute('ALTER TABLE check_ins ADD COLUMN custom_hypothesis TEXT');
          await db.execute('ALTER TABLE check_ins ADD COLUMN selected_action TEXT');
          await db.execute('''
            CREATE TABLE personal_mappings (
              id TEXT PRIMARY KEY,
              hypothesis_name TEXT,
              regions TEXT,
              sensations TEXT,
              confirmation_count INTEGER DEFAULT 1,
              confidence_score REAL DEFAULT 0.5,
              last_confirmed TEXT
            )
          ''');
        }
      },
    );
  }

  String _generateSecureKey() {
    final random = Random.secure();
    final values = List<int>.generate(32, (i) => random.nextInt(256));
    return base64Url.encode(values);
  }

  /// Inserts data into the specified table.
  /// 
  /// This method adds a new record to the table. If a record with the same
  /// primary key already exists, the operation will be aborted.
  /// 
  /// Parameters:
  /// - [table]: The name of the table to insert into
  /// - [data]: The data to insert as a key-value map
  /// 
  /// Throws: A database exception if the insert fails
  Future<void> insert(String table, Map<String, dynamic> data) async {
    final db = await database;
    await db.insert(
      table,
      data,
      conflictAlgorithm: ConflictAlgorithm.abort,
    );
  }

  /// Queries all records from the specified table.
  /// 
  /// This method retrieves all records from the table, ordered by timestamp
  /// in descending order (most recent first).
  /// 
  /// Parameters:
  /// - [table]: The name of the table to query
  /// 
  /// Returns: A list of all records in the table, ordered by timestamp DESC
  /// 
  /// Throws: A database exception if the query fails
  Future<List<Map<String, dynamic>>> queryAll(String table) async {
    final db = await database;
    return await db.query(table, orderBy: 'timestamp DESC');
  }

  /// Deletes records from the specified table.
  /// 
  /// This method deletes records that match the specified where clause.
  /// If no where clause is provided, all records will be deleted.
  /// 
  /// Parameters:
  /// - [table]: The name of the table to delete from
  /// - [where]: Optional WHERE clause (without the 'WHERE' keyword)
  /// - [whereArgs]: Optional arguments to replace '?' placeholders in the where clause
  /// 
  /// Throws: A database exception if the delete fails
  Future<void> delete(String table, {String? where, List<dynamic>? whereArgs}) async {
    final db = await database;
    await db.delete(table, where: where, whereArgs: whereArgs);
  }

  /// Executes a database operation within a transaction with automatic rollback on failure.
  /// 
  /// This method provides transaction support with rollback capability. If the operation
  /// throws an exception, the transaction is automatically rolled back and the error is
  /// re-thrown.
  /// 
  /// Parameters:
  /// - [operation]: A function that performs the database operations within the transaction
  /// 
  /// Returns: The result of the operation
  /// 
  /// Throws: The original exception if the operation fails
  Future<T> withTransaction<T>(Future<T> Function(Transaction txn) operation) async {
    final db = await database;
    return await db.transaction((txn) async {
      try {
        return await operation(txn);
      } catch (e) {
        debugPrint('[APEX] Transaction failed, rolling back: $e');
        rethrow;
      }
    });
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
  Future<List<Map<String, dynamic>>> backupTable(String table) async {
    try {
      final db = await database;
      final data = await db.query(table);
      debugPrint('[APEX] Backed up ${data.length} rows from table "$table"');
      return data;
    } catch (e) {
      debugPrint('[APEX] Backup failed for table "$table": $e');
      rethrow;
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
  Future<void> restoreTable(String table, List<Map<String, dynamic>> backupData) async {
    try {
      await withTransaction((txn) async {
        // Clear existing data
        await txn.delete(table);
        
        // Restore backup data
        for (final row in backupData) {
          await txn.insert(table, row, conflictAlgorithm: ConflictAlgorithm.replace);
        }
      });
      debugPrint('[APEX] Restored ${backupData.length} rows to table "$table"');
    } catch (e) {
      debugPrint('[APEX] Restore failed for table "$table": $e');
      rethrow;
    }
  }

  // TODO: [APEX] Add unit tests for transaction rollback scenarios
  // TODO: [APEX] Implement incremental backup for large tables
}

final encryptedDatabaseHelperProvider = Provider((ref) => EncryptedDatabaseHelper());
