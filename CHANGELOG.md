# Changelog

Toutes les evolutions notables du projet `Code Relay` sont documentees ici.

## [0.2.0] - 2026-03-17

### Added
- Scaffold `Next.js + TypeScript + Tailwind + Prisma` pour la web app Code Relay.
- Ecrans `overview`, `register`, `admin`, `judge` et `tv`.
- Design system "control room" partage entre les surfaces.
- Schema Prisma initial pour tournois, manches, equipes, membres, soumissions et scores.
- Store applicatif local base fichier pour les equipes dans `data/team-store.json`.
- API de creation, lecture et mise a jour d'equipes.
- Flux participant sans login avec `teamCode` public et `editToken` secret.
- Page de gestion d'equipe via lien secret.

### Changed
- Les ecrans `overview`, `admin`, `judge` et `tv` consomment des donnees communes via API avec fallback demo.
- Le cockpit juge persiste les notes dans le store local du projet.

### Verified
- `npm run build`
- `npm audit`
