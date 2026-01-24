# SOMA - Somatic Translator

A Flutter application for emotional self-regulation through somatic awareness and body scanning techniques.

## Platform Support

SOMA is designed for cross-platform use:

| Platform | Status | Notes |
|----------|--------|-------|
| iOS | Supported | Native app with encrypted local storage, biometric auth, notifications |
| Android | Supported | Native app with encrypted local storage, biometric auth, notifications |
| Web | Supported | Browser-based access from any desktop (Mac, Windows, Linux) |

**Web Platform Notes:**
- Data is stored in browser localStorage (persistent across sessions)
- Biometric authentication is not available (app opens directly)
- Push notifications are not available
- All other features work identically to mobile

## Quick Start

```bash
# Install dependencies
flutter pub get

# Run on connected device (iOS/Android)
flutter run

# Run on web (Chrome)
flutter run -d chrome

# Run tests
flutter test

# Build for release
flutter build apk --release      # Android
flutter build ios --release      # iOS
flutter build web                # Web
```

## Architecture

SOMA follows a clean architecture pattern:

```
lib/
├── core/           # Design system, constants, platform utilities
├── data/           # Data access, models, services
├── domain/         # Business logic, use cases
└── presentation/   # UI components, screens, state management
```

### Key Components

- **Data Layer**: 
  - Mobile: SQLite with SQLCipher encryption (AES-256)
  - Web: SharedPreferences/localStorage with JSON serialization
- **Domain Layer**: Business logic for check-ins, reflections, exports
- **Presentation Layer**: Flutter widgets with Riverpod state management
- **Design System**: Centralized tokens for colors, typography, spacing
- **Platform Utils**: Graceful feature degradation across platforms

## Features

- **Body Scan**: Interactive body region selection for sensation mapping
- **Feelings Wheel**: 3D interactive wheel for emotion selection
- **Check-In Flow**: Structured emotional check-in with intensity tracking
- **History View**: Chronological view of emotional patterns
- **Export**: PDF export of check-in history
- **Privacy**: All data stored locally, encrypted at rest (mobile)
- **App Lock**: Biometric/PIN protection (mobile only)
- **Reflection Reminders**: Scheduled notifications (mobile only)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`flutter test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

See [docs/CODE_REVIEW.md](docs/CODE_REVIEW.md) for review guidelines.

## Documentation

- [Requirements](docs/REQUIREMENTS.md)
- [API Documentation](docs/API.md)
- [Testing Protocol](docs/TESTING.md)
- [Accessibility](docs/ACCESSIBILITY.md)
- [Design Process](docs/DESIGN_PROCESS.md)
- [Security](docs/SECURITY.md)

## License

[License information]
