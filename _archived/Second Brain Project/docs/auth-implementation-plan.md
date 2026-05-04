# Authentication Implementation Plan

**Status**: Deferred (for future multi-user expansion)
**Created**: January 24, 2026
**Priority**: Implement before public release or multi-user support

---

## Current State

- Single-user app using `SINGLE_USER_ID` config
- Running on local network
- No authentication required for current use case

## When to Implement

Trigger implementation when ANY of these occur:
- Planning to deploy publicly (internet-accessible)
- Adding support for multiple users
- Storing sensitive data that needs protection
- Integrating with external services that require user identity

---

## Recommended Approach: NextAuth.js v5

### Why NextAuth.js

| Factor | Benefit |
|--------|---------|
| Next.js native | Built for App Router, minimal config |
| Multiple providers | Google, GitHub, email, credentials |
| Session management | Built-in, secure |
| Database adapters | Drizzle adapter available |
| Future-proof | Active maintenance, good docs |

### Alternative: Clerk or Auth0

If you want managed auth (less code, more cost):
- **Clerk**: Great DX, generous free tier, Next.js focused
- **Auth0**: Enterprise-grade, more complex

---

## Implementation Steps

### Phase 1: Setup (2-3 hours)

```bash
# Install dependencies
npm install next-auth@beta @auth/drizzle-adapter
```

#### 1.1 Create Auth Config

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import Google from "next-auth/providers/google"
import { db } from "./db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
})
```

#### 1.2 Add Database Tables

```typescript
// src/lib/db/schema.ts - Add these tables

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
})

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
})

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
})
```

#### 1.3 Create Auth Route Handler

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth"
export const { GET, POST } = handlers
```

### Phase 2: Protect Routes (1-2 hours)

#### 2.1 Create Auth Middleware

```typescript
// src/middleware.ts
import { auth } from "@/lib/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isApiRoute = req.nextUrl.pathname.startsWith("/api")
  const isAuthRoute = req.nextUrl.pathname.startsWith("/api/auth")
  
  // Allow auth routes
  if (isAuthRoute) return
  
  // Protect API routes
  if (isApiRoute && !isLoggedIn) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Redirect unauthenticated users to login
  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl.origin))
  }
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
```

#### 2.2 Update API Routes

```typescript
// Example: src/app/api/projects/route.ts
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Use session.user.id instead of CONFIG.SINGLE_USER_ID
  const userId = session.user.id
  
  // ... rest of handler
}
```

### Phase 3: Migration (2-3 hours)

#### 3.1 Migrate Existing Data

```typescript
// scripts/migrate-to-multi-user.ts
import { db } from "@/lib/db"
import { users, projects, ideas, people, inbox } from "@/lib/db/schema"

async function migrateToMultiUser(newUserId: string) {
  // Create user record for existing data
  await db.insert(users).values({
    id: newUserId,
    email: "your@email.com",
    name: "Your Name",
  })
  
  // Update all existing records to use new user ID
  const tables = [projects, ideas, people, inbox]
  for (const table of tables) {
    await db.update(table).set({ userId: newUserId })
  }
  
  console.log("Migration complete!")
}
```

#### 3.2 Update Config

```typescript
// src/lib/config.ts
// Remove SINGLE_USER_ID - use session.user.id everywhere instead
```

### Phase 4: UI (1-2 hours)

#### 4.1 Login Page

```typescript
// src/app/login/page.tsx
import { signIn } from "@/lib/auth"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <h1 className="text-2xl font-bold text-center">NeuroSecond</h1>
        <form action={async () => {
          "use server"
          await signIn("google")
        }}>
          <button type="submit" className="w-full btn btn-primary">
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  )
}
```

#### 4.2 User Menu Component

```typescript
// src/components/UserMenu.tsx
import { auth, signOut } from "@/lib/auth"

export async function UserMenu() {
  const session = await auth()
  if (!session?.user) return null
  
  return (
    <div className="flex items-center gap-2">
      <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
      <span>{session.user.name}</span>
      <form action={async () => {
        "use server"
        await signOut()
      }}>
        <button type="submit">Sign out</button>
      </form>
    </div>
  )
}
```

---

## Environment Variables

Add to `.env.local`:

```bash
# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32

# Google OAuth (get from console.cloud.google.com)
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

---

## Security Checklist

Before going live with auth:

- [ ] NEXTAUTH_SECRET is set and secure (32+ random bytes)
- [ ] HTTPS enabled in production
- [ ] OAuth redirect URIs configured correctly
- [ ] CSRF protection enabled (NextAuth handles this)
- [ ] Session expiry configured appropriately
- [ ] Rate limiting added to auth endpoints
- [ ] All API routes check session before processing
- [ ] User data properly scoped by userId in all queries
- [ ] Password requirements enforced (if using credentials)
- [ ] Account lockout after failed attempts (if using credentials)

---

## Estimated Timeline

| Phase | Time | Dependencies |
|-------|------|--------------|
| Phase 1: Setup | 2-3 hours | None |
| Phase 2: Protect Routes | 1-2 hours | Phase 1 |
| Phase 3: Migration | 2-3 hours | Phase 1, 2 |
| Phase 4: UI | 1-2 hours | Phase 1 |
| Testing | 2-3 hours | All phases |
| **Total** | **8-13 hours** | |

---

## Resources

- [NextAuth.js v5 Documentation](https://authjs.dev/)
- [Drizzle Adapter](https://authjs.dev/reference/adapter/drizzle)
- [Google OAuth Setup](https://console.cloud.google.com/apis/credentials)
- [APEX Security Guardrails](/Volumes/External Drive/02-DEVELOPMENT/Active Projects/apex-vault/apex/skills/building-agents/references/security-guardrails.md)

---

*This plan can be executed when multi-user support is needed. For now, the single-user local network setup is sufficient.*
