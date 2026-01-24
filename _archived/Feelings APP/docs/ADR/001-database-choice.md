# ADR-001: Database Technology Choice

## Status
Accepted

## Context
SOMA needs to store sensitive user data (emotional check-ins, reflections) locally on device. Requirements include:
- Strong encryption at rest
- ACID transactions
- Reliable backup/restore
- Cross-platform support (iOS/Android/Web)

## Decision
Use SQLite with SQLCipher encryption for mobile platforms (iOS/Android), with a localStorage fallback for web.

### Platform Strategy
- **Mobile (iOS/Android)**: SQLite with SQLCipher (AES-256 encryption) + flutter_secure_storage for key management
- **Web**: SharedPreferences/localStorage with JSON serialization (no encryption due to browser limitations)

### Why SQLite?
- Mature, battle-tested database
- ACID-compliant transactions
- Excellent Flutter support via sqflite
- Efficient for local mobile apps
- SQL queries for complex data retrieval

### Why flutter_secure_storage?
- Platform-specific secure storage (Keychain on iOS, Keystore on Android)
- AES-256 encryption by default
- Never exposes keys to app layer
- Widely used and well-maintained

## Consequences

### Positive
- Strong security: AES-256 encryption
- Reliable transactions with rollback support
- Cross-platform consistency
- Well-documented, widely used
- Efficient for local mobile apps
- SQL queries for complex data retrieval

### Negative
- Additional complexity for encryption/decryption
- Requires careful key management
- Manual migration from SharedPreferences
- Need to handle database schema migrations

## Alternatives Considered

### Hive
- Pros: Fast, NoSQL, pure Dart
- Cons: No ACID, less mature encryption

### Isar
- Pros: Fast, NoSQL, modern
- Cons: Less mature, smaller community

### SharedPreferences (existing)
- Pros: Simple, built-in
- Cons: No encryption, no structured queries, deprecated

## Implementation Details

### Database Schema
```sql
CREATE TABLE check_ins (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  regions TEXT NOT NULL,
  sensations TEXT NOT NULL,
  intensity INTEGER NOT NULL,
  energy TEXT NOT NULL,
  valence TEXT NOT NULL,
  context TEXT,
  freeText TEXT
);

CREATE TABLE reflections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_in_id TEXT NOT NULL,
  helped TEXT NOT NULL,
  post_energy TEXT,
  post_valence TEXT,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (check_in_id) REFERENCES check_ins(id) ON DELETE CASCADE
);
```

### Encryption Strategy
- Database file encrypted with AES-256
- Encryption key stored in platform secure storage
- Key generated per device
- Key never exposed to app layer

### Migration Strategy
- One-time migration from SharedPreferences
- Idempotent migration (runs only once)
- Validation of data before migration
- Rollback capability on failure

### Web Platform Fallback
The web platform uses a different storage strategy due to browser limitations:

```dart
// Platform detection
if (PlatformUtils.isWeb) {
  // Use WebDatabaseHelper (SharedPreferences/localStorage)
} else {
  // Use EncryptedDatabaseHelper (SQLCipher)
}
```

**Web Storage Characteristics:**
- Data persisted in browser localStorage
- JSON serialization for structured data
- No encryption (relies on browser/device security)
- Same API surface as mobile for seamless code sharing
- Implemented in `lib/data/web_database_helper.dart`

**Trade-offs:**
- Users get cross-platform access via any desktop browser
- Web users sacrifice encryption for convenience
- Mobile remains the recommended platform for maximum security

## References
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [flutter_secure_storage](https://pub.dev/packages/flutter_secure_storage)
- [sqflite](https://pub.dev/packages/sqflite)

## Date
2026-01-24

## Status
Accepted
