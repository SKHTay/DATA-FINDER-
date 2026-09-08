/* libelles.js, couche de langage produit
   Applique le dictionnaire du guide UX Data Finder V1.0, section 3.
   Règle : l'interface expose le terme utilisateur. Les codes méthodologiques
   n'apparaissent qu'en second niveau, dans Méthode et traçabilité.
   Le modèle métier et le moteur ne connaissent pas ce fichier.
*/

'use strict';

const PRODUIT = {
  nom: "Data Finder",
  accroche: "Révélez le potentiel inexploité de vos données.",
  sous: "Recensez vos actifs de données, identifiez de nouveaux usages et décidez où agir en priorité."
};

/* Navigation principale, cinq destinations au maximum */
const SECTIONS = [
  ["apercu",    "Vue d'ensemble", "M4 12h4l2-6 3 12 2-6h5"],
  ["explorer",  "Explorer",       "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4"],
  ["actifs",    "Actifs de données", "M4 6h16M4 12h16M4 18h10"],
  ["usages",    "Cas d'usage",    "M5 12l4 4L19 6"],
  ["priorites", "Priorités",      "M6 20V10M12 20V4M18 20v-7"]
];

/* Origines d'une piste, remplacent R1 à R5 */
const ORIGINES = {
  R1:"Document ou inventaire officiel",
  R2:"Système ou application",
  R3:"Usage réel observé",
  R4:"Équipe métier",
  R5:"Fichier ou outil local"
};

/* États d'une case de couverture */
const ETATS_CASE = {NC:"À vérifier", ID:"Trouvée", AB:"Absente", NA:"Non applicable"};

/* Niveaux, libellé français avant le code */
const NIVEAU_ND = "À déterminer";
const NIVEAU_NA = "Non applicable";
const PREUVES = [
  {code:"E0", label:"Aucun élément"},
  {code:"E1", label:"Déclaré"},
  {code:"E2", label:"Documenté"},
  {code:"E3", label:"Vérifié"}
];

/* Statuts décisionnels, section 29 du guide */
const STATUTS = {
  P0:{label:"Ne pas poursuivre en l'état", action:"Un prérequis critique empêche d'aller plus loin", ton:"encre"},
  P4:{label:"Compléter avant de décider",  action:"Des informations importantes manquent encore", ton:"hach"},
  P1:{label:"Prêt à cadrer un pilote",     action:"Les conditions sont réunies pour cadrer un pilote encadré", ton:"teal"},
  P2:{label:"À préparer avant pilote",     action:"Un travail ciblé est nécessaire avant de tester l'usage", ton:"violet"},
  P3:{label:"Usage simple à tester",       action:"Cet usage peut être testé rapidement et de façon mesurable", ton:"lime"},
  P5:{label:"À approfondir",               action:"Conservez l'hypothèse et approfondissez-la lorsque le contexte sera plus favorable", ton:"gris"},
  P6:{label:"À surveiller",                action:"Aucun investissement prioritaire n'est recommandé actuellement", ton:"gris"}
};
const ORDRE_STATUTS = ["P1","P3","P2","P5","P4","P6","P0"];

/* Prérequis et risques */
const STATUT_PREREQUIS = {
  ADMISSIBLE:{label:"Prérequis satisfaits", ton:"teal"},
  CONDITIONNEL:{label:"Prérequis à traiter", ton:"hach"},
  NON_EVALUE:{label:"Prérequis non évalués", ton:"hach"},
  BLOQUE:{label:"Prérequis bloquant", ton:"encre"}
};

/* Dimensions de l'évaluation */
const DIMENSIONS = [
  {cle:"U",  titre:"Usage actuel",
   question:"Dans quelle mesure ce besoin est-il déjà couvert aujourd'hui ?"},
  {cle:"V",  titre:"Valeur potentielle",
   question:"Qu'apporterait cet usage s'il fonctionnait comme prévu ?"},
  {cle:"A",  titre:"Capacité de mise en œuvre",
   question:"Dans quelle mesure cet usage peut-il être testé avec les données, équipes et moyens disponibles ?"},
  {cle:"C",  titre:"Prérequis et risques",
   question:"Quelles conditions doivent impérativement être satisfaites avant d'aller plus loin ?"},
  {cle:"IA", titre:"Pertinence pour l'IA",
   question:"Une composante IA apporterait-elle quelque chose d'utile, mesurable et contrôlable ?"}
];

/* Appréciations qualitatives affichées avant le chiffre */
const direPotentiel = v => v<20?"Très faible":v<40?"Limité":v<60?"Significatif":v<80?"Fort":"Majeur";
const direCapacite  = v => v<25?"Très limitée":v<40?"Limitée":v<60?"Correcte":v<75?"Bonne":"Élevée";
const direValeur    = v => v<25?"Faible":v<50?"À préciser":v<70?"Crédible":v<85?"Forte":"Stratégique";
const direUsage     = v => v<20?"Presque pas exploité":v<40?"Peu exploité":v<60?"Partiellement exploité":v<80?"Largement exploité":"Besoin déjà couvert";

/* Questions de la description d'un actif, section 16 du guide */
const QUESTIONS_ACTIF = [
  ["nom",         "Comment appelle-t-on ces données ?", "D02", ""],
  ["definition",  "Que contient cet actif ?", "D03", "Précisez aussi ce qui n'en fait pas partie."],
  ["sources",     "D'où viennent les données ?", "D06", ""],
  ["producteur",  "Qui produit ces données ?", "D07", ""],
  ["rmetier",     "Qui en est responsable côté métier ?", "D08", ""],
  ["rtech",       "Qui peut répondre sur leur stockage ou leur fonctionnement technique ?", "D09", ""],
  ["population",  "Quelles personnes, activités ou objets sont concernés ?", "D10", ""],
  ["periode",     "Depuis quand existent-elles et à quelle fréquence évoluent-elles ?", "D11", ""],
  ["modalites",   "Sous quelle forme existent-elles ?", "D12", ""],
  ["granularite", "Quel est leur niveau de détail ?", "D13", ""],
  ["sensibilite", "Quel niveau de sensibilité faut-il anticiper ?", "D15", ""],
  ["usageInitial","À quoi servent-elles aujourd'hui ?", "D16", ""],
  ["contraintes", "Quelles contraintes sont déjà connues ?", "D19", ""]
];

/* Questions du périmètre, section 8 du guide */
const QUESTIONS_PERIMETRE = [
  ["nom",        "Comment nommez-vous cette exploration ?", "texte", ""],
  ["pilote",     "Qui la pilote ?", "texte", "Fonction ou direction responsable"],
  ["perimetre",  "Quelles parties de l'organisation sont concernées ?", "zone", ""],
  ["exclusions", "Qu'est-ce qui est explicitement hors périmètre ?", "zone", ""],
  ["debut",      "Quand l'exploration a-t-elle commencé ?", "texte", "AAAA-MM-JJ"]
];

/* Questions de création d'un cas d'usage, section 20 du guide */
const QUESTIONS_USAGE = [
  ["titre",       "Quel problème voulez-vous résoudre ?", "Formulez-le en une phrase."],
  ["beneficiaire","Qui bénéficiera du résultat ?", ""],
  ["decision",    "Quelle décision ou action sera améliorée ?", ""],
  ["resultat",    "Quel résultat concret attendez-vous ?", ""],
  ["population",  "Sur quelle population ?", ""],
  ["horizon",     "À quel horizon souhaitez-vous tester cet usage ?", "Par exemple 6 mois."]
];

/* Profils qui déterminent les niveaux requis */
const PROFILS_USAGE = {
  PERSONNEL_SANTE:"Données personnelles de santé",
  IDENTIFIANT:"Personnes directement identifiables",
  GRANDE_ECHELLE:"Grande échelle ou plusieurs sources",
  INFLUENCE_SOIN:"Influence directe sur un soin",
  DECISION_AUTO:"Décision automatisée sur une personne",
  RECHERCHE:"Recherche, étude ou entrepôt",
  TRANSFERT_EXTERNE:"Transfert externe ou nouveau prestataire",
  PUBLICATION:"Publication ou partage ouvert"
};

/* Raisons de signalement d'une piste */
const RAISONS = ["Peu utilisées","Utilisation limitée à un seul processus","Historique important",
  "Données peu connues","Difficiles d'accès","Beaucoup de travail manuel","Peu analysées",
  "Contenu riche en texte ou documents","Rapprochement possible avec d'autres données",
  "Demande récurrente d'autres équipes","Usage possible encore inconnu"];

/* Statut patrimonial d'un actif */
const STATUT_ACTIF = {
  "Candidat à investissement":{label:"Potentiel stratégique élevé", ton:"lime"},
  "Investissement sélectif":{label:"Potentiel stratégique sélectif", ton:"violet"},
  "Instruire le patrimoine":{label:"À compléter avant d'investir", ton:"hach"},
  "Maintenir / veille":{label:"À maintenir en l'état", ton:"gris"}
};
