# Innerscape

Personal growth OS in TypeScript: journaling, emotional check-ins, habits, goals, tasks, sleep logs, decluttering, and self-awareness workflows.

**Who it is for:** people who want one local-first suite for self-tracking instead of five disconnected apps.

**What you get:** backend + mobile app sources you run yourself.

## Try it

Backend:

```bash
cd apps/backend
cp .env.example .env   # DB + JWT secret (openssl rand -base64 32)
npm ci
npx prisma migrate dev
npm run dev
```

Mobile:

```bash
cd apps/mobile
npm ci
npx expo start
```

## Docs

- [Skill](skills/innerscape/SKILL.md)
- [KyaniteLabs](https://kyanitelabs.tech)

## License

MIT. See [LICENSE](LICENSE).
