# Testing Protocol

## Regression Testing (MANDATORY)

| When | Action |
|------|--------|
| **Before any change** | Run full test suite to establish baseline |
| **After any change** | Run full test suite — ALL must pass |
| **If tests fail** | Fix regression IMMEDIATELY — do not continue |
| **If unable to fix** | ROLLBACK changes, report blocker |

## The Rule

A "fix" that breaks something else is NOT a fix. A task that introduces regressions is NOT complete.

## Running Tests

### Run All Tests
```bash
# Run all tests
flutter test

# Run with coverage
flutter test --coverage

# Run with coverage and generate HTML report
flutter test --coverage && genhtml coverage/lcov.info -o coverage/html
```

### Run Specific Test File
```bash
flutter test test/unit/log_service_test.dart
```

### Run Tests Matching Pattern
```bash
# Run all tests in a directory
flutter test test/unit/

# Run tests matching a pattern
flutter test --name "saveCheckIn"
```

### Run Integration Tests
```bash
# Run integration tests
flutter test integration_test

# Run specific integration test
flutter test integration_test/app_test.dart
```

### Platform-Specific Testing
```bash
# Test on iOS Simulator
flutter test -d ios

# Test on Android Emulator
flutter test -d android

# Test web build compiles
flutter build web

# Run app on web for manual testing
flutter run -d chrome
```

**Note**: Unit tests run in a headless environment and test platform-independent logic. Manual testing on each target platform (iOS, Android, Web) is required for full coverage of platform-specific features.

## Test Structure

```
test/
├── unit/              # Unit tests for individual classes/functions
│   ├── log_service_test.dart
│   ├── encrypted_database_helper_test.dart
│   ├── models_test.dart
│   ├── constants_test.dart
│   ├── input_validator_test.dart
│   └── structured_logger_test.dart
├── widget/            # Widget tests for UI components
│   ├── body_scan_screen_test.dart
│   ├── history_screen_test.dart
│   └── ...
└── integration/        # Integration tests for end-to-end flows
    └── app_test.dart
```

## Test Coverage Requirements

| Component | Minimum Coverage | Target Coverage |
|-----------|-----------------|----------------|
| Core services | 90% | 95% |
| Domain layer | 85% | 90% |
| Data layer | 90% | 95% |
| Presentation layer | 70% | 80% |
| Overall | 80% | 85% |

## Unit Test Guidelines

### What to Test
- Public methods and functions
- Business logic
- Data transformations
- Validation rules
- Error handling

### What NOT to Test
- Private methods (test via public interface)
- Third-party libraries
- Platform-specific code
- Trivial getters/setters

### Test Structure
```dart
void main() {
  group('LogService', () {
    group('saveCheckIn', () {
      test('validates intensity range', () {
        expect(
          () => logService.saveCheckIn(intensity: 6),
          throwsA(isA<ValidationException>()),
        );
      });

      test('saves valid check-in to database', () async {
        // Arrange
        final regions = [BodyRegion.chestHeart];
        final sensations = {SensationToken(label: 'tension', category: 'pressure')};

        // Act
        final id = await logService.saveCheckIn(
          regions: regions,
          sensations: sensations,
          energy: EnergyLevel.low,
          valence: Valence.unpleasant,
        );

        // Assert
        expect(id, isNotEmpty);
      });
    });
  });
}
```

## Widget Test Guidelines

### What to Test
- Widget renders correctly
- User interactions work as expected
- State changes update UI
- Error states are displayed
- Accessibility features work

### Test Structure
```dart
void main() {
  testWidgets('BodyScanScreen displays body regions', (tester) async {
    // Arrange
    await tester.pumpWidget(
      MaterialApp(
        home: BodyScanScreen(),
      ),
    );

    // Act
    await tester.pumpAndSettle();

    // Assert
    expect(find.text('Head/Face'), findsOneWidget);
    expect(find.text('Chest/Heart'), findsOneWidget);
  });

  testWidgets('BodyScanScreen allows region selection', (tester) async {
    // Arrange
    await tester.pumpWidget(
      MaterialApp(
        home: BodyScanScreen(),
      ),
    );

    // Act
    await tester.tap(find.text('Head/Face'));
    await tester.pumpAndSettle();

    // Assert
    expect(find.byType(Checkbox), findsWidgets);
  });
}
```

## Integration Test Guidelines

### What to Test
- End-to-end user flows
- Navigation between screens
- Data persistence
- Error recovery

### Test Structure
```dart
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Complete check-in flow', (tester) async {
    // Arrange
    app.main();
    await tester.pumpAndSettle();

    // Act - Navigate to body scan
    await tester.tap(find.text('Start Check-In'));
    await tester.pumpAndSettle();

    // Act - Select region
    await tester.tap(find.text('Chest/Heart'));
    await tester.pumpAndSettle();

    // Act - Submit
    await tester.tap(find.text('Submit'));
    await tester.pumpAndSettle();

    // Assert - Verify success
    expect(find.text('Check-in saved'), findsOneWidget);
  });
}
```

## Testing Checklist

### Before Committing
- [ ] All tests pass locally
- [ ] Code coverage meets minimum requirements
- [ ] No tests are skipped or ignored
- [ ] Tests are independent (no shared state)
- [ ] Tests are fast (<1 second per test)

### Before Merging
- [ ] CI/CD tests pass
- [ ] Code coverage hasn't decreased
- [ ] No flaky tests identified
- [ ] New features have tests
- [ ] Bug fixes include regression tests

## Common Testing Pitfalls

### 1. Testing Implementation Details
❌ Bad: Tests internal state variables
✅ Good: Tests public API behavior

### 2. Brittle Tests
❌ Bad: Tests depend on exact widget structure
✅ Good: Tests use semantic labels and finders

### 3. Slow Tests
❌ Bad: Tests sleep for arbitrary times
✅ Good: Tests use pumpAndSettle or explicit waits

### 4. Shared State
❌ Bad: Tests share mutable state
✅ Good: Each test is isolated

### 5. Not Testing Edge Cases
❌ Bad: Only tests happy path
✅ Good: Tests null, empty, and error cases

## Mocking Guidelines

### When to Mock
- External dependencies (databases, APIs)
- Time-dependent code
- Random number generation
- Platform-specific code

### How to Mock
```dart
class MockDatabaseHelper extends Mock implements EncryptedDatabaseHelper {}

void main() {
  group('LogService', () {
    late MockDatabaseHelper mockDb;
    late LogService logService;

    setUp(() {
      mockDb = MockDatabaseHelper();
      logService = LogService(mockDb);
    });

    test('saves check-in to database', () async {
      // Arrange
      when(mockDb.insert(any, any)).thenAnswer((_) async => 1);

      // Act
      await logService.saveCheckIn(
        regions: [BodyRegion.chestHeart],
        sensations: {SensationToken(label: 'tension', category: 'pressure')},
        energy: EnergyLevel.low,
        valence: Valence.unpleasant,
      );

      // Assert
      verify(mockDb.insert('check_ins', any)).called(1);
    });
  });
}
```

## Performance Testing

### Running Performance Tests
```bash
# Run with performance tracking
flutter test --profile

# Use Flutter DevTools for profiling
flutter pub global activate devtools
flutter pub global run devtools
```

### What to Measure
- Widget build times
- Frame rendering times
- Memory usage
- Battery impact

## Accessibility Testing

### Automated Checks
```bash
# Use Flutter DevTools accessibility audit
flutter pub global run devtools
```

### Manual Checklist
- [ ] All interactive elements have semantic labels
- [ ] Focus order is logical
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA
- [ ] Works with screen reader
- [ ] Works with keyboard only

## Continuous Integration

### CI/CD Pipeline
The CI/CD pipeline automatically runs:
- Static analysis (`flutter analyze`)
- Unit tests (`flutter test`)
- Integration tests (`flutter test integration_test`)
- Coverage reporting

### Blocking Issues
- Any test failure blocks merge
- Coverage decrease below minimum blocks merge
- Static analysis warnings block merge

## Troubleshooting

### Tests Pass Locally but Fail in CI
1. Check environment differences (Flutter version, OS)
2. Ensure dependencies are up to date (`flutter pub get`)
3. Check for flaky tests (timing-dependent)
4. Verify test isolation (no shared state)

### Flaky Tests
1. Identify flaky test (fails intermittently)
2. Add retries or explicit waits
3. Fix timing dependencies
4. Mock time-dependent code
5. Run multiple times to verify fix

### Slow Tests
1. Profile slow tests
2. Identify bottlenecks (I/O, network, rendering)
3. Mock external dependencies
4. Optimize test setup/teardown
5. Consider parallel test execution

## References

- [Flutter Testing Documentation](https://docs.flutter.dev/cookbooks/testing)
- [APEX SDLC - Testing](../apex%20rules/APEX_SDLC.md#4-testing)
- [Test Coverage Best Practices](https://dart.dev/guides/testing/code-coverage)

## Last Updated
- Date: 2026-01-24
- Version: 1.0.0
