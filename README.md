# Code Relay

MVP `Next.js + Prisma` pour piloter un tournoi Code Relay.

## Surfaces incluses

- `/register` inscription d'equipe
- `/admin` pilotage de manche
- `/judge` evaluation des equipes
- `/tv` affichage plein ecran

## Demarrage

```bash
npm install
npm run dev
```

## Base de donnees

Le schema Prisma est dans [`prisma/schema.prisma`](./prisma/schema.prisma).

Variables attendues:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/code_relay"
```

## Etat actuel

Le projet livre:

- un design system pour l'univers "control room"
- des donnees de demonstration derivees d'un cycle de jeu
- des formulaires locaux pour les equipes et les scores
- la structure necessaire pour brancher un backend temps reel ensuite
