# premiere-api-rest
Cours AL API REST

## Lancement
1. Pour les dépendances: `npm i`
2. D'abord, lancer la BDD (quelques données de base sont incluses) : `cd ./bdd/ & docker-compose up -d` (Il est possible d'utiliser `podman-compose`au lieu de `docker-compose` selon préférences)
3. Ensuite , lancer l'appli: `npm run dev`

## Arrêt
1. Arrêter la BDD: `docker-compose down -v` 