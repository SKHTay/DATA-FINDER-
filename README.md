# Data Finder

Révélez le potentiel inexploité de vos données.

Data Finder permet de recenser les actifs de données d'une organisation de santé,
d'identifier de nouveaux usages et de décider où agir en priorité. L'interface expose
un langage métier. La méthode reste rigoureuse sous la surface.

Application web statique, sans serveur ni base. Aucune dépendance, aucun script de construction,
aucun outil de mesure d'audience.

## Ce que l'utilisateur peut faire

Cinq destinations, pas davantage.

| Destination | Contenu |
|---|---|
| Vue d'ensemble | Où en sommes-nous, ce qui mérite l'attention, la prochaine action utile |
| Explorer | Périmètre, couverture, pistes à vérifier, clôture de l'exploration |
| Actifs de données | Inventaire, description, sources, usage actuel, cas d'usage rattachés |
| Cas d'usage | Création guidée, évaluation, résultat, historique |
| Priorités | Cas d'usage, actifs de données, actions communes |

Chaque écran affiche une action principale unique et la prochaine action utile.
Le mode formation et la méthode sont accessibles depuis le menu de l'en-tête.

## Ce que l'outil ne fait pas

Il ne se connecte à aucun système d'information. Il ne produit aucune décision opposable
et ne remplace ni l'avis du délégué à la protection des données, ni la validation sécurité,
ni la validation clinique. Chaque poste est isolé, rien n'est partagé entre participants.

## Langage produit

Le vocabulaire méthodologique ne pilote plus la navigation. Il reste accessible dans
Méthode et traçabilité, dans les exports et dans les sections avancées de chaque écran.

| Terme méthodologique | Terme affiché |
|---|---|
| Campagne EDR | Exploration |
| Signal | Piste de données |
| Gisement | Actif de données |
| Scénario | Cas d'usage |
| Q1 et Q2 | Identifier des cas d'usage, Évaluation |
| U, V, L, A, C | Usage actuel, Valeur potentielle, Potentiel encore inexploité, Capacité de mise en œuvre, Prérequis et risques |
| Complétude et confiance | Informations renseignées, Fiabilité de l'évaluation |
| P0 à P6 | Ne pas poursuivre en l'état, Compléter avant de décider, Prêt à cadrer un pilote, À préparer avant pilote, Usage simple à tester, À approfondir, À surveiller |
| Portefeuilles | Priorités |
| Chantier commun | Action commune |

Le dictionnaire complet est dans `libelles.js`. Toute nouvelle notion méthodologique doit
recevoir un équivalent utilisateur dans ce fichier avant d'apparaître à l'écran.

## Points de départ

| Espace | Contenu | Usage |
|---|---|---|
| Cas hôpital, établissement pilote H1 | Exploration avancée, cinq actifs, cinq cas d'usage évalués | Lecture, évaluation, arbitrage |
| Cas maison de santé, MSP M1 | Exploration légère, trois pistes, aucun cas d'usage | Recensement en environnement peu doté |
| Espace vierge | Rien | Cadrage de bout en bout |

Toutes les données fournies sont fictives. Un utilisateur peut ouvrir plusieurs espaces
et passer de l'un à l'autre.

## Mettre en ligne sur GitHub Pages

1. Déposez les treize fichiers à la racine du dépôt, sans créer de sous-dossier.
2. Poussez sur la branche `main`.
3. Dans Settings, Pages, choisissez la source **Deploy from a branch**, branche `main`, dossier `/ (root)`.

Aucun workflow GitHub Actions n'est nécessaire. Chaque commit sur `main` est republié.

Ouvrir `index.html` directement dans un navigateur fonctionne aussi, y compris hors connexion.
L'enregistrement local reste distinct entre la version en ligne et la version locale, puisque
le navigateur distingue les deux origines.

## Arborescence

```
index.html          coque applicative et ordre de chargement
logo-cius.svg       logo affiché sur la page d'accueil et en pied de page
styles.css          système visuel, jetons, composants, responsive, impression
moteur.js           poids, formules du référentiel, indicateurs de couverture
ancres.js           repères de niveau et éléments de preuve, repris du référentiel
libelles.js         couche de langage produit, dictionnaire et libellés visibles
cas.js              trois points de départ, tous fictifs
persistance.js      espaces de travail, enregistrement local, export et import
interface.js        rendu des écrans, composants et interactions
favicon.svg
robots.txt
README.md
GUIDE-FORMATEUR.md
```

`logo-cius.svg` est un fichier de remplacement. Écrasez-le par le logo officiel, au format SVG,
en conservant le nom du fichier. Il est appelé à deux endroits, la page d'accueil et le pied de page,
avec une hauteur de 34 et 30 pixels. Aucune autre modification n'est nécessaire.

Trois couches séparées. Le moteur ignore le langage produit. Le langage produit ignore le rendu.
Le rendu n'invente aucune règle de calcul. Cette séparation permet de faire évoluer le
vocabulaire sans toucher aux formules, et inversement.

## Ajouter un point de départ

Ouvrez `cas.js`. Chaque cas est une fonction qui renvoie un état neuf, déclarée dans l'objet `CAS`.
Copiez `casMSP`, changez le contenu, ajoutez une entrée. Les réponses utilisent trois constructeurs
définis dans `moteur.js` :

```js
a(valeur, preuve)                        // réponse simple, valeur dans ND, NA, 0, 1, 2, 3, 4
au(valeur, preuve, declare, constate)    // usage actuel
c(niveau, preuve, gravite, exposition)   // prérequis et risques
```

## Où va le travail des utilisateurs

Tout est enregistré dans le stockage local du navigateur, sous les clés `cius.gisements.index`
et `cius.gisements.espace.*`. Le code ne fait aucune requête réseau.

Un utilisateur qui change de poste ou de navigateur ne retrouve pas son travail. Il doit exporter
une sauvegarde et la recharger. En navigation privée, l'enregistrement peut être bloqué,
l'outil le détecte et l'affiche. Sur un poste partagé, les espaces subsistent après la séance,
prévoyez leur suppression.

## Données personnelles

Les données d'exemple ne contiennent ni contenu patient, ni donnée réelle d'établissement,
ni nom de professionnel. Cette règle doit être tenue. Le stockage local n'est ni chiffré,
ni sauvegardé, ni administré. Un rapport exporté depuis un exercice ne vaut pas inventaire.

La question de l'hébergement de santé ne se pose pas pour cet outil. Elle devra être instruite
pour la plateforme réelle, y compris dans l'hypothèse metadata-first, parce que la plateforme
traitera des données personnelles de professionnels et que des champs libres peuvent recevoir
des informations non prévues.

## Accessibilité

Cibles interactives d'au moins 44 pixels, focus visible, navigation clavier, labels associés
aux champs, aucun état transmis par la couleur seule, prise en charge de la réduction des animations.
Les tableaux passent en cartes sous 900 pixels, aucun défilement horizontal n'est imposé.

## Conformité au guide UX

Le guide UX et langage produit V1.0 a été appliqué dans l'ordre P0, P1 puis P2. Trois écarts assumés
sont documentés ici.

La création d'un cas d'usage utilise les sept questions du guide dans un formulaire unique,
plutôt qu'un assistant en sept étapes. Le nombre d'écrans reste faible et le contenu est identique.

Les chaînes de métadonnées assemblées par points médians ont été remplacées par de la ponctuation
ordinaire, conformément aux règles de rédaction internes.

L'historique s'appuie sur un journal d'événements créé pour l'occasion. Il enregistre les créations,
les décisions sur les pistes, les changements de statut et la clôture de l'exploration.
Il ne restitue pas l'historique des valeurs saisies, qui suppose un modèle de révisions côté serveur.

## Limites méthodologiques à connaître

- Un cas d'usage peut afficher une valeur potentielle élevée en restant non renseigné sur trois voies de valeur sur six. C'est l'effet de la règle des deux meilleures voies.
- Un actif dont le potentiel stratégique dépasse 70 reste classé à compléter dès qu'un cas d'usage contributeur passe sous les seuils de fiabilité.
- Un actif qui porte un usage simple à tester peut être classé à maintenir en l'état, parce que le score patrimonial pondère le potentiel latent à 45 pour cent.
- Le rendement du dernier tour d'exploration diminue mécaniquement si ce tour est écourté.

## Décisions à prendre avant diffusion large

Licence du dépôt, mention de propriété dans l'en-tête, nom de domaine,
et version à figer avant chaque session pour que les résultats montrés restent reproductibles.

## Versions

| Élément | Version |
|---|---|
| Référentiel de qualification | 1.2.2 du 10 août 2026 |
| Procédure d'exploration structurée | 1.0, sans connecteur |
| Spécification fonctionnelle et logique | 1.2.2 du 22 août 2026 |
| Modèle physique de données | 1.1.5 |
| Guide UX et langage produit | 1.0 |
| Data Finder | 0.4 |
