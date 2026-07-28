# Innerscape

Personal growth OS — self-awareness, productivity, and well-being in one unified TypeScript suite.

## Try it

```bash
cd apps/backend
cp .env.example .env    # Edit with your DB connection
# Generate a local JWT secret: openssl rand -base64 32
npm ci
npx prisma migrate dev
npm run dev
```

```bash
cd apps/mobile
npm ci
npx expo start
```

## Docs

- [`skills/innerscape/SKILL.md`](skills/innerscape/SKILL.md)
- [KyaniteLabs](https://kyanitelabs.tech)
- [Elixis](https://github.com/KyaniteLabs/Elixis)
- [openglaze](https://github.com/KyaniteLabs/openglaze)
- [liminal](https://github.com/KyaniteLabs/liminal)
