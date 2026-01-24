# ADR-0001: Use Next.js 16 App Router

## Status

Accepted

## Context

We need a web framework for building the NeuroSecond Second Brain application. The application requires:

- Server-side rendering for SEO and initial load performance
- API routes for backend functionality
- Modern React patterns (Server Components, Suspense)
- PWA support for mobile access
- TypeScript support

Options considered:

1. **Next.js App Router** - Latest Next.js with server components
2. **Next.js Pages Router** - Traditional Next.js routing
3. **Remix** - Full-stack React framework
4. **SvelteKit** - Svelte-based framework

## Decision

Use Next.js 16 with the App Router architecture.

### Key reasons:

1. **Server Components** - Reduce client-side JavaScript, improve initial load
2. **Built-in API Routes** - No need for separate backend
3. **Streaming & Suspense** - Better loading states for AI operations
4. **Strong TypeScript Support** - Type safety across the stack
5. **Vercel Ecosystem** - Easy deployment, good DX
6. **Large Community** - Extensive documentation and packages

## Consequences

### Positive

- Modern React patterns available (use client/server components appropriately)
- Simplified deployment with Vercel or self-hosted options
- Collocated API routes reduce complexity
- Built-in optimizations (image, font, script)

### Negative

- App Router is newer, some libraries may not be compatible
- Learning curve for Server Components patterns
- Some patterns require careful thought about client/server boundary

### Neutral

- Project structure follows App Router conventions
- File-based routing determines URL structure

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
