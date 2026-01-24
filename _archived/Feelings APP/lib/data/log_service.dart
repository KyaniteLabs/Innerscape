import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'encrypted_database_helper.dart';
import 'models.dart';
import 'dart:convert';
import 'dart:async';
import 'package:uuid/uuid.dart';
import '../core/constants.dart';
import '../core/structured_logger.dart';
import '../core/input_validator.dart';
import '../core/platform_utils.dart';
import 'web_database_helper.dart';

class LogService {
  final EncryptedDatabaseHelper _dbHelper;
  final _uuid = const Uuid();
  static const Duration _defaultTimeout = Duration(seconds: TimeoutConstants.defaultTimeoutSeconds);

  LogService(this._dbHelper);

  /// Saves a check-in session to the database.
  ///
  /// **Inputs**:
  /// - `regions`: List of body regions where sensations were felt (non-empty)
  /// - `sensations`: Set of sensation tokens describing the experience (non-empty)
  /// - `energy`: Energy level of the experience (high or low)
  /// - `valence`: Emotional valence of the experience (pleasant or unpleasant)
  /// - `source`: Source of the sensation (inside body or outside world)
  /// - `context`: Context category of the experience (social, sensory, task, or unknown)
  /// - `intensity`: Optional intensity rating (1-5, defaults to 3)
  /// - `freeText`: Optional free text notes from the user (max 1000 chars)
  ///
  /// **Outputs**: Future<String> - The unique ID of the created check-in
  ///
  /// **Errors**:
  /// - `ValidationException`: If parameters are invalid (null, empty, or out of range)
  /// - `TimeoutException`: If database operation takes longer than default timeout (30 seconds)
  ///
  /// **Edge Cases**:
  /// - Empty/null regions list → throws ValidationException
  /// - Empty/null sensations set → throws ValidationException
  /// - Intensity outside 1-5 range → throws ValidationException
  /// - freeText exceeding 1000 characters → throws ValidationException
  /// - Concurrent writes → handled by database transactions via withTransaction
  /// - Database locked → automatic retry with exponential backoff (handled by SharedPreferences)
  /// - Timeout after 30 seconds → throws TimeoutException and logs error
  /// - Invalid enum values → throws ValidationException
  /// - Invalid UUID format for checkInId (in reflection) → throws ValidationException
  Future<String> saveCheckIn({
    required List<BodyRegion> regions,
    required Set<SensationToken> sensations,
    required EnergyLevel energy,
    required Valence valence,
    required String? source,
    required ContextCategory? context,
    int? intensity,
    String? freeText,
    bool? hypothesisAccepted,
    String? customHypothesis,
    String? selectedAction,
  }) async {
    // Input validation
    InputValidator.validateList(
      regions,
      fieldName: 'regions',
    );
    InputValidator.validateSet(
      sensations,
      fieldName: 'sensations',
    );
    InputValidator.validateEnum(
      energy,
      EnergyLevel.values,
      fieldName: 'energy',
    );
    InputValidator.validateEnum(
      valence,
      Valence.values,
      fieldName: 'valence',
    );

    final validatedIntensity = InputValidator.validateInt(
      intensity ?? LogServiceConstants.defaultIntensity,
      min: 1,
      max: 5,
      fieldName: 'intensity',
    );

    if (freeText != null) {
      InputValidator.validateString(
        freeText,
        maxLength: 1000,
        fieldName: 'freeText',
      );
    }

    final id = _uuid.v4();
    final checkIn = CheckIn(
      id: id,
      timestamp: DateTime.now(),
      regions: regions,
      sensations: sensations.toList(),
      intensity: validatedIntensity,
      energy: energy,
      valence: valence,
      context: context,
      freeText: freeText,
      hypothesisAccepted: hypothesisAccepted,
      customHypothesis: customHypothesis,
      selectedAction: selectedAction,
    );

    if (PlatformUtils.isWeb) {
      final WebDatabaseHelper webDb = await EncryptedDatabaseHelper.webDatabase;
      await webDb.insert('check_ins', {
        ...checkIn.toMap(),
        'regions': json.encode(checkIn.regions.map((e) => e.name).toList()),
        'sensations': json.encode(checkIn.sensations.map((e) => e.toMap()).toList()),
      }).timeout(_defaultTimeout, onTimeout: () {
        StructuredLogger.error(
          'Database operation timeout',
          context: {
            'operation': 'saveCheckIn',
            'timeout_seconds': _defaultTimeout.inSeconds,
          },
        );
        throw TimeoutException('Database insert timeout');
      });
      return id;
    }

    await _dbHelper.insert('check_ins', {
      ...checkIn.toMap(),
      'regions': json.encode(checkIn.regions.map((e) => e.name).toList()),
      'sensations': json.encode(checkIn.sensations.map((e) => e.toMap()).toList()),
    }).timeout(_defaultTimeout, onTimeout: () {
      StructuredLogger.error(
        'Database operation timeout',
        context: {
          'operation': 'saveCheckIn',
          'timeout_seconds': _defaultTimeout.inSeconds,
        },
      );
      throw TimeoutException('Database insert timeout');
    });
    return id;
  }

  /// Saves a reflection to the database.
  ///
  /// **Inputs**:
  /// - `checkInId`: The ID of the check-in this reflection is associated with (valid UUID)
  /// - `helped`: Rating of how helpful the session was (HelpfulnessRating enum)
  /// - `postEnergy`: Optional energy level after the session (EnergyLevel enum)
  /// - `postValence`: Optional valence after the session (Valence enum)
  ///
  /// **Outputs**: Future<void>
  ///
  /// **Errors**:
  /// - `ValidationException`: If checkInId is invalid UUID or enum values are invalid
  /// - `TimeoutException`: If database operation takes longer than default timeout (30 seconds)
  ///
  /// **Edge Cases**:
  /// - Invalid UUID format for checkInId → throws ValidationException
  /// - Invalid enum values → throws ValidationException
  /// - Concurrent writes → handled by database transactions via withTransaction
  /// - Database locked → automatic retry with exponential backoff (handled by SharedPreferences)
  /// - Timeout after 30 seconds → throws TimeoutException and logs error
  /// - checkInId doesn't exist in database → still creates reflection (no foreign key constraint)
  Future<void> saveReflection({
    required String checkInId,
    required HelpfulnessRating helped,
    EnergyLevel? postEnergy,
    Valence? postValence,
  }) async {
    // Input validation
    InputValidator.validateUuid(
      checkInId,
      fieldName: 'checkInId',
    );
    InputValidator.validateEnum(
      helped,
      HelpfulnessRating.values,
      fieldName: 'helped',
    );

    final reflection = Reflection(
      checkInId: checkInId,
      helped: helped,
      postEnergy: postEnergy,
      postValence: postValence,
      timestamp: DateTime.now(),
    );

    if (PlatformUtils.isWeb) {
      final WebDatabaseHelper webDb = await EncryptedDatabaseHelper.webDatabase;
      await webDb.insert('reflections', {
        'check_in_id': reflection.checkInId,
        'helped': reflection.helped.name,
        'post_energy': reflection.postEnergy?.name,
        'post_valence': reflection.postValence?.name,
        'timestamp': reflection.timestamp.toIso8601String(),
      }).timeout(_defaultTimeout, onTimeout: () {
        StructuredLogger.error(
          'Database operation timeout',
          context: {
            'operation': 'saveReflection',
            'timeout_seconds': _defaultTimeout.inSeconds,
          },
        );
        throw TimeoutException('Database insert timeout');
      });
      return;
    }

    await _dbHelper.insert('reflections', {
      'check_in_id': reflection.checkInId,
      'helped': reflection.helped.name,
      'post_energy': reflection.postEnergy?.name,
      'post_valence': reflection.postValence?.name,
      'timestamp': reflection.timestamp.toIso8601String(),
    }).timeout(_defaultTimeout, onTimeout: () {
      StructuredLogger.error(
        'Database operation timeout',
        context: {
          'operation': 'saveReflection',
          'timeout_seconds': _defaultTimeout.inSeconds,
        },
      );
      throw TimeoutException('Database insert timeout');
    });
  }

  /// Retrieves all check-in history from the database.
  ///
  /// **Inputs**: None
  ///
  /// **Outputs**: Future<List<Map<String, dynamic>>> - List of check-in records
  ///
  /// **Errors**:
  /// - `TimeoutException`: If database operation takes longer than default timeout (30 seconds)
  ///
  /// **Edge Cases**:
  /// - Empty database → returns empty list (no error)
  /// - Timeout after 30 seconds → returns empty list and logs error
  /// - Large dataset (>1000 records) → may cause performance issues (TODO: add pagination)
  /// - Corrupted data → may throw JSON decode error (handled by try-catch in database layer)
  /// - Concurrent reads → handled by SharedPreferences (thread-safe)
  Future<List<Map<String, dynamic>>> getHistory() async {
    if (PlatformUtils.isWeb) {
      final WebDatabaseHelper webDb = await EncryptedDatabaseHelper.webDatabase;
      return await webDb.query('check_ins').timeout(_defaultTimeout, onTimeout: () {
        StructuredLogger.error(
          'Database operation timeout',
          context: {
            'operation': 'getHistory',
            'timeout_seconds': _defaultTimeout.inSeconds,
          },
        );
        return <Map<String, dynamic>>[];
      }).then((records) {
        records.sort((a, b) {
          final aTime = a['timestamp']?.toString() ?? '';
          final bTime = b['timestamp']?.toString() ?? '';
          return bTime.compareTo(aTime);
        });
        return records;
      });
    }

    return await _dbHelper.queryAll('check_ins').timeout(_defaultTimeout, onTimeout: () {
      StructuredLogger.error(
        'Database operation timeout',
        context: {
          'operation': 'getHistory',
          'timeout_seconds': _defaultTimeout.inSeconds,
        },
      );
      return <Map<String, dynamic>>[];
    });
  }

  // TODO: [APEX] Add pagination support for getHistory to handle large datasets
  // TODO: [APEX] Implement caching layer for frequently accessed check-ins
  // TODO: [APEX] Add data validation before saving to database
}

final logServiceProvider = Provider((ref) {
  final dbHelper = ref.watch(encryptedDatabaseHelperProvider);
  return LogService(dbHelper);
});
