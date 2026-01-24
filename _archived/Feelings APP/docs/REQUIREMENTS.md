# SOMA - Somatic Translator Requirements

## User Stories

### US-001: Complete Check-In Flow
As a user experiencing emotional dysregulation, I want to complete a structured check-in process so that I can identify and label my physical sensations.

**Acceptance Criteria**:
- [ ] User can select body regions where sensations are felt
- [ ] User can rate intensity (1-5)
- [ ] User can select from vocabulary of sensations
- [ ] User can add custom sensations
- [ ] User can specify energy level (high/low)
- [ ] User can specify valence (pleasant/unpleasant/neutral)
- [ ] User can specify context (social/sensory/task/unknown)
- [ ] User can add optional free text notes
- [ ] Data is saved securely with encryption

### US-002: View History
As a user, I want to view my emotional history so that I can identify patterns over time.

**Acceptance Criteria**:
- [ ] History displays in chronological order (most recent first)
- [ ] User can filter by date range
- [ ] User can view individual check-in details
- [ ] User can export data to PDF
- [ ] User can delete individual entries

### US-003: Receive Reflection Prompt
As a user, I want to receive a reflection prompt after completing a check-in so that I can assess how helpful the session was.

**Acceptance Criteria**:
- [ ] Reflection prompt appears after check-in completion
- [ ] User can rate helpfulness (helped/didn't help/not sure)
- [ ] User can optionally update energy and valence
- [ ] Reflection is saved and linked to check-in

### US-004: Explore Emotional Connections
As a user, I want to explore connections between my body sensations and emotions so that I can build better emotional awareness.

**Acceptance Criteria**:
- [ ] User can view suggested hypotheses based on check-in data
- [ ] User can select or reject hypotheses
- [ ] User can add personal mappings
- [ ] System learns from user confirmations

### US-005: Data Privacy and Security
As a user, I want my data to be private and secure so that I can trust the app with sensitive information.

**Acceptance Criteria**:
- [ ] All data is encrypted at rest (AES-256)
- [ ] Data never leaves the device without explicit consent
- [ ] User can export their data
- [ ] User can delete all their data
- [ ] Privacy policy is accessible and clear

### US-006: Onboarding and Education
As a new user, I want to understand how to use the app so that I can get value from it immediately.

**Acceptance Criteria**:
- [ ] Onboarding flow explains the app's purpose
- [ ] Onboarding explains how to complete a check-in
- [ ] Onboarding explains the body scan process
- [ ] User can skip onboarding
- [ ] User can revisit onboarding from settings

## Non-Functional Requirements

### Performance
- **Response Time**: All operations complete within 2 seconds
- **Database Queries**: Queries return within 500ms for datasets up to 1000 entries
- **App Startup**: App launches within 3 seconds on modern devices
- **Animation**: Animations respect user's reduced motion preference

### Security
- **Encryption**: All data encrypted at rest using AES-256
- **Key Management**: Encryption keys stored in platform-specific secure storage
- **Input Validation**: All inputs validated at boundaries
- **SQL Injection Protection**: Parameterized queries used throughout
- **No Remote Storage**: No data sent to remote servers without explicit consent

### Privacy
- **Local-Only**: All data stored locally on device
- **No Tracking**: No analytics or tracking without explicit consent
- **Data Ownership**: User has full control over their data
- **Export**: User can export all data in standard format
- **Deletion**: User can delete all data with one action

### Reliability
- **Crash Rate**: <0.1% crash rate (99.9% uptime)
- **Data Integrity**: No data loss during normal operations
- **Migration**: Data migration from old storage is reversible
- **Backup**: Automatic daily backups retained for 30 days

### Usability
- **Accessibility**: WCAG AA compliant
- **Touch Targets**: Minimum 44x44 points for all interactive elements
- **Text Scaling**: Respects user's text scaling preferences
- **Keyboard Navigation**: All features accessible via keyboard
- **Screen Reader**: All interactive elements have semantic labels

### Maintainability
- **Code Quality**: All code passes static analysis with zero warnings
- **Test Coverage**: Minimum 80% code coverage
- **Documentation**: All public APIs documented
- **Logging**: Structured logging for all critical operations
- **Monitoring**: RED/USE metrics for critical paths

### Platform Support
- **iOS**: iOS 14.0 and above (native app)
- **Android**: Android 6.0 (API level 23) and above (native app)
- **Web**: Modern browsers (Chrome, Firefox, Safari, Edge) for desktop access
- **Form Factor**: Mobile phones, tablets, and desktop browsers

#### Platform Feature Matrix

| Feature | iOS | Android | Web |
|---------|-----|---------|-----|
| Core check-in flow | Yes | Yes | Yes |
| Encrypted database | Yes (SQLCipher) | Yes (SQLCipher) | No (localStorage) |
| Biometric/PIN lock | Yes | Yes | No |
| Push notifications | Yes | Yes | No |
| PDF export | Yes | Yes | Yes |
| Offline support | Yes | Yes | Yes |

**Note**: Web platform provides full functional parity for the core experience. Security features (encryption, biometric auth) and notifications are mobile-only due to browser limitations.

## Functional Requirements

### FR-001: Body Region Selection
- System provides 8 predefined body regions (head/face, neck/throat, shoulders/arms, chest/heart, belly/gut, back, hips/groin, legs/feet)
- User can select multiple regions
- Selection is visually indicated
- Selection can be changed before submission

### FR-002: Sensation Vocabulary
- System provides predefined sensation vocabulary
- Vocabulary is organized by category
- User can search/filter vocabulary
- User can add custom sensations
- Custom sensations are saved for future use

### FR-003: Intensity Rating
- Intensity is rated on a 1-5 scale
- Scale is visually represented (e.g., slider, buttons)
- Current selection is clearly indicated
- Default value is 3 (middle of range)

### FR-004: Energy Level
- Energy level is selected as high or low
- Selection is mutually exclusive
- Visual feedback indicates current selection

### FR-005: Valence
- Valence is selected as pleasant, unpleasant, or neutral
- Selection is mutually exclusive
- Visual feedback indicates current selection

### FR-006: Context
- Context is selected as social, sensory, task, or unknown
- Context is optional
- Selection is mutually exclusive

### FR-007: Free Text Notes
- User can add optional free text notes
- Notes are limited to 1000 characters
- Character count is displayed
- Notes are encrypted with other data

### FR-008: Data Storage
- All check-ins are stored in encrypted SQLite database
- Each check-in has unique ID
- Timestamp is automatically recorded
- Data is persisted across app restarts

### FR-009: Data Retrieval
- User can view all check-ins in chronological order
- User can view individual check-in details
- User can filter by date range
- History page supports pagination for large datasets

### FR-010: Data Export
- User can export check-in history to PDF
- Export includes all check-in data
- PDF is formatted for readability
- Export is saved to device storage

### FR-011: Data Deletion
- User can delete individual check-ins
- User can delete all data
- Deletion requires confirmation
- Deletion is irreversible

### FR-012: Reflection Capture
- Reflection is captured after check-in completion
- Reflection includes helpfulness rating
- Reflection can include updated energy and valence
- Reflection is linked to check-in via ID

### FR-013: Migration
- Data is migrated from SharedPreferences to encrypted database
- Migration is idempotent (runs only once)
- Migration handles corrupt data gracefully
- Migration can be rolled back on failure

## Technical Constraints

### Storage
- Maximum storage: 100MB (excluding app assets)
- Database size: Grows with user data, expected <10MB for 1000 entries
- Backup retention: 30 days for automatic backups

### Network
- No network connectivity required for core functionality
- Optional network for future features (e.g., cloud sync)
- Offline-first architecture

### Battery
- Minimal battery impact
- No background processing
- Efficient database queries

### Memory
- Memory usage: <100MB during normal operation
- Efficient memory management for large datasets
- Proper disposal of resources

## Out of Scope

The following features are explicitly out of scope for the initial release:

- Cloud sync or backup
- Social features (sharing, community)
- Multi-user support
- Wearable device integration
- Biometric authentication (beyond platform secure storage)
- Voice input
- Gamification
- Push notifications
- In-app purchases

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial requirements document |
