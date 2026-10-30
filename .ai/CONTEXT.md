# CONTEXT.md

## Nom du projet

boulangerie

## Objectif

Application web personnelle "Boulangerie" permettant de suivre ses journées de travail, de visualiser ses totaux hebdomadaires/mensuels et d'obtenir une estimation brute de salaire à partir des heures saisies.

## Utilisateur cible

Un salarié unique travaillant en boulangerie/pâtisserie, usage 100 % personnel.

## Périmètre (MVP)

- [x] Navigation mensuelle
- [x] Ajouter / modifier / copier / supprimer une journée
- [x] Calcul durée (avec passage minuit)
- [x] Liste du mois triée par date
- [x] Totaux semaine / mois / nb jours travaillés
- [x] Carte "Mon contrat" (infos affichées)
- [x] Estimation salaire brut + majoration dimanche
- [x] Résumé par semaine + impression d'une semaine
- [x] Export JSON / Import JSON
- [x] Suppression totale avec confirmation
- [x] Persistance localStorage
- [x] Responsive + accessibilité basique

## Hors-périmètre

- Authentification / multi-utilisateurs
- Backend / API / BDD
- Synchronisation cloud
- Calcul de paie officiel / cotisations / impôts
- Bulletin de salaire
- Planning collectif / gestion équipe
- Application mobile native
- PWA obligatoire (à envisager plus tard uniquement si justifié)

## Contraintes

- Mono-fichier acceptable (HTML/CSS/JS) OU refactor en modules si clair
- Local-first, sans serveur
- Clé localStorage : `boulangerie_hours`
- Semaine = lundi -> dimanche
- Journée traversant minuit rattachée à sa date de début
- Ne pas casser format import/export existant
- Estimation = indicative, non officielle
- Données importées = non fiables

## Etat initial

existant (prototype fonctionnel)

## Point d'entrée

Ouvrir `src/index.html` ou `index.html` dans un navigateur (idéalement servi en HTTP local)
