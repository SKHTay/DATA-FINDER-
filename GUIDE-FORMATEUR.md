# Guide du formateur

Ce guide accompagne les six exercices intégrés à l'outil. Il donne le déroulé,
les points d'animation, les erreurs fréquentes et les réponses aux questions qui reviennent.

## Avant la séance

Vérifiez l'adresse de publication depuis un poste de la salle, avec le navigateur qui y est installé.

Demandez à chaque participant d'ouvrir un espace et de le renommer avec son nom, en haut de l'écran.
Le nom sert ensuite au fichier exporté.

Annoncez la règle de données dès l'ouverture : aucune donnée réelle de patient, aucun nom de
professionnel, aucun identifiant. Les exercices fonctionnent entièrement sur des exemples fictifs,
et le stockage local d'un navigateur n'est ni chiffré ni administré.

Prévoyez cinq minutes en fin de séance pour l'export et, sur poste partagé, la suppression des espaces.

## Déroulé proposé sur une journée

| Séquence | Durée | Contenu |
|---|---|---|
| Ouverture | 30 min | Objet du référentiel, distinction entre gisement et scénario, principe metadata-first |
| Exercice 1 | 30 min | Cadrer un périmètre et démontrer sa couverture |
| Exercice 2 | 30 min | Faire émerger un gisement que personne n'avait recensé |
| Reprise collective | 20 min | Ce que la triangulation a produit chez chacun |
| Exercice 3 | 20 min | Séparer le gisement du scénario |
| Exercice 4 | 40 min | Coter avec des preuves et non avec des impressions |
| Exercice 5 | 25 min | Relever une cible du bloc C par le profil du scénario |
| Exercice 6 | 30 min | Lire un portefeuille et repartir avec son dossier |
| Clôture | 25 min | Limites de l'outil, points de calibration, suites |

## Exercice 1, cadrer un périmètre

Point d'animation. La tentation est de décrire tout l'établissement. Le cadrage sert à pouvoir dire
« nous avons exploré ce périmètre selon notre protocole » plutôt que « nous avons trouvé toutes
les données de l'établissement ». Faites écrire les exclusions, c'est ce qui rend la phrase tenable.

Erreur fréquente. Déclarer toutes les unités prioritaires. La grille des angles morts devient
alors ingérable et la couverture ne progresse plus. Une unité secondaire reste dans le périmètre
sans entrer dans la grille.

Ce qu'il faut faire apparaître. Le statut de couverture reste insuffisant tant qu'une famille
critique n'est pas vérifiée, même avec toutes les unités explorées. L'outil refuse la clôture
et affiche quels critères restent ouverts.

## Exercice 2, faire émerger un gisement invisible

Point d'animation. Demandez de créer les trois signaux avec trois auteurs différents et trois canaux
différents. C'est la condition d'indépendance qui alimente le taux de confirmation croisée.

Erreur fréquente. Écarter un signal en doublon au lieu de le fusionner. L'écartement historise
un signal jugé non pertinent, la fusion rattache un signal à un gisement existant en conservant sa
provenance. Les deux sont tracés, mais ils ne disent pas la même chose au lecteur du rapport.

Question qui revient. Pourquoi ne pas laisser le moteur fusionner seul ? Parce qu'un rapprochement
sémantique n'est pas une preuve d'identité. Deux bases de radiologie peuvent porter le même nom et
couvrir deux populations distinctes. Le référentiel réserve la fusion à une décision humaine.

## Exercice 3, séparer le gisement du scénario

Point d'animation. Faites ouvrir les deux tableaux de bord côte à côte, dans deux onglets.
Même gisement, même source, même population, et deux résultats opposés.

Ce qu'il faut faire apparaître. Le scénario d'alerte prédictive obtient une valeur de 70 et reste
bloqué, parce que la maturité du contrôle de sécurité clinique est nulle pour un usage qui influence
directement un soin. Aucune valeur ne compense le bloc C.

Question qui revient. Le blocage est-il définitif ? Non. Il traduit l'état d'un contrôle à une date.
Il se lève par une analyse de risques clinique, une supervision définie et un mode dégradé,
pas par un arbitrage de priorité.

## Exercice 4, coter avec des preuves

Point d'animation. C'est l'exercice le plus utile et le plus contre-intuitif. Insistez sur la consigne :
ne modifier aucun niveau, seulement renseigner ce qui était en ND.

Ce qu'il faut faire apparaître. Le scénario passe du statut à instruire au statut à préparer.
Le potentiel latent avait déjà cette valeur. Ce qui a changé, c'est la capacité à s'appuyer dessus.

Erreur fréquente. Confondre le niveau et la preuve. Un niveau 4 exige une preuve vérifiée,
un niveau 3 une preuve documentée. Un participant qui coche 4 avec une preuve déclarative
crée une incohérence que le rapport laissera visible.

Question qui revient. Pourquoi une absence de preuve ne fait-elle pas baisser l'usage ?
Parce que sous-estimer l'usage actuel gonfle mécaniquement le potentiel latent, donc l'intérêt
apparent du scénario. Le référentiel interdit ce biais, et calcule une borne haute de l'usage
pour la lecture prudente.

## Exercice 5, relever une cible du bloc C

Point d'animation. Montrez la ligne des profils, puis cochez influence directe sur un soin.
Les cibles bougent, les écarts apparaissent, la liste des actions préalables s'allonge.

Ce qu'il faut faire apparaître. La maturité cible est déterminée par le moteur à partir du profil,
pas par le répondant. C'est ce qui rend deux évaluations comparables entre deux établissements.

Question qui revient. Le bloc C remplace-t-il l'analyse d'impact ? Non. C'est un pré-diagnostic
qui oriente vers les bonnes saisines et prépare le dossier. Il déclenche l'instruction, il ne la conduit pas.

## Exercice 6, lire un portefeuille

Point d'animation. Faites chercher le gisement dont le score patrimonial dépasse 70 et qui reste
classé à instruire. La règle est exclusive et appliquée dans l'ordre : l'incertitude prime toujours
sur une recommandation d'investissement.

Ce qu'il faut faire apparaître. Le portefeuille des scénarios et le portefeuille des gisements ne
répondent pas à la même question. Un gisement peut porter un gain rapide et ne pas justifier
d'investissement patrimonial.

Pour finir. Faites exporter le rapport, puis la sauvegarde. Le rapport se lit hors de l'outil et
peut servir de base de discussion en établissement. La sauvegarde sert à reprendre le travail
à la séance suivante.

## Ce qu'il faut dire sur les limites

L'outil applique les formules du référentiel V1.2.2. Ces formules sont des hypothèses de travail,
pas des constantes validées. Les poids d'activabilité au pourcent près et les coefficients du score
patrimonial n'ont pas été calibrés sur données terrain. Le dire en formation évite qu'un participant
présente ensuite un score comme une mesure.

Quatre effets méritent d'être montrés plutôt que masqués.

La règle des deux meilleures voies de valeur avantage un excellent cas d'usage spécialisé,
ce qui est voulu, mais permet un score élevé avec trois voies non renseignées.

Un seul scénario contributeur faible renvoie tout le patrimoine d'un gisement en instruction.

Un gisement qui porte un gain rapide peut être classé en maintien et veille au patrimoine.

Le rendement marginal baisse mécaniquement si la dernière passe est écourtée, ce qui permet
de décréter la convergence au lieu de la constater.

## Questions de participants auxquelles se préparer

Est-ce que l'outil se connectera un jour à notre système d'information ?
Le MVP est explicitement sans connecteur. La découverte repose sur la mobilisation organisée
des équipes, pas sur un scan technique. C'est une hypothèse de faisabilité que les pilotes doivent valider.

Combien de temps pour qualifier un gisement ?
Aucun document ne le chiffre à ce jour. C'est l'une des mesures attendues des pilotes,
et probablement le facteur limitant du déploiement.

Qui décide au bout de la chaîne ?
Une personne, jamais le moteur. Le niveau maximal recommandé est un pilote contrôlé,
soumis aux validations compétentes.
