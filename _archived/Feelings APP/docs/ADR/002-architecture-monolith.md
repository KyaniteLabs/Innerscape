# ADR-002: Monolithic Architecture

## Status
Accepted

## Context
SOMA is a single-developer mobile app with clear domain boundaries. Need to decide between monolith and microservices.

## Decision
Use monolithic architecture.

### Why Monolith?
- Single developer team
- Clear domain boundaries (data, domain, presentation)
- No need for independent scaling
- Simpler deployment and testing
- Faster development iteration
- All code in single codebase
- Easier to understand and maintain

## Consequences

### Positive
- Simpler codebase
- Easier to understand and maintain
- Faster development
- No network overhead
- Single build artifact
- Easier testing (no integration tests across services)
- Simpler dependency management

### Negative
- Harder to scale if team grows
- Tighter coupling between modules
- All modules share same deployment cycle
- Changes to one module require rebuilding entire app

## Architecture Layers

### Presentation Layer
- Screens and widgets
- User interface
- State management (Riverpod)
- Navigation

### Domain Layer
- Business logic
- Use cases
- Services (log, export, migration, monitoring)
- Independent of UI and data

### Data Layer
- Database operations
- Data models
- Encryption/decryption
- External storage (SharedPreferences)

## Module Boundaries

### Data Module
- `lib/data/` directory
- Database helpers
- Data models
- Encrypted storage

### Domain Module
- `lib/domain/` directory
- Business services
- Use cases
- Domain logic

### Presentation Module
- `lib/presentation/` directory
- Screens
- Widgets
- State management

### Core Module
- `lib/core/` directory
- Shared utilities
- Design system
- Constants
- Validators
- Logging

## Future Considerations
If team grows beyond 5 developers or needs independent scaling, consider:
- Extracting services into separate modules
- Using feature-based architecture
- Implementing dependency injection
- Moving to modular architecture

## References
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Flutter Architecture](https://docs.flutter.dev/data-and-backend/state-mgmt/intro)

## Date
2026-01-24

## Status
Accepted
