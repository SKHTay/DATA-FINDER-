/* ancres.js, aides à la cotation
   Ancres de niveau extraites du référentiel de qualification V1.2.2, sections 5.2, 5.3,
   6.2, 7.2, 8.2, 8.3 et 9.2. Texte repris sans reformulation.
   Ce fichier est un support de formation : il s'affiche au moment de coter.
*/

'use strict';

/* Échelle générique de maturité, section 3.1 */
const ECHELLE = [
 ["Absent ou rédhibitoire","Le critère n'est pas satisfait ou un obstacle avéré empêche l'usage envisagé."],
 ["Repéré","Le sujet est connu, mais repose surtout sur une hypothèse, une pratique locale ou une déclaration non stabilisée."],
 ["Partiel","Des éléments existent et un test est possible, mais la couverture, la documentation ou la maîtrise restent incomplètes."],
 ["Maîtrisé","Le critère est satisfait de manière documentée, reproductible et adaptée au cas d'usage."],
 ["Prouvé et piloté","Le critère est satisfait, vérifié par des mesures ou des tests, suivi dans le temps et assorti d'un responsable."]
];

/* Ancres de contrôle du bloc C, section 8.3 */
const ECHELLE_C = [
 "Contrôle absent, décision négative ou impossibilité avérée de satisfaire l'exigence.",
 "Risque identifié ; mesures informelles ou projetées, sans responsable ni preuve suffisante.",
 "Mesures partielles ; responsables connus ; documents ou tests incomplets.",
 "Mesures documentées, mises en œuvre, testées et adaptées au scénario.",
 "Mesures vérifiées, surveillées, auditées et améliorées dans le temps."
];

/* Niveaux de preuve, section 3.3 */
const NIVEAUX_PREUVE = [
 ["E0","Aucune preuve","Réponse absente, contradictoire ou non attribuée"],
 ["E1","Déclaratif","Entretien, estimation d'un professionnel identifié"],
 ["E2","Documenté","Dictionnaire, procédure, contrat, journal, rapport qualité, capture ou export"],
 ["E3","Vérifié","Test d'extraction, profilage, échantillon contrôlé, audit ou mesure reproductible"]
];

/* Règles de preuve opposables, section 3.3 */
const REGLES_PREUVE = [
 "Un niveau de maturité 4 exige une preuve E3.",
 "Un niveau 3 exige au moins E2.",
 "En cas de contradiction non résolue, le niveau le plus prudent est retenu et une anomalie est créée.",
 "Une preuve de plus de douze mois doit être reconfirmée pour la volumétrie, la qualité, l'accès, la sécurité et la gouvernance."
];

/* Ancres par critère, niveaux 0 à 4 */
const ANCRES = {
  UG01: ["Aucun usage identifié","Usage exceptionnel ou individuel","Usage périodique dans un processus","Usage fréquent et stabilisé","Usage continu, suivi et critique pour plusieurs activités"],
  UG02: ["Aucun usage","Usage initial uniquement","Une réutilisation secondaire","Plusieurs finalités distinctes","Portefeuille diversifié de finalités avec gouvernance"],
  UG03: ["Aucun utilisateur identifié","Individu ou équipe isolée","Plusieurs équipes proches","Plusieurs métiers ou unités","Usage transversal, multi-site ou territorial"],
  UG04: ["Aucune exploitation","Consultation ou export manuel","Reporting ou recherche simple","Analytique, rapprochement ou automatisation","Modèles avancés ou services intégrés, surveillés et réutilisés"],
  UG05: ["Aucune part mobilisée","Fraction marginale","Sous-ensemble significatif","Majorité utile exploitée","Richesse pertinente largement exploitée et suivie"],
  U01: ["Aucun usage correspondant","Contournement informel ou très éloigné","Solution partielle couvrant une partie du besoin","Processus stabilisé couvrant l'essentiel du besoin","Finalité déjà satisfaite de manière démontrée"],
  U02: ["Aucune","Pilote isolé ou moins de 10 %","Couverture partielle ou hétérogène","Majorité de la cible couverte","Couverture quasi générale et équitable"],
  U03: ["Jamais","Occasionnel et dépendant d'une personne","Périodique mais fragile","Régulier, documenté et fiable","Intégré au workflow, suivi et disponible au niveau requis"],
  U04: ["Rien n'est mobilisé","Fraction marginale","Sous-ensemble utile mais incomplet","Majorité de l'information nécessaire","Toute la richesse pertinente est mobilisée et maintenue"],
  U05: ["Aucun bénéfice constaté","Bénéfice supposé ou marginal","Bénéfice partiel, mesure incomplète","Bénéfice important mesuré","Cible atteinte ou dépassée de façon durable"],
  V01: ["Aucun lien avec les soins ou effet négatif plausible","Hypothèse générale sans processus ni bénéficiaire identifié","Effet plausible sur un processus ciblé","Bénéfice attendu documenté avec professionnels et indicateur","Bénéfice démontré ou fortement étayé, mesurable sur résultats ou sécurité"],
  V02: ["Aucun effet","Opportunité évoquée","Étape de parcours et acteurs identifiés","Usage partagé défini, avec rupture ou délai mesurable","Amélioration démontrée ou priorité de parcours institutionnelle"],
  V03: ["Aucun apport","Hypothèse diffuse","Population et action de prévention identifiées","Programme ou décision populationnelle défini avec indicateur","Impact attendu majeur ou déjà observé, incluant suivi de l'équité"],
  V04: ["Aucun gain","Gain supposé","Processus et ordre de grandeur identifiés","Gain quantifié, sponsor et indicateur disponibles","Gain démontré, récurrent et significatif à l'échelle de l'organisation"],
  V05: ["Aucun usage crédible","Question générale","Protocole, indicateur ou population esquissé","Question formalisée, équipe et méthode identifiées","Programme actif ou forte capacité de réutilisation scientifique/évaluative"],
  V06: ["IA sans problème défini ou inappropriée","Idée technologique","Tâche, utilisateur et sortie attendue définis","Bénéfice IA plausible, baseline et protocole d'évaluation identifiés","Valeur ajoutée démontrée face à une baseline, avec usage et supervision définis"],
  V07: ["Aucun besoin ni sponsor","Intérêt isolé","Besoin confirmé par plusieurs utilisateurs ou une priorité locale","Sponsor, utilisateurs et feuille de route identifiés","Priorité stratégique financée, portée et assortie d'une décision attendue"],
  V08: ["Marginal ou exceptionnel","Faible portée","Portée significative dans une unité","Plusieurs unités ou usage fréquent","Impact transversal, territorial ou sur une population importante"],
  V09: ["Facilement remplaçable","Utilité locale faible","Difficile à reconstituer partiellement","Historique, expertise ou modalité rare","Actif unique, critique, longitudinal ou irremplaçable"],
  V10: ["Aucun résultat observable","Résultat formulé vaguement","Indicateur possible, baseline à construire","Baseline, cible et horizon définis","Mesure robuste disponible, attribution ou comparaison réalisable"],
  A01: ["Source inconnue","Localisation approximative ou dépendante d'une personne","Sources principales repérées, périmètre incomplet","Cartographie documentée et reproductible","Cartographie tenue à jour, dépendances et flux vérifiés"],
  A02: ["Aucun responsable","Contacts informels","Rôles pressentis, arbitrage incertain","Responsables nommés, rôles et circuit de décision documentés","Gouvernance active, indicateurs et revues périodiques"],
  A03: ["Accès impossible ou interdit pour l'usage","Extraction manuelle, fragile ou non testée","Export partiel ou test ponctuel réussi","Extraction reproductible, sécurisée et documentée","Flux industrialisé, surveillé, versionné et réversible"],
  A04: ["Données inutilisables ou couverture inconnue","Lacunes majeures","Couverture hétérogène mais quantifiée partiellement","Complétude mesurée et compatible avec l'usage","Seuils atteints, causes des manquants suivies et corrigées"],
  A05: ["Erreurs majeures ou inconnues","Anomalies fréquentes non mesurées","Profilage ou contrôles partiels","Règles qualité documentées, anomalies compatibles avec l'usage","Qualité mesurée en continu, corrections et traçabilité maîtrisées"],
  A06: ["Données ininterprétables","Sens dépendant d'experts locaux","Dictionnaire partiel, ambiguïtés connues","Dictionnaire versionné, règles et provenance documentées","Métadonnées actives, lignage et gestion des changements"],
  A07: ["Format propriétaire inexploitable","Transformation lourde non spécifiée","Formats exploitables, mappings partiels","Standards ou mappings documentés et testés","Conformité vérifiée aux profils pertinents, tests réguliers"],
  A08: ["Insuffisant ou inconnu","Très faible ou mal dénombré","Potentiellement suffisant, estimation disponible","Suffisant selon calcul ou test, granularité adaptée","Marge robuste, sous-groupes couverts et croissance suivie"],
  A09: ["Population inadéquate ou non rapprochable","Biais majeurs inconnus","Couverture et liaisons partielles","Biais mesurés, rapprochements testés, limites documentées","Couverture maîtrisée, sous-groupes suivis, rapprochements fiables"],
  A10: ["Temporalité incompatible","Historique ou fraîcheur très insuffisant","Partiellement adapté","Fenêtre et fréquence adaptées, ruptures connues","Continuité surveillée, mises à jour fiables et engagements tenus"],
  A11: ["Effort prohibitif ou dépendance insoluble","Projet lourd sans ressources","Effort significatif mais planifiable","Effort modéré, ressources et étapes identifiées","Faible effort, composants réutilisables et équipe disponible"],
  IA01: ["Solution IA sans problème","Idée générale","Tâche et utilisateur définis","Workflow, baseline et critères de succès définis","Besoin validé, baseline mesurée, valeur différentielle démontrable"],
  IA02: ["Aucun signal exploitable","Signal supposé","Échantillon plausible","Adéquation testée sur échantillon","Signal robuste, documentation et tests reproductibles"],
  IA03: ["Aucune référence possible","Référence subjective non cadrée","Annotation ou proxy possible","Protocole, experts et accord inter-évaluateurs prévus","Référence validée, qualité mesurée et processus d'arbitrage établi"],
  IA04: ["Très insuffisant/inadapté","Volume faible ou monocentrique non analysé","Volume plausible, diversité partielle","Calcul et découpages entraînement/test définis","Validation externe/temporelle possible et sous-groupes suffisamment couverts"],
  IA05: ["Succès non mesurable","Métrique générique","Métriques principales choisies","Seuils, jeu de test et protocole définis","Protocole comparatif, métriques par sous-groupe et décision go/no-go"],
  IA06: ["Aucun workflow sûr","Démonstrateur isolé","Intégration et supervision esquissées","Workflow, rôles, interface et mode dégradé définis","Test utilisateur réussi, charge, recours et responsabilité mesurés"],
  IA07: ["Aucun responsable après prototype","Maintenance non planifiée","Responsable et métriques pressentis","Plan de monitoring, versionnage et retrait défini","Surveillance testée, seuils d'alerte et ressources pérennes"]
};

/* Preuves attendues pour les contrôles du bloc C, section 8.2 */
const PREUVES_C = {
  C01: "Fiche de traitement, registre, analyse juridique/DPO, protocole, décision du responsable de traitement",
  C02: "Notice d'information, matrice de minimisation, politique de conservation, procédure droits",
  C03: "Matrice d'habilitation, engagements de confidentialité, revues de droits, journaux d'accès",
  C04: "Analyse de risques SSI, architecture, contrats, qualification d'hébergement applicable, tests, plan d'incident",
  C05: "Stratégie de pseudonymisation/anonymisation, séparation des clés, test de réidentification, règles de sortie",
  C06: "Analyse de risques clinique, protocole de validation, responsabilités, seuils d'alerte, mode dégradé",
  C07: "Analyse de population, métriques par groupe, revue métier/éthique, plan de mitigation",
  C08: "RACI, lignage, journaux, versionnage, dossier de décision, procédure d'audit",
  C09: "Note de qualification, formalité ou autorisation, protocole recherche, analyse DM/IA, avis compétent"
};
