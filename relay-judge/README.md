# Relay Judge

Binaire Go pour evaluer rapidement des sujets Python a fonction imposee.

## Principe

- un sujet impose un fichier Python et un nom de fonction
- le binaire charge le sujet, lance Python une seule fois, execute tous les tests en batch
- le binaire produit un resume texte ou JSON

## Commandes

Lister les sujets disponibles:

```bash
go run ./cmd/relay-judge list
```

Executer un sujet depuis le workspace courant:

```bash
go run ./cmd/relay-judge run --subject two-sum --workspace ./examples
```

Executer directement un fichier Python et laisser le juge retrouver le sujet:

```bash
go run ./cmd/relay-judge ./examples/two_sum.py
```

Ou avec `run`:

```bash
go run ./cmd/relay-judge run ./examples/two_sum.py
```

Mode interactif pour le terrain:

```bash
go run ./cmd/relay-judge
```

Ou:

```bash
go run ./cmd/relay-judge run
```

Specifier explicitement le fichier a evaluer:

```bash
go run ./cmd/relay-judge run --subject valid-parentheses --submission ./examples/valid_parentheses.py
```

Sortie JSON:

```bash
go run ./cmd/relay-judge run --subject two-sum --workspace ./examples --json
```

Sortie terminal detaillee si necessaire:

```bash
go run ./cmd/relay-judge run --subject two-sum --workspace ./examples --detailed
```

## Organisation

- `subjects/<id>/subject.json`: definition du sujet et des tests
- `internal/checker`: checkers integres
- `internal/engine`: orchestration Go + wrapper Python embarque
- `examples/`: solutions d'exemple

## Groupes de tests

Les sujets utilisent les groupes suivants:

- `core`: correction du coeur du sujet
- `edge`: cas limites et robustesse
- `anti-hardcode`: variantes qui evitent une solution collee aux exemples
- `perf`: signal de complexite

Le juge affiche ensuite des suggestions pour:

- `Correction /40`
- `Edge cases /20`
- `Complexite /20`

`Lisibilite / proprete` et `Rapidité` restent a evaluer manuellement par le jury.

La sortie terminal est compacte par defaut et inclut:

- un rapport technique court
- une aide a la decision
- un resume `Auto / Manual / Subtotal`

La fiche jury detaillee reste disponible avec `--detailed`.

## Distribution

Construire un binaire + le pack de sujets a copier sur le poste des juges:

```bash
./build.sh
```

## Important

Si tu veux de vrais tests caches, ne distribue pas les memes `subject.json` aux equipes et au poste organisateur.
La structure du juge supporte tres bien un pack public pour les equipes et un pack complet pour l'evaluation officielle.

Le cadrage detaille de l'evaluation est documente dans [`JURY_EVAL_PLAN.md`](./JURY_EVAL_PLAN.md).
