# SOMA API Documentation

## Public Services

### LogService

#### saveCheckIn
Saves a check-in record to the encrypted database.

**Parameters**:
- `regions` (List<BodyRegion>): List of body regions where sensations were felt
- `sensations` (Set<SensationToken>): Set of sensation tokens describing the experience
- `energy` (EnergyLevel): Energy level of the experience (high or low)
- `valence` (Valence): Emotional valence of the experience (pleasant, unpleasant, or neutral)
- `source` (String?): Source of the sensation (optional)
- `context` (ContextCategory?): Context category of the experience (social, sensory, task, or unknown)
- `intensity` (int?): Intensity rating (1-5, defaults to 3)
- `freeText` (String?): Optional free text notes from the user (max 1000 characters)

**Returns**: `Future<String>` - The unique ID of the created check-in

**Throws**:
- `ValidationException` if parameters are invalid
- `TimeoutException` if database operation takes longer than default timeout

**Example**:
```dart
final logService = ref.read(logServiceProvider);

final id = await logService.saveCheckIn(
  regions: [BodyRegion.chestHeart, BodyRegion.bellyGut],
  sensations: {
    SensationToken(label: 'tension', category: 'pressure'),
    SensationToken(label: 'heat', category: 'temperature'),
  },
  energy: EnergyLevel.low,
  valence: Valence.unpleasant,
  intensity: 3,
  freeText: 'Feeling anxious about upcoming meeting',
);

print('Check-in saved with ID: $id');
```

#### saveReflection
Saves a reflection to the database, linked to a previous check-in.

**Parameters**:
- `checkInId` (String): The ID of the check-in this reflection is associated with
- `helped` (HelpfulnessRating): Rating of how helpful the session was (helped, didntHelp, notSure)
- `postEnergy` (EnergyLevel?): Optional energy level after the session
- `postValence` (Valence?): Optional valence after the session

**Returns**: `Future<void>`

**Throws**:
- `ValidationException` if parameters are invalid
- `TimeoutException` if database operation takes longer than default timeout

**Example**:
```dart
await logService.saveReflection(
  checkInId: 'abc-123-def-456',
  helped: HelpfulnessRating.helped,
  postEnergy: EnergyLevel.high,
  postValence: Valence.neutral,
);
```

#### getHistory
Retrieves all check-in history from the database.

**Parameters**: None

**Returns**: `Future<List<Map<String, dynamic>>>` - List of check-in records, ordered by timestamp (most recent first)

**Throws**:
- `TimeoutException` if database operation takes longer than default timeout

**Example**:
```dart
final history = await logService.getHistory();

for (final entry in history) {
  print('Check-in at ${entry['timestamp']}: ${entry['sensations']}');
}
```

---

### ExportService

#### exportToPdf
Exports check-in history to PDF format.

**Parameters**:
- `history` (List<Map<String, dynamic>>): Check-in records to export

**Returns**: `Future<Uint8List>` - PDF bytes

**Throws**:
- `ExportException` if export fails

**Example**:
```dart
final exportService = ref.read(exportServiceProvider);
final history = await logService.getHistory();

final pdfBytes = await exportService.exportToPdf(history);

// Save to device
// (Implementation depends on platform-specific file saving)
```

---

### DataMigrationService

#### migrateFromSharedPreferences
Migrates data from SharedPreferences to encrypted database.

**Parameters**: None

**Returns**: `Future<void>`

**Throws**: None (handles errors gracefully by logging warnings)

**Behavior**:
- Idempotent: Only runs once (checks 'migration_v1_complete' flag)
- Handles corrupt data by logging warnings and skipping invalid entries
- Validates data before migration
- Creates backup before migration (if implemented)

**Example**:
```dart
final migrationService = DataMigrationService(encryptedDatabaseHelper);
await migrationService.migrateFromSharedPreferences();
```

---

### MonitoringService

#### incrementCounter
Increments a counter metric.

**Parameters**:
- `name` (String): The name of counter to increment
- `tags` (Map<String, String>?): Optional key-value pairs for additional context

**Returns**: `void`

**Example**:
```dart
MonitoringService.incrementCounter('check_ins_completed');
MonitoringService.incrementCounter('errors', tags: {'type': 'database'});
```

#### recordDuration
Records a duration metric.

**Parameters**:
- `name` (String): The name of duration metric
- `duration` (Duration): The duration to record
- `tags` (Map<String, String>?): Optional key-value pairs for additional context

**Returns**: `void`

**Example**:
```dart
final stopwatch = Stopwatch()..start();
// ... perform operation ...
stopwatch.stop();

MonitoringService.recordDuration('database_query', stopwatch.elapsed);
```

#### startTimer
Starts timing an operation.

**Parameters**:
- `name` (String): The name of timer

**Returns**: `String` - A unique timer ID

**Example**:
```dart
final timerId = MonitoringService.startTimer('check_in_save');
// ... perform operation ...
MonitoringService.stopTimer(timerId, 'check_in_save');
```

#### stopTimer
Stops a timer and records duration.

**Parameters**:
- `timerId` (String): The timer ID returned by `startTimer`
- `name` (String): The name of duration metric
- `tags` (Map<String, String>?): Optional key-value pairs for additional context

**Returns**: `void`

**Example**:
```dart
final timerId = MonitoringService.startTimer('operation_name');
try {
  // ... perform operation ...
} finally {
  MonitoringService.stopTimer(timerId, 'operation_name');
}
```

#### recordError
Records an error occurrence.

**Parameters**:
- `error` (Object): The error that occurred
- `stackTrace` (StackTrace?): Optional stack trace
- `tags` (Map<String, String>?): Optional key-value pairs for additional context

**Returns**: `void`

**Example**:
```dart
try {
  // ... operation that might fail ...
} catch (e, stackTrace) {
  MonitoringService.recordError(e, stackTrace, tags: {'operation': 'save_check_in'});
}
```

#### getCounter
Gets current value of a counter.

**Parameters**:
- `name` (String): The name of counter

**Returns**: `int` - The current counter value, or 0 if not found

**Example**:
```dart
final errorCount = MonitoringService.getCounter('errors');
print('Total errors: $errorCount');
```

#### getDurationStats
Gets statistics for a duration metric.

**Parameters**:
- `name` (String): The name of duration metric

**Returns**: `Map<String, int>?` - A map with min, max, avg, and count statistics, or null if not found

**Example**:
```dart
final stats = MonitoringService.getDurationStats('database_query');
if (stats != null) {
  print('Average query time: ${stats['avg']}ms');
  print('Max query time: ${stats['max']}ms');
}
```

#### logSummary
Logs a summary of all metrics.

**Parameters**: None

**Returns**: `void`

**Example**:
```dart
// Call periodically to output metrics
MonitoringService.logSummary();
```

---

### InputValidator

#### validateString
Validates a string value.

**Parameters**:
- `value` (String): The string to validate
- `minLength` (int?): Minimum allowed length (optional)
- `maxLength` (int?): Maximum allowed length (optional)
- `fieldName` (String?): Name of the field being validated (for error messages)

**Returns**: `String` - The validated string

**Throws**: `ValidationException` if validation fails

**Example**:
```dart
final validated = InputValidator.validateString(
  'Hello, world!',
  minLength: 5,
  maxLength: 100,
  fieldName: 'message',
);
```

#### validateInt
Validates an integer value.

**Parameters**:
- `value` (int): The integer to validate
- `min` (int?): Minimum allowed value (optional)
- `max` (int?): Maximum allowed value (optional)
- `fieldName` (String?): Name of the field being validated (for error messages)

**Returns**: `int` - The validated integer

**Throws**: `ValidationException` if validation fails

**Example**:
```dart
final intensity = InputValidator.validateInt(
  3,
  min: 1,
  max: 5,
  fieldName: 'intensity',
);
```

#### validateList
Validates a list is not empty.

**Parameters**:
- `list` (List<T>?): The list to validate
- `allowEmpty` (bool): Whether to allow empty lists (default: false)
- `fieldName` (String?): Name of the field being validated (for error messages)

**Returns**: `List<T>` - The validated list

**Throws**: `ValidationException` if validation fails

**Example**:
```dart
final regions = InputValidator.validateList(
  [BodyRegion.chestHeart],
  fieldName: 'regions',
);
```

#### validateSet
Validates a set is not empty.

**Parameters**:
- `set` (Set<T>?): The set to validate
- `allowEmpty` (bool): Whether to allow empty sets (default: false)
- `fieldName` (String?): Name of the field being validated (for error messages)

**Returns**: `Set<T>` - The validated set

**Throws**: `ValidationException` if validation fails

**Example**:
```dart
final sensations = InputValidator.validateSet(
  {SensationToken(label: 'tension', category: 'pressure')},
  fieldName: 'sensations',
);
```

#### validateUuid
Validates a UUID string format.

**Parameters**:
- `uuid` (String): The UUID string to validate
- `fieldName` (String?): Name of the field being validated (for error messages)

**Returns**: `String` - The validated UUID string

**Throws**: `ValidationException` if validation fails

**Example**:
```dart
InputValidator.validateUuid('abc-123-def-456', fieldName: 'checkInId');
```

#### validateEnum
Validates an enum value is one of the allowed values.

**Parameters**:
- `value` (T): The enum value to validate
- `allowedValues` (List<T>): List of allowed enum values
- `fieldName` (String?): Name of the field being validated (for error messages)

**Returns**: `T` - The validated enum value

**Throws**: `ValidationException` if validation fails

**Example**:
```dart
final energy = InputValidator.validateEnum(
  EnergyLevel.low,
  EnergyLevel.values,
  fieldName: 'energy',
);
```

---

### StructuredLogger

#### debug
Logs a debug-level message.

**Parameters**:
- `message` (String): The message to log
- `correlationId` (String?): Optional correlation ID for tracking
- `context` (Map<String, dynamic>?): Optional additional context

**Returns**: `void`

**Example**:
```dart
StructuredLogger.debug(
  'User tapped submit button',
  context: {'screen': 'BodyScanScreen'},
);
```

#### info
Logs an info-level message.

**Parameters**:
- `message` (String): The message to log
- `correlationId` (String?): Optional correlation ID for tracking
- `context` (Map<String, dynamic>?): Optional additional context

**Returns**: `void`

**Example**:
```dart
StructuredLogger.info(
  'Check-in saved successfully',
  context: {'checkInId': 'abc-123'},
);
```

#### warn
Logs a warning-level message.

**Parameters**:
- `message` (String): The message to log
- `correlationId` (String?): Optional correlation ID for tracking
- `context` (Map<String, dynamic>?): Optional additional context

**Returns**: `void`

**Example**:
```dart
StructuredLogger.warn(
  'Migration encountered corrupt entry',
  context: {'entry': jsonStr},
);
```

#### error
Logs an error-level message.

**Parameters**:
- `message` (String): The message to log
- `correlationId` (String?): Optional correlation ID for tracking
- `context` (Map<String, dynamic>?): Optional additional context
- `error` (Object?): The error that occurred
- `stackTrace` (StackTrace?): Optional stack trace

**Returns**: `void`

**Example**:
```dart
try {
  // ... operation ...
} catch (e, stackTrace) {
  StructuredLogger.error(
    'Failed to save check-in',
    error: e,
    stackTrace: stackTrace,
  );
}
```

#### startOperation
Logs the start of an operation with a unique correlation ID.

**Parameters**:
- `operationName` (String): Name of the operation
- `context` (Map<String, dynamic>?): Optional additional context

**Returns**: `String` - The correlation ID for tracking the operation

**Example**:
```dart
final correlationId = StructuredLogger.startOperation('save_check_in');
try {
  // ... perform operation ...
  StructuredLogger.completeOperation('save_check_in');
} catch (e) {
  StructuredLogger.failOperation('save_check_in', e);
}
```

#### completeOperation
Logs the successful completion of an operation.

**Parameters**:
- `operationName` (String): Name of the operation
- `context` (Map<String, dynamic>?): Optional additional context

**Returns**: `void`

**Example**:
```dart
StructuredLogger.completeOperation('save_check_in');
```

#### failOperation
Logs a failed operation.

**Parameters**:
- `operationName` (String): Name of the operation
- `error` (Object): The error that occurred
- `stackTrace` (StackTrace?): Optional stack trace
- `context` (Map<String, dynamic>?): Optional additional context

**Returns**: `void`

**Example**:
```dart
StructuredLogger.failOperation('save_check_in', e, stackTrace);
```

---

## Data Models

### CheckIn
Represents a completed check-in session.

**Properties**:
- `id` (String): Unique identifier
- `timestamp` (DateTime): When the check-in was created
- `regions` (List<BodyRegion>): Body regions where sensations were felt
- `sensations` (List<SensationToken>): Sensation tokens describing the experience
- `intensity` (int): Intensity rating (1-5)
- `energy` (EnergyLevel): Energy level (high or low)
- `valence` (Valence): Emotional valence (pleasant, unpleasant, or neutral)
- `context` (ContextCategory?): Context category (social, sensory, task, or unknown)
- `freeText` (String?): Optional free text notes

### Reflection
Represents a user's reflection on a check-in session.

**Properties**:
- `checkInId` (String): ID of the associated check-in
- `helped` (HelpfulnessRating): How helpful the session was
- `postEnergy` (EnergyLevel?): Energy level after the session
- `postValence` (Valence?): Valence after the session
- `timestamp` (DateTime): When the reflection was created

### SensationToken
Represents a sensation with its category.

**Properties**:
- `label` (String): The sensation label (e.g., "tension", "heat")
- `category` (String): The sensation category (e.g., "pressure", "temperature")

## Enums

### EnergyLevel
- `high`: High energy state
- `low`: Low energy state

### Valence
- `pleasant`: Positive emotional state
- `unpleasant`: Negative emotional state
- `neutral`: Neutral emotional state

### ContextCategory
- `social`: Social context
- `sensory`: Sensory context
- `task`: Task context
- `unknown`: Unknown context

### BodyRegion
- `headFace`: Head and face
- `neckThroat`: Neck and throat
- `shouldersArms`: Shoulders and arms
- `chestHeart`: Chest and heart
- `bellyGut`: Belly and gut
- `back`: Back
- `hipsGroin`: Hips and groin
- `legsFeet`: Legs and feet

### HelpfulnessRating
- `helped`: Session was helpful
- `didntHelp`: Session was not helpful
- `notSure`: Not sure if session was helpful

## Error Handling

All services throw typed exceptions for error handling:

### ValidationException
Thrown when input validation fails.

**Properties**:
- `message` (String): Error message
- `field` (String?): Name of the field that failed validation

### TimeoutException
Thrown when a database operation exceeds the timeout duration.

### ExportException
Thrown when PDF export fails.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial API documentation |
