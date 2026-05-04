# NeuroSecond

Executive function prosthetic for neurodivergent minds — a personal Second Brain system with AI-powered capture routing.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Initialize database
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/capture/        # Capture API endpoint
│   ├── globals.css         # Design tokens & styles
│   ├── layout.tsx          # Root layout with fonts
│   └── page.tsx            # Main dashboard
├── components/             # React components
│   ├── QuickCapture.tsx    # Voice/text capture input
│   ├── DopamineMenu.tsx    # Regulation activities
│   └── ShutdownRitual.tsx  # End-of-day checklist
└── lib/
    ├── ai/classifier.ts    # GLM-4 classification
    ├── db/                  # Drizzle ORM + SQLite
    ├── hooks/useWhisper.ts  # Browser speech recognition
    └── queue.ts             # BullMQ job queue (optional)
```

### Data Flow

1. **Capture** → User inputs text or voice
2. **Store** → Saved to SQLite inbox
3. **Classify** → AI routes to: projects, people, ideas, admin
4. **Review** → Low-confidence items flagged for manual review

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Database | SQLite via libSQL + Drizzle ORM |
| AI | GLM-4 Flash (ZhipuAI) |
| Queue | BullMQ + Redis (optional) |
| Speech | Whisper.js (browser) |
| Styling | Tailwind CSS 4 |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run test` | Run tests with Vitest |
| `npm run test:ui` | Run tests with UI |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |

## Environment Variables

See [`.env.example`](.env.example) for required configuration.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make changes following [APEX v4.3.0 rules](.cursor/rules/apex-core.md)
4. Run tests (`npm test`)
5. Submit a pull request

## License

MIT
