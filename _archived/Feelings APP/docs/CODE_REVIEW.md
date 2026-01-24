# Code Review Guidelines

## PR Guidelines

| Rule | Guideline |
|------|-----------|
| Size | <400 lines (ideal), <800 (max) |
| Focus | Single concern per PR |
| Title | Imperative mood: "Add user auth" |
| Description | What, why, how to test |
| Draft | Mark as draft while in progress |
| Labels | Add appropriate labels (bug, feature, refactor, etc.) |

## PR Description Template

```markdown
## What
Brief description of what this PR changes.

## Why
Explain the motivation for this change.

## How
Brief explanation of the implementation approach.

## Testing
Describe how this change was tested:
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed
- [ ] Screenshots/videos attached (if UI changes)

## Checklist
- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] No new warnings/errors in static analysis
- [ ] Documentation updated (if needed)
- [ ] Changelog updated (if user-facing change)
```

## Review Checklist

### 1. Correctness
- [ ] Does it work as intended?
- [ ] Are edge cases handled?
- [ ] Are null checks appropriate?
- [ ] Are error cases handled?

### 2. Security
- [ ] Are inputs validated?
- [ ] Is auth checked where needed?
- [ ] Are secrets exposed?
- [ ] Is SQL injection prevented?
- [ ] Is XSS prevented (if applicable)?

### 3. Performance
- [ ] Are there N+1 queries?
- [ ] Are there unnecessary loops?
- [ ] Are there memory leaks?
- [ ] Is caching used appropriately?
- [ ] Are expensive operations optimized?

### 4. Readability
- [ ] Is naming clear and consistent?
- [ ] Is complexity reasonable?
- [ ] Are functions short and focused?
- [ ] Is there appropriate documentation?
- [ ] Are magic numbers/strings replaced with constants?

### 5. Testing
- [ ] Is coverage adequate?
- [ ] Are tests meaningful?
- [ ] Are edge cases tested?
- [ ] Are tests independent?

### 6. Accessibility
- [ ] Are semantic labels added?
- [ ] Is keyboard navigation supported?
- [ ] Are focus states visible?
- [ ] Is color contrast adequate?
- [ ] Does it respect reduced motion preference?

## Feedback Convention

| Type | Format | Example |
|------|--------|---------|
| Must fix | `[blocking] reason` | `[blocking] Missing input validation on user input` |
| Suggestion | `[nit] suggestion` | `[nit] Consider using const constructor here` |
| Question | `[question] why X?` | `[question] Why use List instead of Set here?` |
| Praise | `[nice] good approach` | `[nice] Clean separation of concerns` |
| Warning | `[warning] potential issue` | `[warning] This could cause a memory leak` |

## Review Process

### For Author
1. Create feature branch from `develop`
2. Implement changes with small, focused commits
3. Ensure all tests pass locally
4. Run `flutter analyze` and fix all issues
5. Run `flutter test` and ensure coverage
6. Create PR with description following template
7. Request review from at least one team member
8. Address feedback promptly
9. Keep PR updated with status

### For Reviewer
1. Review PR within 24-48 hours
2. Provide clear, actionable feedback
3. Use feedback convention for clarity
4. Test changes locally if needed
5. Approve or request changes
6. Leave comments for future reference

### Approval Criteria
- [ ] All review checklist items addressed
- [ ] All feedback resolved (or discussed)
- [ ] CI/CD passes
- [ ] At least one approval from team member
- [ ] No blocking issues remaining

## Common Issues to Watch For

### Code Smells
- Duplicate code
- Long functions (>50 lines)
- Deep nesting (>3 levels)
- God classes
- Magic numbers/strings
- Dead code

### Flutter-Specific
- Missing `const` constructors
- Improper widget lifecycle usage
- Memory leaks (e.g., not disposing controllers)
- Missing `setState` calls
- Improper use of `FutureBuilder`

### Security
- Missing input validation
- SQL injection vulnerabilities
- Hardcoded secrets
- Insecure storage of sensitive data
- Missing null checks

### Performance
- Inefficient widget rebuilds
- Missing `const` widgets
- Unnecessary `setState` calls
- Large images not optimized
- Inefficient list rendering

## Merge Guidelines

### When to Merge
- All approval criteria met
- No blocking issues
- CI/CD passing
- At least one approval

### When NOT to Merge
- Blocking issues remain
- CI/CD failing
- No approvals
- Conflicts not resolved
- Tests failing

### Merge Strategy
- Feature branches: Squash and merge
- Bugfix branches: Rebase and merge
- Release branches: Merge commit

## Post-Merge

1. Delete feature branch
2. Update changelog (if needed)
3. Notify team of release (if needed)
4. Close related issues
5. Celebrate! 🎉

## Tools and Automation

### Pre-commit Hooks (Recommended)
```bash
# Run static analysis
flutter analyze

# Run tests
flutter test

# Format code
dart format .
```

### CI/CD Checks
- Lint: `flutter analyze`
- Test: `flutter test --coverage`
- Build: `flutter build apk --debug`
- Security: Automated vulnerability scanning

### Code Quality Tools
- Flutter DevTools for performance profiling
- Dart Code Metrics for complexity analysis
- Coverage report for test coverage

## Best Practices

### Small PRs
- Keep PRs focused and small
- One concern per PR
- Easier to review
- Faster to merge
- Less risk of bugs

### Descriptive Commits
- Use conventional commits format
- `feat: add user authentication`
- `fix: resolve crash on login`
- `refactor: simplify database queries`

### Documentation
- Document public APIs
- Add inline comments for complex logic
- Update README for user-facing changes
- Keep docs in sync with code

### Testing
- Write tests before code (TDD)
- Test happy path and edge cases
- Mock external dependencies
- Keep tests fast and independent

## Escalation Path

If there's disagreement on a PR:
1. Discuss in PR comments
2. Schedule pair programming session
3. Escalate to tech lead
4. Final decision by tech lead

## References

- [APEX SDLC - Code Review](../apex%20rules/APEX_SDLC.md#5-code-review)
- [Flutter Style Guide](https://dart.dev/guides/language/effective-dart/style)
- [Effective Dart](https://dart.dev/guides/language/effective-dart)
- [Clean Code](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)

## Last Updated
- Date: 2026-01-24
- Version: 1.0.0
