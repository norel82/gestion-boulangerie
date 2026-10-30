# AGENTS.md

## Règle d'or
Lis TOUJOURS dans cet ordre : .ai/CONTEXT.md -> .ai/STATE.md -> .ai/TASKS.md -> .ai/DECISIONS.md

## Méthode
- Contexte avant code
- Un petit pas à la fois, propose un plan et attends validation
- Mets à jour .ai/STATE.md, .ai/TASKS.md, .ai/JOURNAL.md après chaque étape validée
- Mets à jour .ai/DECISIONS.md si tu fais un choix important
- N'invente pas de fonctionnalités hors périmètre
- Préserve l'existant si déjà fonctionnel
- Données locales = ne pas casser l'import/export
- Ne duplique pas les constantes métier
- Pose des questions si flou

## Mémoire
La mémoire est dans `.ai/`. Reste concis.
