# ADR-0005: Centralized Error Handling Strategy

## Status

Accepted

## Context

A consistent error handling strategy is needed across the application to:

- Provide useful error messages to users
- Log errors for debugging
- Prevent sensitive information leakage
- Standardize API error responses

## Decision

Implement a centralized error handling system with:

1. **Custom Error Classes** - `AppError`, `ValidationError`, `NotFoundError`, etc.
2. **Standardized API Response Format** - Consistent error shape across all endpoints
3. **Error Sanitization** - Remove internal details before sending to client
4. **Error Boundaries** - React error boundaries for UI error recovery

### Error Response Format

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable message",
  "details": {}  // Optional, sanitized
}
```

### Error Classes

| Class | HTTP Status | Use Case |
|-------|-------------|----------|
| `ValidationError` | 400 | Invalid input |
| `NotFoundError` | 404 | Resource not found |
| `DatabaseError` | 500 | Database operation failed |
| `ExternalServiceError` | 502 | AI/external API failed |

### HTTP Status Constants

Status codes are centralized in `CONFIG.HTTP` for consistency.

## Consequences

### Positive

- Consistent error format across all API routes
- Type-safe error handling with custom classes
- Clear separation between user-facing and internal errors
- Easy to add new error types

### Negative

- More boilerplate than simple throw/catch
- Need to remember to use custom errors

### Neutral

- Error classes in `src/lib/errors.ts`
- `formatErrorResponse()` utility for API routes
- `ErrorBoundary` component for React errors

## References

- `src/lib/errors.ts` - Error classes and utilities
- `src/components/ErrorBoundary.tsx` - React error boundary
- `src/lib/config.ts` - HTTP status constants
