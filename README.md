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

## Docker Prod

Le repo inclut maintenant un [`Dockerfile`](./Dockerfile) pour Dokploy ou tout autre orchestrateur compatible Docker.

Build local:

```bash
docker build -t code-relay .
```

Run local:

```bash
docker run --rm -p 3000:3000 \
  -e DATABASE_URL=postgresql://code_relay:code_relay@host.docker.internal:5432/code_relay \
  -e CODE_RELAY_ADMIN_CODE=admin-relay \
  -e CODE_RELAY_JUDGE_CODE=judge-relay \
  -e CODE_RELAY_SESSION_SECRET=change-me-in-production \
  -e NEXT_PUBLIC_APP_URL=https://coderelay.hordeagence.com \
  code-relay
```

Au démarrage du conteneur, `prisma migrate deploy` est exécuté automatiquement si `DATABASE_URL` est défini.

## Variables d'environnement

Copier `.env.example` en `.env` pour Prisma CLI et Next.js. Tu peux aussi dupliquer vers `.env.local` si tu veux surcharger localement l'app web:

```bash
DATABASE_URL=postgresql://code_relay:code_relay@localhost:5432/code_relay
CODE_RELAY_ADMIN_CODE=admin-relay
CODE_RELAY_JUDGE_CODE=judge-relay
CODE_RELAY_SESSION_SECRET=change-me-in-production
NEXT_PUBLIC_APP_URL=https://coderelay.hordeagence.com
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
- un backend PostgreSQL via Prisma pour les equipes, les scores et plusieurs manches
- un catalogue de sujets charge depuis `relay-judge/subjects` et assignable a chaque manche
- un flux participant sans login avec code d'equipe et token secret
- un acces staff protege par code court pour `admin` et `judge`
- des controles admin reels pour inscriptions, phases, soumissions et manche courante
- une action admin de reinitialisation complete pour repartir sur une nouvelle edition
- une page publique `/brief` et un affichage `/tv` qui exposent le fichier a rendre et le brief public
- une base solide pour brancher ensuite du temps reel multi-client

## Modele multi-manches

Le backend distingue maintenant:

- `Team`: identite stable de l'equipe
- `Round`: une manche avec son timer et sa phase
- `RoundEntry`: la participation d'une equipe a une manche
- `RoundScore`: la note de cette equipe pour cette manche

Les routes historiques continuent a viser la manche courante:

- `GET /api/live`
- `POST /api/teams`
- `POST /api/admin/round`
- `POST /api/admin/submissions/[teamCode]`
- `PUT /api/teams/[teamCode]/score`

Nouvelles routes admin pour jouer plusieurs manches:

- `GET /api/admin/rounds`
- `POST /api/admin/rounds`
- `PUT /api/admin/rounds/current`

Exemple de creation d'une nouvelle manche en clonant les equipes de la manche courante:

```json
{
  "name": "Manche 2",
  "cloneTeams": true
}
```

Exemple pour ne garder que certains qualifies:

```json
{
  "name": "Finale",
  "cloneTeams": true,
  "teamCodes": ["AB12C", "ZX98Q", "K7MNP"]
}
```
