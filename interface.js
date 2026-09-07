/* interface.js, rendu et interactions
   Démonstrateur du moteur unifié de recensement et de qualification
   des gisements de données sanitaires et médico-sociales.
   Sources normatives : référentiel V1.2.2, procédure EDR V1.0, spécification
   fonctionnelle V1.2.2. Voir README.md.
*/

/* ==========================================================================
   1. OUTILS DE RENDU
   ========================================================================== */
const $=id=>document.getElementById(id);
const f1=x=>(x===null||x===undefined||isNaN(x))?"N/A":x.toFixed(1).replace(".",",");
const f0=x=>(x===null||x===undefined||isNaN(x))?"N/A":Math.round(x);
const esc=s=>String(s===null||s===undefined?"":s).replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
const VUES=[["edr","Campagne EDR"],["signaux","Signaux"],["gisements","Gisements"],
            ["q1","Q1 et scénarios"],["q2","Q2 qualification"],["scenario","Tableau de bord"],["portefeuilles","Portefeuilles"]];
const CANAUX={R1:"Institutionnel",R2:"Technique",R3:"Usage",R4:"Métier",R5:"Périphérique"};
const MOTIFS=["Peu utilisé","Utilisation limitée à un seul processus","Historique important","Donnée peu connue",
  "Difficile d'accès","Beaucoup de travail manuel","Peu analysé","Contenu riche en texte ou documents",
  "Potentiel de rapprochement avec d'autres données","Demande récurrente d'autres équipes","Usage potentiel inconnu"];
const PROFILS={PERSONNEL_SANTE:"Données personnelles de santé",IDENTIFIANT:"Données directement identifiantes",
  GRANDE_ECHELLE:"Grande échelle ou multi-source",INFLUENCE_SOIN:"Influence directe sur un soin",
  DECISION_AUTO:"Décision automatisée sur une personne",RECHERCHE:"Recherche, étude ou entrepôt",
  TRANSFERT_EXTERNE:"Transfert externe ou nouveau sous-traitant",PUBLICATION:"Publication ou partage ouvert"};

function idSuivant(liste,prefixe){
  let n=1; const pris=new Set(liste.map(x=>x.id));
  while(pris.has(prefixe+String(n).padStart(4,"0"))) n++;
  return prefixe+String(n).padStart(4,"0");
}
const gisCourant=()=>S.gisements.find(x=>x.id===S.gisementCourant)||S.gisements[0]||null;
const scnCourant=()=>S.scenarios.find(x=>x.id===S.scenarioCourant)||S.scenarios[0]||null;

/* champs liés à l'état, sans rerendu pour ne pas perdre le curseur */
function texte(attr,cle,valeur,libelle,placeholder){
  return `<label class="champ" for="c-${attr}-${cle}">${libelle}</label>
    <input type="text" id="c-${attr}-${cle}" data-${attr}="${cle}" value="${esc(valeur)}"
      placeholder="${esc(placeholder||"")}">`;
}
function zone(attr,cle,valeur,libelle,lignes){
  return `<label class="champ" for="z-${attr}-${cle}">${libelle}</label>
    <textarea id="z-${attr}-${cle}" rows="${lignes||2}" data-${attr}="${cle}">${esc(valeur)}</textarea>`;
}
function choix(attr,cle,valeur,libelle,options){
  return `<label class="champ">${libelle}</label><select data-${attr}="${cle}">${
    options.map(o=>{const v=Array.isArray(o)?o[0]:o, t=Array.isArray(o)?o[1]:o;
      return `<option value="${esc(v)}" ${String(valeur)===String(v)?"selected":""}>${esc(t)}</option>`;}).join("")}</select>`;
}

/* ==========================================================================
   2. BARRE D'ESPACE DE TRAVAIL
   ========================================================================== */
function majBarre(){
  const b=$("etatSauvegarde"); if(!b) return;
  if(!P.actif){ b.textContent=""; return; }
  if(!P.disponible){ b.textContent="Enregistrement local indisponible"; b.className="p p-hach"; return; }
  if(P.etat==="en cours"){ b.textContent="Enregistrement"; b.className="p p-gris"; }
  else { b.textContent="Enregistré"+(P.dernier?" à "+P.dernier.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}):"");
         b.className="p p-teal"; }
}
function renderBarre(){
  const barre=$("barre");
  if(!P.actif){ barre.innerHTML=""; barre.hidden=true; return; }
  barre.hidden=false;
  barre.innerHTML=`<div class="barre-in">
    <div class="ligne" style="gap:10px;align-items:center;flex:1 1 320px">
      <span class="tag">Espace de travail</span>
      <input type="text" id="nomEspace" value="${esc(P.meta?P.meta.nom:"")}" style="max-width:320px">
      <span id="etatSauvegarde" class="p p-teal"></span>
    </div>
    <div class="ligne" style="gap:6px">
      <button class="btn mini gris" data-action="voir-exercices">Exercices</button>
      <button class="btn mini gris" data-action="exporter-rapport">Rapport</button>
      <button class="btn mini gris" data-action="exporter-json">Sauvegarde</button>
      <button class="btn mini gris" data-action="imprimer">Imprimer</button>
      <button class="btn mini sec" data-action="voir-accueil">Mes espaces</button>
    </div></div>`;
  majBarre();
}

/* ==========================================================================
   3. ACCUEIL, ESPACES DE TRAVAIL
   ========================================================================== */
function vueAccueil(){
  const liste=indexEspaces();
  const date=s=>new Date(s).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
  return `
  <div class="titre"><div><h1>Espaces de travail</h1>
    <small>Votre travail est enregistré dans ce navigateur, sur ce poste. Rien n'est envoyé sur un serveur.</small></div></div>
  ${!P.disponible?`<div class="encadre att">L'enregistrement local est bloqué par le navigateur, probablement en navigation privée.
    Vous pouvez travailler, mais tout sera perdu à la fermeture de l'onglet. Exportez votre sauvegarde avant de fermer.</div>`:""}

  <div class="sect"><h2>Commencer</h2>
  <div class="sub">Choisissez le point de départ demandé par l'exercice.</div>
  <div class="grille g3">${Object.entries(CAS).map(([cle,cas])=>`<div class="carte">
    <h3>${esc(cas.nom)}</h3><p style="margin:8px 0 14px;color:var(--gris);font-size:14px">${esc(cas.resume)}</p>
    <button class="btn" data-action="creer-espace" data-id="${cle}">Ouvrir un espace</button></div>`).join("")}</div>
  </div>

  <div class="sect"><h2>Reprendre</h2>
  ${liste.length?`<div class="carte scroll"><table><thead><tr><th>Nom</th><th>Point de départ</th>
    <th>Dernière modification</th><th></th></tr></thead><tbody>
    ${liste.map(m=>`<tr><td>${esc(m.nom)}<br><small class="mono-id">${m.id}</small></td>
      <td><small>${esc(CAS[m.cas]?CAS[m.cas].nom:m.cas)}</small></td>
      <td><small>${date(m.modifie)}</small></td>
      <td><div class="ligne" style="gap:4px;justify-content:flex-end">
        <button class="btn mini" data-action="ouvrir-espace" data-id="${m.id}">Ouvrir</button>
        <button class="btn mini gris" data-action="dupliquer-espace" data-id="${m.id}">Dupliquer</button>
        <button class="btn mini gris" data-action="supprimer-espace" data-id="${m.id}">Supprimer</button>
      </div></td></tr>`).join("")}
  </tbody></table></div>`:`<div class="carte"><small>Aucun espace enregistré sur ce poste.</small></div>`}
  </div>

  <div class="sect"><h2>Reprendre une sauvegarde</h2>
  <div class="sub">Chargez un fichier exporté depuis un autre poste ou lors d'une séance précédente.</div>
  <div class="carte"><div class="ligne">
    <input type="file" id="fichierImport" accept="application/json,.json">
    <button class="btn sec" data-action="importer">Charger la sauvegarde</button></div>
    <div id="messageImport" style="margin-top:10px"></div></div>
  </div>`;
}

/* ==========================================================================
   4. EXERCICES
   ========================================================================== */
const EXERCICES=[
 {t:"Cadrer un périmètre et démontrer sa couverture", depart:"Espace vierge", duree:"30 minutes",
  o:"Distinguer une exploration maîtrisée d'une prétention à l'exhaustivité.",
  e:["Renseignez le nom, le périmètre, le pilote et les exclusions de la campagne.",
     "Créez quatre unités, dont trois prioritaires, et cinq systèmes connus.",
     "Parcourez la grille des angles morts et résolvez chaque cellule des familles critiques.",
     "Déclarez les contributeurs sollicités et ceux qui ont répondu."],
  v:"Le statut de couverture reste insuffisant tant qu'une famille critique n'est pas vérifiée, même si toutes les unités sont explorées. La clôture reste refusée."},
 {t:"Faire émerger un gisement que personne n'avait recensé", depart:"Cas hôpital", duree:"30 minutes",
  o:"Comprendre pourquoi la découverte repose sur le croisement de canaux indépendants.",
  e:["Créez trois signaux décrivant la même réalité, avec trois canaux différents, par exemple métier, périphérique et institutionnel.",
     "Confirmez le premier signal, ce qui crée le gisement.",
     "Fusionnez les deux autres vers ce gisement.",
     "Ouvrez la fiche du gisement et regardez la provenance conservée."],
  v:"Le taux de confirmation croisée augmente. Aucun signal n'a été supprimé, et la fusion garde l'auteur et le canal de chaque signal."},
 {t:"Séparer le gisement du scénario", depart:"Cas hôpital", duree:"20 minutes",
  o:"Vérifier qu'un même gisement peut porter deux évaluations opposées.",
  e:["Ouvrez le gisement des comptes rendus d'hospitalisation.",
     "Comparez le tableau de bord du scénario de recherche de cohortes et celui de l'alerte prédictive.",
     "Notez les scores de valeur, d'activabilité et le statut du bloc C de chacun."],
  v:"Même gisement, même source, même population. Le premier est à instruire, le second est bloqué. La valeur ne compense jamais le bloc C."},
 {t:"Coter avec des preuves et non avec des impressions", depart:"Cas hôpital", duree:"40 minutes",
  o:"Voir la confiance changer une décision sans qu'aucune note ne bouge.",
  e:["Ouvrez Q2 sur le scénario de recherche de cohortes, aujourd'hui classé à instruire.",
     "Sans modifier aucun niveau, renseignez les deux voies de valeur laissées en ND avec une preuve documentée.",
     "Observez la complétude, la confiance, puis le statut de portefeuille."],
  v:"Le scénario quitte le statut à instruire dès que la confiance décisionnelle atteint 60 pour cent. Le potentiel latent, lui, avait déjà la même valeur."},
 {t:"Relever une cible du bloc C par le profil du scénario", depart:"Cas hôpital", duree:"25 minutes",
  o:"Montrer que la maturité cible est déterminée par le moteur, pas par le répondant.",
  e:["Ouvrez Q2 sur un scénario admissible, onglet Conditions et risques.",
     "Cochez le profil influence directe sur un soin.",
     "Regardez la cible de C06 passer à 4 et les écarts apparaître."],
  v:"Le scénario bascule en conditionnel et la liste des actions préalables s'allonge, sans qu'aucune réponse n'ait été modifiée."},
 {t:"Lire un portefeuille et repartir avec son dossier", depart:"Cas hôpital", duree:"30 minutes",
  o:"Interpréter les deux portefeuilles et produire un livrable exploitable en établissement.",
  e:["Ouvrez le portefeuille des gisements et repérez celui dont le score dépasse 70.",
     "Expliquez pourquoi il reste classé à instruire.",
     "Exportez le rapport, puis la sauvegarde de votre espace."],
  v:"Un score élevé ne suffit pas. Un seul scénario contributeur sous les seuils de confiance suffit à renvoyer le patrimoine en instruction."}
];
function vueExercices(){
  return `
  <div class="titre"><div><h1>Exercices</h1>
    <small>Six exercices, du cadrage à la lecture des portefeuilles.</small></div></div>
  <p class="chapeau">Chaque exercice indique son point de départ. Vous pouvez ouvrir un espace par exercice
     depuis l'écran Mes espaces, et conserver les deux côte à côte.</p>
  <div class="grille g2">${EXERCICES.map((x,i)=>`<div class="carte">
    <div class="ligne" style="justify-content:space-between;align-items:baseline">
      <span class="p p-violet">Exercice ${i+1}</span><span class="tag">${x.depart}, ${x.duree}</span></div>
    <h3 style="margin:10px 0 6px">${esc(x.t)}</h3>
    <p style="font-size:14px;color:var(--gris)">${esc(x.o)}</p>
    <ol style="font-size:14px;padding-left:20px;margin:0 0 12px">${x.e.map(s=>`<li style="margin-bottom:4px">${esc(s)}</li>`).join("")}</ol>
    <div class="encadre"><strong>Ce que vous devez obtenir.</strong> ${esc(x.v)}</div></div>`).join("")}</div>`;
}

/* ==========================================================================
   5. CAMPAGNE EDR
   ========================================================================== */
function unitesPrio(){ return S.campagne.unites.filter(u=>u.prio); }
function cellulesPerimetre(){
  const out=[];
  unitesPrio().forEach(u=>FAMILLES.forEach((f,i)=>{
    const cle=u.id+"|"+i;
    out.push([cle, S.campagne.cellules[cle]||"NC", f]);
  }));
  return out;
}
function vueEDR(){
  const c=S.campagne,k=kpiEDR();
  const pastilleStatut={INSUFFISANTE:"p-hach",PARTIELLE:"p-gris",SATISFAISANTE:"p-teal",FORTE:"p-lime"}[k.statut];
  const cloture=[
    ["Contre-exploration réalisée",c.contreExploration],
    ["Aucun signal prioritaire non résolu",k.prioNonResolus===0],
    ["Aucune cellule critique non vérifiée",k.critNC===0],
    ["Couverture organisationnelle prioritaire d'au moins 90 pour cent",k.CO_p>=90],
    ["Couverture des systèmes connus d'au moins 90 pour cent",k.CS>=90],
    ["Rendement de la dernière passe inférieur à 10 pour cent",k.RM<10],
    ["Chaque gisement a un interlocuteur ou une action de gouvernance",k.gouvNon===0],
    ["Aucune copie de contenu patient nécessaire",true]
  ];
  return `
  <div class="titre"><div><h1>${esc(c.nom)}</h1>
    <small class="mono-id">${c.id}, passe ${c.passe}, ouverte le ${esc(c.debut)}</small></div>
    <span class="p ${pastilleStatut}">Couverture ${k.statut.toLowerCase()}</span></div>

  <div class="carte"><h3>E0, cadrer la campagne</h3>
    <div class="sub" style="margin:4px 0 14px">Le périmètre explicite est ce qui permet d'affirmer une exploration maîtrisée
      plutôt qu'un inventaire de toutes les données de l'établissement.</div>
    <div class="grille g2">
      <div>${texte("camp","nom",c.nom,"Nom de la campagne")}</div>
      <div>${texte("camp","pilote",c.pilote,"Pilote de campagne","Fonction ou direction responsable")}</div>
      <div>${zone("camp","perimetre",c.perimetre,"Périmètre organisationnel et processus couverts")}</div>
      <div>${zone("camp","exclusions",c.exclusions,"Exclusions explicites")}</div>
    </div>
    <div class="ligne" style="margin-top:12px">
      <div style="flex:0 1 160px">${texte("camp","debut",c.debut,"Date d'ouverture")}</div>
      <div style="flex:0 1 120px">${texte("campn","passe",c.passe,"Passe en cours")}</div>
      <div style="flex:0 1 160px">${texte("contrib","sollicites",c.contributeurs.sollicites,"Contributeurs sollicités")}</div>
      <div style="flex:0 1 160px">${texte("contrib","repondu",c.contributeurs.repondu,"Contributeurs ayant répondu")}</div>
      <div style="flex:0 1 150px">${texte("contrib","rolesAttendus",c.contributeurs.rolesAttendus,"Rôles attendus")}</div>
      <div style="flex:0 1 150px">${texte("contrib","rolesCouverts",c.contributeurs.rolesCouverts,"Rôles couverts")}</div>
      <div style="flex:0 1 220px">${choix("camp","contreExploration",c.contreExploration,"Contre-exploration",[[true,"Réalisée"],[false,"Non réalisée"]])}</div>
    </div>
  </div>

  <div class="grille g4 sect">
    ${kpi(k.CO_p,"Couverture organisationnelle prioritaire",unitesPrio().filter(u=>u.etat!=="PREVUE").length+" sur "+unitesPrio().length+" unités",1)}
    ${kpi(k.CS,"Systèmes connus examinés ou exclus",c.systemes.filter(s=>["EXAMINE","EXCLU"].includes(s.etat)).length+" sur "+c.systemes.filter(s=>s.etat!=="HORS_PERIMETRE").length,1)}
    ${kpi(k.CF,"Familles de données résolues",(k.tot-k.nc)+" sur "+k.tot+" cellules",1)}
    ${kpi(k.CC_p,"Contributeurs ayant répondu",c.contributeurs.repondu+" sur "+c.contributeurs.sollicites,1)}
    ${kpi(k.CC_r,"Rôles couverts",c.contributeurs.rolesCouverts+" sur "+c.contributeurs.rolesAttendus,1)}
    ${kpi(k.novelty,"Gisements absents des inventaires","sur "+S.gisements.filter(g=>g.prealable!=="INCONNU").length+" gisements cotés",1)}
    ${kpi(k.croise,"Confirmation par au moins deux signaux","auteur et canal différents",1)}
    ${kpi(k.RM,"Rendement de la dernière passe",c.passes.map(p=>p.id+" : "+p.nouveaux).join(", "),1)}
  </div>

  <div class="sect"><h2>E1, carte d'exploration</h2>
    <div class="sub">Les unités prioritaires alimentent la grille des angles morts et le calcul de couverture.</div>
    <div class="grille g2">
      <div class="carte"><h3>Unités du périmètre</h3>
        <div class="scroll"><table style="margin-top:8px"><tbody>
        ${c.unites.map(u=>`<tr>
          <td style="width:46%"><input type="text" data-unite="${u.id}|nom" value="${esc(u.nom)}"></td>
          <td>${choix("unite",u.id+"|prio",u.prio,"",[[true,"Prioritaire"],[false,"Secondaire"]])}</td>
          <td>${choix("unite",u.id+"|etat",u.etat,"",[["PREVUE","Prévue"],["EXPLOREE","Explorée"],["EXCLUE","Exclue"]])}</td>
          <td style="width:1%"><button class="btn mini gris" data-action="suppr-unite" data-id="${u.id}">Retirer</button></td>
        </tr>`).join("")||`<tr><td><small>Aucune unité. Commencez par en créer une.</small></td></tr>`}
        </tbody></table></div>
        <button class="btn sec mini" style="margin-top:10px" data-action="ajout-unite">Ajouter une unité</button></div>

      <div class="carte"><h3>Systèmes et outils connus</h3>
        <div class="scroll"><table style="margin-top:8px"><tbody>
        ${c.systemes.map(s=>`<tr>
          <td style="width:56%"><input type="text" data-systeme="${s.id}|nom" value="${esc(s.nom)}"></td>
          <td>${choix("systeme",s.id+"|etat",s.etat,"",[["A_REVOIR","À examiner"],["EXAMINE","Examiné"],["EXCLU","Exclu"],["HORS_PERIMETRE","Hors périmètre"]])}</td>
          <td style="width:1%"><button class="btn mini gris" data-action="suppr-systeme" data-id="${s.id}">Retirer</button></td>
        </tr>`).join("")||`<tr><td><small>Aucun système déclaré.</small></td></tr>`}
        </tbody></table></div>
        <button class="btn sec mini" style="margin-top:10px" data-action="ajout-systeme">Ajouter un système</button></div>
    </div>
  </div>

  <div class="sect"><h2>E5, grille des angles morts</h2>
    <div class="sub">Chaque cellule croise une famille de données et une unité prioritaire. Cliquez pour faire évoluer son état.
      Une cellule non vérifiée crée une action, et les familles critiques bloquent la clôture.</div>
    <div class="carte scroll">${grilleAM()}</div>
    <div class="tag" style="margin-top:12px">${k.id} identifiées, ${k.ab} absentes déclarées, ${k.na} non applicables,
      ${k.nc} non vérifiées dont ${k.critNC} sur des familles critiques</div>
  </div>

  <div class="sect"><h2>Clôture proposée</h2>
    <div class="sub">Le moteur propose, il ne clôture jamais seul. Les invariants ne sont pas dérogeables.</div>
    <div class="carte"><ul class="liste-nette">${cloture.map(([t,ok])=>`<li><span>${t}</span>
      <span class="p ${ok?"p-teal":"p-hach"}">${ok?"Satisfait":"Non satisfait"}</span></li>`).join("")}</ul>
      <div class="encadre att" style="margin-top:16px">${cloture.every(x=>x[1])
        ? "Tous les critères sont réunis. La clôture reste une décision humaine, attribuée et motivée."
        : "Clôture impossible en l'état, "+cloture.filter(x=>!x[1]).length+" critères restent ouverts."}</div>
    </div></div>`;
}
function kpi(v,l,d,pc){
  const na=(v===null||v===undefined||isNaN(v));
  return `<div class="kpi${na?' na':''}"><div class="v">${na?"N/A":(pc?f0(v)+" %":f0(v))}</div>
    <div class="l">${l}</div>${d?`<div class="d">${d}</div>`:""}</div>`;
}
function grilleAM(){
  const zones=unitesPrio();
  if(!zones.length) return `<small>Déclarez au moins une unité prioritaire pour construire la grille.</small>`;
  return `<table class="am"><thead><tr><th style="min-width:200px">Famille de données</th>
    ${zones.map(z=>`<th>${esc(z.nom)}</th>`).join("")}</tr></thead><tbody>
    ${FAMILLES.map((f,i)=>`<tr><th style="text-align:left;font-weight:400;color:var(--encre)">
      ${esc(f)}${FAM_CRIT.has(f)?' <span class="tag">critique</span>':''}</th>
      ${zones.map(z=>{const v=S.campagne.cellules[z.id+"|"+i]||"NC";
        return `<td><button class="s-${v}" data-cell="${z.id}|${i}" title="${CELL_LIB[v]}">${CELL_LIB[v]}</button></td>`;}).join("")}
    </tr>`).join("")}</tbody></table>`;
}

/* ==========================================================================
   6. SIGNAUX
   ========================================================================== */
function vueSignaux(){
  const pastille=s=>{
    if(s.res==="CONFIRME") return '<span class="p p-teal">Confirmé</span>';
    if(s.res==="FUSIONNE") return '<span class="p p-gris">Fusionné</span>';
    if(s.res==="ECARTE")   return '<span class="p p-gris">Écarté, historisé</span>';
    if(s.wf==="EN_REVUE")  return '<span class="p p-violet">En revue</span>';
    return '<span class="p p-hach">À arbitrer</span>';
  };
  const attente=S.signaux.filter(s=>s.wf!=="RESOLU");
  return `
  <div class="titre"><div><h1>File des signaux</h1>
    <small>Un signal n'est pas un gisement. Aucun score n'est calculé à ce stade.</small></div></div>
  <p class="chapeau">Le pilote arbitre chaque signal : confirmer, fusionner ou écarter.
     Un signal écarté reste historisé avec sa justification, un signal fusionné conserve sa provenance.</p>

  <div class="carte"><h3>E4, créer un signal</h3>
    <div class="sub" style="margin:4px 0 12px">Saisie rapide, sans source ni interlocuteur obligatoire.</div>
    <div class="ligne">
      <div style="flex:2 1 260px">${texte("neuf","sig-nom","","Nom provisoire","Ex. tableur de suivi des sorties contre avis médical")}</div>
      <div style="flex:1 1 150px"><label class="champ">Unité</label><select id="sig-zone">
        ${S.campagne.unites.map(u=>`<option value="${u.id}">${esc(u.nom)}</option>`).join("")||`<option value="">Aucune unité</option>`}</select></div>
      <div style="flex:1 1 170px"><label class="champ">Canal de découverte</label><select id="sig-canal">
        ${Object.entries(CANAUX).map(([k,v])=>`<option value="${k}">${k} ${v}</option>`).join("")}</select></div>
      <div style="flex:1 1 160px">${texte("neuf","sig-auteur","","Auteur du signal","Fonction du contributeur")}</div>
      <div style="flex:1 1 200px"><label class="champ">Motif du signalement</label><select id="sig-motif">
        ${MOTIFS.map(m=>`<option>${esc(m)}</option>`).join("")}</select></div>
      <button class="btn" data-action="add-signal">Créer le signal</button>
    </div>
    <div class="tag" style="margin-top:10px">Le motif explique pourquoi le signal mérite une investigation. Ce n'est pas une cotation de valeur.</div>
  </div>

  <div class="sect"><h2>Signaux de la campagne</h2>
  <div class="carte scroll"><table><thead><tr>
    <th>Identifiant</th><th>Nom provisoire</th><th>Unité</th><th>Canal</th><th>Auteur</th>
    <th>Motif</th><th>Statut</th><th>Gisement</th><th></th></tr></thead><tbody>
    ${S.signaux.map(s=>{const z=S.campagne.unites.find(u=>u.id===s.zone);
      return `<tr><td class="mono-id">${s.id}</td><td>${esc(s.nom)}</td><td>${z?esc(z.nom):"non précisée"}</td>
      <td>${s.canal} <span class="tag">${CANAUX[s.canal]||""}</span></td><td>${esc(s.auteur)}</td>
      <td><small>${esc(s.motif)}</small></td><td>${pastille(s)}</td>
      <td class="mono-id">${s.gis||"aucun"}</td>
      <td>${s.wf!=="RESOLU"?`<div class="ligne" style="gap:4px;justify-content:flex-end">
        <button class="btn mini" data-action="confirm-signal" data-id="${s.id}">Confirmer</button>
        ${S.gisements.length?`<select data-fusion="${s.id}" style="width:auto;min-width:150px">
          <option value="">Fusionner vers</option>
          ${S.gisements.map(g=>`<option value="${g.id}">${esc(g.nom.slice(0,40))}</option>`).join("")}</select>`:""}
        <button class="btn mini gris" data-action="dismiss-signal" data-id="${s.id}">Écarter</button></div>`:""}</td></tr>`;}).join("")
      ||`<tr><td colspan="9"><small>Aucun signal. Créez-en un ci-dessus.</small></td></tr>`}
  </tbody></table></div></div>

  ${attente.length?`<div class="encadre" style="margin-top:20px">
    ${attente.length} signal${attente.length>1?"s attendent":" attend"} une décision. Confirmer crée le gisement canonique
    en une transaction : identifiant pérenne, provenance conservée, aucun dossier de qualification ouvert à ce stade.</div>`:""}`;
}

/* ==========================================================================
   7. GISEMENTS
   ========================================================================== */
function vueGisements(){
  const g=gisCourant();
  if(!g) return `<div class="titre"><h1>Registre des gisements</h1></div>
    <div class="carte"><p>Aucun gisement confirmé.</p>
    <p style="color:var(--gris);font-size:14px">Un gisement naît de la confirmation d'un signal. Vous pouvez aussi en créer un directement,
      par exemple pour reprendre un inventaire existant.</p>
    <button class="btn" data-action="creer-gisement">Créer un gisement</button></div>`;
  const r=calcGisement(g);
  const champD=[["D02","nom","Nom usuel"],["D03","definition","Définition, ce qu'il contient et ce qu'il ne contient pas"],
    ["D06","sources","Sources"],["D07","producteur","Producteur"],["D08","rmetier","Responsable métier"],
    ["D09","rtech","Responsable technique"],["D10","population","Population"],["D11","periode","Période et rythme"],
    ["D12","modalites","Modalités"],["D13","granularite","Granularité"],["D15","sensibilite","Sensibilité présumée"],
    ["D16","usageInitial","Usage initial"],["D19","contraintes","Contraintes connues"]];
  return `
  <div class="titre"><div><h1>Registre des gisements</h1>
    <small>${S.gisements.length} gisements confirmés. Chacun porte un identifiant pérenne et sa provenance.
      L'état de qualification appartient aux scénarios.</small></div>
    <button class="btn sec" data-action="creer-gisement">Créer un gisement</button></div>
  <div class="ligne" style="margin-bottom:20px">
    <div style="flex:1 1 420px"><label class="champ" for="gsel">Gisement</label><select id="gsel" data-action="sel-gis">
      ${S.gisements.map(x=>`<option value="${x.id}" ${x.id===g.id?"selected":""}>${x.id} ${esc(x.nom)}</option>`).join("")}</select></div>
    <button class="btn mini gris" data-action="suppr-gisement" data-id="${g.id}">Retirer ce gisement</button>
  </div>

  <div class="grille g2">
    <div class="carte"><h3>Fiche D, description du gisement</h3>
      <div class="sub" style="margin:4px 0 12px">Le bloc D n'est pas coté. Il garantit que les objets comparés ont un périmètre stable.</div>
      ${champD.map(([code,cle,lib])=>`<div style="margin-bottom:10px">${
        (cle==="definition")? zone("gis",g.id+"|"+cle,g[cle],code+" "+lib,3)
                            : texte("gis",g.id+"|"+cle,g[cle],code+" "+lib)}</div>`).join("")}
      <div class="grille g2" style="margin-top:4px">
        <div>${choix("gis",g.id+"|famille",g.famille,"D04 Famille",FAMILLES.concat(["À qualifier en Q1"]))}</div>
        <div>${choix("gis",g.id+"|zone",g.zone,"D05 Unité",S.campagne.unites.map(u=>[u.id,u.nom]))}</div>
        <div>${choix("gis",g.id+"|prealable",g.prealable,"Recensé avant la campagne",[["NON","Non"],["OUI","Oui"],["INCONNU","Inconnu"]])}</div>
        <div>${choix("gis",g.id+"|gouvernance",g.gouvernance,"Gouvernance",[["A_IDENTIFIER","Responsable à identifier"],["IDENTIFIE","Responsable identifié"]])}</div>
        <div>${choix("gisn",g.id+"|V09",g.V09,"V09 Valeur patrimoniale validée",[0,1,2,3,4])}</div>
        <div>${choix("gisn",g.id+"|V09preuve",g.V09preuve,"Preuve de la cotation V09",[[0,"E0"],[1,"E1"],[2,"E2"],[3,"E3"]])}</div>
      </div>
    </div>
    <div>
      <div class="carte"><h3>Profil d'usage du gisement</h3>
        <div class="sub" style="margin:4px 0 12px">Lecture patrimoniale Ug, distincte du U d'un scénario. Elle n'est jamais soustraite à la valeur.</div>
        <div style="font-size:34px;font-weight:600" class="num">${f1(r.Ug)}<span style="font-size:15px;color:var(--gris);font-weight:400"> sur 100, complétude ${f0(r.K_UG)} %</span></div>
        <div class="jauge lime"><i style="width:${Math.max(0,Math.min(100,r.Ug))}%"></i></div>
        ${Object.keys(g.ug).map(id=>{const rep=g.ug[id];
          return `<div class="crit"><div class="hd"><h4>${id} ${LIB[id]}</h4></div>
            <div class="q">${QUESTION[id]||""}</div>
            <div class="ctl"><div>${choix("ug",g.id+"|"+id+"|v",rep.v,"Niveau",["ND","NA",0,1,2,3,4])}</div>
              <div>${choix("ugn",g.id+"|"+id+"|e",rep.e,"Preuve",[[0,"E0"],[1,"E1"],[2,"E2"],[3,"E3"]])}</div></div>
            ${ancresHTML(id,rep.v)}</div>`;}).join("")}
      </div>
      <div class="carte" style="margin-top:16px"><h3>Provenance</h3>
        <ul class="liste-nette" style="margin-top:8px">${S.signaux.filter(s=>s.gis===g.id).map(s=>
          `<li><span>${s.id} ${esc(s.nom)}<br><small>${esc(s.auteur)}, canal ${s.canal}</small></span>
           <span class="p p-gris">${s.res==="CONFIRME"?"Origine":"Fusionné"}</span></li>`).join("")
           ||"<li><small>Aucun signal rattaché. Ce gisement a été saisi directement.</small></li>"}</ul>
      </div>
    </div>
  </div>

  <div class="sect"><h2>Scénarios rattachés</h2>
  <div class="carte scroll"><table><thead><tr><th>Scénario</th><th>Origine</th><th class="n">Potentiel latent</th>
    <th class="n">Activabilité</th><th>Statut C</th><th>Statut</th><th></th></tr></thead><tbody>
    ${r.scs.map(({s,r:rr})=>`<tr><td>${esc(s.titre)}<br><small class="mono-id">${s.id}</small></td>
      <td><small>${esc(s.origine)}</small></td><td class="n">${f1(rr.L.dec)}</td><td class="n">${f1(rr.A.dec)}</td>
      <td><span class="p ${rr.C.statut==="ADMISSIBLE"?"p-teal":rr.C.statut==="BLOQUE"?"p-encre":"p-hach"}">${C_LIB[rr.C.statut]}</span></td>
      <td><span class="p ${rr.P==="P0"?"p-encre":rr.P==="P4"?"p-hach":"p-violet"}">${P_LIB[rr.P]}</span></td>
      <td><button class="btn mini sec" data-action="open-scn" data-id="${s.id}">Ouvrir</button></td></tr>`).join("")
      ||`<tr><td colspan="7"><small>Aucun scénario. Passez par Q1 pour en formuler un.</small></td></tr>`}
  </tbody></table></div></div>`;
}

/* ==========================================================================
   8. Q1, DÉTECTION ET SCÉNARIOS
   ========================================================================== */
function scenarioVide(gis,titre,origine){
  const vide=ks=>Object.fromEntries(ks.map(k=>[k,a("ND",0)]));
  return {id:idSuivant(S.scenarios,"SCN-"), gis, stade:"SIGNALE", titre,
    finalite:"",beneficiaire:"",decision:"",resultat:"",population:"",horizon:"",
    origine, cIA:false, profil:["PERSONNEL_SANTE"],
    u:Object.fromEntries(Object.keys(W.U).map(k=>[k,au("ND",0,null,null)])),
    v:vide([...Object.keys(W.Vv),...Object.keys(W.Vc)]),
    A:vide(Object.keys(W.A)),
    c:Object.fromEntries(Object.keys(W.C).map(k=>[k,c("ND",0,null,null)])),
    ia:{}};
}
function vueQ1(){
  const sc=scnCourant();
  return `
  <div class="titre"><div><h1>Q1, détection et formulation des scénarios</h1>
    <small>Aucun calcul décisionnel U, V, L, A, C ou IA n'est autorisé pendant Q1.</small></div></div>
  <p class="chapeau">Q1 complète la fiche D, le profil d'usage et les premiers signaux d'activabilité et de conditions.
     Le moteur peut proposer des scénarios candidats à partir des seules métadonnées. Une suggestion reste une hypothèse
     non cotée tant qu'un professionnel habilité ne l'a pas validée ou reformulée.</p>

  ${S.suggestions.length?`<div class="sect"><h2>Suggestions du moteur de découverte</h2>
  <div class="sub">Générées à partir de la famille, de la modalité, de la profondeur historique, du producteur et des usages déclarés.
    Elles ne portent ni score, ni priorité, ni recommandation de pilote.</div>
  <div class="grille g2">${S.suggestions.map(s=>{const g=S.gisements.find(x=>x.id===s.gis);
    return `<div class="carte"><div class="ligne" style="justify-content:space-between">
      <span class="p p-violet">Suggestion non cotée</span><span class="mono-id">${s.id}</span></div>
      <h3 style="margin-top:10px">${esc(s.titre)}</h3>
      <div class="tag" style="margin:4px 0 10px">${g?esc(g.nom):""}, première voie de valeur ${s.voie} ${LIB[s.voie]}</div>
      <table><tr><td style="color:var(--gris);width:34%">Hypothèses</td><td>${esc(s.hypotheses)}</td></tr>
      <tr><td style="color:var(--gris)">Inconnues</td><td>${esc(s.inconnues)}</td></tr>
      <tr><td style="color:var(--gris)">Méthode de référence</td><td>${esc(s.baseline)}</td></tr></table>
      <div class="ligne" style="margin-top:12px">
        <button class="btn" data-action="valider-sug" data-id="${s.id}">Valider et créer le scénario</button>
        <button class="btn sec" data-action="rejeter-sug" data-id="${s.id}">Rejeter</button></div></div>`;}).join("")}</div></div>`:""}

  <div class="sect"><h2>Formuler un scénario</h2>
  <div class="sub">Un scénario est un gisement croisé avec un cas d'usage. Il exige au minimum une finalité, un bénéficiaire,
    une décision améliorée, un résultat attendu, une population et un horizon.</div>
  ${S.gisements.length?`<div class="carte"><div class="ligne">
    <div style="flex:2 1 320px">${texte("neuf","scn-titre","","Intitulé du scénario","Ex. repérage des patients perdus de vue")}</div>
    <div style="flex:1 1 260px"><label class="champ">Gisement</label><select id="scn-gis">
      ${S.gisements.map(g=>`<option value="${g.id}">${esc(g.nom)}</option>`).join("")}</select></div>
    <button class="btn" data-action="creer-scenario">Créer le scénario</button></div></div>`
   :`<div class="carte"><small>Confirmez d'abord un gisement.</small></div>`}
  </div>

  ${sc?`<div class="sect"><h2>Définition du scénario</h2>
  <div class="ligne" style="margin-bottom:14px"><div style="flex:1 1 460px">
    <label class="champ" for="ssel0">Scénario</label><select id="ssel0" data-action="sel-scn">
      ${S.scenarios.map(x=>`<option value="${x.id}" ${x.id===sc.id?"selected":""}>${x.id} ${esc(x.titre)}</option>`).join("")}
    </select></div>
    <button class="btn mini gris" data-action="suppr-scenario" data-id="${sc.id}">Retirer ce scénario</button></div>
  <div class="carte"><div class="grille g2">
    <div>${texte("scn",sc.id+"|titre",sc.titre,"Intitulé")}</div>
    <div>${texte("scn",sc.id+"|horizon",sc.horizon,"Horizon","Ex. 12 mois")}</div>
    <div>${zone("scn",sc.id+"|finalite",sc.finalite,"Finalité poursuivie")}</div>
    <div>${zone("scn",sc.id+"|beneficiaire",sc.beneficiaire,"Bénéficiaire ou utilisateur")}</div>
    <div>${zone("scn",sc.id+"|decision",sc.decision,"Décision ou activité améliorée")}</div>
    <div>${zone("scn",sc.id+"|resultat",sc.resultat,"Résultat attendu")}</div>
    <div>${zone("scn",sc.id+"|population",sc.population,"Population et périmètre")}</div>
    <div>${choix("scn",sc.id+"|cIA",sc.cIA,"Cas d'usage d'intelligence artificielle explicite",[[false,"Non"],[true,"Oui, ouvrir le bloc IA"]])}</div>
  </div>
  <div class="encadre" style="margin-top:14px">Le bloc IA ne s'ouvre que si la tâche, l'utilisateur, la sortie attendue
    et une méthode de référence non fondée sur l'IA sont définis. À défaut, la recommandation est de reformuler le besoin.</div>
  </div></div>`:""}

  <div class="sect"><h2>Scénarios de l'espace</h2>
  <div class="carte scroll"><table><thead><tr><th>Scénario</th><th>Gisement</th><th>Finalité</th>
    <th>Bénéficiaire</th><th>Horizon</th><th>Cas IA</th></tr></thead><tbody>
    ${S.scenarios.map(s=>{const g=S.gisements.find(x=>x.id===s.gis);
      return `<tr><td>${esc(s.titre)}<br><small class="mono-id">${s.id}, ${esc(s.origine)}</small></td>
      <td><small>${g?esc(g.nom):""}</small></td><td><small>${esc(s.finalite)||'<span class="p p-hach">à compléter</span>'}</small></td>
      <td><small>${esc(s.beneficiaire)}</small></td><td>${esc(s.horizon)}</td>
      <td>${s.cIA?'<span class="p p-violet">Ouvert</span>':'<span class="tag">non</span>'}</td></tr>`;}).join("")
      ||`<tr><td colspan="6"><small>Aucun scénario.</small></td></tr>`}
  </tbody></table></div></div>`;
}

/* ==========================================================================
   9. Q2, QUALIFICATION
   ========================================================================== */
function ancresHTML(id,valeur){
  const an=ANCRES[id]; if(!an) return "";
  return `<details class="ancres"><summary>Ancres de cotation</summary>
    <table>${an.map((t,n)=>`<tr class="${String(valeur)===String(n)?'active':''}">
      <td class="niv">${n}</td><td>${esc(t)}</td></tr>`).join("")}</table></details>`;
}
function vueQ2(){
  const sc=scnCourant();
  if(!sc) return `<div class="titre"><h1>Q2, qualification</h1></div>
    <div class="carte"><small>Aucun scénario à qualifier. Formulez-en un depuis Q1.</small></div>`;
  const g=S.gisements.find(x=>x.id===sc.gis);
  const onglets=[["U","Usage actuel"],["V","Valeur potentielle"],["A","Activabilité"],["C","Conditions et risques"]];
  if(sc.cIA) onglets.push(["IA","Aptitude IA"]);
  if(S.tabQ==="IA" && !sc.cIA) S.tabQ="U";
  return `
  <div class="titre"><div><h1>Q2, qualification distribuée</h1>
    <small>${esc(sc.titre)}, <span class="mono-id">${sc.id}</span>, ${g?esc(g.nom):""}</small></div></div>
  <div class="ligne" style="margin-bottom:16px"><div style="flex:1 1 460px">
    <label class="champ" for="ssel">Scénario</label><select id="ssel" data-action="sel-scn">
      ${S.scenarios.map(x=>`<option value="${x.id}" ${x.id===sc.id?"selected":""}>${x.id} ${esc(x.titre)}</option>`).join("")}
    </select></div></div>
  <details class="carte rappel"><summary>Rappel de l'échelle et des niveaux de preuve</summary>
    <div class="grille g2" style="margin-top:12px">
      <div><h4>Échelle de maturité</h4><table>${ECHELLE.map((e,i)=>
        `<tr><td class="niv">${i}</td><td><strong>${e[0]}</strong><br><small>${esc(e[1])}</small></td></tr>`).join("")}</table></div>
      <div><h4>Niveaux de preuve</h4><table>${NIVEAUX_PREUVE.map(e=>
        `<tr><td class="niv">${e[0]}</td><td><strong>${e[1]}</strong><br><small>${esc(e[2])}</small></td></tr>`).join("")}</table>
        <ul class="liste-nette" style="margin-top:10px">${REGLES_PREUVE.map(r=>`<li><small>${esc(r)}</small></li>`).join("")}</ul></div>
    </div></details>
  <div class="tabs">${onglets.map(([k,l])=>
    `<button data-tab="${k}" aria-current="${S.tabQ===k}">${l}</button>`).join("")}</div>
  <div class="carte">${S.tabQ==="C"?blocC(sc):S.tabQ==="U"?blocU(sc):blocSimple(sc,S.tabQ)}</div>
  <div class="encadre" style="margin-top:16px">
    ND n'est jamais assimilé à zéro : il déclenche une instruction et élargit la fourchette de potentiel latent.
    NA exige une justification validée et redistribue le poids sur les critères applicables du même axe.</div>`;
}
function selNiv(bloc,id,champ,val){
  const opts=["ND","NA",0,1,2,3,4].map(o=>
    `<option value="${o}" ${String(val)===String(o)?"selected":""}>${o==="ND"?"ND, non déterminé":o==="NA"?"NA, non applicable":o}</option>`).join("");
  return `<select data-edit="${bloc}|${id}|${champ}">${opts}</select>`;
}
function selPreuve(bloc,id,val){
  return `<select data-edit="${bloc}|${id}|e">${[0,1,2,3].map(o=>
    `<option value="${o}" ${o===val?"selected":""}>E${o}, ${["aucune preuve","déclaratif","documenté","vérifié"][o]}</option>`).join("")}</select>`;
}
function blocSimple(sc,bloc){
  const src = bloc==="V"?sc.v:bloc==="A"?sc.A:sc.ia;
  const ids = bloc==="V"?[...Object.keys(W.Vv),...Object.keys(W.Vc)]:Object.keys(bloc==="A"?W.A:W.IA);
  const poids = bloc==="V"?{...W.Vv,...W.Vc}:(bloc==="A"?W.A:W.IA);
  return ids.map(id=>{const r=src[id]||(src[id]=a("ND",0));
    return `<div class="crit"><div class="hd"><h4>${id} ${LIB[id]}</h4>
      <span class="tag">poids ${poids[id]} %${bloc==="V"&&W.Vv[id]?", voie de valeur":""}</span></div>
      <div class="q">${QUESTION[id]||""}</div>
      <div class="ctl"><div><label class="champ">Niveau</label>${selNiv(bloc,id,"v",r.v)}</div>
        <div><label class="champ">Preuve</label>${selPreuve(bloc,id,r.e)}</div></div>
      ${ancresHTML(id,r.v)}</div>`;}).join("");
}
function blocU(sc){
  return Object.keys(W.U).map(id=>{const r=sc.u[id]||(sc.u[id]=au("ND",0,null,null));
    const contra = num(r.d)&&num(r.o)&&Math.abs(r.d-r.o)>=2;
    return `<div class="crit"><div class="hd"><h4>${id} ${LIB[id]}</h4><span class="tag">poids ${W.U[id]} %</span></div>
      <div class="q">${QUESTION[id]}</div>
      <div class="ctl">
        <div><label class="champ">Niveau retenu</label>${selNiv("U",id,"v",r.v)}</div>
        <div><label class="champ">Usage déclaré</label>${selNiv("U",id,"d",r.d===null||r.d===undefined?"ND":r.d)}</div>
        <div><label class="champ">Usage objectivé</label>${selNiv("U",id,"o",r.o===null||r.o===undefined?"ND":r.o)}</div>
        <div><label class="champ">Preuve</label>${selPreuve("U",id,r.e)}</div></div>
      ${contra?`<div class="encadre att" style="margin-top:10px">Écart d'au moins deux niveaux entre déclaré et objectivé,
        anomalie à instruire. Aucune moyenne automatique, la borne haute retient ${Math.max(r.d,r.o)}.</div>`:""}
      ${ancresHTML(id,r.v)}</div>`;}).join("");
}
function blocC(sc){
  const cib=ciblesC(sc.profil);
  return `<div style="margin-bottom:16px"><h4>Profil du scénario</h4>
    <div class="sub" style="margin:4px 0 10px">Le profil détermine les maturités cibles. Ce n'est pas une appréciation libre du répondant.</div>
    <div class="ligne">${Object.entries(PROFILS).map(([k,l])=>
      `<button class="btn mini ${sc.profil.includes(k)?"":"gris"}" data-action="toggle-profil" data-id="${k}">${l}</button>`).join("")}</div></div>
  ${Object.keys(W.C).map(id=>{const r=sc.c[id]||(sc.c[id]=c("ND",0,null,null));
    const gap=num(r.v)?Math.max(0,cib[id]-r.v):cib[id];
    return `<div class="crit"><div class="hd"><h4>${id} ${LIB[id]}</h4>
      <span class="tag">poids ${W.C[id]} %, cible ${cib[id]}${gap>0?", écart "+gap:""}</span></div>
      <div class="q">${QUESTION[id]}</div>
      <div class="ctl">
        <div><label class="champ">Maturité du contrôle</label>${selNiv("C",id,"v",r.v)}</div>
        <div><label class="champ">Impact</label><select data-edit="C|${id}|I">${["ND",1,2,3,4].map(o=>
          `<option value="${o}" ${(o==="ND"?!num(r.I):r.I===o)?"selected":""}>${o}</option>`).join("")}</select></div>
        <div><label class="champ">Exposition</label><select data-edit="C|${id}|P">${["ND",1,2,3,4].map(o=>
          `<option value="${o}" ${(o==="ND"?!num(r.P):r.P===o)?"selected":""}>${o}</option>`).join("")}</select></div>
        <div><label class="champ">Preuve</label>${selPreuve("C",id,r.e)}</div></div>
      <div class="tag" style="margin-top:8px">Preuves attendues : ${esc(PREUVES_C[id]||"")}</div>
      <details class="ancres"><summary>Ancres de contrôle</summary><table>${ECHELLE_C.map((t,n)=>
        `<tr class="${String(r.v)===String(n)?'active':''}"><td class="niv">${n}</td><td>${esc(t)}</td></tr>`).join("")}</table></details>
      ${gap>0?`<div class="tag" style="margin-top:6px">Écart ouvert, une action de maîtrise est créée avec niveau cible,
        responsable, preuve de clôture et autorité de validation.</div>`:""}
    </div>`;}).join("")}`;
}

/* ==========================================================================
   10. TABLEAU DE BORD D'UN SCÉNARIO
   ========================================================================== */
function vueScenario(){
  const sc=scnCourant();
  if(!sc) return `<div class="titre"><h1>Tableau de bord</h1></div>
    <div class="carte"><small>Aucun scénario. Formulez-en un depuis Q1.</small></div>`;
  const g=S.gisements.find(x=>x.id===sc.gis); const r=calcScenario(sc);
  const badges=[];
  if(r.P==="P4") badges.push(['p-hach',"À instruire"]);
  if(r.U.dec>=80&&r.V.dec>=70) badges.push(['p-gris',"Valeur déjà captée"]);
  if(r.noPilot) badges.push(['p-encre',"Pas de pilote"]);
  if(r.IA&&r.IA.suspendu) badges.push(['p-encre',"IA suspendue"]);
  if(r.V.provisoire) badges.push(['p-hach',"Valeur provisoire"]);
  const msg=[
    ["Potentiel latent",lireL(r.L.dec),f1(r.L.dec)+" sur 100","lime"],
    ["Activabilité",lireA(r.A.dec),f1(r.A.dec)+" sur 100","teal"],
    ["Confiance",r.confLib,"complétude "+f0(r.K_dec)+" %, preuve "+f0(r.Conf_dec)+" %",""],
    ["Conditions",r.conditions+" action"+(r.conditions>1?"s":"")+" préalable"+(r.conditions>1?"s":""),C_LIB[r.C.statut],""],
    ["Recommandation",P_LIB[r.P],P_DEC[r.P],""]
  ];
  return `
  <div class="titre"><div><h1>${esc(sc.titre)}</h1>
    <small class="mono-id">${sc.id}, ${g?esc(g.nom):""}, horizon ${esc(sc.horizon)||"non défini"}</small></div>
    <div class="ligne">${badges.map(([cl,t])=>`<span class="p ${cl}">${t}</span>`).join("")}</div></div>
  <div class="ligne" style="margin-bottom:20px"><div style="flex:1 1 460px">
    <label class="champ" for="ssel2">Scénario</label><select id="ssel2" data-action="sel-scn">
      ${S.scenarios.map(x=>`<option value="${x.id}" ${x.id===sc.id?"selected":""}>${x.id} ${esc(x.titre)}</option>`).join("")}
    </select></div><button class="btn sec" data-action="exporter-dossier" data-id="${sc.id}">Exporter ce dossier</button></div>

  <div class="grille g3">${msg.map(([l,v,d,cl])=>`<div class="kpi">
    <div class="l">${l}</div><div style="font-size:19px;font-weight:600;margin:2px 0">${v}</div>
    <div class="d">${d}</div>${cl?`<div class="jauge ${cl}"><i style="width:${Math.max(0,Math.min(100,l==="Potentiel latent"?r.L.dec:r.A.dec))}%"></i></div>`:""}</div>`).join("")}</div>

  <div class="grille g2 sect">
    <div class="carte"><h3>Le scénario</h3><table style="margin-top:8px">
      <tr><td style="color:var(--gris);width:32%">Finalité</td><td>${esc(sc.finalite)}</td></tr>
      <tr><td style="color:var(--gris)">Bénéficiaire</td><td>${esc(sc.beneficiaire)}</td></tr>
      <tr><td style="color:var(--gris)">Décision améliorée</td><td>${esc(sc.decision)}</td></tr>
      <tr><td style="color:var(--gris)">Résultat attendu</td><td>${esc(sc.resultat)}</td></tr>
      <tr><td style="color:var(--gris)">Population</td><td>${esc(sc.population)}</td></tr></table></div>
    <div class="carte"><h3>Conditions à lever</h3>
      <ul class="liste-nette" style="margin-top:8px">
      ${r.C.ecarts.filter(e=>e.gap>0).map(e=>`<li><span>${e.id} ${LIB[e.id]}<br>
        <small>${e.actuel===null?"non renseigné":"niveau "+e.actuel}, cible ${e.cible}</small></span>
        <span class="p ${e.critique?"p-encre":"p-hach"}">${e.critique?"critique":"écart "+e.gap}</span></li>`).join("")}
      ${r.A.regles.map(t=>`<li><span><small>${t}</small></span><span class="p p-hach">activabilité</span></li>`).join("")}
      ${(!r.C.ecarts.filter(e=>e.gap>0).length&&!r.A.regles.length)?"<li><small>Aucune condition ouverte.</small></li>":""}
      </ul></div>
  </div>

  ${r.IA?`<div class="sect"><h2>Aptitude IA</h2><div class="carte">
    <div class="ligne" style="justify-content:space-between;align-items:baseline">
      <div><div style="font-size:27px;font-weight:600" class="num">${f1(r.IA.dec)}<span style="font-size:15px;color:var(--gris);font-weight:400"> sur 100</span></div>
      <div class="tag">Recommandation maximale : ${r.IA.reco}</div></div>
      ${r.IA.suspendu?'<span class="p p-encre">Recommandation suspendue</span>':""}</div>
    <ul class="liste-nette" style="margin-top:12px">${r.IA.regles.map(t=>`<li><small>${esc(t)}</small></li>`).join("")||"<li><small>Aucun plafond déclenché.</small></li>"}</ul>
  </div></div>`:""}

  <div class="sect"><h2>Comprendre le calcul</h2>
  <div class="sub">Lectures observée, prudente et décisionnelle, complétude, confiance, règles déclenchées et hypothèses de borne.
    Aucun classement ne dépend de la capacité à lire ce tableau.</div>
  <div class="grille g2 audit">
    <div class="carte"><h4>Axes quantitatifs</h4>
      <table style="margin-top:8px"><thead><tr><th>Axe</th><th class="n">Observé</th><th class="n">Prudent</th>
        <th class="n">Décisionnel</th><th class="n">K</th><th class="n">Conf</th></tr></thead><tbody>
        <tr><td>Usage U</td><td class="n">${f1(r.U.obs)}</td><td class="n">${f1(r.U.pru)}</td><td class="n">${f1(r.U.dec)}</td><td class="n">${f0(r.U.K)}</td><td class="n">${f0(r.U.Conf)}</td></tr>
        <tr><td>Valeur V</td><td class="n">${f1(r.V.obs)}</td><td class="n">${f1(r.V.pru)}</td><td class="n">${f1(r.V.dec)}</td><td class="n">${f0(r.V.K)}</td><td class="n">${f0(r.V.Conf)}</td></tr>
        <tr><td>Potentiel latent L</td><td class="n">${f1(r.L.obs)}</td><td class="n">${f1(r.L.pru)}</td><td class="n">${f1(r.L.dec)}</td><td class="n">${f0(r.L.K)}</td><td class="n">${f0(r.L.Conf)}</td></tr>
        <tr><td>Activabilité A</td><td class="n">${f1(r.A.obs)}</td><td class="n">${f1(r.A.pru)}</td><td class="n">${f1(r.A.dec)}</td><td class="n">${f0(r.A.K)}</td><td class="n">${f0(r.A.Conf)}</td></tr>
        ${r.IA?`<tr><td>IA</td><td class="n">${f1(r.IA.obs)}</td><td class="n">${f1(r.IA.pru)}</td><td class="n">${f1(r.IA.dec)}</td><td class="n">${f0(r.IA.K)}</td><td class="n">${f0(r.IA.Conf)}</td></tr>`:""}
      </tbody></table>
      <table style="margin-top:12px">
        <tr><td>Lecture de U</td><td>${lireU(r.U.dec)}</td></tr>
        <tr><td>Lecture de V</td><td>${lireV(r.V.dec)}</td></tr>
        <tr><td>Bornes de U, basse et haute</td><td class="num">${f1(r.U.bas)} et ${f1(r.U.haut)}</td></tr>
        <tr><td>Fourchette de potentiel latent</td><td class="num">${f1(r.L.fourchette[0])} à ${f1(r.L.fourchette[1])}
          <br><small>Fourchette d'incertitude méthodologique, pas un intervalle de confiance statistique.</small></td></tr>
        <tr><td>Voies de valeur renseignées</td><td>${r.V.nVoies} sur 6, B observé ${f1(r.V.B_obs)}</td></tr>
        <tr><td>K et Conf décisionnels</td><td class="num">${f0(r.K_dec)} % et ${f0(r.Conf_dec)} %</td></tr>
        <tr><td>O<sub>V</sub>, O<sub>L</sub>, O<sub>Lc</sub></td><td class="num">${f1(r.O_V)}, ${f1(r.O_L)}, ${f1(r.O_Lc)}</td></tr>
      </table></div>
    <div class="carte"><h4>Règles déclenchées et bloc C</h4>
      <table style="margin-top:8px">
        <tr><td>Statut de passage C</td><td>${C_LIB[r.C.statut]}${r.C.bloqueMotif?", "+r.C.bloqueMotif:""}</td></tr>
        <tr><td>Risque résiduel R</td><td class="num">${f1(r.C.R)}, ${r.C.R<25?"faible sous contrôles":r.C.R<50?"modéré":r.C.R<70?"élevé":"critique"}</td></tr>
        <tr><td>Indice d'écart GapC</td><td class="num">${f1(r.C.GapC)}</td></tr>
        <tr><td>Hypothèses conservatrices I égale 4, P égale 3, M égale 0</td><td>${r.C.hypotheses.join(", ")||"aucune"}</td></tr>
        <tr><td>Contradictions entre usage déclaré et objectivé</td><td>${r.U.contradictions.join(", ")||"aucune"}</td></tr>
        <tr><td>Plafond de valeur</td><td>${r.V.plafond||"aucun"}</td></tr>
        <tr><td>Plafonds d'activabilité</td><td>${r.A.regles.map(esc).join("<br>")||"aucun"}</td></tr>
        <tr><td>Statut de portefeuille</td><td><span class="p ${r.P==="P0"?"p-encre":r.P==="P4"?"p-hach":"p-violet"}">${r.P} ${P_LIB[r.P]}</span></td></tr>
      </table>
      <div class="encadre att" style="margin-top:14px">Le score ne vaut ni autorisation juridique, ni avis du délégué à la protection
        des données, ni validation de sécurité, ni validation clinique. Le niveau maximal recommandé reste un pilote contrôlé.</div>
    </div>
  </div></div>`;
}

/* ==========================================================================
   11. PORTEFEUILLES
   ========================================================================== */
function vuePortefeuilles(){
  const calc=S.scenarios.map(s=>({s,r:calcScenario(s)}));
  const ordre=["P1","P3","P2","P5","P4","P6","P0"];
  const groupes=ordre.map(p=>({p,items:calc.filter(x=>x.r.P===p).sort((x,y)=>y.r.O_Lc-x.r.O_Lc)})).filter(g=>g.items.length);
  const bandes=[[60,100,"Latent fort"],[40,59.999,"Latent significatif"],[0,39.999,"Latent faible"]];
  const cols=[[0,39.999,"Activabilité faible"],[40,59.999,"Activabilité moyenne"],[60,100,"Activabilité forte"]];
  const texteCellule=[["Actif stratégique à débloquer","Chantier prioritaire de préparation","Candidat pilote à fort potentiel"],
                  ["Incubation sélective","Opportunité à arbitrer","Gain rapide"],
                  ["Veille ou valeur déjà captée","Réemploi opportuniste","Amélioration marginale seulement"]];
  const gis=S.gisements.map(g=>({g,r:calcGisement(g)})).sort((x,y)=>y.r.Sg-x.r.Sg);
  if(!S.scenarios.length && !S.gisements.length)
    return `<div class="titre"><h1>Portefeuilles</h1></div><div class="carte"><small>Rien à classer pour le moment.</small></div>`;
  return `
  <div class="titre"><div><h1>Portefeuilles</h1>
    <small>Deux unités d'analyse distinctes : quels usages instruire, dans quels actifs investir.</small></div></div>

  <div class="sect"><h2>Portefeuille des scénarios</h2>
  <div class="sub">Groupé par statut, jamais par rang global. Un scénario bloqué ne peut pas paraître meilleur qu'un scénario admissible.
    Tri interne : statut C, puis O<sub>Lc</sub>, puis O<sub>V</sub>, puis valeur patrimoniale, puis effort.</div>
  ${groupes.map(gr=>`<div class="carte" style="margin-bottom:14px">
    <div class="ligne" style="justify-content:space-between;align-items:baseline">
      <h3>${P_LIB[gr.p]} <span class="tag">${gr.p}, ${gr.items.length}</span></h3>
      <small>${P_DEC[gr.p]}</small></div>
    <div class="scroll"><table style="margin-top:10px"><thead><tr><th>Scénario</th><th>Gisement</th>
      <th class="n">L</th><th class="n">A</th><th class="n">V</th><th class="n">O<sub>Lc</sub></th>
      <th>C</th><th>Confiance</th><th></th></tr></thead><tbody>
      ${gr.items.map(({s,r})=>{const g=S.gisements.find(x=>x.id===s.gis);
        return `<tr><td>${esc(s.titre)}<br><small class="mono-id">${s.id}</small></td>
        <td><small>${g?esc(g.nom):""}</small></td>
        <td class="n">${f1(r.L.dec)}</td><td class="n">${f1(r.A.dec)}</td><td class="n">${f1(r.V.dec)}</td>
        <td class="n">${f1(r.O_Lc)}</td>
        <td><span class="p ${r.C.statut==="ADMISSIBLE"?"p-teal":r.C.statut==="BLOQUE"?"p-encre":"p-hach"}">${C_LIB[r.C.statut]}</span></td>
        <td><span class="p ${r.confLib==="Insuffisante"?"p-hach":r.confLib==="Élevée"?"p-teal":"p-gris"}">${r.confLib}</span></td>
        <td><button class="btn mini sec" data-action="open-scn" data-id="${s.id}">Ouvrir</button></td></tr>`;}).join("")}
    </tbody></table></div></div>`).join("")||`<div class="carte"><small>Aucun scénario coté.</small></div>`}
  </div>

  ${S.scenarios.length?`<div class="sect"><h2>Carte du potentiel latent et de l'activabilité</h2>
  <div class="sub">Lecture après la valeur et le statut C. Les scénarios à instruire sont hachurés, les scénarios bloqués sont isolés hors carte.</div>
  <div class="scroll"><table class="mat"><thead><tr><th style="width:150px"></th>
    ${cols.map(cc=>`<th>${cc[2]}<br><span class="tag">de ${cc[0]} à ${Math.round(cc[1])}</span></th>`).join("")}</tr></thead><tbody>
    ${bandes.map((b,bi)=>`<tr><th style="text-align:left">${b[2]}<br><span class="tag">de ${b[0]} à ${Math.round(b[1])}</span></th>
      ${cols.map((cc,ci)=>{const items=calc.filter(x=>x.r.P!=="P0"&&x.r.L.dec>=b[0]&&x.r.L.dec<=b[1]&&x.r.A.dec>=cc[0]&&x.r.A.dec<=cc[1]);
        return `<td><div class="tag" style="margin-bottom:6px">${texteCellule[bi][ci]}</div>
          ${items.map(({s,r})=>`<span class="puce ${r.P==="P4"?"p-hach":r.C.statut==="ADMISSIBLE"?"p-teal":"p-violet"}">${s.id} ${esc(s.titre.slice(0,42))}${s.titre.length>42?"…":""}</span>`).join("")}</td>`;}).join("")}
    </tr>`).join("")}
  </tbody></table></div>
  ${calc.filter(x=>x.r.P==="P0").length?`<div class="encadre att" style="margin-top:12px">
    Hors carte, statut bloqué : ${calc.filter(x=>x.r.P==="P0").map(x=>x.s.id+" "+esc(x.s.titre)).join(" ; ")}.
    Le blocage relève d'une décision d'autorité compétente, pas d'un arbitrage de valeur.</div>`:""}
  </div>`:""}

  <div class="sect"><h2>Portefeuille des gisements</h2>
  <div class="sub">Le patrimoine agrège les scénarios sans récompenser leur nombre. L*, Lev et Div restent des hypothèses
    expérimentales à confronter au jugement des experts.</div>
  <div class="carte scroll"><table><thead><tr><th>Gisement</th><th>Statut patrimonial</th>
    <th class="n">S<sub>g</sub></th><th class="n">L*</th><th class="n">Pat</th><th class="n">Lev</th><th class="n">Div</th>
    <th class="n">Conf<sub>g</sub></th><th class="n">U<sub>g</sub></th></tr></thead><tbody>
    ${gis.map(({g,r})=>`<tr><td>${esc(g.nom)}<br><small class="mono-id">${g.id}, ${r.scs.length} scénario${r.scs.length>1?"s":""}, ${r.nf} famille${r.nf>1?"s":""} de valeur</small></td>
      <td><span class="p ${r.statut==="Candidat à investissement"?"p-lime":r.statut==="Instruire le patrimoine"?"p-hach":"p-gris"}">${r.statut}</span></td>
      <td class="n">${f1(r.Sg)}</td><td class="n">${f1(r.Lstar)}</td><td class="n">${f1(r.Pat)}</td>
      <td class="n">${f1(r.Lev)}</td><td class="n">${f1(r.Div)}</td><td class="n">${f0(r.Confg)}</td><td class="n">${f1(r.Ug)}</td></tr>`).join("")
      ||`<tr><td colspan="9"><small>Aucun gisement.</small></td></tr>`}
  </tbody></table></div>

  ${S.chantiers.length?`<div class="carte" style="margin-top:16px"><h3>Chantiers communs</h3>
    <div class="sub" style="margin:4px 0 10px">Chaque relation entre un chantier, une condition levée et un scénario est explicitée et prouvée.
      Un scénario n'est compté qu'une fois par chantier.</div>
    <ul class="liste-nette">${S.chantiers.map(w=>`<li><span>${esc(w.titre)}<br>
      <small class="mono-id">${w.id}, lève une condition pour ${w.leve.join(", ")}, preuve E${w.preuve}</small></span></li>`).join("")}</ul></div>`:""}
  </div>`;
}

/* ==========================================================================
   12. EXPORT LISIBLE
   ========================================================================== */
function rapportMarkdown(scenarioSeul){
  const k=kpiEDR(); const L=[];
  const pct=x=>(x===null||isNaN(x))?"N/A":Math.round(x)+" %";
  L.push("# "+(P.meta?P.meta.nom:"Espace de travail"));
  L.push("");
  L.push("Rapport produit le "+new Date().toLocaleString("fr-FR")+" par le démonstrateur du moteur unifié.");
  L.push("Données de travail issues d'un exercice de formation. Ce document ne vaut ni autorisation, ni validation.");
  L.push("");
  if(!scenarioSeul){
    L.push("## Campagne");
    L.push("");
    L.push("- Nom : "+S.campagne.nom);
    L.push("- Périmètre : "+(S.campagne.perimetre||"non renseigné"));
    L.push("- Exclusions : "+(S.campagne.exclusions||"aucune"));
    L.push("- Pilote : "+(S.campagne.pilote||"non désigné"));
    L.push("- Statut de couverture : "+k.statut.toLowerCase());
    L.push("");
    L.push("| Indicateur | Valeur |");
    L.push("|---|---|");
    L.push("| Couverture organisationnelle prioritaire | "+pct(k.CO_p)+" |");
    L.push("| Systèmes connus examinés ou exclus | "+pct(k.CS)+" |");
    L.push("| Familles de données résolues | "+pct(k.CF)+" |");
    L.push("| Contributeurs ayant répondu | "+pct(k.CC_p)+" |");
    L.push("| Gisements absents des inventaires | "+pct(k.novelty)+" |");
    L.push("| Confirmation par au moins deux signaux | "+pct(k.croise)+" |");
    L.push("| Rendement de la dernière passe | "+pct(k.RM)+" |");
    L.push("");
    L.push("La couverture mesure ce qui a été exploré dans le périmètre. Elle ne garantit jamais que toutes les données ont été trouvées.");
    L.push("");
    L.push("## Registre des gisements");
    L.push("");
    S.gisements.forEach(g=>{
      const r=calcGisement(g);
      L.push("### "+g.id+" "+g.nom);
      L.push("");
      L.push("- Famille : "+g.famille);
      L.push("- Définition : "+g.definition);
      L.push("- Sources : "+g.sources);
      L.push("- Producteur : "+g.producteur);
      L.push("- Responsable métier : "+g.rmetier);
      L.push("- Responsable technique : "+g.rtech);
      L.push("- Population : "+g.population);
      L.push("- Période et rythme : "+g.periode);
      L.push("- Modalités : "+g.modalites+", granularité : "+g.granularite);
      L.push("- Sensibilité présumée : "+g.sensibilite);
      L.push("- Usage initial : "+g.usageInitial);
      L.push("- Contraintes connues : "+g.contraintes);
      L.push("- Recensé avant la campagne : "+(g.prealable==="OUI"?"oui":g.prealable==="NON"?"non":"inconnu"));
      L.push("- Provenance : "+(S.signaux.filter(s=>s.gis===g.id).map(s=>s.id+" par "+s.auteur+", canal "+s.canal).join(" ; ")||"saisie directe"));
      L.push("- Profil d'usage Ug : "+f1(r.Ug)+" sur 100, complétude "+f0(r.K_UG)+" %");
      L.push("- Statut patrimonial : "+r.statut+", Sg "+f1(r.Sg)+", confiance "+f0(r.Confg)+" %");
      L.push("");
    });
  }
  L.push("## Dossiers de qualification");
  L.push("");
  const liste = scenarioSeul ? S.scenarios.filter(s=>s.id===scenarioSeul) : S.scenarios;
  liste.forEach(s=>{
    const r=calcScenario(s); const g=S.gisements.find(x=>x.id===s.gis);
    L.push("### "+s.id+" "+s.titre);
    L.push("");
    L.push("- Gisement : "+(g?g.id+" "+g.nom:"non rattaché"));
    L.push("- Finalité : "+s.finalite);
    L.push("- Bénéficiaire : "+s.beneficiaire);
    L.push("- Décision améliorée : "+s.decision);
    L.push("- Résultat attendu : "+s.resultat);
    L.push("- Population : "+s.population+", horizon : "+s.horizon);
    L.push("");
    L.push("| Axe | Observé | Prudent | Décisionnel | Complétude | Confiance |");
    L.push("|---|---:|---:|---:|---:|---:|");
    L.push("| Usage U | "+f1(r.U.obs)+" | "+f1(r.U.pru)+" | "+f1(r.U.dec)+" | "+f0(r.U.K)+" % | "+f0(r.U.Conf)+" % |");
    L.push("| Valeur V | "+f1(r.V.obs)+" | "+f1(r.V.pru)+" | "+f1(r.V.dec)+" | "+f0(r.V.K)+" % | "+f0(r.V.Conf)+" % |");
    L.push("| Potentiel latent L | "+f1(r.L.obs)+" | "+f1(r.L.pru)+" | "+f1(r.L.dec)+" | "+f0(r.L.K)+" % | "+f0(r.L.Conf)+" % |");
    L.push("| Activabilité A | "+f1(r.A.obs)+" | "+f1(r.A.pru)+" | "+f1(r.A.dec)+" | "+f0(r.A.K)+" % | "+f0(r.A.Conf)+" % |");
    if(r.IA) L.push("| Aptitude IA | "+f1(r.IA.obs)+" | "+f1(r.IA.pru)+" | "+f1(r.IA.dec)+" | "+f0(r.IA.K)+" % | "+f0(r.IA.Conf)+" % |");
    L.push("");
    L.push("- Fourchette de potentiel latent : "+f1(r.L.fourchette[0])+" à "+f1(r.L.fourchette[1])+", fourchette d'incertitude méthodologique.");
    L.push("- Statut du bloc C : "+C_LIB[r.C.statut]+(r.C.bloqueMotif?", "+r.C.bloqueMotif:"")+", risque résiduel "+f1(r.C.R)+".");
    L.push("- Statut de portefeuille : "+r.P+" "+P_LIB[r.P]+". Décision recommandée : "+P_DEC[r.P]+".");
    if(r.IA) L.push("- Recommandation IA maximale : "+r.IA.reco+(r.IA.suspendu?" (suspendue par le statut C)":"")+".");
    L.push("");
    const cond=r.C.ecarts.filter(e=>e.gap>0);
    if(cond.length||r.A.regles.length){
      L.push("Conditions à lever :");
      L.push("");
      cond.forEach(e=>L.push("- "+e.id+" "+LIB[e.id]+", niveau "+(e.actuel===null?"non renseigné":e.actuel)+", cible "+e.cible+(e.critique?", contrôle critique":"")));
      r.A.regles.forEach(t=>L.push("- "+t));
      L.push("");
    }
  });
  L.push("---");
  L.push("");
  L.push("Aucun score ne vaut autorisation juridique, avis du délégué à la protection des données, validation de sécurité ou validation clinique.");
  L.push("Le niveau maximal recommandé par le moteur est un pilote contrôlé, soumis aux validations compétentes.");
  return L.join("\n");
}

/* ==========================================================================
   13. RENDU ET INTERACTIONS
   ========================================================================== */
function renderNav(){
  const nav=$("nav");
  if(!P.actif){ nav.innerHTML=""; nav.hidden=true; $("bandeau").parentElement.hidden=true; return; }
  nav.hidden=false; $("bandeau").parentElement.hidden=false;
  nav.innerHTML = VUES.map(([k,l],i)=>
    (i?'<span class="sep">›</span>':'')+
    `<button data-vue="${k}" aria-current="${S.view===k}">${l}</button>`).join("");
  $("bandeau").textContent =
    "La couverture mesure ce qui a été exploré dans le périmètre. Elle ne garantit jamais que toutes les données ont été trouvées. "+
    "Aucun contenu patient n'est stocké. "+S.gisements.length+" gisements et "+S.scenarios.length+
    " scénarios, décrits par des métadonnées et des déclarations attribuées.";
}
let vuePrec=null;
function render(){
  renderBarre();
  if(!P.actif){
    $("nav").hidden=true; $("bandeau").parentElement.hidden=true;
    $("app").innerHTML=vueAccueil(); vuePrec="accueil"; return;
  }
  renderNav();
  const v={edr:vueEDR,signaux:vueSignaux,gisements:vueGisements,q1:vueQ1,q2:vueQ2,
           scenario:vueScenario,portefeuilles:vuePortefeuilles,exercices:vueExercices}[S.view]||vueEDR;
  const y=window.scrollY||0;
  $("app").innerHTML=v();
  if(S.view!==vuePrec){ window.scrollTo({top:0,behavior:"instant"}); vuePrec=S.view; }
  else window.scrollTo({top:y,behavior:"instant"});
}

document.addEventListener("click",e=>{
  const b=e.target.closest("button"); if(!b) return;
  const act=b.dataset.action, id=b.dataset.id;

  /* espaces de travail */
  if(act==="creer-espace"){ const nid=creerEspace(id); ouvrirEspace(nid); S.view="edr"; return render(); }
  if(act==="ouvrir-espace"){ ouvrirEspace(id); return render(); }
  if(act==="dupliquer-espace"){ dupliquerEspace(id); return render(); }
  if(act==="supprimer-espace"){
    if(confirm("Supprimer cet espace et tout son contenu ? Cette action ne peut pas être annulée.")){
      supprimerEspace(id); return render(); } return; }
  if(act==="voir-accueil"){ enregistrerMaintenant(); fermerEspace(); return render(); }
  if(act==="voir-exercices"){ S.view="exercices"; return render(); }
  if(act==="imprimer"){ window.print(); return; }
  if(act==="exporter-json"){ exporterEspace(); return; }
  if(act==="exporter-rapport"){ telecharger(nomFichierSur("rapport","md"), rapportMarkdown(null), "text/markdown"); return; }
  if(act==="exporter-dossier"){ telecharger(nomFichierSur("dossier-"+id.toLowerCase(),"md"), rapportMarkdown(id), "text/markdown"); return; }
  if(act==="importer"){
    const f=$("fichierImport").files[0]; const msg=$("messageImport");
    if(!f){ msg.innerHTML='<span class="p p-hach">Choisissez d\'abord un fichier.</span>'; return; }
    const lecteur=new FileReader();
    lecteur.onload=()=>{ const r=importerEspace(String(lecteur.result));
      if(r.ok){ ouvrirEspace(r.id); render(); }
      else msg.innerHTML='<span class="p p-hach">'+esc(r.message)+'</span>'; };
    lecteur.readAsText(f); return;
  }

  if(!P.actif) return;
  if(b.dataset.vue){ S.view=b.dataset.vue; return render(); }
  if(b.dataset.tab){ S.tabQ=b.dataset.tab; return render(); }
  if(b.dataset.cell){
    const cur=S.campagne.cellules[b.dataset.cell]||"NC";
    S.campagne.cellules[b.dataset.cell]=CELL_ETATS[(CELL_ETATS.indexOf(cur)+1)%4];
    enregistrerBientot(); return render();
  }

  /* campagne */
  if(act==="ajout-unite"){
    S.campagne.unites.push({id:idSuivant(S.campagne.unites,"ZON-"),nom:"Nouvelle unité",prio:true,etat:"PREVUE"});
    enregistrerBientot(); return render(); }
  if(act==="suppr-unite"){ S.campagne.unites=S.campagne.unites.filter(u=>u.id!==id); enregistrerBientot(); return render(); }
  if(act==="ajout-systeme"){
    S.campagne.systemes.push({id:idSuivant(S.campagne.systemes,"SYS-"),nom:"Nouveau système",etat:"A_REVOIR"});
    enregistrerBientot(); return render(); }
  if(act==="suppr-systeme"){ S.campagne.systemes=S.campagne.systemes.filter(s=>s.id!==id); enregistrerBientot(); return render(); }

  /* signaux */
  if(act==="add-signal"){
    const nom=($("c-neuf-sig-nom").value||"").trim();
    if(!nom){ $("c-neuf-sig-nom").focus(); return; }
    S.signaux.push({id:idSuivant(S.signaux,"SIG-"),nom,zone:$("sig-zone").value,canal:$("sig-canal").value,
      auteur:($("c-neuf-sig-auteur").value||"Contributeur").trim(),wf:"SOUMIS",res:null,gis:null,motif:$("sig-motif").value});
    enregistrerBientot(); return render(); }
  if(act==="dismiss-signal"){
    const s=S.signaux.find(x=>x.id===id); s.wf="RESOLU"; s.res="ECARTE"; enregistrerBientot(); return render(); }
  if(act==="confirm-signal"){
    const s=S.signaux.find(x=>x.id===id); s.wf="RESOLU"; s.res="CONFIRME";
    const gid=idSuivant(S.gisements,"GIS-"); s.gis=gid;
    S.gisements.push(gisementVide(gid,s.nom,s.zone));
    S.gisementCourant=gid; S.view="gisements"; enregistrerBientot(); return render(); }

  /* gisements */
  if(act==="creer-gisement"){
    const gid=idSuivant(S.gisements,"GIS-");
    S.gisements.push(gisementVide(gid,"Nouveau gisement",(S.campagne.unites[0]||{}).id||""));
    S.gisementCourant=gid; enregistrerBientot(); return render(); }
  if(act==="suppr-gisement"){
    if(!confirm("Retirer ce gisement et les scénarios qui en dépendent ?")) return;
    S.gisements=S.gisements.filter(g=>g.id!==id);
    S.scenarios=S.scenarios.filter(s=>s.gis!==id);
    S.signaux.forEach(s=>{ if(s.gis===id){ s.gis=null; s.res=null; s.wf="SOUMIS"; } });
    S.gisementCourant=(S.gisements[0]||{}).id||null; enregistrerBientot(); return render(); }

  /* scénarios */
  if(act==="creer-scenario"){
    const t=($("c-neuf-scn-titre").value||"").trim();
    if(!t){ $("c-neuf-scn-titre").focus(); return; }
    const sc=scenarioVide($("scn-gis").value,t,"Formulé par un professionnel");
    S.scenarios.push(sc); S.scenarioCourant=sc.id; enregistrerBientot(); return render(); }
  if(act==="suppr-scenario"){
    if(!confirm("Retirer ce scénario et sa cotation ?")) return;
    S.scenarios=S.scenarios.filter(s=>s.id!==id);
    S.scenarioCourant=(S.scenarios[0]||{}).id||null; enregistrerBientot(); return render(); }
  if(act==="open-scn"){ S.scenarioCourant=id; S.view="scenario"; return render(); }
  if(act==="toggle-profil"){
    const sc=scnCourant(); const i=sc.profil.indexOf(id);
    i>=0?sc.profil.splice(i,1):sc.profil.push(id); enregistrerBientot(); return render(); }
  if(act==="rejeter-sug"){ S.suggestions=S.suggestions.filter(x=>x.id!==id); enregistrerBientot(); return render(); }
  if(act==="valider-sug"){
    const sug=S.suggestions.find(x=>x.id===id); if(!sug) return;
    const sc=scenarioVide(sug.gis,sug.titre,"Validation humaine d'une suggestion");
    S.scenarios.push(sc); S.suggestions=S.suggestions.filter(x=>x.id!==id);
    S.scenarioCourant=sc.id; S.view="q1"; enregistrerBientot(); return render(); }
});

function gisementVide(gid,nom,zone){
  return {id:gid,nom,famille:"À qualifier en Q1",
    definition:"",sources:"",producteur:"",rmetier:"",rtech:"",population:"",periode:"",
    modalites:"",granularite:"",sensibilite:"",usageInitial:"",contraintes:"",
    zone,prealable:"NON",passe:"PAS-"+S.campagne.passe,gouvernance:"A_IDENTIFIER",
    ug:{UG01:a("ND",0),UG02:a("ND",0),UG03:a("ND",0),UG04:a("ND",0),UG05:a("ND",0)},V09:0,V09preuve:0};
}

/* saisie texte, sans rerendu pour garder le curseur */
document.addEventListener("input",e=>{
  const t=e.target;
  if(t.tagName!=="INPUT"&&t.tagName!=="TEXTAREA") return;
  if(t.id==="nomEspace"){ renommerEspace(P.actif,t.value); enregistrerBientot(); return; }
  if(!P.actif) return;
  if(appliquer(t,false)) enregistrerBientot();
});
/* listes déroulantes, avec rerendu */
document.addEventListener("change",e=>{
  const t=e.target;
  if(t.dataset.action==="sel-gis"){ S.gisementCourant=t.value; return render(); }
  if(t.dataset.action==="sel-scn"){ S.scenarioCourant=t.value; return render(); }
  if(t.dataset.fusion){
    const s=S.signaux.find(x=>x.id===t.dataset.fusion);
    if(t.value){ s.wf="RESOLU"; s.res="FUSIONNE"; s.gis=t.value; enregistrerBientot(); return render(); }
    return;
  }
  if(t.tagName!=="SELECT") return;
  if(appliquer(t,true)){ enregistrerBientot(); return render(); }
});

function appliquer(t,estSelect){
  const d=t.dataset; let v=t.value;
  const nombre = x => { const n=Number(x); return isNaN(n)?0:n; };
  if(d.camp!==undefined && d.camp){
    S.campagne[d.camp] = (d.camp==="contreExploration") ? (v==="true") : v; return true; }
  if(d.campn){ S.campagne[d.campn]=nombre(v); return true; }
  if(d.contrib){ S.campagne.contributeurs[d.contrib]=nombre(v); return true; }
  if(d.unite){ const [uid,champ]=d.unite.split("|"); const u=S.campagne.unites.find(x=>x.id===uid);
    if(u) u[champ] = (champ==="prio") ? (v==="true") : v; return true; }
  if(d.systeme){ const [sid,champ]=d.systeme.split("|"); const s=S.campagne.systemes.find(x=>x.id===sid);
    if(s) s[champ]=v; return true; }
  if(d.gis){ const [gid,champ]=d.gis.split("|"); const g=S.gisements.find(x=>x.id===gid);
    if(g) g[champ]=v; return true; }
  if(d.gisn){ const [gid,champ]=d.gisn.split("|"); const g=S.gisements.find(x=>x.id===gid);
    if(g) g[champ]=nombre(v); return true; }
  if(d.scn){ const [sid,champ]=d.scn.split("|"); const s=S.scenarios.find(x=>x.id===sid);
    if(s) s[champ] = (champ==="cIA") ? (v==="true") : v; return true; }
  if(d.ug){ const [gid,crit,champ]=d.ug.split("|"); const g=S.gisements.find(x=>x.id===gid);
    if(g&&g.ug[crit]) g.ug[crit][champ] = (v==="ND"||v==="NA")? v : Number(v); return true; }
  if(d.ugn){ const [gid,crit,champ]=d.ugn.split("|"); const g=S.gisements.find(x=>x.id===gid);
    if(g&&g.ug[crit]) g.ug[crit][champ]=nombre(v); return true; }
  if(d.edit){
    const [bloc,id,champ]=d.edit.split("|"); const sc=scnCourant(); if(!sc) return false;
    const cible={U:sc.u,V:sc.v,A:sc.A,C:sc.c,IA:sc.ia}[bloc];
    if(!cible[id]) cible[id]={v:"ND",e:0};
    if(champ==="e"||champ==="I"||champ==="P") cible[id][champ]=(v==="ND"?null:Number(v));
    else if(champ==="d"||champ==="o") cible[id][champ]=(v==="ND"||v==="NA")?null:Number(v);
    else cible[id].v=(v==="ND"||v==="NA")?v:Number(v);
    return true;
  }
  return false;
}

/* démarrage */
(function demarrer(){
  const liste=indexEspaces();
  if(liste.length===1) ouvrirEspace(liste[0].id);
  render();
})();
