import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../data/encrypted_database_helper.dart';
import '../core/structured_logger.dart';
import '../core/input_validator.dart';

class DataMigrationService {
  final EncryptedDatabaseHelper _newDb;
  static const String _currentVersion = '1.0.0';
  static const String _backupKey = 'migration_backup_$_currentVersion';
  static const String _completeKey = 'migration_v1_complete';

  DataMigrationService(this._newDb);

  /// Migrates data from SharedPreferences to encrypted database.
  /// 
  /// This method handles the one-time migration from the old SharedPreferences-based
  /// storage to the new encrypted SQLite database. It migrates both check-ins
  /// and reflections, handling missing fields and corrupt data gracefully.
  /// 
  /// The migration is idempotent - it will only run once, as determined
  /// by the 'migration_v1_complete' flag in SharedPreferences.
  ///
  /// Inputs: None
  /// Outputs: `Future<void>`
  /// Errors: MigrationException if migration fails
  /// Edge cases: Empty data, corrupt entries, concurrent migrations
  /// 
  /// Note: After successful migration, old data can optionally be cleared
  /// to save storage space (currently commented out for safety).
  Future<void> migrateFromSharedPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    
    // Check if migration already happened
    if (prefs.getBool(_completeKey) == true) return;

    try {
      // Create backup before migration
      await _createBackup(prefs);

      final checkInsJson = prefs.getStringList('check_ins');
      final reflectionsJson = prefs.getStringList('reflections');

      if (checkInsJson == null && reflectionsJson == null) {
        await prefs.setBool(_completeKey, true);
        return;
      }

      // Migrate Check-ins
      if (checkInsJson != null) {
        for (final jsonStr in checkInsJson) {
          try {
            final data = json.decode(jsonStr) as Map<String, dynamic>;
            // Validate and sanitize data
            final id = data['id'] as String?;
            if (id != null) {
              InputValidator.validateUuid(id, fieldName: 'checkIn.id');
            }
            
            final intensity = data['intensity'] as int?;
            if (intensity != null) {
              InputValidator.validateInt(
                intensity,
                min: 1,
                max: 5,
                fieldName: 'checkIn.intensity',
              );
            }
            
            // Ensure structure matches new schema (some fields might be missing in very old versions)
            final mappedData = {
              'id': id ?? '',
              'timestamp': data['timestamp'] ?? DateTime.now().toIso8601String(),
              'regions': data['regions'] is List ? json.encode(data['regions']) : '[]',
              'sensations': data['sensations'] is List ? json.encode(data['sensations']) : '[]',
              'intensity': intensity ?? 3,
              'energy': data['energy'] ?? 'neutral',
              'valence': data['valence'] ?? 'neutral',
              'context': data['context'],
              'freeText': data['freeText'],
            };
            await _newDb.insert('check_ins', mappedData);
          } on ValidationException catch (e) {
            StructuredLogger.warn(
              'Skipping invalid check-in entry during migration',
              context: {
                'error': e.toString(),
              },
            );
          } on FormatException catch (e) {
            StructuredLogger.warn(
              'Skipping malformed check-in entry during migration',
              context: {
                'error': e.toString(),
              },
            );
          } catch (e) {
            // Rethrow unexpected errors to trigger rollback
            rethrow;
          }
        }
      }

      // Migrate Reflections
      if (reflectionsJson != null) {
        for (final jsonStr in reflectionsJson) {
          try {
            final data = json.decode(jsonStr) as Map<String, dynamic>;
            // Validate checkInId if present
            final checkInId = data['check_in_id'] as String?;
            if (checkInId != null) {
              InputValidator.validateUuid(checkInId, fieldName: 'reflection.checkInId');
            }
            await _newDb.insert('reflections', data);
          } on ValidationException catch (e) {
            StructuredLogger.warn(
              'Skipping invalid reflection entry during migration',
              context: {
                'error': e.toString(),
              },
            );
          } on FormatException catch (e) {
            StructuredLogger.warn(
              'Skipping malformed reflection entry during migration',
              context: {
                'error': e.toString(),
              },
            );
          } catch (e) {
            // Rethrow unexpected errors to trigger rollback
            rethrow;
          }
        }
      }

      // Mark as successful
      await prefs.setBool(_completeKey, true);
      
      StructuredLogger.info(
        'Migration completed successfully',
        context: {
          'version': _currentVersion,
        },
      );
      
    } catch (e) {
      StructuredLogger.error(
        'Migration failed',
        error: e,
        context: {
          'version': _currentVersion,
        },
      );
      // Rollback to backup
      await _rollbackMigration(prefs);
      rethrow;
    }
  }

  /// Creates backup of current data before migration.
  Future<void> _createBackup(SharedPreferences prefs) async {
    final checkIns = prefs.getStringList('check_ins');
    final reflections = prefs.getStringList('reflections');
    
    final backup = {
      'check_ins': checkIns,
      'reflections': reflections,
    };
    
    await prefs.setString(_backupKey, jsonEncode(backup));
    
    StructuredLogger.debug(
      'Migration backup created',
      context: {
        'version': _currentVersion,
      },
    );
  }

  /// Rolls back migration by restoring from backup.
  Future<void> _rollbackMigration(SharedPreferences prefs) async {
    final backup = prefs.getString(_backupKey);
    if (backup != null) {
      try {
        final data = jsonDecode(backup) as Map<String, dynamic>;
        
        if (data['check_ins'] != null) {
          await prefs.setStringList('check_ins', List<String>.from(data['check_ins']));
        }
        
        if (data['reflections'] != null) {
          await prefs.setStringList('reflections', List<String>.from(data['reflections']));
        }
        
        // Clear migration complete flag
        await prefs.remove(_completeKey);
        
        StructuredLogger.info(
          'Migration rolled back successfully',
          context: {
            'version': _currentVersion,
          },
        );
      } catch (e) {
        StructuredLogger.error(
          'Failed to rollback migration',
          error: e,
        );
      }
    }
  }

  /// Checks if migration has been completed.
  Future<bool> isMigrationComplete() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_completeKey) == true;
  }

  /// Clears the backup after successful migration.
  Future<void> clearBackup() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_backupKey);
    
    StructuredLogger.debug(
      'Migration backup cleared',
      context: {
        'version': _currentVersion,
      },
    );
  }

  // TODO: [APEX] Implement incremental migration for large datasets
  // TODO: [APEX] Add migration progress reporting to UI
  // TODO: [APEX] Support multiple migration versions with version tracking
}
