# Contributing to SOMA

Thank you for your interest in contributing to SOMA! This guide will help you get started.

## Prerequisites

Before contributing, ensure you have:

- **Flutter SDK**: Version 3.10.7 or higher
- **Dart SDK**: Included with Flutter
- **IDE**: VS Code with Flutter extension, or Android Studio with Flutter plugin
- **Git**: For version control
- **Device/Emulator**: iOS Simulator, Android Emulator, or physical device for testing

### Verify Installation

```bash
flutter doctor
```

All checks should pass before proceeding.

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/soma.git
cd soma
```

### 2. Install Dependencies

```bash
flutter pub get
```

### 3. Run the App

```bash
flutter run
```

### 4. Run Tests

```bash
flutter test
```

## Development Workflow

### Branch Naming Convention

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/description` | `feature/add-export-csv` |
| Bug Fix | `fix/description` | `fix/crash-on-empty-history` |
| Refactor | `refactor/description` | `refactor/extract-constants` |
| Docs | `docs/description` | `docs/update-readme` |
| Test | `test/description` | `test/add-cache-tests` |

### Commit Message Convention

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:

```bash
feat(export): add CSV export option
fix(history): resolve crash when history is empty
docs(readme): update installation instructions
test(cache): add TTL expiration tests
```

### Development Cycle

1. Create a feature branch from `main`
2. Make your changes
3. Run `flutter analyze` - fix any issues
4. Run `flutter test` - all tests must pass
5. Commit with descriptive message
6. Push and create a Pull Request

## Code Style

### Linting

This project uses `flutter_lints` with custom rules in `analysis_options.yaml`.

```bash
# Check for issues
flutter analyze

# Auto-format code
dart format .
```

### Key Style Rules

- **Prefer `const` constructors** where possible
- **Avoid `print()`** - use `debugPrint` with `[APEX]` prefix
- **Use DesignSystem constants** - no hardcoded colors, sizes, or durations
- **Single quotes** for strings
- **Trailing commas** for better formatting
- **Final fields** where possible

### Code Organization

```
lib/
├── core/           # Design system, constants, utilities
├── data/           # Data access, models, services
├── domain/         # Business logic, use cases
└── presentation/   # UI components, screens, state management
```

## Testing Requirements

### Before Submitting a PR

1. **All existing tests pass**: `flutter test`
2. **No analyzer issues**: `flutter analyze`
3. **New code has tests**: Aim for meaningful coverage

### Test File Location

| Source File | Test File |
|-------------|-----------|
| `lib/core/foo.dart` | `test/core/foo_test.dart` |
| `lib/data/bar.dart` | `test/data/bar_test.dart` |
| `lib/domain/baz.dart` | `test/domain/baz_test.dart` |
| `lib/presentation/qux.dart` | `test/presentation/qux_test.dart` |

### Writing Tests

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:soma/path/to/file.dart';

void main() {
  group('ClassName', () {
    test('methodName does expected behavior', () {
      // Arrange
      final sut = ClassName();
      
      // Act
      final result = sut.methodName();
      
      // Assert
      expect(result, expectedValue);
    });
  });
}
```

## Pull Request Process

### Before Creating a PR

- [ ] Code follows style guidelines
- [ ] All tests pass (`flutter test`)
- [ ] No analyzer issues (`flutter analyze`)
- [ ] Meaningful commit messages
- [ ] Documentation updated (if needed)
- [ ] CHANGELOG.md updated (for user-facing changes)

### PR Description Template

```markdown
## What
Brief description of what this PR changes.

## Why
Explain the motivation for this change.

## How
Brief explanation of the implementation approach.

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing performed
- [ ] Tested on iOS
- [ ] Tested on Android
```

### Review Process

1. Create PR with description following template
2. Request review from maintainers
3. Address feedback promptly
4. Squash and merge once approved

See [docs/CODE_REVIEW.md](docs/CODE_REVIEW.md) for detailed review guidelines.

## Questions?

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Be respectful and constructive in all interactions

Thank you for contributing to SOMA!
