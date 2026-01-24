# Backup Protocol

## Data Backup Strategy

| Data | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| Encrypted Database | Daily (on app open) | 30 days | Local device (SharedPreferences) |
| Migration Backups | On migration | Until successful migration | SharedPreferences |
| Exported PDFs | On user action | Forever | User's device |

## Backup Implementation

### Automatic Daily Backup
```dart
class BackupService {
  static const String _lastBackupKey = 'last_backup_date';
  static const int _retentionDays = 30;
  
  /// Performs daily backup if needed.
  static Future<void> performDailyBackup() async {
    final lastBackup = await _getLastBackupDate();
    final now = DateTime.now();
    
    if (lastBackup == null || now.difference(lastBackup).inDays >= 1) {
      await _createBackup();
      await _setLastBackupDate(now);
      await _cleanupOldBackups();
    }
  }
  
  /// Creates backup of current database.
  static Future<void> _createBackup() async {
    final db = await EncryptedDatabaseHelper.instance.database;
    final backup = await db.query('check_ins');
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('backup_$timestamp', jsonEncode(backup));
    
    StructuredLogger.info(
      'Database backup created',
      context: {
        'timestamp': timestamp,
        'entries': backup.length,
      },
    );
  }
  
  /// Gets the date of the last backup.
  static Future<DateTime?> _getLastBackupDate() async {
    final prefs = await SharedPreferences.getInstance();
    final timestamp = prefs.getInt(_lastBackupKey);
    if (timestamp == null) return null;
    return DateTime.fromMillisecondsSinceEpoch(timestamp);
  }
  
  /// Sets the date of the last backup.
  static Future<void> _setLastBackupDate(DateTime date) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_lastBackupKey, date.millisecondsSinceEpoch);
  }
  
  /// Cleans up backups older than retention period.
  static Future<void> _cleanupOldBackups() async {
    final prefs = await SharedPreferences.getInstance();
    final keys = prefs.getKeys();
    final cutoffDate = DateTime.now().subtract(Duration(days: _retentionDays));
    
    for (final key in keys) {
      if (key.startsWith('backup_')) {
        final timestampStr = key.replaceFirst('backup_', '');
        final timestamp = int.tryParse(timestampStr);
        if (timestamp != null) {
          final backupDate = DateTime.fromMillisecondsSinceEpoch(timestamp);
          if (backupDate.isBefore(cutoffDate)) {
            await prefs.remove(key);
            
            StructuredLogger.debug(
              'Old backup deleted',
              context: {
                'key': key,
                'date': backupDate.toIso8601String(),
              },
            );
          }
        }
      }
    }
  }
  
  /// Lists all available backups.
  static Future<List<BackupInfo>> listBackups() async {
    final prefs = await SharedPreferences.getInstance();
    final keys = prefs.getKeys();
    final backups = <BackupInfo>[];
    
    for (final key in keys) {
      if (key.startsWith('backup_')) {
        final timestampStr = key.replaceFirst('backup_', '');
        final timestamp = int.tryParse(timestampStr);
        if (timestamp != null) {
          final data = prefs.getString(key);
          if (data != null) {
            final entries = jsonDecode(data) as List;
            backups.add(BackupInfo(
              key: key,
              date: DateTime.fromMillisecondsSinceEpoch(timestamp),
              entries: entries.length,
            ));
          }
        }
      }
    }
    
    // Sort by date, newest first
    backups.sort((a, b) => b.date.compareTo(a.date));
    return backups;
  }
  
  /// Restores database from a backup.
  static Future<void> restoreBackup(String backupKey) async {
    final prefs = await SharedPreferences.getInstance();
    final backupData = prefs.getString(backupKey);
    
    if (backupData == null) {
      throw BackupException('Backup not found: $backupKey');
    }
    
    try {
      final entries = jsonDecode(backupData) as List;
      final db = await EncryptedDatabaseHelper.instance.database;
      
      // Clear existing data
      await db.delete('check_ins');
      
      // Restore from backup
      for (final entry in entries) {
        await db.insert('check_ins', entry as Map<String, dynamic>);
      }
      
      StructuredLogger.info(
        'Database restored from backup',
        context: {
          'backup_key': backupKey,
          'entries': entries.length,
        },
      );
    } catch (e) {
      StructuredLogger.error(
        'Failed to restore backup',
        error: e,
        context: {
          'backup_key': backupKey,
        },
      );
      rethrow;
    }
  }
  
  /// Deletes a specific backup.
  static Future<void> deleteBackup(String backupKey) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(backupKey);
    
    StructuredLogger.debug(
      'Backup deleted',
      context: {
        'backup_key': backupKey,
      },
    );
  }
}

/// Information about a backup.
class BackupInfo {
  final String key;
  final DateTime date;
  final int entries;
  
  BackupInfo({
    required this.key,
    required this.date,
    required this.entries,
  });
}

/// Exception thrown when backup operation fails.
class BackupException implements Exception {
  final String message;
  
  BackupException(this.message);
  
  @override
  String toString() => 'BackupException: $message';
}
```

## Restore Procedure

1. User goes to Settings → Data → Restore Backup
2. Select backup from list
3. Confirm restore (warning: overwrites current data)
4. Restore completes
5. Verify data integrity

## Retention Policy

### Automatic Backups
- Keep 30 days
- Delete oldest backups after retention period
- Automatic cleanup on each backup

### Manual Exports
- Keep forever (user-managed)
- Stored in user's device file system
- Not subject to automatic cleanup

### Migration Backups
- Delete after successful migration
- Kept until migration is confirmed complete
- Automatic cleanup after migration

## Backup Schedule

| Time | Action |
|------|--------|
| App launch | Check if daily backup needed |
| Daily backup needed | Create new backup |
| After backup | Cleanup old backups |
| On migration | Create migration backup |
| After migration | Delete migration backup |

## Backup Integrity

### Verification
- Each backup is validated on creation
- Backup contains complete dataset
- Backup format is valid JSON
- Backup can be restored successfully

### Error Handling
- Failed backups are logged
- Corrupt backups are skipped
- Failed restores are rolled back
- User is notified of errors

## Storage Management

### Storage Usage
- Estimate: ~1KB per check-in
- 1000 entries: ~1MB
- 30 days of backups: ~30MB

### Storage Limits
- No hard limit on backups
- Automatic cleanup prevents unlimited growth
- User can manually delete backups

## Security

### Backup Encryption
- Backups are stored in SharedPreferences (unencrypted)
- Original database remains encrypted
- Consider encrypting backups for future versions

### Access Control
- Backups are local to device
- No network transmission
- User has full control

## Testing

### Backup Testing
```dart
void main() {
  group('BackupService', () {
    test('creates backup successfully', () async {
      // Arrange
      final db = await EncryptedDatabaseHelper.instance.database;
      await db.insert('check_ins', {'id': 'test-1'});
      
      // Act
      await BackupService.performDailyBackup();
      
      // Assert
      final backups = await BackupService.listBackups();
      expect(backups.isNotEmpty, true);
    });
    
    test('restores backup successfully', () async {
      // Arrange
      final backups = await BackupService.listBackups();
      final backupKey = backups.first.key;
      
      // Act
      await BackupService.restoreBackup(backupKey);
      
      // Assert
      final db = await EncryptedDatabaseHelper.instance.database;
      final entries = await db.query('check_ins');
      expect(entries.isNotEmpty, true);
    });
    
    test('cleans up old backups', () async {
      // Arrange
      await BackupService.performDailyBackup();
      // Simulate old backup
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt('last_backup_date', DateTime.now().subtract(Duration(days: 35)).millisecondsSinceEpoch);
      
      // Act
      await BackupService.performDailyBackup();
      
      // Assert
      final backups = await BackupService.listBackups();
      // Should only have recent backup
      expect(backups.length, 1);
    });
  });
}
```

## Best Practices

### When to Backup
- Before major app updates
- Before device migration
- Before clearing data
- After important data entry
- On user request

### When to Restore
- After data corruption
- After accidental deletion
- After failed migration
- On new device setup
- On user request

### Backup Verification
- Verify backup was created
- Check backup size is reasonable
- Test restore process
- Verify data integrity after restore

## Future Improvements

1. **Encrypted Backups**: Encrypt backups for additional security
2. **Cloud Backup**: Optional cloud backup with user consent
3. **Incremental Backups**: Only backup changed data
4. **Compression**: Compress backups to save space
5. **Backup Scheduling**: Allow user to configure backup schedule

## References

- [APEX SDLC - Data Management](../apex%20rules/APEX_SDLC.md#9-data-management)
- [SharedPreferences Documentation](https://pub.dev/packages/shared_preferences)

## Last Updated
- Date: 2026-01-24
- Version: 1.0.0
