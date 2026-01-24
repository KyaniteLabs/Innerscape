/// Consistent exception handling for the SOMA application.
///
/// Provides a unified exception hierarchy for all error types,
/// enabling proper error handling, logging, and user feedback.
///
/// Usage:
/// ```dart
/// try {
///   await database.insert(checkIn);
/// } on DatabaseException catch (e) {
///   // Handle database errors
///   debugPrint('[APEX] Database error: ${e.message}');
/// } on ValidationException catch (e) {
///   // Handle validation errors
///   showErrorToast(e.message);
/// }
/// ```

/// Base exception class for all application errors.
///
/// Provides consistent error information including message,
/// error code, original error, and stack trace for debugging.
class AppException implements Exception {
  /// Human-readable error message for display or logging.
  final String message;

  /// Optional error code for programmatic error handling.
  final String? code;

  /// The original error that caused this exception.
  final dynamic originalError;

  /// Stack trace at the point where the exception was created.
  final StackTrace? stackTrace;

  AppException({
    required this.message,
    this.code,
    this.originalError,
    this.stackTrace,
  });

  @override
  String toString() =>
      'AppException: $message${code != null ? ' ($code)' : ''}';
}

/// Exception thrown when database operations fail.
///
/// Covers SQLite errors, encryption errors, and database connection issues.
class DatabaseException extends AppException {
  DatabaseException({
    required String message,
    String? code,
    dynamic originalError,
    StackTrace? stackTrace,
  }) : super(
          message: message,
          code: code ?? 'DB_ERROR',
          originalError: originalError,
          stackTrace: stackTrace,
        );

  /// Creates a DatabaseException from a raw database error.
  factory DatabaseException.fromError(dynamic error, StackTrace stackTrace) {
    return DatabaseException(
      message: 'Database operation failed: $error',
      originalError: error,
      stackTrace: stackTrace,
    );
  }
}

/// Exception thrown when input validation fails.
///
/// Used for validating user input, API parameters, and data integrity.
class ValidationException extends AppException {
  ValidationException({
    required String message,
    String? code,
    dynamic originalError,
    StackTrace? stackTrace,
  }) : super(
          message: message,
          code: code ?? 'VALIDATION_ERROR',
          originalError: originalError,
          stackTrace: stackTrace,
        );

  /// Creates a ValidationException for a required field.
  factory ValidationException.required(String fieldName) {
    return ValidationException(
      message: '$fieldName is required',
      code: 'REQUIRED_FIELD',
    );
  }

  /// Creates a ValidationException for an invalid value.
  factory ValidationException.invalidValue(
    String fieldName,
    String expected,
  ) {
    return ValidationException(
      message: '$fieldName must be $expected',
      code: 'INVALID_VALUE',
    );
  }
}

/// Exception thrown when database migration fails.
///
/// Covers schema changes, version upgrades, and data migration errors.
class MigrationException extends AppException {
  MigrationException({
    required String message,
    String? code,
    dynamic originalError,
    StackTrace? stackTrace,
  }) : super(
          message: message,
          code: code ?? 'MIGRATION_ERROR',
          originalError: originalError,
          stackTrace: stackTrace,
        );

  /// Creates a MigrationException for a failed schema upgrade.
  factory MigrationException.schemaUpgradeFailed(
    int fromVersion,
    int toVersion,
    dynamic error,
    StackTrace stackTrace,
  ) {
    return MigrationException(
      message: 'Failed to upgrade schema from $fromVersion to $toVersion',
      originalError: error,
      stackTrace: stackTrace,
    );
  }
}

/// Exception thrown when file operations fail.
///
/// Covers export errors, import errors, and file system issues.
class FileException extends AppException {
  FileException({
    required String message,
    String? code,
    dynamic originalError,
    StackTrace? stackTrace,
  }) : super(
          message: message,
          code: code ?? 'FILE_ERROR',
          originalError: originalError,
          stackTrace: stackTrace,
        );
}

/// Exception thrown when network operations fail.
///
/// Covers API errors, connection issues, and timeout errors.
class NetworkException extends AppException {
  NetworkException({
    required String message,
    String? code,
    dynamic originalError,
    StackTrace? stackTrace,
  }) : super(
          message: message,
          code: code ?? 'NETWORK_ERROR',
          originalError: originalError,
          stackTrace: stackTrace,
        );
}

/// Exception thrown when an operation times out.
class TimeoutException extends AppException {
  TimeoutException({
    required String message,
    String? code,
    dynamic originalError,
    StackTrace? stackTrace,
  }) : super(
          message: message,
          code: code ?? 'TIMEOUT',
          originalError: originalError,
          stackTrace: stackTrace,
        );
}
