# ADR-0004: Defer Authentication for Local Network Deployment

## Status

Accepted

## Context

NeuroSecond is initially deployed as a single-user personal tool on a local network. Authentication adds complexity without providing value in this scenario.

Considerations:

- Single user accessing from trusted devices
- Local network only (not exposed to internet)
- Future potential for multi-user or public deployment
- Development velocity vs security requirements

## Decision

Defer authentication implementation until multi-user support is required.

### Current approach:

1. Use a single hardcoded user ID (`NEXT_PUBLIC_USER_ID=personal`)
2. No authentication middleware on API routes
3. No session management
4. Trust all requests from local network

### When to implement auth:

- Before exposing to public internet
- When adding multiple users
- When storing sensitive data (credentials, financial info)

## Consequences

### Positive

- Faster development velocity
- Simpler codebase to maintain
- No password/session management overhead
- Lower barrier to self-hosting

### Negative

- Cannot safely expose to internet
- No user isolation if multiple people access
- Must remember to implement before going public

### Neutral

- Auth implementation plan documented in `docs/auth-implementation-plan.md`
- Code structured to easily add auth (user ID passed to queries)
- API routes use `CONFIG.SINGLE_USER_ID` - easy to replace with session user

## Implementation Path

When auth is needed, implement via NextAuth.js v5:

1. Add `next-auth` package
2. Create auth middleware
3. Replace `CONFIG.SINGLE_USER_ID` with session user
4. Add login/register UI
5. Add rate limiting

See `docs/auth-implementation-plan.md` for detailed steps.

## References

- [NextAuth.js v5](https://authjs.dev/)
- [docs/auth-implementation-plan.md](../auth-implementation-plan.md)
