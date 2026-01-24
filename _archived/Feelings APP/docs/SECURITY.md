# SOMA Security Documentation

This document outlines the threat model and security controls implemented in SOMA to protect sensitive user somatic and emotional data.

## Threat Model

### Assets Protected
- **Check-in data**: Body regions, sensation tokens, and timestamps.
- **Reflection data**: Helpfulness ratings and follow-up data.
- **Personal mappings**: Learned patterns connecting sensations to emotions.
- **Free-text notes**: Personal clinical notes recorded by the user.

### Threat Scenarios

#### T1: Lost/Stolen Device
- **Risk**: An unauthorized person gains physical access to the device.
- **Mitigation**: All data is stored in a SQLite database encrypted with AES-256 via SQLCipher.
- **Residual risk**: If the device is stolen while unlocked and the app is open, data is accessible unless App Lock is enabled.

#### T2: Coercive Access
- **Risk**: User is forced to open the app by a third party (e.g., partner, employer).
- **Mitigation**: Optional App Lock (Biometric/PIN) provides an additional layer of friction. 
- **Future Improvement**: Implement "Plausible Deniability" mode with a duress PIN that shows decoy data.

#### T3: Backup/Sync Leakage
- **Risk**: Encrypted data is backed up to cloud services (iCloud/Google Drive) where it might be intercepted or accessed.
- **Mitigation**: Encryption keys are stored in the device's secure enclave (Keychain/Keystore) and are configured not to be backed up. The database file is useless without the key.

#### T4: SDK/Analytics Exfiltration
- **Risk**: Third-party libraries or analytics SDKs leak sensitive data to external servers.
- **Mitigation**: SOMA has zero analytics SDKs. It is an offline-first application with minimal dependencies. All processing (inference and learning) happens on-device.

#### T5: Export Mishandling
- **Risk**: User exports PDF or CSV data and shares it via insecure channels (email, unencrypted chat).
- **Mitigation**: Export Safety Warning dialog informs the user of the risks before generating the file.

## Platform-Specific Security

### Mobile (iOS/Android)
- **Encryption at Rest**: AES-256 encryption via SQLCipher
- **Secure Key Management**: Keys stored in platform secure storage (Keychain/Keystore)
- **App Lock**: Biometric or PIN authentication available
- **Backup Protection**: Encryption keys configured to not sync to cloud backups

### Web (Browser)
- **Data Storage**: Uses browser localStorage via SharedPreferences
- **Encryption**: No encryption at rest (browser limitation)
- **Authentication**: No App Lock available
- **Security Model**: Relies on browser security and user's device security
- **Recommendation**: Web version is suitable for low-risk use cases or users who prefer browser access. For maximum security, use the mobile apps.

**Note**: The web platform is designed for convenience and accessibility across all desktop operating systems. Users with heightened privacy concerns should use the mobile apps which provide encrypted storage and biometric protection.

## Security Controls

### Implemented
- **Encryption at Rest**: AES-256 encryption via SQLCipher (mobile only).
- **Secure Key Management**: Keys generated using `Random.secure()` and stored in `flutter_secure_storage` (mobile only).
- **Zero Cloud Footprint**: No accounts, no servers, no syncing.
- **Input Validation**: Strict validation at all boundaries to prevent injection or corruption.
- **App Lock**: Optional biometric or PIN-based gate before accessing data (mobile only).
- **Platform Guards**: Graceful feature degradation prevents crashes on unsupported platforms.

### Planned
- **Data Minimization Review**: Periodic audit of stored fields.
- **Encryption Key Rotation**: Strategy for periodic key updates (mobile).

## Compliance and Legal
- **HIPAA**: SOMA is NOT a HIPAA-covered entity as it does not transmit Protected Health Information (PHI) to covered entities.
- **Consumer Health Data**: Treat all data as sensitive consumer health information under relevant regional privacy laws (e.g., MHMDA, CCPA).
- **Research Ethics**: The app follows the principle of informed consent through its clear privacy policy and terms.
