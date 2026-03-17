# Code Relay

MVP `Next.js + Prisma` pour piloter un tournoi Code Relay.

## Surfaces incluses

- `/register` inscription d'equipe
- `/staff` acces staff par code court
- `/admin` pilotage de manche
- `/judge` evaluation des equipes
- `/results` classement public et explication des tie-breaks
- `/tv` affichage plein ecran

## Demarrage

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npx prisma migrate dev
npm run dev
```

## Variables d'environnement

Copier `.env.example` en `.env` pour Prisma CLI et Next.js. Tu peux aussi dupliquer vers `.env.local` si tu veux surcharger localement l'app web:

```bash
DATABASE_URL=postgresql://code_relay:code_relay@localhost:5432/code_relay
CODE_RELAY_ADMIN_CODE=admin-relay
CODE_RELAY_JUDGE_CODE=judge-relay
CODE_RELAY_SESSION_SECRET=change-me-in-production
```

Par defaut en local:

- organisateur: `admin-relay`
- correcteur: `judge-relay`

## Base de donnees

Le schema Prisma est dans [`prisma/schema.prisma`](./prisma/schema.prisma).

Variables attendues:

```bash
DATABASE_URL=postgresql://code_relay:code_relay@localhost:5432/code_relay
```

Pour un backend local rapide, le projet fournit [`compose.yaml`](./compose.yaml) avec PostgreSQL 17.

## Etat actuel

Le projet livre:

- un design system pour l'univers "control room"
- un backend PostgreSQL via Prisma pour les equipes, les scores et l'etat de manche
- un flux participant sans login avec code d'equipe et token secret
- un acces staff protege par code court pour `admin` et `judge`
- des controles admin reels pour inscriptions, phases et soumissions
- une base solide pour brancher ensuite du temps reel multi-client
