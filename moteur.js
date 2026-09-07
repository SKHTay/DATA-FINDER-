/* moteur.js, calculs normatifs
   Démonstrateur du moteur unifié de recensement et de qualification
   des gisements de données sanitaires et médico-sociales.
   Sources normatives : référentiel V1.2.2, procédure EDR V1.0, spécification
   fonctionnelle V1.2.2. Voir README.md.
*/

'use strict';

const a  = (v,e)=>({v,e});                       // réponse simple
const au = (v,e,d,o)=>({v,e,d,o});               // réponse U : valeur validée, déclarée, objectivée
const c  = (m,e,I,P)=>({v:m,e,I,P});             // contrôle C : maturité + impact + exposition

/* ==========================================================================
   1. POIDS, CATALOGUES, LIBELLÉS  (source : Référentiel V1.2.2)
   ========================================================================== */
const W = {
  U : {U01:25,U02:20,U03:15,U04:15,U05:25},
  Vc: {V07:15,V08:10,V09:10,V10:5},                 // consolidation
  Vv: {V01:10,V02:10,V03:10,V04:10,V05:10,V06:10},  // voies, poids nominal K/Conf (convention MVP)
  A : {A01:7,A02:8,A03:14,A04:10,A05:10,A06:10,A07:10,A08:8,A09:8,A10:7,A11:8},
  C : {C01:15,C02:10,C03:10,C04:15,C05:10,C06:15,C07:10,C08:10,C09:5},
  IA: {IA01:15,IA02:20,IA03:15,IA04:15,IA05:15,IA06:10,IA07:10}
};
const LIB = {
  U01:"Correspondance avec la finalité",U02:"Adoption et couverture des bénéficiaires",
  U03:"Fréquence et fiabilité d'usage",U04:"Profondeur informationnelle",U05:"Bénéfice effectivement obtenu",
  V01:"Valeur clinique et sécurité",V02:"Valeur parcours et coordination",V03:"Valeur populationnelle et équité",
  V04:"Valeur opérationnelle et économique",V05:"Valeur scientifique et évaluation",V06:"Valeur d'automatisation et d'IA",
  V07:"Alignement stratégique et besoin",V08:"Portée, fréquence, bénéficiaires",V09:"Valeur patrimoniale",V10:"Mesurabilité du bénéfice",
  A01:"Localisation et inventaire",A02:"Responsabilité et gouvernance",A03:"Accès et extractabilité",
  A04:"Complétude et couverture",A05:"Exactitude et cohérence",A06:"Sémantique et métadonnées",
  A07:"Standardisation et interopérabilité",A08:"Volumétrie et granularité",A09:"Représentativité et rapprochement",
  A10:"Profondeur, continuité, fraîcheur",A11:"Effort, compétences, dépendances",
  C01:"Finalité et base juridique",C02:"Minimisation, information, droits",C03:"Confidentialité et habilitations",
  C04:"Sécurité, hébergement, sous-traitance",C05:"Identification et réidentification",C06:"Sécurité clinique",
  C07:"Biais, équité, représentativité",C08:"Traçabilité et auditabilité",C09:"Qualification réglementaire",
  IA01:"Problème, utilisateur, baseline",IA02:"Adéquation des données à la tâche",IA03:"Vérité terrain et évaluation",
  IA04:"Volume, diversité, généralisation",IA05:"Évaluabilité et seuils",IA06:"Intégration et supervision humaine",
  IA07:"Déploiement, surveillance, maintenance",
  UG01:"Intensité d'utilisation",UG02:"Diversité des finalités",UG03:"Diversité des utilisateurs",
  UG04:"Niveau d'exploitation informationnelle",UG05:"Couverture de la richesse disponible"
};
const QUESTION = {
  U01:"Une pratique ou solution actuelle poursuit-elle déjà le même résultat que le scénario ?",
  U02:"Quelle part des utilisateurs, sites ou décisions cibles bénéficie réellement de l'usage actuel ?",
  U03:"L'usage actuel intervient-il au bon moment et de façon reproductible ?",
  U04:"L'usage actuel mobilise-t-il les variables, documents, périodes et liens nécessaires ?",
  U05:"Quelle part du résultat attendu est déjà obtenue et mesurée ?",
  V01:"Quelle décision ou prise en charge serait améliorée ? Quel événement évitable réduit ?",
  V02:"Le gisement permet-il de relier des étapes, métiers ou structures ?",
  V03:"Permet-il d'identifier besoins, risques, perdus de vue ou inégalités ?",
  V04:"Peut-il réduire délai, charge, coût, gaspillage ou variabilité ?",
  V05:"Permet-il une cohorte, une évaluation, une étude ou une amélioration qualité ?",
  V06:"Une tâche d'IA est-elle précisément définie et comparée à une solution non-IA ?",
  V07:"Le scénario répond-il à une priorité institutionnelle ? Un sponsor est-il engagé ?",
  V08:"Combien de personnes, décisions ou opérations sont concernées, à quelle fréquence ?",
  V09:"L'information est-elle rare, longitudinale ou impossible à reconstituer ?",
  V10:"Peut-on définir un état initial, une cible et un indicateur d'impact ?",
  A01:"Les sources, environnements, tables et flux sont-ils localisés ?",
  A02:"Un responsable métier et un responsable technique peuvent-ils décider et arbitrer ?",
  A03:"Une extraction complète, sécurisée et reproductible est-elle possible ?",
  A04:"Les variables et épisodes nécessaires sont-ils suffisamment renseignés ?",
  A05:"Les valeurs sont-elles plausibles, cohérentes et dédupliquées ?",
  A06:"Les champs, unités, codes et changements historiques sont-ils compris ?",
  A07:"Les formats, terminologies et profils sont-ils adaptés aux échanges nécessaires ?",
  A08:"Le nombre d'observations est-il suffisant au regard du cas d'usage et des sous-groupes ?",
  A09:"La population utile est-elle couverte ? Les biais et identifiants de liaison sont-ils compris ?",
  A10:"L'historique, la fréquence et le délai de mise à disposition correspondent-ils à l'usage ?",
  A11:"Quel délai, coût, outillage et compétences jusqu'au premier usage ?",
  C01:"La finalité, la base juridique et la condition autorisant le traitement sont-elles identifiées ?",
  C02:"Minimisation, information des personnes, droits et durées sont-ils définis ?",
  C03:"Le cercle des personnes autorisées est-il défini selon le besoin d'en connaître ?",
  C04:"Environnements, transferts, sauvegardes, incidents et prestataires sont-ils maîtrisés ?",
  C05:"Le niveau d'identification est-il nécessaire ? Le risque de réidentification est-il évalué ?",
  C06:"Que se passe-t-il en cas d'erreur ? Une supervision humaine et un repli existent-ils ?",
  C07:"Quels groupes peuvent être sous-représentés ? Les erreurs seront-elles comparées par sous-groupe ?",
  C08:"Qui répond du scénario, des transformations et des résultats ? Tout est-il traçable ?",
  C09:"Le scénario relève-t-il d'une recherche, d'un entrepôt, d'un DM ou d'un système d'IA réglementé ?",
  IA01:"La tâche est-elle bornée ? Quel processus actuel et quelle performance de référence ?",
  IA02:"Modalités, variables, granularité et temporalité correspondent-elles à la sortie attendue ?",
  IA03:"Dispose-t-on d'une référence fiable ou d'experts pour l'annotation ?",
  IA04:"Les sites, périodes, situations et sous-groupes utiles sont-ils représentés ?",
  IA05:"Quelles métriques et quels faux positifs ou négatifs acceptables ?",
  IA06:"Où la sortie apparaît-elle ? Qui peut la vérifier, la contester ou l'ignorer ?",
  IA07:"Les dérives, versions, incidents, coûts et réentraînements peuvent-ils être suivis ?"
};
const FAMILLES = ["Clinique structurée","Textes libres et comptes rendus","Documents et GED","Imagerie et signaux",
  "Biologie et pharmacie","Parcours et flux","Fonctionnelle et médico-sociale","Pilotage et RH",
  "Expérience patient, PROMs","Qualité et événements indésirables","Recherche, cohortes, registres",
  "Fichiers locaux et tableurs","Anciens systèmes et archives","Données détenues par un éditeur"];
const FAM_CRIT = new Set(["Textes libres et comptes rendus","Qualité et événements indésirables",
  "Fichiers locaux et tableurs","Expérience patient, PROMs"]);
const CELL_ETATS = ["NC","ID","AB","NA"];
const CELL_LIB = {NC:"Non vérifiée",ID:"Identifiée",AB:"Absente",NA:"Non applicable"};

/* ==========================================================================
   3. MOTEUR DE CALCUL  (§3.4 à §10 du référentiel, §10 de la spécification)
   ========================================================================== */
const k_ = {0:1.00,1:0.80,2:0.60,3:0.40,4:0.20};
const num = x => (typeof x === "number");

function axe(rep, poids){
  let wApp=0,wRen=0,som=0,confN=0;
  for(const id in poids){
    const r = rep[id]; if(!r) continue;
    if(r.v==="NA") continue;                 // poids redistribué
    wApp += poids[id];
    if(r.v!=="ND"){ wRen+=poids[id]; som+=poids[id]*r.v; confN+=poids[id]*((r.e||0)/3); }
  }
  return {
    obs: wRen? 25*som/wRen : 0,
    pru: wApp? 25*som/wApp : 0,
    K  : wApp? 100*wRen/wApp : null,
    Conf:wApp? 100*confN/wApp : null,
    wApp, wRen
  };
}
const dec = (o,p,K,C) => (K===null||K<70||C===null||C<60) ? p : o;

/* --- U : aucun plafond ne peut abaisser U (§3.6) --- */
function calcU(sc){
  const base = axe(sc.u, W.U);
  let wApp=0,sH=0,contradictions=[];
  for(const id in W.U){
    const r=sc.u[id]; if(!r||r.v==="NA") continue; wApp+=W.U[id];
    let m;
    if(r.v==="ND") m=4;
    else if(num(r.d)&&num(r.o)&&Math.abs(r.d-r.o)>=2){ m=Math.max(r.d,r.o); contradictions.push(id); }
    else if(num(r.o)) m=r.o;
    else if(num(r.d)) m=r.d;
    else m=r.v;
    sH+=W.U[id]*m;
  }
  const haut = wApp? 25*sH/wApp : 0;
  return {...base, bas:base.pru, haut, contradictions,
          dec: dec(base.obs,base.pru,base.K,base.Conf)};
}

/* --- V : deux meilleures voies + consolidation, plafond 69 (§6.3, §6.4) --- */
function calcV(sc){
  const voies=["V01","V02","V03","V04","V05","V06"];
  const lObs=[], lPru=[]; let nVoies=0;
  voies.forEach(id=>{ const r=sc.v[id]; if(!r||r.v==="NA") return;
    if(r.v==="ND"){ lPru.push(0); } else { lObs.push(25*r.v); lPru.push(25*r.v); nVoies++; } });
  const B = l => { const s=[...l].sort((x,y)=>y-x);
    if(!s.length) return 0; if(s.length===1) return 0.70*s[0]; return 0.70*s[0]+0.30*s[1]; };
  let wA=0,wR=0,sR=0;
  for(const id in W.Vc){ const r=sc.v[id]; if(!r||r.v==="NA") continue; wA+=W.Vc[id];
    if(r.v!=="ND"){ wR+=W.Vc[id]; sR+=W.Vc[id]*25*r.v; } }
  let obs = 0.60*B(lObs) + 0.40*(wR? sR/wR : 0);
  let pru = 0.60*B(lPru) + 0.40*(wA? sR/wA : 0);
  const v07=sc.v.V07, v10=sc.v.V10;
  const socle = v07 && v10 && v07.v!=="ND" && v10.v!=="ND" && v07.v>=2 && v10.v>=2;
  let plafond=null;
  if((obs>=70||pru>=70) && !socle){ obs=Math.min(obs,69); pru=Math.min(pru,69);
    plafond="V ≥ 70 exige V07 ≥ 2 et V10 ≥ 2 : plafonné à 69 avant sélection décisionnelle."; }
  const tous = {...W.Vv, ...W.Vc};
  const kc = axe(sc.v, tous);
  return {obs,pru,K:kc.K,Conf:kc.Conf,plafond,nVoies,
          provisoire:nVoies<2, dec: dec(obs,pru,kc.K,kc.Conf), B_obs:B(lObs), B_pru:B(lPru)};
}

/* --- A : plafonds appliqués aux deux lectures avant sélection (§7.5) --- */
function calcA(sc){
  const b=axe(sc.A,W.A); let obs=b.obs,pru=b.pru; const regles=[]; let noPilot=false, aInstruire=false;
  const val=id=>{const r=sc.A[id];return r?r.v:"ND";};
  const cap=(x,r)=>{obs=Math.min(obs,x);pru=Math.min(pru,x);regles.push(r);};
  if(val("A01")===0){ regles.push("A01 = 0 : le gisement reste un signal à investiguer, aucun scénario priorisable."); aInstruire=true; }
  if(val("A02")===0){ cap(39,"A02 = 0 : plafond 39 et classement à instruire."); aInstruire=true; }
  if(val("A03")===0){ cap(39,"A03 = 0 : plafond 39, aucune recommandation de pilote."); noPilot=true; }
  ["A04","A05","A06"].forEach(id=>{ const v=val(id);
    if(v===0||v==="ND") cap(49,id+" = "+(v==="ND"?"ND":"0")+" : plafond 49 tant qu'un profilage n'a pas levé l'inconnue."); });
  const clinPopIA = sc.profil.includes("INFLUENCE_SOIN")||sc.profil.includes("DECISION_AUTO")||sc.cIA;
  if(clinPopIA && num(val("A09")) && val("A09")<2){ regles.push("A09 < 2 pour un usage clinique, populationnel ou IA : pas de pilote opérationnel."); noPilot=true; }
  return {...b,obs,pru,regles,noPilot,aInstruire,dec:dec(obs,pru,b.K,b.Conf)};
}

/* --- C : cibles, écarts, risque résiduel, statut de passage (§8) --- */
function ciblesC(profil){
  const t={C01:3,C02:2,C03:3,C04:3,C05:2,C06:2,C07:2,C08:3,C09:2}; const up=(k,v)=>t[k]=Math.max(t[k],v);
  if(profil.includes("IDENTIFIANT")){["C02","C05","C08"].forEach(k=>up(k,3));}
  if(profil.includes("GRANDE_ECHELLE")){["C03","C04","C05","C08"].forEach(k=>up(k,3));}
  if(profil.includes("INFLUENCE_SOIN")){up("C06",4);["C07","C08"].forEach(k=>up(k,3));}
  if(profil.includes("DECISION_AUTO")){["C06","C07","C08","C09"].forEach(k=>up(k,3));}
  if(profil.includes("RECHERCHE")){["C01","C02","C05","C08","C09"].forEach(k=>up(k,3));}
  if(profil.includes("TRANSFERT_EXTERNE")){up("C04",4);["C03","C08"].forEach(k=>up(k,3));}
  if(profil.includes("PUBLICATION")){["C05","C08"].forEach(k=>up(k,4));}
  return t;
}
function calcC(sc){
  const cibles=ciblesC(sc.profil); const ecarts=[]; let sw=0,sr=0; const hypotheses=[];
  const critiques=["C01","C03","C04","C06"];
  let nonEvalue=false;
  for(const id in W.C){
    const r=sc.c[id]||{v:"ND",e:0}; const w=W.C[id];
    let M=r.v, I=r.I, P=r.P, hyp=false;
    if(M==="ND"||M==="NA"||!num(I)||!num(P)){ M=0;I=4;P=3;hyp=true;hypotheses.push(id); }
    if(sc.profil.includes("INFLUENCE_SOIN")&&id==="C06") I=Math.max(I,4);
    if(sc.profil.includes("IDENTIFIANT")&&["C03","C05"].includes(id)) I=Math.max(I,3);
    const ri=100*(I*P/16)*k_[M];
    sw+=w; sr+=w*ri;
    const actuel = num(r.v)? r.v : null;
    const gap = actuel===null? cibles[id] : Math.max(0,cibles[id]-actuel);
    if(gap>0||actuel===null) ecarts.push({id,cible:cibles[id],actuel,gap,critique:critiques.includes(id)});
    if(critiques.includes(id) && !num(r.v)) nonEvalue=true;
  }
  const R = sw? sr/sw : 0;
  const c06=sc.c.C06;
  const bloque = R>=70 || (sc.profil.includes("INFLUENCE_SOIN") && c06 && c06.v===0);
  let statut;
  if(nonEvalue) statut="NON_EVALUE";
  else if(bloque) statut="BLOQUE";
  else if(ecarts.some(e=>e.gap>0) || (R>=25&&R<70)) statut="CONDITIONNEL";
  else statut="ADMISSIBLE";
  let gapW=0,gapS=0; for(const id in W.C){ const e=ecarts.find(x=>x.id===id); gapW+=W.C[id]; gapS+=W.C[id]*(e?e.gap:0); }
  return {cibles,ecarts,R,statut,hypotheses,GapC:gapW?25*gapS/gapW:0,
          bloqueMotif: bloque ? (R>=70?"Risque résiduel ≥ 70":"C06 = 0 pour un usage influençant les soins") : null};
}

/* --- IA (§9.3) --- */
function calcIA(sc,cst){
  if(!sc.cIA || !Object.keys(sc.ia||{}).length) return null;
  const b=axe(sc.ia,W.IA); let obs=b.obs,pru=b.pru; const regles=[];
  const v=id=>{const r=sc.ia[id];return r?r.v:"ND";};
  const cap=(x,t)=>{obs=Math.min(obs,x);pru=Math.min(pru,x);regles.push(t);};
  if(num(v("IA01"))&&v("IA01")<2) cap(39,"IA01 < 2 : plafond 39.");
  if(v("IA02")===0||v("IA03")===0) regles.push("IA02 ou IA03 = 0 : aucun apprentissage supervisé ; constituer d'abord une référence.");
  if(num(v("IA04"))&&v("IA04")<2) regles.push("IA04 < 2 : aucune conclusion de généralisation.");
  if(num(v("IA05"))&&v("IA05")<3) regles.push("IA05 < 3 : pas de pilote en situation réelle.");
  if(sc.profil.includes("INFLUENCE_SOIN")&&num(v("IA06"))&&v("IA06")<3) regles.push("IA06 < 3 pour un usage clinique : pas de pilote influençant les soins.");
  const c07=sc.c.C07; if(c07&&num(c07.v)&&c07.v<2) regles.push("C07 < 2 : pas de pilote sur une population réelle.");
  let suspendu=false;
  if(cst==="NON_EVALUE"||cst==="BLOQUE"){ suspendu=true; regles.push("Statut C "+(cst==="BLOQUE"?"bloqué":"non évalué")+" : recommandation IA suspendue."); }
  const d=dec(obs,pru,b.K,b.Conf);
  let reco = d>=75?"Pilote contrôlé, si V, A et C l'autorisent" : d>=60?"Preuve de concept sur données contrôlées"
           : d>=40?"Exploration hors production" : "Ne pas engager d'IA ; clarifier le besoin ou préparer les données";
  return {...b,obs,pru,dec:d,regles,suspendu,reco};
}

function calcScenario(sc){
  const U=calcU(sc), V=calcV(sc), A=calcA(sc), C=calcC(sc);
  const IA=calcIA(sc,C.statut);
  const K_L=Math.min(U.K??0,V.K??0), Conf_L=Math.min(U.Conf??0,V.Conf??0);
  const L_obs=V.obs*(1-U.obs/100), L_pru=V.pru*(1-U.haut/100);
  const L_dec=dec(L_obs,L_pru,K_L,Conf_L);
  const fourchette=[V.pru*(1-U.haut/100), V.obs*(1-U.bas/100)];
  const K_dec=Math.min(U.K??0,V.K??0,A.K??0), Conf_dec=Math.min(U.Conf??0,V.Conf??0,A.Conf??0);
  const O_V=Math.sqrt(V.dec*A.dec), O_L=Math.sqrt(L_dec*A.dec), O_Lc=O_L*(0.70+0.30*Conf_dec/100);
  const u01=sc.u.U01, u05=sc.u.U05;
  const ndU = (u01&&u01.v==="ND")||(u05&&u05.v==="ND");
  const noPilot = A.noPilot;
  let P;
  if(C.statut==="BLOQUE") P="P0";
  else if(K_dec<70||Conf_dec<60||ndU||C.statut==="NON_EVALUE"||A.aInstruire) P="P4";
  else if(V.dec>=70&&L_dec>=60&&A.dec>=60&&C.statut==="ADMISSIBLE"&&!noPilot) P="P1";
  else if(V.dec>=70&&L_dec>=60&&((A.dec>=40&&A.dec<60)||C.statut==="CONDITIONNEL")) P="P2";
  else if(V.dec>=50&&L_dec>=40&&A.dec>=70&&C.statut==="ADMISSIBLE"&&!noPilot) P="P3";
  else if(V.dec>=50||L_dec>=35) P="P5";
  else P="P6";
  let confLib = (K_dec<70||Conf_dec<60) ? "Insuffisante" : (K_dec>=85&&Conf_dec>=80) ? "Élevée" : "Bonne";
  return {U,V,A,C,IA,L:{obs:L_obs,pru:L_pru,dec:L_dec,K:K_L,Conf:Conf_L,fourchette},
          K_dec,Conf_dec,O_V,O_L,O_Lc,P,confLib,noPilot,
          conditions:C.ecarts.filter(e=>e.gap>0).length + A.regles.length};
}
const P_LIB={P0:"Bloqué",P4:"À instruire",P1:"Candidat pilote",P2:"À préparer",P3:"Gain rapide",P5:"À incuber",P6:"Veille"};
const P_DEC={P0:"Suspendre, abandonner ou redéfinir",P4:"Lever les inconnues avant tout classement",
  P1:"Cadrer un pilote métier contrôlé",P2:"Financer un chantier ciblé",P3:"Tester un usage simple et mesurable",
  P5:"Conserver avec hypothèse, propriétaire et jalon",P6:"Ne pas mobiliser de ressources"};
const lireL=v=>v<20?"Faible ou non démontré":v<40?"Limité":v<60?"Significatif":v<80?"Fort":"Stratégique";
const lireA=v=>v<25?"Non activable en l'état":v<40?"Exploration lourde":v<60?"Activable sous préparation":v<75?"Activable pour un pilote":"Fortement activable";
const lireV=v=>v<25?"Valeur non démontrée":v<50?"Hypothèse à préciser":v<70?"Valeur crédible":v<85?"Forte valeur":"Valeur stratégique";
const lireU=v=>v<20?"Valeur pratiquement non captée":v<40?"Exploitation faible":v<60?"Exploitation partielle":v<80?"Valeur majoritairement captée":"Scénario déjà largement satisfait";
const C_LIB={NON_EVALUE:"Non évalué",BLOQUE:"Bloqué",CONDITIONNEL:"Conditionnel",ADMISSIBLE:"Admissible sous contrôles"};

/* --- portefeuille patrimonial (§10.5) --- */
function calcGisement(g){
  const scs=S.scenarios.filter(s=>s.gis===g.id).map(s=>({s,r:calcScenario(s)}));
  const elig=scs;                                   // scénarios actifs, définis et dédupliqués
  const Einv=100*(S.preuveInventaire||0)/3;         // preuve que l'inventaire a bien été examiné
  const pourL=scs.filter(x=>["ADMISSIBLE","CONDITIONNEL"].includes(x.r.C.statut))
                 .sort((x,y)=>y.r.L.dec-x.r.L.dec).slice(0,3);
  const pds=[0.60,0.25,0.15].slice(0,pourL.length);
  const tot=pds.reduce((a,b)=>a+b,0)||1;
  const Lstar=pourL.length? pourL.reduce((acc,x,i)=>acc+pds[i]*x.r.L.dec,0)/tot : 0;
  const ConfL=pourL.length? pourL.reduce((acc,x,i)=>acc+pds[i]*x.r.L.Conf,0)/tot : 0;
  const Pat=25*(g.V09||0), ConfPat=100*(g.V09preuve||0)/3;
  let Lev=0,ConfLev=Einv;
  const den=elig.length;
  S.chantiers.forEach(w=>{
    const nume=w.leve.filter(id=>elig.some(x=>x.s.id===id)).length;
    if(den>0&&nume>0){ const l=100*nume/den; if(l>Lev){ Lev=l;
      ConfLev=Math.min(100*w.preuve/3, Math.min(...w.leve.filter(id=>elig.some(x=>x.s.id===id))
        .map(id=>{const f=elig.find(x=>x.s.id===id);return f.r.Conf_dec;}))); } }
  });
  const familles=new Set();
  elig.forEach(x=>{ const vs=["V01","V02","V03","V04","V05","V06"].map(id=>({id,v:x.s.v[id]}))
      .filter(o=>o.v&&num(o.v.v)&&o.v.v>=2).sort((p,q)=>q.v.v-p.v.v).slice(0,2);
    vs.forEach(o=>familles.add(o.id)); });
  const nf=familles.size, Div=25*Math.min(4,nf);
  const ConfDiv=nf? Math.min(...elig.map(x=>x.r.Conf_dec)) : Einv;
  const Sg=0.45*Lstar+0.20*Pat+0.20*Lev+0.15*Div;
  const Confg=0.45*ConfL+0.20*ConfPat+0.20*ConfLev+0.15*ConfDiv;
  const instruire = Confg<60 || scs.some(x=>x.r.K_dec<70||x.r.Conf_dec<60);
  let statut;
  if(instruire) statut="Instruire le patrimoine";
  else if(Sg>=70 && scs.some(x=>x.r.C.statut!=="BLOQUE") && Lev>0) statut="Candidat à investissement";
  else if(Sg>=45) statut="Investissement sélectif";
  else statut="Maintenir / veille";
  const ug=axe(g.ug,{UG01:1,UG02:1,UG03:1,UG04:1,UG05:1});
  return {scs,Lstar,Pat,Lev,Div,Sg,Confg,statut,nf,Ug:ug.obs,K_UG:ug.K,familles:[...familles]};
}

/* ==========================================================================
   4. INDICATEURS EDR (§8.2 de la spécification fonctionnelle)
   ========================================================================== */
function kpiEDR(){
  const c=S.campagne;
  const uPrio=c.unites.filter(u=>u.prio);
  const fait=u=>u.etat==="EXPLOREE"||u.etat==="EXCLUE";
  const CO_p=uPrio.length?100*uPrio.filter(fait).length/uPrio.length:null;
  const CO_a=c.unites.length?100*c.unites.filter(fait).length/c.unites.length:null;
  const sysD=c.systemes.filter(s=>s.etat!=="HORS_PERIMETRE");
  const CS=sysD.length?100*sysD.filter(s=>s.etat==="EXAMINE"||s.etat==="EXCLU").length/sysD.length:null;
  const CC_p=100*c.contributeurs.repondu/c.contributeurs.sollicites;
  const CC_r=100*c.contributeurs.rolesCouverts/c.contributeurs.rolesAttendus;
  const cells=Object.entries(c.cellules);
  const tot=cells.length;
  const cnt=e=>cells.filter(([,v])=>v===e).length;
  const CF=tot?100*(cnt("ID")+cnt("AB")+cnt("NA"))/tot:null;
  const critNC=cells.filter(([k,v])=>v==="NC"&&FAM_CRIT.has(FAMILLES[+k.split("|")[1]])).length;
  const soumis=S.signaux.filter(s=>s.wf!=="BROUILLON").length;
  const resolus=S.signaux.filter(s=>s.wf==="RESOLU");
  const decision=soumis?100*resolus.length/soumis:null;
  const gAct=S.gisements.length;
  const nouv=S.gisements.filter(g=>g.prealable==="OUI"||g.prealable==="NON");
  const novelty=nouv.length?100*nouv.filter(g=>g.prealable==="NON").length/nouv.length:null;
  const croise=gAct?100*S.gisements.filter(g=>S.signaux.filter(s=>s.gis===g.id).length>=2).length/gAct:null;
  const derniere=c.passes[c.passes.length-1];
  const RM=gAct?100*derniere.nouveaux/gAct:null;
  const prioNonResolus=S.signaux.filter(s=>s.wf!=="RESOLU").length;
  const gouvNon=S.gisements.filter(g=>g.gouvernance==="A_IDENTIFIER").length;
  let statut;
  if(!tot||CO_p<50||(CS!==null&&CS<50)||critNC>tot*0.5) statut="INSUFFISANTE";
  else if(CO_p>=90&&CS>=90&&critNC===0&&prioNonResolus===0&&c.contreExploration){
    statut = RM<10 ? "FORTE" : "SATISFAISANTE";
  } else statut="PARTIELLE";
  return {CO_p,CO_a,CS,CC_p,CC_r,CF,critNC,decision,novelty,croise,RM,statut,
          soumis,resolus:resolus.length,prioNonResolus,gouvNon,tot,
          nc:cnt("NC"),id:cnt("ID"),ab:cnt("AB"),na:cnt("NA"),
          fusion:S.signaux.filter(s=>s.res==="FUSIONNE").length,
          ecarte:S.signaux.filter(s=>s.res==="ECARTE").length};
}
