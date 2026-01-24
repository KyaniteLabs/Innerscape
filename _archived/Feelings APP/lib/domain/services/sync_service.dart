// lib/domain/services/sync_service.dart
import 'package:powersync/powersync.dart';

/**
 * APEX Contract: Soma Sync Service
 * Purpose: Local-first SQLite sync with Turso cloud via PowerSync
 */

class SyncService {
  late PowerSyncDatabase db;

  Future<void> initialize(String userId) async {
    print('[APEX] Initializing PowerSync for user $userId');
    
    // Schema matches lifeos-backend/src/db/schema.ts
    final schema = Schema([
      Table('emotional_context', [
        Column.text('id'),
        Column.text('user_id'),
        Column.integer('energy'),
        Column.integer('valence'),
        Column.text('dominant_feeling'),
        Column.text('body_sensation'),
        Column.integer('timestamp'),
      ]),
    ]);

    db = PowerSyncDatabase(schema: schema, path: 'innerscape_soma.db');
    await db.initialize();
    
    // Connection credentials would be provided by backend/clerk
    /*
    await db.connect(
      connector: PowerSyncConnector(
        endpoint: 'https://innerscape.powersync.com',
        userId: userId,
      ),
    );
    */
  }

  Future<void> saveCheckIn({
    required int energy,
    required int valence,
    required String dominantFeeling,
    String? bodySensation,
  }) async {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final id = 'checkin_${timestamp}';

    await db.execute(
      '''INSERT INTO emotional_context (id, user_id, energy, valence, dominant_feeling, body_sensation, timestamp) 
         VALUES (?, ?, ?, ?, ?, ?, ?)''',
      [id, 'test-user-123', energy, valence, dominantFeeling, bodySensation, timestamp],
    );
    
    print('[APEX] Check-in saved locally and queued for sync');
  }
}
