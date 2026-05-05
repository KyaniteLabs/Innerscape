FROM node:22-alpine AS builder

WORKDIR /build
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend
COPY apps/mobile/package.json ./apps/mobile/package.json

RUN npm install --workspaces
RUN npm run build:shared
RUN cd apps/backend && npx prisma generate && npx tsc

# --- Production ---
FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 app

COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/apps/backend/dist ./dist
COPY --from=builder /build/apps/backend/prisma ./prisma
COPY --from=builder /build/apps/backend/package.json ./
COPY --from=builder /build/packages/shared/dist ./packages/shared/dist

USER app
EXPOSE 3001

CMD ["node", "dist/server.js"]
