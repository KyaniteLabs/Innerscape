import 'package:flutter_test/flutter_test.dart';
import 'package:soma/core/input_validator.dart';

void main() {
  group('InputValidator', () {
    test('validateString accepts valid strings', () {
      expect(InputValidator.validateString('valid'), 'valid');
      expect(InputValidator.validateString('abc', minLength: 3), 'abc');
      expect(InputValidator.validateString('abcd', maxLength: 4), 'abcd');
    });

    test('validateString rejects invalid strings', () {
      expect(() => InputValidator.validateString(''), throwsA(isA<ValidationException>()));
      expect(() => InputValidator.validateString('ab', minLength: 3), throwsA(isA<ValidationException>()));
      expect(() => InputValidator.validateString('abcde', maxLength: 4), throwsA(isA<ValidationException>()));
    });

    test('validateUuid accepts valid UUIDs', () {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(InputValidator.validateUuid(uuid), uuid);
    });

    test('validateUuid rejects invalid UUIDs', () {
      expect(() => InputValidator.validateUuid('not-a-uuid'), throwsA(isA<ValidationException>()));
      expect(() => InputValidator.validateUuid(''), throwsA(isA<ValidationException>()));
    });

    test('validateInt accepts valid integers', () {
      expect(InputValidator.validateInt(5, min: 1, max: 10), 5);
      expect(InputValidator.validateInt(1, min: 1), 1);
      expect(InputValidator.validateInt(10, max: 10), 10);
    });

    test('validateInt rejects invalid integers', () {
      expect(() => InputValidator.validateInt(0, min: 1), throwsA(isA<ValidationException>()));
      expect(() => InputValidator.validateInt(11, max: 10), throwsA(isA<ValidationException>()));
    });

    test('sanitizeString removes control characters', () {
      const input = 'Hello\x00World\x07';
      expect(InputValidator.sanitizeString(input), 'HelloWorld');
    });

    test('sanitizeString preserves normal characters', () {
      const input = 'Hello World 123!@#\n\t\r';
      expect(InputValidator.sanitizeString(input), input);
    });

    test('validateDateNotFuture accepts past and now', () {
      final past = DateTime.now().subtract(const Duration(days: 1));
      expect(InputValidator.validateDateNotFuture(past), past);
    });

    test('validateDateNotFuture rejects future dates', () {
      final future = DateTime.now().add(const Duration(days: 1));
      expect(() => InputValidator.validateDateNotFuture(future), throwsA(isA<ValidationException>()));
    });
  });
}
