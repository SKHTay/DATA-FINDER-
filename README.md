# Démonstrateur du moteur unifié de recensement et de qualification des gisements

Application web statique qui déroule la chaîne complète décrite par le référentiel V1.2.2 :
campagne EDR, signal, gisement canonique, Q1, Q2, portefeuilles, décision humaine.
Elle sert à montrer la méthode en réunion, à confronter les formules à des cas réels
et à tester la lisibilité de la restitution avant toute réalisation logicielle.

Aucune dépendance, aucun script de construction, aucun outil de mesure d'audience.
Trois fichiers JavaScript et une feuille de style.

## Ce que le démonstrateur fait

- Pilotage d'une campagne EDR : périmètre, unités, systèmes connus, grille d'angles morts, indicateurs de couverture, checklist de clôture.
- File des signaux avec création rapide, confirmation transactionnelle vers le gisement et conservation de la provenance.
- Registre des gisements avec fiche D et profil d'usage patrimonial Ug.
- Q1 avec suggestions de scénarios non scorées et validation humaine obligatoire.
- Q2 avec saisie des blocs U, V, A, C et IA, gestion de ND et NA, niveau de preuve E0 à E3, usage déclaré et usage objectivé.
- Moteur de calcul complet : lectures observée, prudente et décisionnelle, bornes de U, plafonds de A et de IA, cibles C relevées par profil, risque résiduel, statuts P0 à P6.
- Tableau de bord à cinq messages et vue d'explication détaillée.
- Portefeuille des scénarios, carte potentiel latent par activabilité, portefeuille patrimonial.

## Ce qu'il ne fait pas

Il ne se connecte à aucun système d'information. Il ne conserve rien entre deux visites,
puisqu'il n'a ni serveur ni base. Il ne produit aucune décision opposable et ne remplace
ni l'avis du DPO, ni la validation sécurité, ni la validation clinique.

## Voir la démonstration

Une fois la mise en ligne effectuée, l'adresse est de la forme :

```
https://<organisation>.github.io/<depot>/
```

## Mettre en ligne sur GitHub Pages

1. Créez un dépôt, par exemple `demonstrateur-gisements`.
2. Déposez le contenu de ce dossier à la racine du dépôt, en conservant `assets/`, `.github/` et `.nojekyll`.
3. Poussez sur la branche `main`.
4. Dans Settings, Pages, choisissez la source **GitHub Actions**.
5. Le workflow `.github/workflows/pages.yml` publie à chaque push sur `main`. Suivez son exécution dans l'onglet Actions.

Le dépôt peut rester privé si votre plan GitHub autorise Pages sur les dépôts privés.
Sinon, un dépôt public convient : le démonstrateur ne contient aucune donnée réelle.
Le fichier `robots.txt` et la balise `noindex` évitent que la démonstration soit indexée
et confondue avec un produit en service.

## Ouvrir sans rien installer

Ouvrez `index.html` dans un navigateur. Tout fonctionne depuis le système de fichiers local,
ce qui permet de faire la démonstration hors connexion.

## Arborescence

```
index.html                     page d'entrée, structure et ordre de chargement
assets/styles.css              système visuel, jetons de couleur et de typographie
assets/moteur.js               poids, catalogues de questions, formules normatives, indicateurs EDR
assets/donnees-demo.js         jeu de démonstration fictif, à remplacer librement
assets/interface.js            rendu des sept vues et interactions
assets/favicon.svg
robots.txt                     démonstrateur non indexable
.nojekyll                      publication sans traitement Jekyll
.github/workflows/pages.yml    publication automatique sur GitHub Pages
```

La séparation entre `moteur.js` et `donnees-demo.js` est volontaire. Le moteur ne contient
aucune donnée d'exemple, ce qui permet de le réutiliser tel quel dans la réalisation.

## Changer le jeu de démonstration

Tout se joue dans `assets/donnees-demo.js`, qui expose un unique objet `S` contenant la campagne,
les signaux, les gisements, les suggestions, les chantiers communs et les scénarios.
Les réponses utilisent trois constructeurs définis dans `moteur.js` :

```js
a(valeur, preuve)                    // réponse simple, valeur dans ND, NA, 0, 1, 2, 3, 4
au(valeur, preuve, declare, objective)  // réponse du bloc U
c(maturite, preuve, impact, exposition) // contrôle du bloc C
```

Pour préparer une démonstration devant un établissement, remplacez les libellés de gisements
et de scénarios par des exemples de son secteur, et gardez les cotations telles quelles :
les statuts obtenus restent démonstratifs.

## Correspondance avec les documents normatifs

| Fonction du démonstrateur | Source |
|---|---|
| Parcours E0 à E8, statuts de signal, confirmation en une transaction | Procédure EDR V1.0, spécification fonctionnelle §6 |
| Indicateurs CO, CS, CC, CF, taux de nouveauté, confirmation croisée, rendement marginal | Spécification fonctionnelle §8.2 |
| Statut de couverture et invariants de clôture | Spécification fonctionnelle §8.3 et §8.4 |
| Fiche D, règles d'unicité, découverte avant scénario | Référentiel §4 |
| Ug, U, bornes basse et haute, potentiel latent et fourchette | Référentiel §5 |
| Deux meilleures voies de valeur et plafond à 69 | Référentiel §6.3 et §6.4 |
| Plafonds d'activabilité appliqués aux deux lectures | Référentiel §7.5 |
| Cibles C par profil, écarts, facteur k(M), risque résiduel, statut de passage | Référentiel §8 |
| Plafonds IA et suspension sur statut C | Référentiel §9.3 |
| O_V, O_L, O_Lc, statuts P0 à P6 au premier match | Référentiel §10.1 et §10.2, spécification §10.10 |
| L*, Pat, Lev, Div, S_g, Conf_g, statuts patrimoniaux exclusifs | Référentiel §10.5 |
| Cinq messages de restitution et vue d'explication | Référentiel §3.7, spécification §12.2 et §12.5 |

Deux conventions ont été prises là où les documents ne tranchent pas, et elles sont
signalées dans le code :

- les critères V01 à V06 reçoivent un poids nominal de 10 pour le seul calcul de la complétude et de la confiance, puisque le référentiel ne leur attribue pas de poids individuel ;
- lorsque Lev ou Div valent zéro, leur confiance repose sur le niveau de preuve attestant que l'inventaire des chantiers et des familles a été examiné, conformément au texte du référentiel.

## Données personnelles et sécurité

Le démonstrateur s'exécute entièrement dans le navigateur. Il n'envoie aucune requête,
n'écrit aucun cookie et ne conserve rien après un rechargement de page.
Les saisies faites pendant une démonstration disparaissent donc avec l'onglet.

Le jeu d'exemple ne contient ni donnée patient, ni donnée réelle d'établissement,
ni nom de professionnel. Cette règle doit être tenue si vous créez d'autres jeux d'exemple :
une adresse publique n'est pas le lieu où placer le patrimoine informationnel d'un établissement,
même sous forme de métadonnées.

La question de l'hébergement de santé ne se pose pas pour ce démonstrateur.
Elle devra être instruite et formalisée pour la plateforme réelle, y compris dans l'hypothèse
metadata-first, parce que la plateforme traitera des données personnelles de professionnels
et que des champs libres peuvent recevoir des informations non prévues.

## Points de calibration à observer pendant les pilotes

Le démonstrateur rend ces effets visibles sur le jeu d'exemple, ce qui en fait un bon support de discussion.

- Un scénario peut atteindre 84 sur 100 en valeur tout en restant non renseigné sur trois voies de valeur sur six. C'est l'effet direct de la règle des deux meilleures voies.
- Un gisement dont S_g dépasse 70 reste classé « instruire le patrimoine » dès qu'un scénario contributeur passe sous les seuils de complétude ou de confiance. L'incertitude prime, conformément à la correction V1.2.1.
- Un gisement qui porte un gain rapide peut se retrouver en « maintenir et veille » au patrimoine, parce que S_g pondère L* à 45 pour cent et que les trois autres composantes restent basses.
- Le rendement marginal diminue mécaniquement si la dernière passe est écourtée. Il gagnerait à être rapporté à l'effort consommé dans la passe.

## Décisions à prendre avant diffusion large

- Licence du dépôt et régime de réutilisation de la méthode.
- Mention de propriété et logotype dans l'en-tête.
- Nom de domaine, si le démonstrateur doit être présenté hors adresse `github.io`.
- Version du démonstrateur à figer avant chaque comité, pour que les chiffres montrés restent reproductibles.

## Versions

| Élément | Version |
|---|---|
| Référentiel de qualification | 1.2.2 du 10 août 2026 |
| Procédure EDR | 1.0, MVP sans connecteur |
| Spécification fonctionnelle et logique | 1.2.2 du 22 août 2026 |
| Modèle physique de données | 1.1.5 |
| Démonstrateur | 0.1 |
