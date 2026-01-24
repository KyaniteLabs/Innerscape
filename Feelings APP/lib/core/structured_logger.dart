import 'dart:convert';
import 'package:flutter/foundation.dart';

/// Structured logger that outputs JSON-formatted log entries.
/// 
/// This logger follows APEX_SDLC.md §7 Monitoring requirements for
/// structured logging with consistent format including timestamp,
/// level, message, correlation ID, and context.
class StructuredLogger {
  static String? _correlationId;

  /// Sets a correlation ID for the current operation/session.
  /// This ID will be included in all subsequent log entries.
  static void setCorrelationId(String id) {
    _correlationId = id;
  }

  /// Clears the current correlation ID.
  static void clearCorrelationId() {
    _correlationId = null;
  }

  /// Logs a debug-level message.
  static void debug(
    String message, {
    String? correlationId,
    Map<String, dynamic>? context,
  }) {
    _log(
      level: 'debug',
      message: message,
      correlationId: correlationId,
      context: context,
    );
  }

  /// Logs an info-level message.
  static void info(
    String message, {
    String? correlationId,
    Map<String, dynamic>? context,
  }) {
    _log(
      level: 'info',
      message: message,
      correlationId: correlationId,
      context: context,
    );
  }

  /// Logs a warning-level message.
  static void warn(
    String message, {
    String? correlationId,
    Map<String, dynamic>? context,
  }) {
    _log(
      level: 'warn',
      message: message,
      correlationId: correlationId,
      context: context,
    );
  }

  /// Logs an error-level message.
  static void error(
    String message, {
    String? correlationId,
    Map<String, dynamic>? context,
    Object? error,
    StackTrace? stackTrace,
  }) {
    final errorContext = <String, dynamic>{
      if (context != null) ...context,
      if (error != null) 'error': error.toString(),
      if (stackTrace != null) 'stackTrace': stackTrace.toString(),
    };

    _log(
      level: 'error',
      message: message,
      correlationId: correlationId,
      context: errorContext,
    );
  }

  /// Internal method to format and output log entry.
  static void _log({
    required String level,
    required String message,
    String? correlationId,
    Map<String, dynamic>? context,
  }) {
    final logEntry = {
      'timestamp': DateTime.now().toIso8601String(),
      'level': level,
      'message': message,
      if (correlationId != null || _correlationId != null)
        'correlation_id': correlationId ?? _correlationId,
      if (context != null && context.isNotEmpty) 'context': context,
    };

    debugPrint('[APEX] ${jsonEncode(logEntry)}');
  }

  /// Logs the start of an operation with a unique correlation ID.
  /// Returns the correlation ID for tracking the operation.
  static String startOperation(
    String operationName, {
    Map<String, dynamic>? context,
  }) {
    final id = _generateCorrelationId();
    setCorrelationId(id);

    info(
      'Operation started: $operationName',
      context: {
        'operation': operationName,
        if (context != null) ...context,
      },
    );

    return id;
  }

  /// Logs the successful completion of an operation.
  static void completeOperation(
    String operationName, {
    Map<String, dynamic>? context,
  }) {
    info(
      'Operation completed: $operationName',
      context: {
        'operation': operationName,
        if (context != null) ...context,
      },
    );

    clearCorrelationId();
  }

  /// Logs a failed operation.
  static void failOperation(
    String operationName,
    Object errorObject, {
    StackTrace? stackTrace,
    Map<String, dynamic>? context,
  }) {
    StructuredLogger.error(
      'Operation failed: $operationName',
      error: errorObject,
      stackTrace: stackTrace,
      context: {
        'operation': operationName,
        if (context != null) ...context,
      },
    );

    clearCorrelationId();
  }

  /// Generates a unique correlation ID.
  static String _generateCorrelationId() {
    return '${DateTime.now().millisecondsSinceEpoch}-${_randomString(8)}';
  }

  /// Generates a random string of specified length.
  static String _randomString(int length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    final random = DateTime.now().millisecondsSinceEpoch;
    final buffer = StringBuffer();
    for (var i = 0; i < length; i++) {
      buffer.write(chars[(random + i) % chars.length]);
    }
    return buffer.toString();
  }
}
