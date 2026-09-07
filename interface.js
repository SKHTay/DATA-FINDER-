/* interface.js, rendu et interactions
   Démonstrateur du moteur unifié de recensement et de qualification
   des gisements de données sanitaires et médico-sociales.
   Sources normatives : référentiel V1.2.2, procédure EDR V1.0, spécification
   fonctionnelle V1.2.2. Voir README.md.
*/

/* ==========================================================================
   5. RENDU
   ========================================================================== */
const $=id=>document.getElementById(id);
const f1=x=>(x===null||x===undefined||isNaN(x))?"N/A":x.toFixed(1);
const f0=x=>(x===null||x===undefined||isNaN(x))?"N/A":Math.round(x);
const esc=s=>String(s).replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
const VUES=[["edr","Campagne EDR"],["signaux","Signaux"],["gisements","Gisements"],
            ["q1","Q1 et scénarios"],["q2","Q2 qualification"],["scenario","Tableau de bord"],["portefeuilles","Portefeuilles"]];

function renderNav(){
  $("nav").innerHTML = VUES.map(([k,l],i)=>
    (i?'<span class="sep">›</span>':'')+
    `<button data-vue="${k}" aria-current="${S.view===k}">${l}</button>`).join("");
  const kp=kpiEDR();
  $("bandeau").textContent =
    "La couverture mesure ce qui a été exploré dans le périmètre. Elle ne garantit jamais que toutes les données ont été trouvées. "+
    "Aucun contenu patient n'est stocké. "+S.gisements.length+" gisements et "+S.scenarios.length+" scénarios, décrits par des métadonnées et des déclarations attribuées.";
}

function kpi(v,l,d,pc){
  const na=(v===null||v===undefined||isNaN(v));
  return `<div class="kpi${na?' na':''}"><div class="v">${na?"N/A":(pc?f0(v)+" %":f0(v))}</div>
    <div class="l">${l}</div>${d?`<div class="d">${d}</div>`:""}</div>`;
}

/* ---------- vue 1 : campagne EDR ---------- */
function vueEDR(){
  const c=S.campagne,k=kpiEDR();
  const statutP={INSUFFISANTE:"p-hach",PARTIELLE:"p-gris",SATISFAISANTE:"p-teal",FORTE:"p-lime"}[k.statut];
  const cloture=[
    ["Contre-exploration réalisée",c.contreExploration],
    ["Aucun signal prioritaire non résolu",k.prioNonResolus===0],
    ["Aucune cellule critique non vérifiée",k.critNC===0],
    ["Couverture organisationnelle prioritaire ≥ 90 %",k.CO_p>=90],
    ["Couverture des systèmes connus ≥ 90 %",k.CS>=90],
    ["Rendement de la dernière passe < 10 %",k.RM<10],
    ["Chaque gisement a un interlocuteur ou une action de gouvernance",k.gouvNon===0],
    ["Aucune copie de contenu patient nécessaire",true]
  ];
  return `
  <div class="titre"><div><h1>${esc(c.nom)}</h1>
    <small class="mono-id">${c.id}, passe ${c.passe}, ouverte le ${c.debut}, pilote : ${esc(c.pilote)}</small></div>
    <span class="p ${statutP}">Couverture ${k.statut.toLowerCase()}</span></div>
  <p class="chapeau">Périmètre : ${esc(c.perimetre)}. Exclusions : ${esc(c.exclusions)}.
     La campagne organise la capacité de l'établissement à découvrir ses gisements ; elle ne scanne aucun système.</p>

  <div class="grille g4">
    ${kpi(k.CO_p,"Couverture organisationnelle prioritaire",c.unites.filter(u=>u.prio&&(u.etat!=="PREVUE")).length+" / "+c.unites.filter(u=>u.prio).length+" unités",1)}
    ${kpi(k.CS,"Systèmes connus examinés ou exclus",c.systemes.filter(s=>["EXAMINE","EXCLU"].includes(s.etat)).length+" / "+c.systemes.filter(s=>s.etat!=="HORS_PERIMETRE").length,1)}
    ${kpi(k.CF,"Familles de données résolues",k.tot-k.nc+" / "+k.tot+" cellules",1)}
    ${kpi(k.CC_p,"Contributeurs ayant répondu",c.contributeurs.repondu+" / "+c.contributeurs.sollicites,1)}
    ${kpi(k.CC_r,"Rôles couverts",c.contributeurs.rolesCouverts+" / "+c.contributeurs.rolesAttendus,1)}
    ${kpi(k.novelty,"Gisements absents des inventaires","dénominateur : "+S.gisements.filter(g=>g.prealable!=="INCONNU").length+" gisements",1)}
    ${kpi(k.croise,"Confirmation par au moins deux signaux","indépendance : auteur et canal différents",1)}
    ${kpi(k.RM,"Rendement de la dernière passe",c.passes.map(p=>p.id+" : +"+p.nouveaux).join(" · "),1)}
  </div>

  <div class="sect"><h2>Grille des angles morts</h2>
    <div class="sub">Chaque cellule croise une famille de données et une unité du périmètre. Cliquez pour faire évoluer son état.
      Une cellule non vérifiée crée une action ; les familles critiques bloquent la clôture tant qu'elles ne sont pas résolues.</div>
    <div class="carte scroll">${grilleAM()}</div>
    <div class="ligne" style="margin-top:12px">
      <span class="tag">${k.id} identifiées, ${k.ab} absentes déclarées, ${k.na} non applicables, ${k.nc} non vérifiées dont ${k.critNC} critiques</span>
    </div>
  </div>

  <div class="grille g2 sect">
    <div class="carte"><h3>Unités du périmètre</h3>
      <ul class="liste-nette" style="margin-top:8px">${c.unites.map(u=>`<li>
        <span>${esc(u.nom)}${u.prio?' <span class="tag">prioritaire</span>':''}</span>
        <span class="p ${u.etat==="EXPLOREE"?"p-teal":u.etat==="EXCLUE"?"p-gris":"p-hach"}">${{EXPLOREE:"Explorée",EXCLUE:"Exclue",PREVUE:"Prévue"}[u.etat]}</span></li>`).join("")}</ul></div>
    <div class="carte"><h3>Systèmes connus</h3>
      <ul class="liste-nette" style="margin-top:8px">${c.systemes.map(s=>`<li>
        <span>${esc(s.nom)}</span>
        <span class="p ${s.etat==="EXAMINE"?"p-teal":s.etat==="A_REVOIR"?"p-hach":"p-gris"}">${{EXAMINE:"Examiné",EXCLU:"Exclu",A_REVOIR:"À examiner",HORS_PERIMETRE:"Hors périmètre"}[s.etat]}</span></li>`).join("")}</ul></div>
  </div>

  <div class="sect"><h2>Clôture proposée</h2>
    <div class="sub">Le moteur propose, il ne clôture jamais seul. Les invariants ne sont pas dérogeables ; les seuils expérimentaux le sont, avec motif visible.</div>
    <div class="carte"><ul class="liste-nette">${cloture.map(([t,ok])=>`<li><span>${t}</span>
      <span class="p ${ok?"p-teal":"p-hach"}">${ok?"Satisfait":"Non satisfait"}</span></li>`).join("")}</ul>
      <div class="encadre att" style="margin-top:16px">
        ${cloture.every(x=>x[1])
          ? "Tous les critères sont réunis. La clôture reste une décision humaine, attribuée et motivée."
          : "Clôture impossible en l'état : "+cloture.filter(x=>!x[1]).length+" critères ouverts. Le DIM n'a pas encore été exploré et deux signaux attendent une décision."}
      </div></div></div>`;
}
function grilleAM(){
  const zones=S.campagne.unites.filter(u=>u.prio);
  return `<table class="am"><thead><tr><th style="min-width:200px">Famille de données</th>
    ${zones.map(z=>`<th>${esc(z.nom)}</th>`).join("")}</tr></thead><tbody>
    ${FAMILLES.map((f,i)=>`<tr><th style="text-align:left;font-weight:400;color:var(--encre)">
      ${esc(f)}${FAM_CRIT.has(f)?' <span class="tag">critique</span>':''}</th>
      ${zones.map(z=>{const v=S.campagne.cellules[z.id+"|"+i];
        return `<td><button class="s-${v}" data-cell="${z.id}|${i}" title="${CELL_LIB[v]}">${CELL_LIB[v]}</button></td>`;}).join("")}
    </tr>`).join("")}</tbody></table>`;
}

/* ---------- vue 2 : signaux ---------- */
function vueSignaux(){
  const CAN={R1:"Institutionnel",R2:"Technique",R3:"Usage",R4:"Métier",R5:"Périphérique"};
  const badge=s=>{
    if(s.res==="CONFIRME") return '<span class="p p-teal">Confirmé</span>';
    if(s.res==="FUSIONNE") return '<span class="p p-gris">Fusionné</span>';
    if(s.res==="ECARTE")   return '<span class="p p-gris">Écarté, historisé</span>';
    if(s.wf==="EN_REVUE")  return '<span class="p p-violet">En revue</span>';
    return '<span class="p p-hach">À arbitrer</span>';
  };
  const enAttente=S.signaux.filter(s=>s.wf!=="RESOLU");
  return `
  <div class="titre"><div><h1>File des signaux</h1>
    <small>Un signal n'est pas un gisement. Aucun score n'est calculé à ce stade.</small></div></div>
  <p class="chapeau">Le pilote arbitre chaque signal : confirmer, préciser, réaffecter, fusionner, scinder ou écarter.
     Un signal écarté reste historisé avec sa justification, un signal fusionné conserve sa provenance.</p>

  <div class="carte">
    <h3>Créer un signal</h3>
    <div class="sub" style="margin:4px 0 12px">Saisie rapide, sans source ni interlocuteur obligatoire.</div>
    <div class="ligne">
      <div style="flex:2 1 260px"><label class="champ" for="sn">Nom provisoire</label>
        <input type="text" id="sn" placeholder="Ex. Tableur de suivi des sorties contre avis médical"></div>
      <div style="flex:1 1 150px"><label class="champ" for="sz">Unité</label><select id="sz">
        ${S.campagne.unites.map(u=>`<option value="${u.id}">${esc(u.nom)}</option>`).join("")}</select></div>
      <div style="flex:1 1 150px"><label class="champ" for="sc">Canal de découverte</label><select id="sc">
        ${Object.entries(CAN).map(([k,v])=>`<option value="${k}">${k} ${v}</option>`).join("")}</select></div>
      <div style="flex:1 1 200px"><label class="champ" for="sm">Motif du signalement</label><select id="sm">
        ${["Peu utilisé","Historique important","Donnée peu connue","Difficile d'accès","Beaucoup de travail manuel",
           "Peu analysé","Contenu riche en texte","Demande récurrente d'autres équipes","Usage potentiel inconnu"]
          .map(m=>`<option>${m}</option>`).join("")}</select></div>
      <button class="btn" data-action="add-signal">Créer le signal</button>
    </div>
  </div>

  <div class="sect"><h2>Signaux de la campagne</h2>
  <div class="carte scroll"><table><thead><tr>
    <th>Identifiant</th><th>Nom provisoire</th><th>Unité</th><th>Canal</th><th>Auteur</th>
    <th>Motif</th><th>Statut</th><th>Gisement</th><th></th></tr></thead><tbody>
    ${S.signaux.map(s=>{const z=S.campagne.unites.find(u=>u.id===s.zone);
      return `<tr><td class="mono-id">${s.id}</td><td>${esc(s.nom)}</td><td>${z?esc(z.nom):"non précisée"}</td>
      <td>${s.canal} <span class="tag">${CAN[s.canal]}</span></td><td>${esc(s.auteur)}</td>
      <td><small>${esc(s.motif)}</small></td><td>${badge(s)}</td>
      <td class="mono-id">${s.gis||"aucun"}</td>
      <td>${s.wf!=="RESOLU"?`<div class="ligne" style="gap:4px">
        <button class="btn mini" data-action="confirm-signal" data-id="${s.id}">Confirmer</button>
        <button class="btn mini gris" data-action="dismiss-signal" data-id="${s.id}">Écarter</button></div>`:""}</td></tr>`;}).join("")}
  </tbody></table></div></div>

  ${enAttente.length?`<div class="encadre" style="margin-top:20px">
    ${enAttente.length} signaux attendent une décision. Confirmer un signal crée le gisement canonique en une transaction :
    identifiant pérenne, provenance conservée, aucun dossier de qualification ouvert à ce stade.</div>`:""}`;
}

/* ---------- vue 3 : gisements ---------- */
function vueGisements(){
  const g=S.gisements.find(x=>x.id===S.gisementCourant)||S.gisements[0];
  const r=calcGisement(g);
  const champD=[["D02 Nom usuel",g.nom],["D03 Définition",g.definition],["D04 Famille",g.famille],
    ["D05 Organisation et périmètre",(S.campagne.unites.find(u=>u.id===g.zone)||{}).nom||"non précisée"],
    ["D06 Sources",g.sources],["D07 Producteur",g.producteur],["D08 Responsable métier",g.rmetier],
    ["D09 Responsable technique",g.rtech],["D10 Population",g.population],["D11 Période et rythme",g.periode],
    ["D12 Modalités",g.modalites],["D13 Granularité",g.granularite],["D15 Sensibilité présumée",g.sensibilite],
    ["D16 Usage initial",g.usageInitial],["D19 Contraintes connues",g.contraintes],
    ["V09 Valeur patrimoniale validée",(g.V09!==undefined?g.V09+" / 4 · preuve E"+g.V09preuve:"non cotée")]];
  return `
  <div class="titre"><div><h1>Registre des gisements</h1>
    <small>${S.gisements.length} gisements confirmés. Chacun porte un identifiant pérenne et sa provenance. L'état de qualification appartient aux scénarios, pas au gisement.</small></div></div>
  <div class="ligne" style="margin-bottom:20px">
    <div style="flex:1 1 420px"><label class="champ" for="gsel">Gisement</label><select id="gsel" data-action="sel-gis">
      ${S.gisements.map(x=>`<option value="${x.id}" ${x.id===g.id?"selected":""}>${x.id} ${esc(x.nom)}</option>`).join("")}</select></div>
  </div>

  <div class="grille g2">
    <div class="carte"><h3>Fiche D, description du gisement</h3>
      <table style="margin-top:8px">${champD.map(([l,v])=>
        `<tr><td style="color:var(--gris);width:38%">${l}</td><td>${esc(v)}</td></tr>`).join("")}</table></div>
    <div>
      <div class="carte"><h3>Profil d'usage du gisement</h3>
        <div class="sub" style="margin:4px 0 12px">Lecture patrimoniale U<sub>g</sub>, distincte de U du scénario. Elle n'est jamais soustraite à V.</div>
        <div style="font-size:34px;font-weight:600" class="num">${f1(r.Ug)}<span style="font-size:15px;color:var(--gris);font-weight:400"> / 100 · complétude ${f0(r.K_UG)} %</span></div>
        <div class="jauge lime"><i style="width:${r.Ug}%"></i></div>
        <ul class="liste-nette" style="margin-top:12px">${Object.keys(g.ug).map(id=>{
          const rep=g.ug[id];
          return `<li><span>${LIB[id]}</span><span class="num">${rep.v==="ND"?"ND":rep.v+" / 4"} <span class="tag">E${rep.e}</span></span></li>`;}).join("")}</ul>
      </div>
      <div class="carte" style="margin-top:16px"><h3>Provenance</h3>
        <ul class="liste-nette" style="margin-top:8px">${S.signaux.filter(s=>s.gis===g.id).map(s=>
          `<li><span>${s.id} ${esc(s.nom)}<br><small>${esc(s.auteur)} · canal ${s.canal}</small></span>
           <span class="p p-gris">${s.res==="CONFIRME"?"Origine":"Fusionné"}</span></li>`).join("")||"<li><small>Aucun signal rattaché.</small></li>"}</ul>
        <div style="margin-top:12px" class="tag">Recensé avant la campagne : ${g.prealable==="OUI"?"oui":"non"} ·
          passe ${g.passe} · gouvernance : ${g.gouvernance==="IDENTIFIE"?"responsable identifié":"à identifier"}</div>
      </div>
    </div>
  </div>

  <div class="sect"><h2>Scénarios rattachés</h2>
  <div class="carte scroll"><table><thead><tr><th>Scénario</th><th>Origine</th><th class="n">L décisionnel</th>
    <th class="n">A décisionnel</th><th>Statut C</th><th>Statut</th><th></th></tr></thead><tbody>
    ${r.scs.map(({s,r:rr})=>`<tr><td>${esc(s.titre)}<br><small class="mono-id">${s.id}</small></td>
      <td><small>${esc(s.origine)}</small></td><td class="n">${f1(rr.L.dec)}</td><td class="n">${f1(rr.A.dec)}</td>
      <td><span class="p ${rr.C.statut==="ADMISSIBLE"?"p-teal":rr.C.statut==="BLOQUE"?"p-encre":"p-hach"}">${C_LIB[rr.C.statut]}</span></td>
      <td><span class="p ${rr.P==="P0"?"p-encre":rr.P==="P4"?"p-hach":"p-violet"}">${P_LIB[rr.P]}</span></td>
      <td><button class="btn mini sec" data-action="open-scn" data-id="${s.id}">Ouvrir</button></td></tr>`).join("")
      ||`<tr><td colspan="7"><small>Aucun scénario validé. Passez par Q1 pour formuler ou valider une suggestion.</small></td></tr>`}
  </tbody></table></div></div>`;
}

/* ---------- vue 4 : Q1 et suggestions ---------- */
function vueQ1(){
  const sugs=S.suggestions;
  return `
  <div class="titre"><div><h1>Q1, détection et formulation des scénarios</h1>
    <small>Aucun calcul décisionnel U, V, L, A, C ou IA n'est autorisé pendant Q1.</small></div></div>
  <p class="chapeau">Q1 complète la fiche D, le profil d'usage général et les premiers signaux A et C.
     Le moteur peut proposer jusqu'à cinq scénarios candidats à partir des seules métadonnées.
     Une suggestion reste une hypothèse non scorée tant qu'un professionnel habilité ne l'a pas validée ou reformulée.</p>

  <div class="sect"><h2>Suggestions du moteur de découverte</h2>
  <div class="sub">Générées à partir de la famille, de la modalité, de la profondeur historique, du producteur et des usages déclarés.
    Elles ne portent ni score, ni priorité, ni recommandation de pilote.</div>
  <div class="grille g2">${sugs.map(s=>{const g=S.gisements.find(x=>x.id===s.gis);
    return `<div class="carte"><div class="ligne" style="justify-content:space-between">
      <span class="p p-violet">Suggestion non scorée</span><span class="mono-id">${s.id}</span></div>
      <h3 style="margin-top:10px">${esc(s.titre)}</h3>
      <div class="tag" style="margin:4px 0 10px">${g?esc(g.nom):""} · première voie de valeur ${s.voie} ${LIB[s.voie]}</div>
      <table><tr><td style="color:var(--gris);width:34%">Hypothèses</td><td>${esc(s.hypotheses)}</td></tr>
      <tr><td style="color:var(--gris)">Inconnues</td><td>${esc(s.inconnues)}</td></tr>
      <tr><td style="color:var(--gris)">Méthode de référence</td><td>${esc(s.baseline)}</td></tr></table>
      <div class="ligne" style="margin-top:12px">
        <button class="btn" data-action="valider-sug" data-id="${s.id}">Valider et créer le scénario</button>
        <button class="btn sec" data-action="rejeter-sug" data-id="${s.id}">Rejeter</button></div></div>`;}).join("")
      ||`<div class="carte"><small>Toutes les suggestions ont été traitées.</small></div>`}</div></div>

  <div class="sect"><h2>Scénarios validés</h2>
  <div class="sub">Un scénario existe seulement après validation ou reformulation humaine, avec finalité, bénéficiaire, décision, résultat, population et horizon figés.</div>
  <div class="carte scroll"><table><thead><tr><th>Scénario</th><th>Gisement</th><th>Finalité</th>
    <th>Bénéficiaire</th><th>Horizon</th><th>Cas IA</th></tr></thead><tbody>
    ${S.scenarios.map(s=>{const g=S.gisements.find(x=>x.id===s.gis);
      return `<tr><td>${esc(s.titre)}<br><small class="mono-id">${s.id} · ${esc(s.origine)}</small></td>
      <td><small>${g?esc(g.nom):""}</small></td><td><small>${esc(s.finalite)}</small></td>
      <td><small>${esc(s.beneficiaire)}</small></td><td>${esc(s.horizon)}</td>
      <td>${s.cIA?'<span class="p p-violet">Ouvert</span>':'<span class="tag">non</span>'}</td></tr>`;}).join("")}
  </tbody></table></div></div>`;
}

/* ---------- vue 5 : Q2 saisie ---------- */
function vueQ2(){
  const sc=S.scenarios.find(x=>x.id===S.scenarioCourant)||S.scenarios[0];
  const g=S.gisements.find(x=>x.id===sc.gis);
  const onglets=[["U","Usage actuel"],["V","Valeur potentielle"],["A","Activabilité"],["C","Conditions et risques"]];
  if(sc.cIA) onglets.push(["IA","Aptitude IA"]);
  return `
  <div class="titre"><div><h1>Q2, qualification distribuée</h1>
    <small>${esc(sc.titre)} · <span class="mono-id">${sc.id}</span> · ${g?esc(g.nom):""}</small></div></div>
  <div class="ligne" style="margin-bottom:20px"><div style="flex:1 1 460px">
    <label class="champ" for="ssel">Scénario</label><select id="ssel" data-action="sel-scn">
      ${S.scenarios.map(x=>`<option value="${x.id}" ${x.id===sc.id?"selected":""}>${x.id} ${esc(x.titre)}</option>`).join("")}
    </select></div></div>
  <div class="tabs">${onglets.map(([k,l])=>
    `<button data-tab="${k}" aria-current="${S.tabQ===k}">${l}</button>`).join("")}</div>
  <div class="carte">${S.tabQ==="C"?blocC(sc):S.tabQ==="U"?blocU(sc):blocSimple(sc,S.tabQ)}</div>
  <div class="encadre" style="margin-top:16px">
    ND n'est jamais assimilé à zéro : il déclenche une instruction et élargit la fourchette de potentiel latent.
    NA exige une justification validée et redistribue le poids sur les critères applicables du même axe.
  </div>`;
}
function selNiv(sc,bloc,id,champ,val){
  const opts=["ND","NA",0,1,2,3,4].map(o=>
    `<option value="${o}" ${String(val)===String(o)?"selected":""}>${o==="ND"?"ND, non déterminé":o==="NA"?"NA, non applicable":o}</option>`).join("");
  return `<select data-edit="${bloc}|${id}|${champ}">${opts}</select>`;
}
function selPreuve(sc,bloc,id,val){
  return `<select data-edit="${bloc}|${id}|e">${[0,1,2,3].map(o=>
    `<option value="${o}" ${o===val?"selected":""}>E${o}, ${["aucune preuve","déclaratif","documenté","vérifié"][o]}</option>`).join("")}</select>`;
}
function blocSimple(sc,bloc){
  const src = bloc==="V"?sc.v:bloc==="A"?sc.A:sc.ia;
  const ids = bloc==="V"?[...Object.keys(W.Vv),...Object.keys(W.Vc)]:Object.keys(bloc==="A"?W.A:W.IA);
  const poids = bloc==="V"?{...W.Vv,...W.Vc}:(bloc==="A"?W.A:W.IA);
  return ids.map(id=>{const r=src[id]||{v:"ND",e:0};
    return `<div class="crit"><div class="hd"><h4>${id} ${LIB[id]}</h4>
      <span class="tag">poids ${poids[id]} %${bloc==="V"&&W.Vv[id]?" (voie de valeur)":""}</span></div>
      <div class="q">${QUESTION[id]||""}</div>
      <div class="ctl"><div><label class="champ">Niveau</label>${selNiv(sc,bloc,id,"v",r.v)}</div>
        <div><label class="champ">Preuve</label>${selPreuve(sc,bloc,id,r.e)}</div></div></div>`;}).join("");
}
function blocU(sc){
  return Object.keys(W.U).map(id=>{const r=sc.u[id]||{v:"ND",e:0};
    const contra = num(r.d)&&num(r.o)&&Math.abs(r.d-r.o)>=2;
    return `<div class="crit"><div class="hd"><h4>${id} ${LIB[id]}</h4><span class="tag">poids ${W.U[id]} %</span></div>
      <div class="q">${QUESTION[id]}</div>
      <div class="ctl">
        <div><label class="champ">Niveau retenu</label>${selNiv(sc,"U",id,"v",r.v)}</div>
        <div><label class="champ">Usage déclaré</label>${selNiv(sc,"U",id,"d",r.d===null||r.d===undefined?"ND":r.d)}</div>
        <div><label class="champ">Usage objectivé</label>${selNiv(sc,"U",id,"o",r.o===null||r.o===undefined?"ND":r.o)}</div>
        <div><label class="champ">Preuve</label>${selPreuve(sc,"U",id,r.e)}</div></div>
      ${contra?`<div class="encadre att" style="margin-top:10px">Écart d'au moins deux niveaux entre déclaré et objectivé :
        anomalie à instruire. Aucune moyenne automatique ; la borne haute retient ${Math.max(r.d,r.o)}.</div>`:""}
    </div>`;}).join("");
}
function blocC(sc){
  const cib=ciblesC(sc.profil);
  const profils={PERSONNEL_SANTE:"Données personnelles de santé",IDENTIFIANT:"Données directement identifiantes",
    GRANDE_ECHELLE:"Grande échelle ou multi-source",INFLUENCE_SOIN:"Influence directe sur un soin",
    DECISION_AUTO:"Décision automatisée sur une personne",RECHERCHE:"Recherche, étude ou entrepôt",
    TRANSFERT_EXTERNE:"Transfert externe ou nouveau sous-traitant",PUBLICATION:"Publication ou partage ouvert"};
  return `<div style="margin-bottom:16px"><h4>Profil du scénario</h4>
    <div class="sub" style="margin:4px 0 10px">Le profil détermine les maturités cibles. Il n'est pas une appréciation libre du répondant.</div>
    <div class="ligne">${Object.entries(profils).map(([k,l])=>
      `<button class="btn mini ${sc.profil.includes(k)?"":"gris"}" data-action="toggle-profil" data-id="${k}">${l}</button>`).join("")}</div></div>
  ${Object.keys(W.C).map(id=>{const r=sc.c[id]||{v:"ND",e:0,I:null,P:null};
    const gap=num(r.v)?Math.max(0,cib[id]-r.v):cib[id];
    return `<div class="crit"><div class="hd"><h4>${id} ${LIB[id]}</h4>
      <span class="tag">poids ${W.C[id]} % · cible ${cib[id]}${gap>0?` · écart ${gap}`:""}</span></div>
      <div class="q">${QUESTION[id]}</div>
      <div class="ctl">
        <div><label class="champ">Maturité du contrôle</label>${selNiv(sc,"C",id,"v",r.v)}</div>
        <div><label class="champ">Impact</label><select data-edit="C|${id}|I">${["ND",1,2,3,4].map(o=>
          `<option value="${o}" ${(o==="ND"?!num(r.I):r.I===o)?"selected":""}>${o}</option>`).join("")}</select></div>
        <div><label class="champ">Exposition</label><select data-edit="C|${id}|P">${["ND",1,2,3,4].map(o=>
          `<option value="${o}" ${(o==="ND"?!num(r.P):r.P===o)?"selected":""}>${o}</option>`).join("")}</select></div>
        <div><label class="champ">Preuve</label>${selPreuve(sc,"C",id,r.e)}</div></div>
      ${gap>0?`<div class="tag" style="margin-top:8px">Écart ouvert : une action de maîtrise est créée avec niveau cible, responsable, preuve de clôture et autorité de validation.</div>`:""}
    </div>`;}).join("")}`;
}

/* ---------- vue 6 : tableau de bord d'un scénario ---------- */
function vueScenario(){
  const sc=S.scenarios.find(x=>x.id===S.scenarioCourant)||S.scenarios[0];
  const g=S.gisements.find(x=>x.id===sc.gis); const r=calcScenario(sc);
  const badges=[];
  if(r.P==="P4") badges.push(['p-hach',"À instruire"]);
  if(r.U.dec>=80&&r.V.dec>=70) badges.push(['p-gris',"Valeur déjà captée"]);
  if(r.noPilot) badges.push(['p-encre',"Pas de pilote"]);
  if(r.IA&&r.IA.suspendu) badges.push(['p-encre',"IA suspendue"]);
  if(r.V.provisoire) badges.push(['p-hach',"V provisoire"]);
  const msg=[
    ["Potentiel latent",lireL(r.L.dec),f1(r.L.dec)+" / 100","lime"],
    ["Activabilité",lireA(r.A.dec),f1(r.A.dec)+" / 100","teal"],
    ["Confiance",r.confLib,"complétude "+f0(r.K_dec)+" % · preuve "+f0(r.Conf_dec)+" %",""],
    ["Conditions",r.conditions+" action"+(r.conditions>1?"s":"")+" préalable"+(r.conditions>1?"s":""),C_LIB[r.C.statut],""],
    ["Recommandation",P_LIB[r.P],P_DEC[r.P],""]
  ];
  return `
  <div class="titre"><div><h1>${esc(sc.titre)}</h1>
    <small class="mono-id">${sc.id} · ${g?esc(g.nom):""} · ${esc(sc.horizon)}</small></div>
    <div class="ligne">${badges.map(([c,t])=>`<span class="p ${c}">${t}</span>`).join("")}</div></div>
  <div class="ligne" style="margin-bottom:20px"><div style="flex:1 1 460px">
    <label class="champ" for="ssel2">Scénario</label><select id="ssel2" data-action="sel-scn">
      ${S.scenarios.map(x=>`<option value="${x.id}" ${x.id===sc.id?"selected":""}>${x.id} ${esc(x.titre)}</option>`).join("")}
    </select></div></div>

  <div class="grille g3">${msg.map(([l,v,d,c])=>`<div class="kpi">
    <div class="l">${l}</div><div style="font-size:19px;font-weight:600;margin:2px 0">${v}</div>
    <div class="d">${d}</div>${c?`<div class="jauge ${c}"><i style="width:${l==="Potentiel latent"?r.L.dec:r.A.dec}%"></i></div>`:""}</div>`).join("")}</div>

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
        <small>${e.actuel===null?"non renseigné":"niveau "+e.actuel} · cible ${e.cible}</small></span>
        <span class="p ${e.critique?"p-encre":"p-hach"}">${e.critique?"critique":"écart "+e.gap}</span></li>`).join("")}
      ${r.A.regles.map(t=>`<li><span><small>${t}</small></span><span class="p p-hach">activabilité</span></li>`).join("")}
      ${(!r.C.ecarts.filter(e=>e.gap>0).length&&!r.A.regles.length)?"<li><small>Aucune condition ouverte.</small></li>":""}
      </ul></div>
  </div>

  ${r.IA?`<div class="sect"><h2>Aptitude IA</h2><div class="carte">
    <div class="ligne" style="justify-content:space-between;align-items:baseline">
      <div><div style="font-size:27px;font-weight:600" class="num">${f1(r.IA.dec)}<span style="font-size:15px;color:var(--gris);font-weight:400"> / 100</span></div>
      <div class="tag">Recommandation maximale : ${r.IA.reco}</div></div>
      ${r.IA.suspendu?'<span class="p p-encre">Recommandation suspendue</span>':""}</div>
    <ul class="liste-nette" style="margin-top:12px">${r.IA.regles.map(t=>`<li><small>${t}</small></li>`).join("")||"<li><small>Aucun plafond déclenché.</small></li>"}</ul>
  </div></div>`:""}

  <div class="sect"><h2>Comprendre le calcul</h2>
  <div class="sub">Vue d'explication : lectures observée, prudente et décisionnelle, complétude, confiance, règles déclenchées et hypothèses de borne.
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
        <tr><td>Lecture U</td><td>${lireU(r.U.dec)}</td></tr>
        <tr><td>Lecture V</td><td>${lireV(r.V.dec)}</td></tr>
        <tr><td>Bornes U (bas / haut)</td><td class="num">${f1(r.U.bas)} / ${f1(r.U.haut)}</td></tr>
        <tr><td>Fourchette de potentiel latent</td><td class="num">${f1(r.L.fourchette[0])} à ${f1(r.L.fourchette[1])}
          <br><small>Fourchette d'incertitude méthodologique, pas un intervalle de confiance statistique.</small></td></tr>
        <tr><td>Voies de valeur renseignées</td><td>${r.V.nVoies} sur 6 · B observé ${f1(r.V.B_obs)}</td></tr>
        <tr><td>K et Conf décisionnels</td><td class="num">${f0(r.K_dec)} % · ${f0(r.Conf_dec)} %</td></tr>
        <tr><td>O<sub>V</sub> / O<sub>L</sub> / O<sub>Lc</sub></td><td class="num">${f1(r.O_V)} · ${f1(r.O_L)} · ${f1(r.O_Lc)}</td></tr>
      </table></div>
    <div class="carte"><h4>Règles déclenchées et bloc C</h4>
      <table style="margin-top:8px">
        <tr><td>Statut de passage C</td><td>${C_LIB[r.C.statut]}${r.C.bloqueMotif?", "+r.C.bloqueMotif:""}</td></tr>
        <tr><td>Risque résiduel R</td><td class="num">${f1(r.C.R)}, ${r.C.R<25?"faible sous contrôles":r.C.R<50?"modéré":r.C.R<70?"élevé":"critique"}</td></tr>
        <tr><td>Indice d'écart GapC</td><td class="num">${f1(r.C.GapC)}</td></tr>
        <tr><td>Hypothèses conservatrices I=4, P=3, M=0</td><td>${r.C.hypotheses.join(", ")||"aucune"}</td></tr>
        <tr><td>Contradictions U déclaré / objectivé</td><td>${r.U.contradictions.join(", ")||"aucune"}</td></tr>
        <tr><td>Plafond V</td><td>${r.V.plafond||"aucun"}</td></tr>
        <tr><td>Plafonds A</td><td>${r.A.regles.join("<br>")||"aucun"}</td></tr>
        <tr><td>Statut de portefeuille</td><td><span class="p ${r.P==="P0"?"p-encre":r.P==="P4"?"p-hach":"p-violet"}">${r.P} ${P_LIB[r.P]}</span></td></tr>
      </table>
      <div class="encadre att" style="margin-top:14px">Le score ne vaut ni autorisation juridique, ni avis du DPO,
        ni validation de sécurité, ni validation clinique. Le niveau maximal recommandé reste un pilote contrôlé.</div>
    </div>
  </div></div>`;
}

/* ---------- vue 7 : portefeuilles ---------- */
function vuePortefeuilles(){
  const calc=S.scenarios.map(s=>({s,r:calcScenario(s)}));
  const ordre=["P1","P3","P2","P5","P4","P6","P0"];
  const groupes=ordre.map(p=>({p,items:calc.filter(x=>x.r.P===p)
    .sort((x,y)=>y.r.O_Lc-x.r.O_Lc)})).filter(g=>g.items.length);
  const bandes=[[60,100,"Latent fort"],[40,59.999,"Latent significatif"],[0,39.999,"Latent faible"]];
  const cols=[[0,39.999,"Activabilité faible"],[40,59.999,"Activabilité moyenne"],[60,100,"Activabilité forte"]];
  const cellText=[["Actif stratégique à débloquer","Chantier prioritaire de préparation","Candidat pilote à fort potentiel"],
                  ["Incubation sélective","Opportunité à arbitrer","Gain rapide"],
                  ["Veille ou valeur déjà captée","Réemploi opportuniste","Amélioration marginale seulement"]];
  const gis=S.gisements.map(g=>({g,r:calcGisement(g)})).sort((x,y)=>y.r.Sg-x.r.Sg);
  return `
  <div class="titre"><div><h1>Portefeuilles</h1>
    <small>Deux unités d'analyse distinctes : quels usages instruire, dans quels actifs investir.</small></div></div>

  <div class="sect"><h2>Portefeuille des scénarios</h2>
  <div class="sub">Groupé par statut, jamais par rang global. Un scénario bloqué ne peut pas paraître meilleur qu'un scénario admissible.
    Tri interne : statut C, puis O<sub>Lc</sub>, puis O<sub>V</sub>, puis valeur patrimoniale, puis effort.</div>
  ${groupes.map(gr=>`<div class="carte" style="margin-bottom:14px">
    <div class="ligne" style="justify-content:space-between;align-items:baseline">
      <h3>${P_LIB[gr.p]} <span class="tag">${gr.p} · ${gr.items.length}</span></h3>
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
    </tbody></table></div></div>`).join("")}
  </div>

  <div class="sect"><h2>Carte potentiel latent × activabilité</h2>
  <div class="sub">Lecture après V et statut C. Les scénarios à instruire sont hachurés, les scénarios bloqués sont isolés hors carte.</div>
  <div class="scroll"><table class="mat"><thead><tr><th style="width:150px"></th>
    ${cols.map(c=>`<th>${c[2]}<br><span class="tag">de ${c[0]} à ${Math.round(c[1])}</span></th>`).join("")}</tr></thead><tbody>
    ${bandes.map((b,bi)=>`<tr><th style="text-align:left">${b[2]}<br><span class="tag">de ${b[0]} à ${Math.round(b[1])}</span></th>
      ${cols.map((cc,ci)=>{const items=calc.filter(x=>x.r.P!=="P0"&&x.r.L.dec>=b[0]&&x.r.L.dec<=b[1]&&x.r.A.dec>=cc[0]&&x.r.A.dec<=cc[1]);
        return `<td><div class="tag" style="margin-bottom:6px">${cellText[bi][ci]}</div>
          ${items.map(({s,r})=>`<span class="puce ${r.P==="P4"?"p-hach":r.C.statut==="ADMISSIBLE"?"p-teal":"p-violet"}">${s.id} · ${esc(s.titre.slice(0,42))}${s.titre.length>42?"…":""}</span>`).join("")}</td>`;}).join("")}
    </tr>`).join("")}
  </tbody></table></div>
  ${calc.filter(x=>x.r.P==="P0").length?`<div class="encadre att" style="margin-top:12px">
    Hors carte, statut bloqué : ${calc.filter(x=>x.r.P==="P0").map(x=>x.s.id+" "+esc(x.s.titre)).join(" ; ")}.
    Le blocage relève d'une décision d'autorité compétente, pas d'un arbitrage de valeur.</div>`:""}
  </div>

  <div class="sect"><h2>Portefeuille des gisements</h2>
  <div class="sub">Le patrimoine agrège les scénarios sans récompenser leur nombre. L*, Lev et Div restent des hypothèses expérimentales
    à confronter au jugement des experts pendant les pilotes.</div>
  <div class="carte scroll"><table><thead><tr><th>Gisement</th><th>Statut patrimonial</th>
    <th class="n">S<sub>g</sub></th><th class="n">L*</th><th class="n">Pat</th><th class="n">Lev</th><th class="n">Div</th>
    <th class="n">Conf<sub>g</sub></th><th class="n">U<sub>g</sub></th></tr></thead><tbody>
    ${gis.map(({g,r})=>`<tr><td>${esc(g.nom)}<br><small class="mono-id">${g.id} · ${r.scs.length} scénario${r.scs.length>1?"s":""} · ${r.nf} famille${r.nf>1?"s":""} de valeur</small></td>
      <td><span class="p ${r.statut==="Candidat à investissement"?"p-lime":r.statut==="Instruire le patrimoine"?"p-hach":"p-gris"}">${r.statut}</span></td>
      <td class="n">${f1(r.Sg)}</td><td class="n">${f1(r.Lstar)}</td><td class="n">${f1(r.Pat)}</td>
      <td class="n">${f1(r.Lev)}</td><td class="n">${f1(r.Div)}</td><td class="n">${f0(r.Confg)}</td><td class="n">${f1(r.Ug)}</td></tr>`).join("")}
  </tbody></table></div>

  <div class="carte" style="margin-top:16px"><h3>Chantiers communs</h3>
    <div class="sub" style="margin:4px 0 10px">Chaque relation chantier → condition levée → scénario est explicitée et prouvée. Un scénario n'est compté qu'une fois par chantier.</div>
    <ul class="liste-nette">${S.chantiers.map(w=>`<li><span>${esc(w.titre)}<br>
      <small class="mono-id">${w.id} · lève une condition pour ${w.leve.join(", ")} · preuve E${w.preuve}</small></span></li>`).join("")}</ul></div>
  </div>`;
}

/* ==========================================================================
   6. INTERACTIONS
   ========================================================================== */
let vuePrec=null;
function render(){
  renderNav();
  const v={edr:vueEDR,signaux:vueSignaux,gisements:vueGisements,q1:vueQ1,q2:vueQ2,
           scenario:vueScenario,portefeuilles:vuePortefeuilles}[S.view];
  const y=window.scrollY||0;
  $("app").innerHTML=v();
  if(S.view!==vuePrec){ window.scrollTo({top:0,behavior:"instant"}); vuePrec=S.view; }
  else window.scrollTo({top:y,behavior:"instant"});
}
document.addEventListener("click",e=>{
  const b=e.target.closest("button"); if(!b) return;
  if(b.dataset.vue){ S.view=b.dataset.vue; return render(); }
  if(b.dataset.tab){ S.tabQ=b.dataset.tab; return render(); }
  if(b.dataset.cell){
    const cur=S.campagne.cellules[b.dataset.cell];
    S.campagne.cellules[b.dataset.cell]=CELL_ETATS[(CELL_ETATS.indexOf(cur)+1)%4];
    return render();
  }
  const act=b.dataset.action, id=b.dataset.id;
  if(act==="open-scn"){ S.scenarioCourant=id; S.view="scenario"; return render(); }
  if(act==="toggle-profil"){
    const sc=S.scenarios.find(x=>x.id===S.scenarioCourant);
    const i=sc.profil.indexOf(id); i>=0?sc.profil.splice(i,1):sc.profil.push(id);
    return render();
  }
  if(act==="add-signal"){
    const nom=$("sn").value.trim(); if(!nom){ $("sn").focus(); return; }
    const n=String(S.signaux.length+1).padStart(4,"0");
    S.signaux.push({id:"SIG-"+n,nom,zone:$("sz").value,canal:$("sc").value,
      auteur:"Contributeur connecté",wf:"SOUMIS",res:null,gis:null,motif:$("sm").value});
    return render();
  }
  if(act==="dismiss-signal"){
    const s=S.signaux.find(x=>x.id===id); s.wf="RESOLU"; s.res="ECARTE"; return render();
  }
  if(act==="confirm-signal"){
    const s=S.signaux.find(x=>x.id===id); s.wf="RESOLU"; s.res="CONFIRME";
    const n=String(S.gisements.length+1).padStart(4,"0"); const gid="GIS-"+n; s.gis=gid;
    S.gisements.push({id:gid,nom:s.nom,famille:"À qualifier en Q1",
      definition:"Description à compléter en Q1. Créé par confirmation du signal "+s.id+".",
      sources:"À préciser",producteur:"À préciser",rmetier:"À identifier",rtech:"À identifier",
      population:"À préciser",periode:"À préciser",modalites:"À préciser",granularite:"À préciser",
      sensibilite:"À qualifier",usageInitial:"À préciser",contraintes:"À préciser",
      zone:s.zone,prealable:"NON",passe:"PAS-"+S.campagne.passe,gouvernance:"A_IDENTIFIER",
      ug:{UG01:a("ND",0),UG02:a("ND",0),UG03:a("ND",0),UG04:a("ND",0),UG05:a("ND",0)},V09preuve:0});
    S.gisementCourant=gid; S.view="gisements"; return render();
  }
  if(act==="rejeter-sug"){ S.suggestions=S.suggestions.filter(x=>x.id!==id); return render(); }
  if(act==="valider-sug"){
    const sug=S.suggestions.find(x=>x.id===id); if(!sug) return;
    const n=String(S.scenarios.length+1).padStart(4,"0"); const sid="SCN-"+n;
    const vide=(ks)=>Object.fromEntries(ks.map(k=>[k,a("ND",0)]));
    S.scenarios.push({id:sid,gis:sug.gis,stade:"SIGNALE",titre:sug.titre,
      finalite:"À compléter lors de la validation",beneficiaire:"À compléter",decision:"À compléter",
      resultat:"À compléter",population:"À compléter",horizon:"À compléter",
      origine:"Validation humaine d'une suggestion",cIA:false,profil:["PERSONNEL_SANTE"],
      u:Object.fromEntries(Object.keys(W.U).map(k=>[k,au("ND",0,null,null)])),
      v:vide([...Object.keys(W.Vv),...Object.keys(W.Vc)]),
      A:vide(Object.keys(W.A)),
      c:Object.fromEntries(Object.keys(W.C).map(k=>[k,c("ND",0,null,null)])),
      ia:{}});
    S.suggestions=S.suggestions.filter(x=>x.id!==id);
    S.scenarioCourant=sid; S.tabQ="U"; S.view="q2"; return render();
  }
});
document.addEventListener("change",e=>{
  const t=e.target;
  if(t.dataset.action==="sel-gis"){ S.gisementCourant=t.value; return render(); }
  if(t.dataset.action==="sel-scn"){ S.scenarioCourant=t.value; return render(); }
  if(t.dataset.edit){
    const [bloc,id,champ]=t.dataset.edit.split("|");
    const sc=S.scenarios.find(x=>x.id===S.scenarioCourant);
    const cible={U:sc.u,V:sc.v,A:sc.A,C:sc.c,IA:sc.ia}[bloc];
    if(!cible[id]) cible[id]={v:"ND",e:0};
    let val=t.value;
    if(val!=="ND"&&val!=="NA") val=Number(val);
    if(champ==="e"||champ==="I"||champ==="P") cible[id][champ]=(val==="ND"?null:Number(val));
    else if(champ==="d"||champ==="o") cible[id][champ]=(val==="ND"||val==="NA")?null:val;
    else cible[id].v=val;
    return render();
  }
});
render();
