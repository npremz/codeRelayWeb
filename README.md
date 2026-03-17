# Code Relay

MVP `Next.js + Prisma` pour piloter un tournoi Code Relay.

## Surfaces incluses

- `/register` inscription d'equipe
- `/staff` acces staff par code court
- `/admin` pilotage de manche
- `/judge` evaluation des equipes
- `/tv` affichage plein ecran

## Demarrage

```bash
npm install
npm run dev
```

## Variables d'environnement

Copier `.env.example` en `.env.local` si tu veux personnaliser les codes staff:

```bash
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
DATABASE_URL="postgresql://user:password@localhost:5432/code_relay"
```

## Etat actuel

Le projet livre:

- un design system pour l'univers "control room"
- un store local de projet pour les equipes et les scores
- un flux participant sans login avec code d'equipe et token secret
- un acces staff protege par code court pour `admin` et `judge`
- la structure necessaire pour brancher un backend temps reel ensuite
