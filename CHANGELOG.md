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

## [0.4.0] - 2026-03-17

### Added
- Etat de manche persistant dans le store local.
- API admin pour piloter les phases et marquer les soumissions.
- Verrouillage des inscriptions et des equipes depuis le tableau admin.

### Changed
- Les ecrans `overview`, `admin`, `judge`, `register` et `tv` consomment maintenant le vrai timer de manche.
- Le bonus rapidite est derive automatiquement de l'ordre reel de soumission.
- Le fallback demo a ete retire des surfaces live pour privilegier le vrai etat du tournoi.

### Verified
- `npm run build`
- smoke tests API `admin/round`, `admin/submissions`, `teams`, `live`
- `npm audit`

## [0.3.0] - 2026-03-17

### Added
- Ecran `/staff` pour l'acces staff par code court.
- Session staff signee en cookie HttpOnly.
- Variables d'environnement documentees dans `.env.example`.
- Wrappers serveur pour proteger les surfaces `admin` et `judge`.

### Changed
- L'API de scoring exige desormais une session staff valide.
- Les ecrans `admin` et `judge` affichent le contexte de session staff courant.

### Verified
- `npm run build`
