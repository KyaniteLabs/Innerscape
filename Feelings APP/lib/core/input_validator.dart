/// Validation exception thrown when input validation fails.
class ValidationException implements Exception {
  final String message;
  final String? field;

  ValidationException(this.message, {this.field});

  @override
  String toString() {
    if (field != null) {
      return 'ValidationException($field): $message';
    }
    return 'ValidationException: $message';
  }
}

/// Input validator class for validating data at all boundaries.
/// 
/// This class provides static methods to validate various input types
/// according to APEX_SDLC.md §10 Security requirements.
class InputValidator {
  /// Validates a string value.
  /// 
  /// Parameters:
  /// - [value]: The string to validate
  /// - [minLength]: Minimum allowed length (optional)
  /// - [maxLength]: Maximum allowed length (optional)
  /// - [fieldName]: Name of the field being validated (for error messages)
  /// 
  /// Returns: The validated string
  /// 
  /// Throws: [ValidationException] if validation fails
  static String validateString(
    String value, {
    int? minLength,
    int? maxLength,
    String? fieldName,
  }) {
    if (value.isEmpty) {
      throw ValidationException(
        'Value cannot be empty',
        field: fieldName,
      );
    }

    if (minLength != null && value.length < minLength) {
      throw ValidationException(
        'Value must be at least $minLength characters',
        field: fieldName,
      );
    }

    if (maxLength != null && value.length > maxLength) {
      throw ValidationException(
        'Value must not exceed $maxLength characters',
        field: fieldName,
      );
    }

    return value;
  }

  /// Validates an integer value.
  /// 
  /// Parameters:
  /// - [value]: The integer to validate
  /// - [min]: Minimum allowed value (optional)
  /// - [max]: Maximum allowed value (optional)
  /// - [fieldName]: Name of the field being validated (for error messages)
  /// 
  /// Returns: The validated integer
  /// 
  /// Throws: [ValidationException] if validation fails
  static int validateInt(
    int value, {
    int? min,
    int? max,
    String? fieldName,
  }) {
    if (min != null && value < min) {
      throw ValidationException(
        'Value must be at least $min',
        field: fieldName,
      );
    }

    if (max != null && value > max) {
      throw ValidationException(
        'Value must not exceed $max',
        field: fieldName,
      );
    }

    return value;
  }

  /// Validates a double value.
  /// 
  /// Parameters:
  /// - [value]: The double to validate
  /// - [min]: Minimum allowed value (optional)
  /// - [max]: Maximum allowed value (optional)
  /// - [fieldName]: Name of the field being validated (for error messages)
  /// 
  /// Returns: The validated double
  /// 
  /// Throws: [ValidationException] if validation fails
  static double validateDouble(
    double value, {
    double? min,
    double? max,
    String? fieldName,
  }) {
    if (min != null && value < min) {
      throw ValidationException(
        'Value must be at least $min',
        field: fieldName,
      );
    }

    if (max != null && value > max) {
      throw ValidationException(
        'Value must not exceed $max',
        field: fieldName,
      );
    }

    return value;
  }

  /// Validates a list is not empty.
  /// 
  /// Parameters:
  /// - [list]: The list to validate
  /// - [fieldName]: Name of the field being validated (for error messages)
  /// 
  /// Returns: The validated list
  /// 
  /// Throws: [ValidationException] if validation fails
  static List<T> validateList<T>(
    List<T>? list, {
    bool allowEmpty = false,
    String? fieldName,
  }) {
    if (list == null) {
      throw ValidationException(
        'List cannot be null',
        field: fieldName,
      );
    }

    if (!allowEmpty && list.isEmpty) {
      throw ValidationException(
        'List cannot be empty',
        field: fieldName,
      );
    }

    return list;
  }

  /// Validates a set is not empty.
  /// 
  /// Parameters:
  /// - [set]: The set to validate
  /// - [fieldName]: Name of the field being validated (for error messages)
  /// 
  /// Returns: The validated set
  /// 
  /// Throws: [ValidationException] if validation fails
  static Set<T> validateSet<T>(
    Set<T>? set, {
    bool allowEmpty = false,
    String? fieldName,
  }) {
    if (set == null) {
      throw ValidationException(
        'Set cannot be null',
        field: fieldName,
      );
    }

    if (!allowEmpty && set.isEmpty) {
      throw ValidationException(
        'Set cannot be empty',
        field: fieldName,
      );
    }

    return set;
  }

  /// Validates a UUID string format.
  /// 
  /// Parameters:
  /// - [uuid]: The UUID string to validate
  /// - [fieldName]: Name of the field being validated (for error messages)
  /// 
  /// Returns: The validated UUID string
  /// 
  /// Throws: [ValidationException] if validation fails
  static String validateUuid(
    String uuid, {
    String? fieldName,
  }) {
    // Basic UUID format validation (8-4-4-4-12 hex digits)
    final uuidRegex = RegExp(
      r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    );

    if (!uuidRegex.hasMatch(uuid)) {
      throw ValidationException(
        'Invalid UUID format',
        field: fieldName,
      );
    }

    return uuid;
  }

  /// Validates a date is not in the future (for historical data).
  /// 
  /// Parameters:
  /// - [date]: The date to validate
  /// - [fieldName]: Name of the field being validated (for error messages)
  /// 
  /// Returns: The validated date
  /// 
  /// Throws: [ValidationException] if validation fails
  static DateTime validateDateNotFuture(
    DateTime date, {
    String? fieldName,
  }) {
    final now = DateTime.now();
    if (date.isAfter(now)) {
      throw ValidationException(
        'Date cannot be in the future',
        field: fieldName,
      );
    }

    return date;
  }

  /// Validates an enum value is one of the allowed values.
  /// 
  /// Parameters:
  /// - [value]: The enum value to validate
  /// - [allowedValues]: List of allowed enum values
  /// - [fieldName]: Name of the field being validated (for error messages)
  /// 
  /// Returns: The validated enum value
  /// 
  /// Throws: [ValidationException] if validation fails
  static T validateEnum<T>(
    T value,
    List<T> allowedValues, {
    String? fieldName,
  }) {
    if (!allowedValues.contains(value)) {
      throw ValidationException(
        'Invalid enum value: $value',
        field: fieldName,
      );
    }

    return value;
  }

  /// Validates a map is not empty.
  /// 
  /// Parameters:
  /// - [map]: The map to validate
  /// - [fieldName]: Name of the field being validated (for error messages)
  /// 
  /// Returns: The validated map
  /// 
  /// Throws: [ValidationException] if validation fails
  static Map<K, V> validateMap<K, V>(
    Map<K, V>? map, {
    bool allowEmpty = false,
    String? fieldName,
  }) {
    if (map == null) {
      throw ValidationException(
        'Map cannot be null',
        field: fieldName,
      );
    }

    if (!allowEmpty && map.isEmpty) {
      throw ValidationException(
        'Map cannot be empty',
        field: fieldName,
      );
    }

    return map;
  }

  /// Sanitizes a string by removing potentially dangerous characters.
  /// 
  /// Parameters:
  /// - [value]: The string to sanitize
  /// 
  /// Returns: The sanitized string
  static String sanitizeString(String value) {
    // Remove null bytes and control characters (except newline, tab, carriage return)
    return value.replaceAll(RegExp(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'), '');
  }
}
