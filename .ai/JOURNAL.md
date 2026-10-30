# JOURNAL.md

## 2026-10-27
- Étape 1 validée : création squelette `index.html` (structure, CSS responsive, modales ajout/modif/copier/confirmation). Mise à jour STATE/TASKS. Passer à étape 2.

## 2026-10-30
- Versioning Git initialisé (3 commits) :
  - `50d70fc` chore: init dépôt et .gitignore
  - `b2b89db` docs: ajout AGENTS.md et mémoire .ai
  - `5d6ea2c` feat: squelette UI index.html

## 2026-10-30 (suite)
- Étape 2 validée : `app.js` avec constantes métier (`STORAGE_KEY`, `DEFAULT_RATE`, `SUNDAY_BONUS`), modèle `{ rate, days[] }`, `load/save` localStorage `boulangerie_hours`, normalisation/tri des données importées. Commit `e2f7014`.
- Étape 3 validée : navigation mensuelle (état `currentMonth`, `addMonths`, label français, boutons précédent/suivant). Commit `40408d0`.
- Étape 4 validée : calculs purs (`dayDurationMinutes` avec passage minuit, `formatDuration`, `startOfWeek` lundi, `isSunday`, `dayPay` majoration 20 %, `computeMonthTotals`, `computeCurrentWeekTotals`, `groupDaysByWeek`). Tests Node OK. Commit `e633840`.
- Étape 5a validée : rendu contrat, cartes (semaine réelle, mois, jours, salaire) et liste du mois avec état vide, re-render au changement de mois. Rendu via `textContent`. Commit à venir.
