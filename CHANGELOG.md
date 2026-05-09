# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-05-09

### Added

- Expo mobile app with React Native + Expo Router
- Fastify 5 backend with Prisma 6 and PostgreSQL
- Emotional Context System — real-time state tracking (energy + valence)
- Somatic check-in, journal, habit, goal, task, and sleep-log routes
- Declutter and Trade bounded contexts with type-safe routes
- Trade Marketplace UI with full backend API integration
- Space routes wired to mobile, replacing legacy DeclutterSpaces
- Zod validation on all POST endpoints
- JWT authentication (jose)
- Docker Compose deployment with Traefik reverse proxy and Let's Encrypt TLS
- 143 integration tests across all route groups
- GitHub Actions CI (lint + test + build)
- Issue templates (bug report, feature request)
- FUNDING.yml for GitHub Sponsors and Ko-fi

### Changed

- Migrated Declutter bounded contexts into Innerscape monorepo
- Refactored Declutter/Trade routes for type safety
- Upgraded dependencies, resolved critical fast-jwt vulnerability

### Removed

- Unused Redis from Docker Compose and env example
- Stale planning files, obsolete setup script, and legacy _archived code
