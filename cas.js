/* cas.js, jeux de travail
   Trois points de départ : un cas hôpital complet, un cas maison de santé allégé
   et un espace vierge. Toutes les données sont fictives. Aucun établissement réel,
   aucun professionnel réel, aucun contenu patient.
   Chaque fonction renvoie un état neuf, jamais une référence partagée.
*/

'use strict';

const CAS = {
  hopital: {
    nom: "Cas hôpital, établissement pilote H1",
    resume: "Campagne avancée sur quatre unités, cinq gisements et cinq scénarios déjà cotés. Sert aux exercices de lecture et de cotation.",
    creer: casHopital
  },
  msp: {
    nom: "Cas maison de santé, MSP M1",
    resume: "Campagne légère sans direction des systèmes d'information, trois signaux et un scénario à peine ouvert. Sert aux exercices de recensement.",
    creer: casMSP
  },
  vierge: {
    nom: "Espace vierge",
    resume: "Aucune campagne, aucun gisement. Sert à cadrer un périmètre de bout en bout.",
    creer: casVierge
  }
};

function casHopital(){
  const S = {
    view:"edr", tabQ:"U", scenarioCourant:"SCN-0001", gisementCourant:"GIS-0001",
    campagne:{
      id:"CMP-0001", nom:"Exploration des gisements, établissement pilote H1",
      perimetre:"Urgences, médecine interne, qualité et gestion des risques, DIM",
      pilote:"Direction de la donnée", debut:"2026-09-14", passe:2, contreExploration:true,
      exclusions:"Sauvegardes techniques, périmètre pédiatrie",
      unites:[
        {id:"ZON-01",nom:"Urgences",prio:true,etat:"EXPLOREE"},
        {id:"ZON-02",nom:"Médecine interne",prio:true,etat:"EXPLOREE"},
        {id:"ZON-03",nom:"Qualité et gestion des risques",prio:true,etat:"EXPLOREE"},
        {id:"ZON-04",nom:"DIM",prio:true,etat:"PREVUE"},
        {id:"ZON-05",nom:"Pharmacie à usage intérieur",prio:false,etat:"EXPLOREE"},
        {id:"ZON-06",nom:"Ingénierie biomédicale",prio:false,etat:"EXCLUE"}
      ],
      systemes:[
        {id:"SYS-01",nom:"DPI",etat:"EXAMINE"},{id:"SYS-02",nom:"PMSI / groupage",etat:"EXAMINE"},
        {id:"SYS-03",nom:"SGL laboratoire",etat:"EXAMINE"},{id:"SYS-04",nom:"PACS",etat:"A_REVOIR"},
        {id:"SYS-05",nom:"GED qualité",etat:"EXAMINE"},{id:"SYS-06",nom:"Entrepôt BI",etat:"EXAMINE"},
        {id:"SYS-07",nom:"Base Access urgences",etat:"EXAMINE"},{id:"SYS-08",nom:"Serveur ECG",etat:"A_REVOIR"},
        {id:"SYS-09",nom:"Gestion des lits",etat:"EXCLU"},{id:"SYS-10",nom:"Imagerie pédiatrique",etat:"HORS_PERIMETRE"}
      ],
      contributeurs:{sollicites:14,repondu:9,rolesAttendus:8,rolesCouverts:6},
      passes:[{id:"PAS-1",nouveaux:5},{id:"PAS-2",nouveaux:1}],
      cellules:{}  // rempli plus bas
    },
    signaux:[
      {id:"SIG-0001",nom:"Comptes rendus d'hospitalisation",zone:"ZON-02",canal:"R4",auteur:"Cadre de santé",wf:"RESOLU",res:"CONFIRME",gis:"GIS-0001",motif:"Contenu riche en texte, peu analysé"},
      {id:"SIG-0002",nom:"Lettres de liaison archivées",zone:"ZON-02",canal:"R1",auteur:"DSI",wf:"RESOLU",res:"FUSIONNE",gis:"GIS-0001",motif:"Historique important"},
      {id:"SIG-0003",nom:"Registre des événements indésirables",zone:"ZON-03",canal:"R1",auteur:"Qualité",wf:"RESOLU",res:"CONFIRME",gis:"GIS-0002",motif:"Peu analysé de façon agrégée"},
      {id:"SIG-0004",nom:"Fichier de suivi des passages non programmés",zone:"ZON-01",canal:"R5",auteur:"Secrétariat urgences",wf:"RESOLU",res:"CONFIRME",gis:"GIS-0003",motif:"Fichier local indispensable à l'équipe"},
      {id:"SIG-0005",nom:"Extractions PMSI mensuelles",zone:"ZON-04",canal:"R1",auteur:"DIM",wf:"RESOLU",res:"CONFIRME",gis:"GIS-0004",motif:"Demande récurrente d'autres équipes"},
      {id:"SIG-0006",nom:"Verbatim des questionnaires de sortie",zone:"ZON-03",canal:"R4",auteur:"Chargée de mission usagers",wf:"SOUMIS",res:null,gis:null,motif:"Usage potentiel inconnu"},
      {id:"SIG-0007",nom:"Tableur de suivi des refus de transfert",zone:"ZON-01",canal:"R4",auteur:"Médecin urgentiste",wf:"SOUMIS",res:null,gis:null,motif:"Beaucoup de travail manuel"},
      {id:"SIG-0008",nom:"Sauvegardes de l'ancien DPI",zone:"ZON-02",canal:"R2",auteur:"DSI",wf:"RESOLU",res:"ECARTE",gis:null,motif:"Hors périmètre de la campagne"},
      {id:"SIG-0009",nom:"Comptes rendus opératoires numérisés",zone:"ZON-02",canal:"R5",auteur:"Secrétariat médical",wf:"EN_REVUE",res:null,gis:null,motif:"Donnée peu connue des autres services"}
    ],
    gisements:[
      {id:"GIS-0001",nom:"Comptes rendus d'hospitalisation en médecine interne",famille:"Textes libres et comptes rendus",
       definition:"Comptes rendus de sortie et lettres de liaison saisis dans le DPI. N'inclut pas les comptes rendus opératoires ni les documents scannés externes.",
       sources:"DPI (module documents), GED archivage",producteur:"Médecins et internes, à la sortie du patient",
       rmetier:"Chef de service de médecine interne",rtech:"Responsable applicatif DPI",
       population:"Séjours de médecine interne, adultes",periode:"Depuis 2013, environ 4 200 documents par an",
       modalites:"Texte libre, PDF",granularite:"Document / séjour",sensibilite:"Données de santé, directement identifiantes",
       usageInitial:"Continuité des soins et transmission au médecin traitant",
       contraintes:"Export texte limité par le contrat éditeur, extraction par lot non testée",
       zone:"ZON-02",prealable:"NON",passe:"PAS-1",gouvernance:"IDENTIFIE",
       ug:{UG01:a(3,2),UG02:a(1,2),UG03:a(2,1),UG04:a(1,2),UG05:a(1,1)},V09:3,V09preuve:2},
      {id:"GIS-0002",nom:"Registre des événements indésirables associés aux soins",famille:"Qualité et événements indésirables",
       definition:"Déclarations internes d'événements indésirables, analyse de causes et suites données. N'inclut pas les réclamations des usagers.",
       sources:"GED qualité, base Access de la cellule qualité",producteur:"Tout professionnel déclarant",
       rmetier:"Responsable qualité et gestion des risques",rtech:"Référent applicatif qualité",
       population:"Événements déclarés sur l'ensemble de l'établissement",periode:"Depuis 2016, environ 900 déclarations par an",
       modalites:"Semi-structuré, texte libre",granularite:"Déclaration",sensibilite:"Données de santé indirectes, données de professionnels",
       usageInitial:"Traitement unitaire des déclarations et retour d'expérience",
       contraintes:"Base Access non maintenue, pas de dictionnaire",
       zone:"ZON-03",prealable:"OUI",passe:"PAS-1",gouvernance:"IDENTIFIE",
       ug:{UG01:a(2,2),UG02:a(1,2),UG03:a(2,2),UG04:a(1,2),UG05:a(1,1)},V09:2,V09preuve:2},
      {id:"GIS-0003",nom:"Fichier local des passages non programmés aux urgences",famille:"Fichiers locaux et tableurs",
       definition:"Tableur tenu par le secrétariat des urgences recensant les passages non enregistrés dans le logiciel de flux, motifs et orientation.",
       sources:"Tableur partagé sur le répertoire du service",producteur:"Secrétariat des urgences, saisie quotidienne",
       rmetier:"Cadre des urgences",rtech:"Aucun responsable technique identifié",
       population:"Passages non programmés",periode:"Depuis 2019, mise à jour quotidienne",
       modalites:"Structuré léger",granularite:"Passage",sensibilite:"Données de santé, identifiants indirects",
       usageInitial:"Suivi interne du service, préparation des staffs",
       contraintes:"Fichier hors sauvegarde institutionnelle",
       zone:"ZON-01",prealable:"NON",passe:"PAS-1",gouvernance:"A_IDENTIFIER",
       ug:{UG01:a(3,1),UG02:a(1,1),UG03:a(1,1),UG04:a(1,1),UG05:a(2,1)},V09:2,V09preuve:1},
      {id:"GIS-0004",nom:"Extractions PMSI et fichiers de pilotage d'activité",famille:"Pilotage et RH",
       definition:"Résumés de sortie groupés et extractions mensuelles produites par le DIM pour le pilotage et la facturation.",
       sources:"Logiciel de groupage, entrepôt BI",producteur:"DIM, à partir du codage des séjours",
       rmetier:"Médecin DIM",rtech:"Administrateur BI",
       population:"Ensemble des séjours MCO",periode:"Depuis 2010, production mensuelle",
       modalites:"Structuré",granularite:"Séjour",sensibilite:"Données de santé pseudonymisables",
       usageInitial:"Facturation, contrôle de gestion, rapports réglementaires",
       contraintes:"Calendrier de production contraint, chaînage inter-séjours à confirmer",
       zone:"ZON-04",prealable:"OUI",passe:"PAS-1",gouvernance:"IDENTIFIE",
       ug:{UG01:a(4,3),UG02:a(2,2),UG03:a(3,2),UG04:a(2,2),UG05:a(2,2)},V09:2,V09preuve:2},
      {id:"GIS-0005",nom:"Comptes rendus opératoires numérisés",famille:"Documents et GED",
       definition:"Comptes rendus opératoires scannés avant bascule sur le DPI, conservés dans la GED.",
       sources:"GED",producteur:"Secrétariat de bloc",rmetier:"À identifier",rtech:"Responsable GED",
       population:"Séjours chirurgicaux de 2011 à 2017",periode:"2011 à 2017, gisement figé",
       modalites:"Image, PDF non océrisé",granularite:"Document",sensibilite:"Données de santé, directement identifiantes",
       usageInitial:"Archivage réglementaire",contraintes:"Aucun OCR, qualité de numérisation hétérogène",
       zone:"ZON-02",prealable:"NON",passe:"PAS-2",gouvernance:"A_IDENTIFIER",
       ug:{UG01:a(1,1),UG02:a(1,1),UG03:a(1,1),UG04:a(1,1),UG05:a(0,1)},V09:3,V09preuve:2}
    ],
    suggestions:[
      {id:"SUG-0001",gis:"GIS-0005",titre:"Océrisation et recherche plein texte des comptes rendus opératoires de 2011 à 2017",
       voie:"V05",hypotheses:"Le fonds est figé et complet ; l'OCR atteint une qualité suffisante sur des documents scannés hétérogènes.",
       inconnues:"Qualité de numérisation, existence d'un index patient fiable, droit de réutilisation.",
       baseline:"Recherche manuelle dans la GED par date et nom, plusieurs heures par demande."},
      {id:"SUG-0002",gis:"GIS-0003",titre:"Mesure du volume réel de passages non programmés et de leur orientation",
       voie:"V04",hypotheses:"Le tableur couvre la majorité des passages non enregistrés dans le logiciel de flux.",
       inconnues:"Complétude de la saisie, doublons avec le logiciel de flux.",
       baseline:"Comptage manuel trimestriel par le cadre du service."}
    ],
    preuveInventaire:2,   // E2 : l'inventaire des chantiers et des familles a été examiné et documenté
    chantiers:[
      {id:"WRK-01",titre:"Voie d'extraction sécurisée du DPI documentaire et dictionnaire minimal",
       leve:["SCN-0001","SCN-0004"],preuve:2},
      {id:"WRK-02",titre:"Reprise de la base Access qualité dans un socle maintenu",leve:["SCN-0003"],preuve:1}
    ],
    scenarios:[
      { id:"SCN-0001", gis:"GIS-0001", stade:"QUALIFIE",
        titre:"Recherche sémantique dans les comptes rendus pour la faisabilité de cohortes",
        finalite:"Réduire le délai d'identification des patients éligibles à une étude",
        beneficiaire:"Équipes de recherche clinique et médecins de médecine interne",
        decision:"Décider d'ouvrir ou non une étude et dimensionner son recrutement",
        resultat:"Liste de séjours candidats produite en moins d'une journée au lieu de plusieurs semaines",
        population:"Séjours de médecine interne depuis 2013", horizon:"12 mois",
        origine:"Validation humaine d'une suggestion", cIA:false,
        profil:["PERSONNEL_SANTE","IDENTIFIANT","RECHERCHE"],
        u:{U01:au(1,2,1,1),U02:au(0,2,0,0),U03:au(1,1,1,null),U04:au(1,2,2,1),U05:au(0,2,0,0)},
        v:{V01:a(2,1),V02:a("ND",0),V03:a("ND",0),V04:a(2,2),V05:a(4,2),V06:a(3,2),
           V07:a(3,2),V08:a(3,2),V09:a(3,2),V10:a(2,2)},
        A:{A01:a(3,2),A02:a(3,2),A03:a(2,2),A04:a(2,2),A05:a(2,2),A06:a(2,2),A07:a(1,2),
           A08:a(3,2),A09:a(2,2),A10:a(3,2),A11:a(2,1)},
        c:{C01:c(2,2,3,3),C02:c(2,2,3,2),C03:c(3,2,4,2),C04:c(3,2,4,2),C05:c(2,2,3,3),
           C06:c(2,2,2,1),C07:c(2,1,2,2),C08:c(2,2,3,2),C09:c(2,2,3,2)},
        ia:{}
      },
      { id:"SCN-0002", gis:"GIS-0004", stade:"QUALIFIE",
        titre:"Repérage des réhospitalisations non programmées à 30 jours",
        finalite:"Identifier les services et profils de séjours à fort taux de réhospitalisation",
        beneficiaire:"Direction qualité, chefs de pôle",
        decision:"Cibler les actions d'amélioration de la préparation de la sortie",
        resultat:"Tableau de bord trimestriel par service, avec suivi de l'écart",
        population:"Séjours MCO adultes", horizon:"6 mois",
        origine:"Formulé par la direction qualité", cIA:false,
        profil:["PERSONNEL_SANTE","GRANDE_ECHELLE"],
        u:{U01:au(1,2,2,1),U02:au(1,2,1,1),U03:au(1,2,1,1),U04:au(2,2,2,2),U05:au(1,2,1,1)},
        v:{V01:a(3,2),V02:a(3,2),V03:a(2,2),V04:a(3,2),V05:a(2,2),V06:a(1,2),
           V07:a(3,2),V08:a(3,2),V09:a(2,2),V10:a(3,3)},
        A:{A01:a(4,3),A02:a(3,2),A03:a(3,3),A04:a(3,3),A05:a(3,3),A06:a(3,2),A07:a(3,2),
           A08:a(4,3),A09:a(3,2),A10:a(3,2),A11:a(3,2)},
        c:{C01:c(3,2,3,2),C02:c(3,2,2,2),C03:c(3,2,3,2),C04:c(3,3,3,2),C05:c(3,2,2,2),
           C06:c(3,2,2,1),C07:c(3,2,2,2),C08:c(3,2,2,2),C09:c(3,2,2,1)},
        ia:{}
      },
      { id:"SCN-0003", gis:"GIS-0002", stade:"QUALIFIE",
        titre:"Thématisation automatique des déclarations d'événements indésirables",
        finalite:"Faire émerger des familles de risques récurrentes non visibles au traitement unitaire",
        beneficiaire:"Cellule qualité et commission des risques",
        decision:"Choisir les thèmes prioritaires du programme d'amélioration",
        resultat:"Regroupement thématique des déclarations, revu par la cellule qualité",
        population:"Déclarations 2016 à 2026", horizon:"9 mois",
        origine:"Validation humaine d'une suggestion", cIA:true,
        profil:["PERSONNEL_SANTE"],
        u:{U01:au(1,1,1,null),U02:au(1,1,1,null),U03:au("ND",0,null,null),U04:au(1,1,1,null),U05:au("ND",0,null,null)},
        v:{V01:a(2,1),V02:a("ND",0),V03:a("ND",0),V04:a(2,1),V05:a(3,1),V06:a(3,1),
           V07:a(2,1),V08:a(2,1),V09:a(2,1),V10:a("ND",0)},
        A:{A01:a(2,1),A02:a(2,1),A03:a(1,1),A04:a("ND",0),A05:a("ND",0),A06:a(1,1),A07:a(1,1),
           A08:a(2,1),A09:a("ND",0),A10:a(2,1),A11:a(2,1)},
        c:{C01:c(2,1,3,2),C02:c(2,1,2,2),C03:c(2,1,3,2),C04:c(2,1,3,2),C05:c(2,1,3,2),
           C06:c("ND",0,2,1),C07:c(1,1,2,2),C08:c(2,1,2,2),C09:c(1,1,2,1)},
        ia:{IA01:a(2,1),IA02:a(2,1),IA03:a(1,1),IA04:a(2,1),IA05:a(1,1),IA06:a(2,1),IA07:a(1,1)}
      },
      { id:"SCN-0004", gis:"GIS-0001", stade:"QUALIFIE",
        titre:"Alerte prédictive de décompensation à partir des comptes rendus",
        finalite:"Signaler en temps réel un risque de dégradation clinique",
        beneficiaire:"Équipe soignante de médecine interne",
        decision:"Déclencher une réévaluation médicale anticipée",
        resultat:"Alerte affichée dans le poste de soins",
        population:"Patients hospitalisés en médecine interne", horizon:"18 mois",
        origine:"Formulé par un praticien", cIA:true,
        profil:["PERSONNEL_SANTE","IDENTIFIANT","INFLUENCE_SOIN","DECISION_AUTO"],
        u:{U01:au(0,2,0,0),U02:au(0,2,0,0),U03:au(0,2,0,0),U04:au(0,2,0,0),U05:au(0,2,0,0)},
        v:{V01:a(3,1),V02:a(2,1),V03:a("ND",0),V04:a(2,1),V05:a(2,1),V06:a(3,1),
           V07:a(2,1),V08:a(3,1),V09:a(3,2),V10:a(2,1)},
        A:{A01:a(3,2),A02:a(3,2),A03:a(2,2),A04:a(2,2),A05:a(2,2),A06:a(2,2),A07:a(1,1),
           A08:a(3,2),A09:a(1,1),A10:a(2,2),A11:a(1,1)},
        c:{C01:c(1,1,4,3),C02:c(1,1,3,3),C03:c(2,2,4,2),C04:c(2,2,4,2),C05:c(1,1,4,3),
           C06:c(0,2,4,3),C07:c(1,1,3,3),C08:c(1,1,3,2),C09:c(0,1,3,2)},
        ia:{IA01:a(2,1),IA02:a(1,1),IA03:a(1,1),IA04:a(1,1),IA05:a(1,1),IA06:a(1,1),IA07:a(0,1)}
      },
      { id:"SCN-0005", gis:"GIS-0003", stade:"QUALIFIE",
        titre:"Quantification et redirection des passages non programmés évitables",
        finalite:"Mesurer le volume réel de passages relevant de la ville et organiser leur redirection",
        beneficiaire:"Cadre des urgences, coordination territoriale",
        decision:"Dimensionner une filière de réorientation avec les MSP du territoire",
        resultat:"Volume mensuel documenté et suivi du taux de réorientation",
        population:"Passages non programmés depuis 2019", horizon:"4 mois",
        origine:"Validation humaine d'une suggestion", cIA:false,
        profil:["PERSONNEL_SANTE"],
        u:{U01:au(1,2,1,1),U02:au(1,2,1,1),U03:au(2,2,2,2),U04:au(1,2,1,1),U05:au(1,2,1,1)},
        v:{V01:a(1,2),V02:a(3,2),V03:a(3,2),V04:a(3,2),V05:a(2,2),V06:a(0,2),
           V07:a(3,2),V08:a(2,2),V09:a(2,2),V10:a(3,2)},
        A:{A01:a(3,2),A02:a(2,2),A03:a(4,3),A04:a(3,2),A05:a(2,2),A06:a(3,2),A07:a(2,2),
           A08:a(3,2),A09:a(3,2),A10:a(4,3),A11:a(4,2)},
        c:{C01:c(3,2,3,2),C02:c(3,2,2,2),C03:c(3,2,3,2),C04:c(3,2,3,2),C05:c(3,2,2,2),
           C06:c(3,2,2,1),C07:c(3,2,2,2),C08:c(3,2,2,2),C09:c(3,2,2,1)},
        ia:{}
      }
    ]
  };
  // grille d'angles morts : familles × 4 unités prioritaires
  (function seedCells(){
    const zones=["ZON-01","ZON-02","ZON-03","ZON-04"];
    const preseed={ "ZON-01":{0:"ID",1:"ID",5:"ID",11:"ID",9:"AB",3:"NA",12:"AB",13:"NC",8:"NC"},
                    "ZON-02":{0:"ID",1:"ID",2:"ID",4:"ID",5:"ID",6:"AB",10:"AB",11:"ID",12:"ID",13:"NC",8:"NC",9:"AB",3:"NC",7:"AB"},
                    "ZON-03":{1:"ID",2:"ID",9:"ID",8:"ID",11:"ID",10:"AB",0:"AB",3:"NA",4:"NA",5:"AB",6:"NA",7:"AB",12:"NC",13:"NC"},
                    "ZON-04":{7:"ID",0:"AB",5:"NC",11:"NC",12:"NC",13:"NC"} };
    zones.forEach(z=>{ FAMILLES.forEach((f,i)=>{ S.campagne.cellules[z+"|"+i]= (preseed[z]&&preseed[z][i])||"NC"; }); });
  })();
  return S;
}

function casMSP(){
  const S = {
    view:"edr", tabQ:"U", scenarioCourant:null, gisementCourant:"GIS-0001",
    campagne:{
      id:"CMP-0001", nom:"Exploration des gisements, MSP M1",
      perimetre:"Médecine générale, infirmières, coordination du parcours des patients chroniques",
      pilote:"Coordinatrice de la maison de santé", debut:"2026-09-21", passe:1, contreExploration:false,
      exclusions:"Comptabilité de la structure, données de gestion des locaux",
      unites:[
        {id:"ZON-01",nom:"Médecins généralistes",prio:true,etat:"EXPLOREE"},
        {id:"ZON-02",nom:"Infirmières et soins de proximité",prio:true,etat:"PREVUE"},
        {id:"ZON-03",nom:"Coordination et secrétariat",prio:true,etat:"EXPLOREE"},
        {id:"ZON-04",nom:"Kinésithérapie et podologie",prio:false,etat:"PREVUE"}
      ],
      systemes:[
        {id:"SYS-01",nom:"Logiciel métier des médecins",etat:"EXAMINE"},
        {id:"SYS-02",nom:"Logiciel métier des infirmières",etat:"A_REVOIR"},
        {id:"SYS-03",nom:"Agenda partagé de prise de rendez-vous",etat:"EXAMINE"},
        {id:"SYS-04",nom:"Répertoire partagé de la structure",etat:"A_REVOIR"},
        {id:"SYS-05",nom:"Messagerie sécurisée de santé",etat:"A_REVOIR"}
      ],
      contributeurs:{sollicites:8,repondu:3,rolesAttendus:5,rolesCouverts:2},
      passes:[{id:"PAS-1",nouveaux:2}],
      cellules:{}
    },
    signaux:[
      {id:"SIG-0001",nom:"Suivi des patients diabétiques de la patientèle",zone:"ZON-01",canal:"R4",
       auteur:"Médecin coordonnateur",wf:"RESOLU",res:"CONFIRME",gis:"GIS-0001",motif:"Peu analysé"},
      {id:"SIG-0002",nom:"Tableur des patients non revus depuis dix-huit mois",zone:"ZON-03",canal:"R5",
       auteur:"Secrétaire",wf:"RESOLU",res:"CONFIRME",gis:"GIS-0002",motif:"Beaucoup de travail manuel"},
      {id:"SIG-0003",nom:"Comptes rendus de concertation pluriprofessionnelle",zone:"ZON-03",canal:"R4",
       auteur:"Coordinatrice",wf:"SOUMIS",res:null,gis:null,motif:"Contenu riche en texte"}
    ],
    gisements:[
      {id:"GIS-0001",nom:"Dossiers de suivi des patients chroniques",famille:"Clinique structurée",
       definition:"Données de suivi saisies par les médecins pour les patients diabétiques et hypertendus. N'inclut pas les comptes rendus hospitaliers reçus.",
       sources:"Logiciel métier des médecins",producteur:"Médecins généralistes, à chaque consultation",
       rmetier:"Médecin coordonnateur",rtech:"Éditeur du logiciel métier",
       population:"Patients chroniques de la patientèle",periode:"Depuis 2017, mise à jour continue",
       modalites:"Structuré et texte libre",granularite:"Consultation",
       sensibilite:"Données de santé, directement identifiantes",
       usageInitial:"Suivi individuel en consultation",
       contraintes:"Export dépendant de l'éditeur, format non documenté",
       zone:"ZON-01",prealable:"NON",passe:"PAS-1",gouvernance:"IDENTIFIE",
       ug:{UG01:a(3,1),UG02:a(1,1),UG03:a(1,1),UG04:a(1,1),UG05:a(1,1)},V09:2,V09preuve:1},
      {id:"GIS-0002",nom:"Fichier des patients perdus de vue",famille:"Fichiers locaux et tableurs",
       definition:"Tableur tenu par le secrétariat listant les patients sans consultation depuis dix-huit mois.",
       sources:"Répertoire partagé de la structure",producteur:"Secrétariat, mise à jour trimestrielle",
       rmetier:"Coordinatrice",rtech:"Aucun responsable technique identifié",
       population:"Patientèle inscrite",periode:"Depuis 2022",
       modalites:"Structuré léger",granularite:"Patient",
       sensibilite:"Données de santé indirectes, identifiants directs",
       usageInitial:"Relance téléphonique ponctuelle",
       contraintes:"Fichier hors sauvegarde, aucune règle de conservation",
       zone:"ZON-03",prealable:"NON",passe:"PAS-1",gouvernance:"A_IDENTIFIER",
       ug:{UG01:a(2,1),UG02:a(1,1),UG03:a(1,1),UG04:a(1,1),UG05:a(1,1)},V09:1,V09preuve:1}
    ],
    suggestions:[
      {id:"SUG-0001",gis:"GIS-0002",titre:"Campagne de rappel ciblée des patients chroniques perdus de vue",
       voie:"V03",hypotheses:"Le fichier couvre l'essentiel des patients sans consultation récente.",
       inconnues:"Fiabilité de la liste, doublons avec le logiciel métier, base juridique de la relance.",
       baseline:"Relances téléphoniques décidées au cas par cas, sans suivi du résultat."}
    ],
    preuveInventaire:1,
    chantiers:[],
    scenarios:[]
  };
  (function(){
    ["ZON-01","ZON-02","ZON-03"].forEach(z=>{ FAMILLES.forEach((f,i)=>{ S.campagne.cellules[z+"|"+i]="NC"; }); });
    S.campagne.cellules["ZON-01|0"]="ID"; S.campagne.cellules["ZON-01|1"]="ID";
    S.campagne.cellules["ZON-03|11"]="ID"; S.campagne.cellules["ZON-03|2"]="ID";
  })();
  return S;
}

function casVierge(){
  const S = {
    view:"edr", tabQ:"U", scenarioCourant:null, gisementCourant:null,
    campagne:{
      id:"CMP-0001", nom:"Nouvelle campagne",
      perimetre:"", pilote:"", debut:new Date().toISOString().slice(0,10), passe:1,
      contreExploration:false, exclusions:"",
      unites:[], systemes:[],
      contributeurs:{sollicites:0,repondu:0,rolesAttendus:0,rolesCouverts:0},
      passes:[{id:"PAS-1",nouveaux:0}],
      cellules:{}
    },
    signaux:[], gisements:[], suggestions:[], preuveInventaire:0, chantiers:[], scenarios:[]
  };
  return S;
}
