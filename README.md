# Démonstrateur du moteur unifié de recensement et de qualification des gisements

Outil de formation. Il déroule la chaîne complète décrite par le référentiel V1.2.2 :
campagne EDR, signal, gisement canonique, Q1, Q2, portefeuilles, décision humaine.
Chaque participant travaille sur son poste, conserve son travail d'une séance à l'autre
et repart avec un rapport et une sauvegarde.

Application web statique, sans serveur ni base. Aucune dépendance, aucun script de construction,
aucun outil de mesure d'audience.

## Ce que le participant peut faire

- Cadrer une campagne : périmètre, exclusions, unités, systèmes connus, contributeurs.
- Remplir la grille des angles morts et suivre les indicateurs de couverture.
- Créer des signaux, les confirmer, les fusionner ou les écarter, et voir naître le gisement canonique.
- Rédiger une fiche D complète et coter le profil d'usage patrimonial.
- Formuler un scénario, ou valider une suggestion du moteur de découverte.
- Coter les blocs U, V, A, C et IA, avec les ancres du référentiel affichées au moment de coter,
  la gestion de ND et NA, le niveau de preuve et la distinction entre usage déclaré et usage objectivé.
- Lire le tableau de bord à cinq messages, ouvrir la vue d'explication, comparer les deux portefeuilles.
- Exporter un rapport lisible, exporter une sauvegarde, imprimer.

## Ce que l'outil ne fait pas

Il ne se connecte à aucun système d'information. Il ne produit aucune décision opposable
et ne remplace ni l'avis du délégué à la protection des données, ni la validation sécurité,
ni la validation clinique. Il ne partage rien entre participants : chaque poste est isolé.

## Points de départ

Trois espaces sont proposés au démarrage.

| Espace | Contenu | Usage en formation |
|---|---|---|
| Cas hôpital, établissement pilote H1 | Campagne avancée, quatre unités prioritaires, cinq gisements, cinq scénarios cotés | Lecture, cotation, arbitrage |
| Cas maison de santé, MSP M1 | Campagne légère sans direction des systèmes d'information, trois signaux, aucun scénario | Recensement en environnement peu doté |
| Espace vierge | Rien | Cadrage de bout en bout |

Un participant peut ouvrir plusieurs espaces et passer de l'un à l'autre.
Toutes les données fournies sont fictives.

## Exercices

Six exercices sont intégrés à l'outil, onglet Exercices, du cadrage d'un périmètre
à la lecture du portefeuille patrimonial. Chacun indique son point de départ, sa durée,
ses étapes et le résultat attendu. Le guide du formateur détaille les points d'animation,
les erreurs fréquentes et les questions qui reviennent.

## Mettre en ligne sur GitHub Pages

1. Créez un dépôt, par exemple `demonstrateur-gisements`.
2. Déposez les onze fichiers à la racine, sans créer de sous-dossier.
3. Poussez sur la branche `main`.
4. Dans Settings, Pages, choisissez la source **Deploy from a branch**, branche `main`, dossier `/ (root)`.
5. Enregistrez. La première publication prend une à deux minutes.

Aucun workflow GitHub Actions n'est nécessaire. Chaque modification poussée sur `main` est republiée.

Le dépôt peut rester privé si votre plan GitHub autorise Pages sur les dépôts privés.
Sinon un dépôt public convient, puisque rien de réel n'y figure. Le fichier `robots.txt`
et la balise `noindex` évitent que l'outil soit indexé et pris pour un produit en service.

## Ouvrir sans rien installer

Ouvrez `index.html` dans un navigateur. Tout fonctionne depuis le système de fichiers local,
ce qui permet de former hors connexion. L'enregistrement fonctionne aussi, mais séparément
de la version en ligne, puisque le navigateur distingue les deux origines.

## Arborescence

```
index.html          page d'entrée et ordre de chargement
styles.css          système visuel, jetons de couleur et de typographie
moteur.js           poids, catalogues de questions, formules normatives, indicateurs EDR
ancres.js           ancres de cotation et niveaux de preuve, repris du référentiel
cas.js              trois points de départ, tous fictifs
persistance.js      espaces de travail, enregistrement local, export et import
interface.js        rendu des vues, formulaires, exercices et rapports
favicon.svg
robots.txt
README.md
GUIDE-FORMATEUR.md
```

Le moteur ne contient aucune donnée d'exemple. Il peut être repris tel quel dans la réalisation
et servir de test de non-régression contre le futur service.

## Ajouter un cas de formation

Ouvrez `cas.js`. Chaque cas est une fonction qui renvoie un état neuf, déclarée dans l'objet `CAS`.
Copiez `casMSP`, changez le contenu, ajoutez une entrée dans `CAS`. Les réponses utilisent
trois constructeurs définis dans `moteur.js` :

```js
a(valeur, preuve)                        // réponse simple, valeur dans ND, NA, 0, 1, 2, 3, 4
au(valeur, preuve, declare, objective)   // réponse du bloc U
c(maturite, preuve, impact, exposition)  // contrôle du bloc C
```

Pour préparer une session avec un établissement, gardez les cotations et remplacez les libellés
par des exemples de son secteur. Les statuts obtenus restent démonstratifs.

## Où va le travail des participants

Tout est enregistré dans le stockage local du navigateur, sur le poste, sous les clés
`cius.gisements.index` et `cius.gisements.espace.*`. Rien n'est envoyé sur un serveur,
même en version publiée, puisque le code ne fait aucune requête réseau.

Trois conséquences pratiques.

Un participant qui change de poste ou de navigateur ne retrouve pas son travail.
Il doit exporter sa sauvegarde et la recharger sur l'autre poste.

En navigation privée, l'enregistrement peut être bloqué. L'outil le détecte et l'affiche.

Sur un poste partagé en salle de formation, les espaces restent après la séance.
Demandez aux participants de supprimer leurs espaces depuis l'écran Mes espaces,
ou prévoyez un nettoyage des navigateurs en fin de session.

## Données personnelles

Le jeu d'exemple ne contient ni donnée patient, ni donnée réelle d'établissement, ni nom de professionnel.
Cette règle doit être tenue pendant la formation. Le stockage local n'est ni chiffré, ni sauvegardé,
ni administré. Il n'est pas le lieu où placer le patrimoine informationnel réel d'un établissement,
même sous forme de métadonnées, et un rapport exporté depuis un exercice ne vaut pas inventaire.

La question de l'hébergement de santé ne se pose pas pour cet outil. Elle devra être instruite
et formalisée pour la plateforme réelle, y compris dans l'hypothèse metadata-first, parce que
la plateforme traitera des données personnelles de professionnels et que des champs libres
peuvent recevoir des informations non prévues.

## Correspondance avec les documents normatifs

| Fonction | Source |
|---|---|
| Parcours E0 à E8, statuts de signal, confirmation en une transaction | Procédure EDR V1.0, spécification fonctionnelle §6 |
| Indicateurs CO, CS, CC, CF, nouveauté, confirmation croisée, rendement marginal | Spécification fonctionnelle §8.2 |
| Statut de couverture et invariants de clôture | Spécification fonctionnelle §8.3 et §8.4 |
| Fiche D, règles d'unicité, découverte avant scénario | Référentiel §4 |
| Ug, U, bornes basse et haute, potentiel latent et fourchette | Référentiel §5 |
| Deux meilleures voies de valeur et plafond à 69 | Référentiel §6.3 et §6.4 |
| Plafonds d'activabilité appliqués aux deux lectures | Référentiel §7.5 |
| Cibles C par profil, écarts, facteur k(M), risque résiduel, statut de passage | Référentiel §8 |
| Ancres de cotation et niveaux de preuve affichés à la saisie | Référentiel §3.1, §3.3, §5.2, §5.3, §6.2, §7.2, §8.2, §8.3 et §9.2 |
| Plafonds IA et suspension sur statut C | Référentiel §9.3 |
| Scores d'opportunité et statuts P0 à P6 au premier match | Référentiel §10.1 et §10.2, spécification §10.10 |
| L*, Pat, Lev, Div, S_g, Conf_g, statuts patrimoniaux exclusifs | Référentiel §10.5 |
| Cinq messages de restitution et vue d'explication | Référentiel §3.7, spécification §12.2 et §12.5 |

Deux conventions ont été prises là où les documents ne tranchent pas, et elles sont signalées dans le code.

Les critères V01 à V06 reçoivent un poids nominal de 10 pour le seul calcul de la complétude
et de la confiance, puisque le référentiel ne leur attribue pas de poids individuel.

Lorsque Lev ou Div valent zéro, leur confiance repose sur le niveau de preuve attestant que
l'inventaire des chantiers et des familles a été examiné, conformément au texte du référentiel.

## Points de calibration à observer

- Un scénario peut atteindre 84 sur 100 en valeur en restant non renseigné sur trois voies sur six. C'est l'effet de la règle des deux meilleures voies.
- Un gisement dont S_g dépasse 70 reste classé à instruire dès qu'un scénario contributeur passe sous les seuils de confiance. L'incertitude prime.
- Un gisement qui porte un gain rapide peut se retrouver en maintien et veille au patrimoine, parce que S_g pondère L* à 45 pour cent.
- Le rendement marginal diminue mécaniquement si la dernière passe est écourtée. Il gagnerait à être rapporté à l'effort consommé.

## Décisions à prendre avant diffusion large

- Licence du dépôt et régime de réutilisation de la méthode.
- Mention de propriété et logotype dans l'en-tête.
- Nom de domaine, si l'outil doit être présenté hors adresse `github.io`.
- Version à figer avant chaque session, pour que les résultats montrés restent reproductibles.

## Versions

| Élément | Version |
|---|---|
| Référentiel de qualification | 1.2.2 du 10 août 2026 |
| Procédure EDR | 1.0, MVP sans connecteur |
| Spécification fonctionnelle et logique | 1.2.2 du 22 août 2026 |
| Modèle physique de données | 1.1.5 |
| Outil | 0.2, version formation |
