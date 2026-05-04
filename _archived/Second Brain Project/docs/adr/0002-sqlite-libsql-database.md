# ADR-0002: Use SQLite via libSQL with Drizzle ORM

## Status

Accepted

## Context

We need a database solution for a personal productivity application. Requirements:

- Local-first operation (works offline)
- No external dependencies for single-user deployment
- Low operational overhead
- Support for potential multi-user expansion
- Type-safe queries in TypeScript

Options considered:

1. **SQLite via libSQL** - Embedded database with Turso compatibility
2. **PostgreSQL** - Full-featured RDBMS
3. **MongoDB** - Document database
4. **IndexedDB/LocalStorage** - Browser-based storage

## Decision

Use SQLite via libSQL with Drizzle ORM for type-safe database operations.

### Key reasons:

1. **Local-first** - No external database server required
2. **Zero Configuration** - File-based, works out of the box
3. **libSQL Compatibility** - Can migrate to Turso for multi-user/edge deployment
4. **Drizzle ORM** - Type-safe queries, migrations, excellent DX
5. **Performance** - Fast for single-user workloads
6. **Portability** - Database is a single file, easy to backup

## Consequences

### Positive

- Simple deployment (just ship the file)
- No database server to manage
- Type-safe schema with Drizzle
- Easy migrations with `drizzle-kit`
- Fast reads/writes for typical workloads

### Negative

- Limited concurrent write performance (acceptable for single-user)
- No built-in full-text search (would need SQLite FTS extension)
- Migration to multi-user requires Turso or similar

### Neutral

- Database stored in project directory as `local.db`
- Schema defined in `src/lib/db/schema.ts`
- Migrations in `drizzle/` directory

## References

- [libSQL](https://github.com/libsql/libsql)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Turso](https://turso.tech/) - For future multi-user deployment
