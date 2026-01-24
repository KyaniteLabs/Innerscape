import 'dart:async';
import '../core/structured_logger.dart';

/// Monitoring service for tracking application metrics and performance.
/// 
/// This service provides RED/USE metrics tracking for critical paths,
/// following APEX_SDLC.md §7 Monitoring requirements.
class MonitoringService {
  static final Map<String, int> _counters = {};
  static final Map<String, List<int>> _durations = {};
  static final Map<String, DateTime> _timestamps = {};

  /// Increments a counter metric.
  /// 
  /// Use this to track occurrences of events like:
  /// - Database operations
  /// - API calls
  /// - User actions
  /// - Error occurrences
  /// 
  /// Parameters:
  /// - [name]: The name of the counter to increment
  /// - [tags]: Optional key-value pairs for additional context
  static void incrementCounter(
    String name, {
    Map<String, String>? tags,
  }) {
    _counters[name] = (_counters[name] ?? 0) + 1;

    StructuredLogger.debug(
      'Counter incremented',
      context: {
        'metric': name,
        'value': _counters[name],
        if (tags != null) 'tags': tags,
      },
    );
  }

  /// Records a duration metric.
  /// 
  /// Use this to track operation durations like:
  /// - Database query time
  /// - API response time
  /// - Screen load time
  /// 
  /// Parameters:
  /// - [name]: The name of the duration metric
  /// - [duration]: The duration to record
  /// - [tags]: Optional key-value pairs for additional context
  static void recordDuration(
    String name,
    Duration duration, {
    Map<String, String>? tags,
  }) {
    final milliseconds = duration.inMilliseconds;
    _durations[name] ??= [];
    _durations[name]!.add(milliseconds);

    StructuredLogger.debug(
      'Duration recorded',
      context: {
        'metric': name,
        'duration_ms': milliseconds,
        if (tags != null) 'tags': tags,
      },
    );
  }

  /// Starts timing an operation.
  /// 
  /// Returns a unique timer ID that can be used with [stopTimer].
  /// 
  /// Parameters:
  /// - [name]: The name of the timer
  /// 
  /// Returns: A unique timer ID
  static String startTimer(String name) {
    final timerId = '${name}_${DateTime.now().millisecondsSinceEpoch}';
    _timestamps[timerId] = DateTime.now();

    StructuredLogger.debug(
      'Timer started',
      context: {
        'timer': name,
        'timer_id': timerId,
      },
    );

    return timerId;
  }

  /// Stops a timer and records the duration.
  /// 
  /// Parameters:
  /// - [timerId]: The timer ID returned by [startTimer]
  /// - [name]: The name of the duration metric
  /// - [tags]: Optional key-value pairs for additional context
  static void stopTimer(
    String timerId,
    String name, {
    Map<String, String>? tags,
  }) {
    final startTime = _timestamps[timerId];
    if (startTime == null) {
      StructuredLogger.warn(
        'Timer not found',
        context: {
          'timer_id': timerId,
        },
      );
      return;
    }

    final duration = DateTime.now().difference(startTime);
    recordDuration(name, duration, tags: tags);
    _timestamps.remove(timerId);
  }

  /// Records an error occurrence.
  /// 
  /// Parameters:
  /// - [error]: The error that occurred
  /// - [stackTrace]: Optional stack trace
  /// - [tags]: Optional key-value pairs for additional context
  static void recordError(
    Object error,
    StackTrace? stackTrace, {
    Map<String, String>? tags,
  }) {
    incrementCounter('errors', tags: tags);

    StructuredLogger.error(
      'Error recorded',
      error: error,
      stackTrace: stackTrace,
      context: {
        if (tags != null) 'tags': tags,
      },
    );
  }

  /// Gets the current value of a counter.
  /// 
  /// Parameters:
  /// - [name]: The name of the counter
  /// 
  /// Returns: The current counter value, or 0 if not found
  static int getCounter(String name) {
    return _counters[name] ?? 0;
  }

  /// Gets all counter metrics.
  /// 
  /// Returns: A copy of the counters map
  static Map<String, int> getCounters() {
    return Map.from(_counters);
  }

  /// Gets statistics for a duration metric.
  /// 
  /// Parameters:
  /// - [name]: The name of the duration metric
  /// 
  /// Returns: A map with min, max, avg, and count statistics
  static Map<String, int>? getDurationStats(String name) {
    final values = _durations[name];
    if (values == null || values.isEmpty) {
      return null;
    }

    values.sort();
    final min = values.first;
    final max = values.last;
    final sum = values.reduce((a, b) => a + b);
    final avg = sum ~/ values.length;

    return {
      'min': min,
      'max': max,
      'avg': avg,
      'count': values.length,
    };
  }

  /// Gets all duration metrics.
  /// 
  /// Returns: A map of metric names to their statistics
  static Map<String, Map<String, int>> getAllDurationStats() {
    final result = <String, Map<String, int>>{};
    for (final name in _durations.keys) {
      final stats = getDurationStats(name);
      if (stats != null) {
        result[name] = stats;
      }
    }
    return result;
  }

  /// Resets all metrics.
  /// 
  /// Use this to clear metrics between test runs or on app restart.
  static void reset() {
    _counters.clear();
    _durations.clear();
    _timestamps.clear();

    StructuredLogger.debug('All metrics reset');
  }

  /// Logs a summary of all metrics.
  /// 
  /// Use this to periodically output metrics for monitoring.
  static void logSummary() {
    StructuredLogger.info(
      'Metrics summary',
      context: {
        'counters': _counters,
        'durations': getAllDurationStats(),
      },
    );
  }
}

/// Helper class for timing operations automatically.
/// 
/// Usage:
/// ```dart
/// await MonitoringService.runTimed('database_query', () async {
///   return await db.query('check_ins');
/// });
/// ```
class TimedOperation<T> {
  final String name;
  final Map<String, String>? tags;
  final Future<T> Function() operation;

  TimedOperation({
    required this.name,
    this.tags,
    required this.operation,
  });

  Future<T> execute() async {
    final timerId = MonitoringService.startTimer(name);
    try {
      return await operation();
    } finally {
      MonitoringService.stopTimer(timerId, name, tags: tags);
    }
  }
}

/// Extension method for convenient timing of operations.
extension MonitoringServiceExtension on MonitoringService {
  /// Runs an operation and times it automatically.
  /// 
  /// Parameters:
  /// - [name]: The name of the operation
  /// - [operation]: The operation to execute
  /// - [tags]: Optional key-value pairs for additional context
  /// 
  /// Returns: The result of the operation
  static Future<T> runTimed<T>(
    String name,
    Future<T> Function() operation, {
    Map<String, String>? tags,
  }) {
    return TimedOperation<T>(
      name: name,
      tags: tags,
      operation: operation,
    ).execute();
  }
}
