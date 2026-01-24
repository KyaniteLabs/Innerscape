# Dependency Management

## Update Strategy

| Type | Frequency | Approach |
|------|-----------|----------|
| **Security patches** | Immediate | Automated PRs |
| **Minor versions** | Weekly | Batch updates |
| **Major versions** | Quarterly | Planned migration |

## Process

### Security Patches
1. Dependabot/GitHub Dependabot creates PR
2. Review and merge within 24 hours
3. Deploy to production immediately

### Minor Versions
1. Weekly review of available updates
2. Batch into single PR
3. Run full test suite
4. Merge if all tests pass

### Major Versions
1. Assess breaking changes
2. Create migration plan
3. Schedule in sprint
4. Update and test thoroughly
5. Deploy with feature flags if needed

## Current Dependencies

### Production
- `flutter`: ^3.0.0
- `sqflite`: ^2.3.0
- `flutter_secure_storage`: ^9.0.0
- `provider`: ^6.0.0
- `pdf`: ^3.10.0
- `flutter_riverpod`: ^2.0.0
- `shared_preferences`: ^2.0.0
- `uuid`: ^4.0.0

### Development
- `flutter_test`: ^3.0.0
- `mocktail`: ^1.0.0
- `integration_test`: ^3.0.0

## Security

Run `flutter pub outdated` weekly to check for security updates.

## Version Pinning

- Use caret ranges (`^`) for dependencies
- Pin exact versions for critical security patches
- Document breaking changes in CHANGELOG.md

## Dependency Audit

Run dependency audit quarterly:
```bash
flutter pub deps
flutter pub outdated
```

## Adding New Dependencies

1. Evaluate necessity
2. Check for alternatives
3. Review license compatibility
4. Assess maintenance status
5. Add to pubspec.yaml
6. Update documentation
7. Add to DEPENDENCIES.md

## Removing Dependencies

1. Verify no code uses the dependency
2. Run tests
3. Remove from pubspec.yaml
4. Update documentation
5. Update DEPENDENCIES.md
