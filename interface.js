/* interface.js, rendu et interactions Data Finder
   Applique le guide UX/UI et langage produit V1.0.
   Le moteur de calcul et le modèle métier ne sont pas modifiés : seule la couche
   de langage, de navigation et d'interaction est écrite ici.
*/

/* ==========================================================================
   1. OUTILS
   ========================================================================== */
const $=id=>document.getElementById(id);
const f1=x=>(x===null||x===undefined||isNaN(x))?"N/A":x.toFixed(1).replace(".",",");
const f0=x=>(x===null||x===undefined||isNaN(x))?"N/A":String(Math.round(x));
const esc=s=>String(s===null||s===undefined?"":s).replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
const pct=x=>(x===null||x===undefined||isNaN(x))?"N/A":Math.round(x)+" %";
const borne=x=>Math.max(0,Math.min(100,x||0));

function idSuivant(liste,prefixe){
  let n=1; const pris=new Set(liste.map(x=>x.id));
  while(pris.has(prefixe+String(n).padStart(4,"0"))) n++;
  return prefixe+String(n).padStart(4,"0");
}
const actifCourant  = ()=>S.gisements.find(x=>x.id===S.gisementCourant)||S.gisements[0]||null;
const usageCourant  = ()=>S.scenarios.find(x=>S.nav&&S.nav.fiche&&x.id===S.nav.fiche)
                        ||S.scenarios.find(x=>x.id===S.scenarioCourant)||null;
const pisteCourante = ()=>S.signaux.find(x=>x.id===S.pisteCourante)||null;
const usagesDe      = gid=>S.scenarios.filter(s=>s.gis===gid);
const pistesOuvertes= ()=>S.signaux.filter(s=>s.wf!=="RESOLU");
const dateCourte = t=>new Date(t).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"})+" "+
  new Date(t).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});

function normaliser(){
  if(!S) return;
  if(!S.nav) S.nav={};
  const n=S.nav;
  n.section=n.section||"apercu"; n.explorer=n.explorer||"perimetre";
  n.actif=n.actif||"apercu"; n.usage=n.usage||"apercu"; n.priorites=n.priorites||"usages";
  n.dim=n.dim||"U"; n.listeUsages=n.listeUsages||"tous"; n.listePistes=n.listePistes||"ouvertes";
  n.fiche=n.fiche||null; n.recherche=n.recherche||"";
  if(!S.journal) S.journal=[];
  if(S.campagne.terminee===undefined) S.campagne.terminee=false;
  if(S.preuveInventaire===undefined) S.preuveInventaire=0;
  S.gisements.forEach(g=>{ if(g.V09===undefined){ g.V09=0; g.V09preuve=0; } });
  if(!S.gisementCourant && S.gisements[0]) S.gisementCourant=S.gisements[0].id;
  synchroniserCases();
  delete S.view; delete S.tabQ;
}
/* Les cases de couverture couvrent exactement les services prioritaires.
   Sans cette remise à plat, un service ajouté n'entrerait pas dans le calcul. */
function synchroniserCases(){
  const prio=S.campagne.unites.filter(u=>u.prio);
  const neuf={};
  prio.forEach(u=>FAMILLES.forEach((f,i)=>{
    const cle=u.id+"|"+i;
    neuf[cle]=S.campagne.cellules[cle]||"NC";
  }));
  S.campagne.cellules=neuf;
}
function journal(texte,objet){
  S.journal.unshift({t:new Date().toISOString(), o:objet||null, l:texte});
  if(S.journal.length>200) S.journal.pop();
}
function surveillerStatuts(){
  S.scenarios.forEach(sc=>{
    const p=calcScenario(sc).P;
    if(sc._statut && sc._statut!==p) journal("Résultat mis à jour, "+STATUTS[p].label.toLowerCase(),sc.id);
    sc._statut=p;
  });
}

/* ==========================================================================
   2. ÉLÉMENTS À TRAITER ET PROCHAINE ACTION
   ========================================================================== */
function elementsATraiter(){
  const out=[]; const k=kpiEDR();
  if(!S.campagne.perimetre)
    out.push({t:"L'exploration n'a pas encore de périmètre",cta:"Définir le périmètre",
      go:{section:"explorer",explorer:"perimetre"},ton:"attention"});
  const po=pistesOuvertes().length;
  if(po) out.push({t:po+(po>1?" pistes attendent une décision":" piste attend une décision"),
      cta:"Examiner",go:{section:"explorer",explorer:"pistes"},ton:"attention"});
  const sansUsage=S.gisements.filter(g=>!usagesDe(g.id).length).length;
  if(sansUsage) out.push({t:sansUsage+(sansUsage>1?" actifs n'ont aucun cas d'usage":" actif n'a aucun cas d'usage"),
      cta:"Créer un cas d'usage",go:{section:"actifs"},ton:"neutral"});
  S.scenarios.forEach(sc=>{
    const r=calcScenario(sc);
    if(r.C.statut==="BLOQUE")
      out.push({t:"Un prérequis critique bloque « "+sc.titre+" »",cta:"Traiter",
        go:{section:"usages",fiche:sc.id,usage:"resultat"},ton:"blocage"});
  });
  const incomplets=S.scenarios.filter(sc=>calcScenario(sc).P==="P4"&&calcScenario(sc).C.statut!=="BLOQUE");
  if(incomplets.length)
    out.push({t:incomplets.length+(incomplets.length>1?" cas d'usage sont incomplets":" cas d'usage est incomplet"),
      cta:"Continuer",go:{section:"usages",fiche:incomplets[0].id,usage:"evaluation"},ton:"attention"});
  if(!S.campagne.terminee && conditionsCloture().every(c=>c.ok) && S.campagne.perimetre)
    out.push({t:"L'exploration est prête à être terminée",cta:"Terminer",
      go:{section:"explorer",explorer:"terminer"},ton:"succes"});
  return out;
}
function banniere(){
  if(S.nav.section==="formation"||S.nav.section==="methode") return "";
  const l=elementsATraiter();
  if(!l.length) return `<div class="suite succes"><div class="txt"><b>Rien ne bloque</b>
    <small>Vous pouvez comparer vos priorités.</small></div>
    <button class="btn petit sec" data-aller='{"section":"priorites"}'>Voir les priorités</button></div>`;
  const x=l[0];
  return `<div class="suite ${x.ton==="attention"?"attention":x.ton==="blocage"?"blocage":x.ton==="succes"?"succes":""}">
    <div class="txt"><b>${esc(x.t)}</b></div>
    <button class="btn petit" data-aller='${esc(JSON.stringify(x.go))}'>${esc(x.cta)}</button></div>`;
}

/* ==========================================================================
   3. COMPOSANTS
   ========================================================================== */
function champTexte(attr,cle,valeur,question,aide,code,multi){
  const idc="q-"+attr+"-"+cle.replace(/[^A-Za-z0-9]/g,"");
  return `<div class="question">
    <label for="${idc}">${esc(question)}</label>
    ${aide?`<div class="aide">${esc(aide)}</div>`:""}
    ${multi
      ? `<textarea id="${idc}" data-${attr}="${esc(cle)}">${esc(valeur)}</textarea>`
      : `<input type="text" id="${idc}" data-${attr}="${esc(cle)}" value="${esc(valeur)}">`}
    ${code?`<div class="code">${code}</div>`:""}
  </div>`;
}
function champChoix(attr,cle,valeur,question,options,aide){
  return `<div class="question"><label>${esc(question)}</label>
    ${aide?`<div class="aide">${esc(aide)}</div>`:""}
    <select data-${attr}="${esc(cle)}">${options.map(o=>{
      const v=Array.isArray(o)?o[0]:o, t=Array.isArray(o)?o[1]:o;
      return `<option value="${esc(v)}" ${String(valeur)===String(v)?"selected":""}>${esc(t)}</option>`;}).join("")}
    </select></div>`;
}
/* choix de niveau, section 23 du guide */
function selecteurNiveau(portee,valeur,libelle){
  const b=(v,t,cls)=>`<button type="button" role="radio" aria-checked="${String(valeur)===String(v)}"
    class="${cls||""}" data-niveau="${portee}|${v}">${t}</button>`;
  return `<div class="lab">${esc(libelle||"Votre évaluation")}</div>
    <div class="niveaux" role="radiogroup" aria-label="${esc(libelle||"Votre évaluation")}">
      ${b("ND",NIVEAU_ND,"bord")}<span class="sep"></span>
      ${[0,1,2,3,4].map(n=>b(n,n)).join("")}<span class="sep"></span>
      ${b("NA",NIVEAU_NA,"bord")}
    </div>`;
}
/* repère du niveau choisi, section 24 du guide */
function repereNiveau(critere,valeur,ancresPerso){
  const an=ancresPerso||ANCRES[critere];
  if(!an) return "";
  const n=Number(valeur);
  const tous=`<details class="avance reperes-tous"><summary>Voir tous les repères</summary>
    <table>${an.map((t,i)=>`<tr class="${String(valeur)===String(i)?"actif":""}">
      <td class="n">${i}</td><td>${esc(t)}</td></tr>`).join("")}</table></details>`;
  if(valeur==="ND") return `<div class="repere vide">Information encore inconnue. Elle sera signalée comme à déterminer.</div>${tous}`;
  if(valeur==="NA") return `<div class="repere vide">Critère écarté du calcul, son poids est reporté sur les autres critères.</div>${tous}`;
  if(isNaN(n)||!an[n]) return tous;
  return `<div class="repere"><b>Niveau ${n}</b><br>${esc(an[n])}</div>${tous}`;
}
/* choix de preuve, section 25 du guide */
function selecteurPreuve(portee,valeur){
  return `<div class="lab">Sur quoi repose cette évaluation ?</div>
    <div class="preuves" role="radiogroup" aria-label="Sur quoi repose cette évaluation ?">
      ${PREUVES.map((p,i)=>`<button type="button" role="radio" aria-checked="${Number(valeur)===i}"
        data-preuve="${portee}|${i}"><span class="pastille-radio"></span>${p.label}
        <span class="code">${p.code}</span></button>`).join("")}
    </div>`;
}
/* validation visuelle niveau et preuve, section 26 du guide */
function alerteEtayage(valeur,preuve){
  const n=Number(valeur); if(isNaN(n)) return "";
  let attendu=null;
  if(n===4 && preuve<3) attendu="Vérifiés";
  else if(n===3 && preuve<2) attendu="Documentés";
  if(!attendu) return "";
  return `<div class="alerte"><b>Cette évaluation n'est pas encore suffisamment étayée.</b>
    <table><tr><td>Niveau choisi</td><td class="num">${n}</td></tr>
    <tr><td>Éléments disponibles</td><td>${PREUVES[preuve||0].label}</td></tr>
    <tr><td>Attendu</td><td>${attendu}</td></tr></table></div>`;
}
function avance(titre,contenu){
  return `<details class="avance"><summary>${esc(titre)}</summary><div class="contenu">${contenu}</div></details>`;
}
function etatVide(titre,phrase,actions){
  return `<div class="vide"><h3>${esc(titre)}</h3><p>${esc(phrase)}</p>
    <div class="actions">${actions}</div></div>`;
}
function onglets(nom,liste,actif){
  return `<div class="onglets" role="tablist">${liste.map(([cle,lib,compte])=>
    `<button role="tab" aria-current="${actif===cle}" data-onglet="${nom}|${cle}">${esc(lib)}${
      compte!==undefined&&compte!==null?` <span class="compte">${compte}</span>`:""}</button>`).join("")}</div>`;
}
function statPastille(ton,texte){
  const cls={violet:"p-violet",teal:"p-teal",lime:"p-lime",encre:"p-encre",hach:"p-hach",gris:"p-gris"}[ton]||"p-gris";
  return `<span class="p ${cls}">${esc(texte)}</span>`;
}

/* ==========================================================================
   4. ESPACES DE TRAVAIL
   ========================================================================== */
function vueEspaces(){
  const liste=indexEspaces();
  const objectifs=[
    ["Recenser ce que vous avez",
     "Faites remonter les ensembles de données que personne n'inventorie : fichiers tenus par un service, systèmes anciens, documents jamais réexploités.",
     "M4 6h16M4 12h16M4 18h10"],
    ["Identifier de nouveaux usages",
     "Associez un usage concret à chaque actif, et mesurez ce qui reste réellement à exploiter une fois déduit ce qui est déjà fait.",
     "M12 3v18M3 12h18"],
    ["Décider où agir",
     "Comparez les usages selon leur potentiel, leur faisabilité et leurs prérequis, avant d'engager du temps et des moyens.",
     "M6 20V10M12 20V4M18 20v-7"]
  ];
  const etapes=[
    ["Explorer","Définissez où chercher et vérifiez que chaque partie importante du périmètre a été examinée."],
    ["Recenser","Transformez les pistes repérées en actifs de données décrits, avec un responsable identifié."],
    ["Évaluer","Répondez aux questions de chaque dimension et indiquez sur quoi repose votre réponse."],
    ["Prioriser","Obtenez une recommandation lisible et les freins précis à lever pour avancer."]
  ];
  return `
  <section class="hero">
    <div class="hero-txt">
      <div class="signature"><img src="logo-cius.svg" alt="CIUS" height="34"><span>Une plateforme du CIUS</span></div>
      <h1>${esc(PRODUIT.nom)}</h1>
      <p class="accroche">${esc(PRODUIT.accroche)}</p>
      <p class="sous">${esc(PRODUIT.sous)}</p>
      <div class="actions">
        <button class="btn" data-action="aller-commencer">Commencer</button>
        <button class="btn neutre" data-aller='{"section":"methode"}'>Voir la méthode</button>
      </div>
      <p class="mention">Vos données restent sur ce poste. Aucun envoi, aucun compte à créer.</p>
    </div>
    <div class="hero-vis" aria-hidden="true">
      <div class="vis-carte v1"><span>Piste repérée</span><b>Tableur de suivi des sorties</b></div>
      <div class="vis-carte v2"><span>Actif de données</span><b>Comptes rendus d'hospitalisation</b></div>
      <div class="vis-carte v3"><span>Cas d'usage</span><b>Prêt à cadrer un pilote</b></div>
    </div>
  </section>

  <section class="bloc"><h2>À quoi sert Data Finder</h2>
  <div class="sub">Beaucoup d'organisations de santé disposent de données qu'elles n'exploitent pas,
    faute de savoir qu'elles existent, à qui elles appartiennent et ce qu'elles permettraient.
    Data Finder répond à ces trois questions dans l'ordre.</div>
  <div class="grille g3">${objectifs.map(([t,d,ic])=>`<div class="carte objectif">
    <span class="ico">${icone(ic)}</span><h3>${esc(t)}</h3>
    <p>${esc(d)}</p></div>`).join("")}</div></section>

  <section class="bloc"><h2>Comment cela se passe</h2>
  <div class="sub">Quatre temps, dans cet ordre. Chaque écran indique la prochaine action utile.</div>
  <ol class="etapes">${etapes.map(([t,d],i)=>`<li><span class="num">${i+1}</span>
    <div><b>${esc(t)}</b><p>${esc(d)}</p></div></li>`).join("")}</ol></section>

  <section class="bloc"><h2>Ce que Data Finder ne fait pas</h2>
  <div class="carte limites">
    <p>La plateforme ne se connecte à aucun système d'information et ne copie aucun contenu patient.
      Elle travaille à partir de ce que les équipes déclarent, pas à partir d'un scan technique.</p>
    <p>Elle ne produit aucune décision opposable. Un résultat ne remplace ni l'avis du délégué à la protection
      des données, ni la validation de sécurité, ni la validation clinique. L'étape maximale qu'elle recommande
      est un pilote encadré.</p>
  </div></section>

  ${!P.disponible?`<div class="suite blocage"><div class="txt"><b>Enregistrement indisponible</b>
    <small>Le navigateur bloque le stockage local, probablement en navigation privée.
    Vous pouvez travailler, mais exportez une copie avant de fermer l'onglet.</small></div></div>`:""}

  <section class="bloc" id="commencer"><h2>Commencer</h2>
  <div class="sub">Choisissez le point de départ qui correspond à votre situation.
    Les deux premiers reposent sur des données d'exemple entièrement fictives.</div>
  <div class="grille g3">${Object.entries(CAS).map(([cle,cas])=>`<div class="carte depart">
    <h3>${esc(cas.nom)}</h3><p>${esc(cas.resume)}</p>
    <button class="btn" data-action="creer-espace" data-id="${cle}">Ouvrir</button></div>`).join("")}</div></section>

  ${liste.length?`<section class="bloc"><h2>Reprendre votre travail</h2>
  <div class="sub">Ces espaces sont enregistrés dans ce navigateur, sur ce poste.</div>
  <div class="carte"><ul class="liste">${liste.map(m=>`<li>
      <span class="principal"><b>${esc(m.nom)}</b>
        <small>Modifié le ${dateCourte(m.modifie)}</small></span>
      <span class="actions">
        <button class="btn petit" data-action="ouvrir-espace" data-id="${m.id}">Ouvrir</button>
        <details class="menu"><summary aria-label="Autres actions">•••</summary>
          <div class="menu-liste">
            <button data-action="dupliquer-espace" data-id="${m.id}">Dupliquer</button>
            <button class="danger" data-action="supprimer-espace" data-id="${m.id}">Supprimer</button>
          </div></details>
      </span></li>`).join("")}</ul></div></section>`:""}

  <section class="bloc"><h2>Reprendre une sauvegarde</h2>
  <div class="sub">Chargez un fichier exporté depuis un autre poste ou lors d'une séance précédente.</div>
  <div class="carte"><div class="actions">
    <input type="file" id="fichierImport" accept="application/json,.json">
    <button class="btn sec" data-action="importer">Charger</button></div>
    <div id="messageImport" style="margin-top:12px"></div></div></section>`;
}

/* ==========================================================================
   5. VUE D'ENSEMBLE
   ========================================================================== */
function vueApercu(){
  const k=kpiEDR();
  const aTraiter=elementsATraiter();
  const enCours=S.scenarios.filter(s=>calcScenario(s).P!=="P0").length;
  const couv=k.CF===null?null:k.CF;
  return `
  <div class="tete"><div class="t"><h1>Bonjour</h1>
    <p>${esc(P.meta?P.meta.nom:"")}</p></div></div>

  <div class="grille g3">
    <div class="stat"><div class="l">Exploration</div>
      <div class="q">${couv===null?"À démarrer":pct(couv)+" du périmètre vérifié"}</div>
      <div class="v">${k.nc||0} zone${(k.nc||0)>1?"s":""} encore à vérifier</div>
      <div class="jauge"><i style="width:${borne(couv)}%"></i></div></div>
    <div class="stat"><div class="l">Actifs de données</div>
      <div class="q">${S.gisements.length} recensé${S.gisements.length>1?"s":""}</div>
      <div class="v">${S.gisements.filter(g=>!usagesDe(g.id).length).length} sans cas d'usage</div></div>
    <div class="stat"><div class="l">Cas d'usage</div>
      <div class="q">${enCours} en cours</div>
      <div class="v">${S.suggestions.length} idée${S.suggestions.length>1?"s":""} proposée${S.suggestions.length>1?"s":""}</div></div>
  </div>

  <div class="bloc"><h2>À traiter</h2>
  ${aTraiter.length?`<div class="carte"><ul class="liste">${aTraiter.map(x=>`<li>
    <span class="principal"><b>${esc(x.t)}</b></span>
    <button class="btn petit sec" data-aller='${esc(JSON.stringify(x.go))}'>${esc(x.cta)}</button></li>`).join("")}
    </ul></div>`
   :etatVide("Rien ne demande votre attention","Vous pouvez comparer vos priorités ou poursuivre l'exploration.",
     `<button class="btn" data-aller='{"section":"priorites"}'>Voir les priorités</button>`)}
  </div>

  <div class="bloc"><h2>Derniers éléments modifiés</h2>
  ${S.journal.length?`<div class="carte"><ul class="chrono">${S.journal.slice(0,6).map(e=>`<li>
    <div>${esc(e.l)}</div><div class="quand">${dateCourte(e.t)}</div></li>`).join("")}</ul></div>`
   :`<div class="carte"><small>Aucune activité enregistrée pour le moment.</small></div>`}
  </div>`;
}

/* ==========================================================================
   6. EXPLORER
   ========================================================================== */
function conditionsCloture(){
  const k=kpiEDR();
  return [
    {ok:!!S.campagne.contreExploration, t:"Vérification indépendante réalisée",
     go:{section:"explorer",explorer:"perimetre"}},
    {ok:k.prioNonResolus===0, t:k.prioNonResolus===0?"Toutes les pistes ont été traitées"
      :k.prioNonResolus+(k.prioNonResolus>1?" pistes attendent encore une décision":" piste attend encore une décision"),
     go:{section:"explorer",explorer:"pistes"}},
    {ok:k.critNC===0, t:k.critNC===0?"Tous les types de données critiques ont été vérifiés"
      :k.critNC+(k.critNC>1?" types de données critiques restent à vérifier":" type de données critique reste à vérifier"),
     go:{section:"explorer",explorer:"couverture"}},
    {ok:k.CO_p>=90, t:"Services prioritaires suffisamment explorés",
     go:{section:"explorer",explorer:"couverture"}},
    {ok:k.CS>=90, t:"Systèmes connus suffisamment vérifiés",
     go:{section:"explorer",explorer:"couverture"}},
    {ok:k.RM<10, t:"Le dernier tour d'exploration n'a presque rien apporté de nouveau",
     go:{section:"explorer",explorer:"couverture"}},
    {ok:k.gouvNon===0, t:k.gouvNon===0?"Tous les actifs ont un interlocuteur identifié"
      :k.gouvNon+(k.gouvNon>1?" actifs n'ont pas d'interlocuteur":" actif n'a pas d'interlocuteur"),
     go:{section:"actifs"}},
    {ok:true, t:"Aucune copie de contenu patient n'a été nécessaire", go:null}
  ];
}
function vueExplorer(){
  const n=S.nav.explorer;
  const entete=`<div class="tete"><div class="t"><h1>Explorer les données</h1>
    <p>Définissez où chercher, puis vérifiez que chaque partie importante du périmètre a été examinée.</p></div></div>
    ${onglets("explorer",[["perimetre","Périmètre"],["couverture","Couverture"],
      ["pistes","Pistes",pistesOuvertes().length||null],["terminer","Terminer"]],n)}`;
  const corps={perimetre:explPerimetre,couverture:explCouverture,pistes:explPistes,terminer:explTerminer}[n]();
  return entete+corps;
}
function explPerimetre(){
  const c=S.campagne;
  return `
  <h2>Périmètre de l'exploration</h2>
  <div class="sub" style="margin:4px 0 16px;color:var(--gris);font-size:14px">
    Un périmètre explicite permet d'affirmer ce qui a été exploré, plutôt que de laisser croire à un inventaire exhaustif.</div>
  <div class="carte">
    ${QUESTIONS_PERIMETRE.map(([cle,q,type,aide])=>
      champTexte("camp",cle,c[cle],q,aide,"",type==="zone")).join("")}
    <div class="grille g2">
      ${champTexte("campn","passe",c.passe,"Tour d'exploration actuel","","",false)}
      ${champChoix("camp","contreExploration",c.contreExploration,"Une vérification indépendante a-t-elle été réalisée ?",
        [[false,"Pas encore"],[true,"Oui, un second regard a été mené"]],
        "Second regard destiné à rechercher ce qui aurait pu être manqué.")}
    </div>
  </div>

  <div class="bloc"><h2>Services et unités concernés</h2>
  <div class="sub">Les services prioritaires alimentent la grille des types de données à vérifier.</div>
  <div class="carte">
    ${c.unites.length?`<table class="donnees cartes"><tbody>
      ${c.unites.map(u=>`<tr>
        <td data-l="Nom"><input type="text" data-unite="${u.id}|nom" value="${esc(u.nom)}" aria-label="Nom du service"></td>
        <td data-l="Priorité"><select data-unite="${u.id}|prio" aria-label="Priorité">
          <option value="true" ${u.prio?"selected":""}>Service prioritaire</option>
          <option value="false" ${!u.prio?"selected":""}>Service secondaire</option></select></td>
        <td data-l="État"><select data-unite="${u.id}|etat" aria-label="État de l'exploration">
          <option value="PREVUE" ${u.etat==="PREVUE"?"selected":""}>À explorer</option>
          <option value="EXPLOREE" ${u.etat==="EXPLOREE"?"selected":""}>Exploré</option>
          <option value="EXCLUE" ${u.etat==="EXCLUE"?"selected":""}>Hors périmètre</option></select></td>
        <td data-l=""><details class="menu"><summary aria-label="Autres actions">•••</summary><div class="menu-liste">
          <button class="danger" data-action="suppr-unite" data-id="${u.id}">Retirer ce service</button>
        </div></details></td></tr>`).join("")}
    </tbody></table>`:`<small>Aucun service déclaré pour le moment.</small>`}
    <div class="actions" style="margin-top:14px"><button class="btn sec petit" data-action="ajout-unite">Ajouter un service</button></div>
  </div></div>

  <div class="bloc"><h2>Systèmes et outils connus</h2>
  <div class="sub">Ce que l'organisation sait déjà posséder. Chaque entrée doit être examinée ou écartée.</div>
  <div class="carte">
    ${c.systemes.length?`<table class="donnees cartes"><tbody>
      ${c.systemes.map(s=>`<tr>
        <td data-l="Nom"><input type="text" data-systeme="${s.id}|nom" value="${esc(s.nom)}" aria-label="Nom du système"></td>
        <td data-l="État"><select data-systeme="${s.id}|etat" aria-label="État">
          <option value="A_REVOIR" ${s.etat==="A_REVOIR"?"selected":""}>À examiner</option>
          <option value="EXAMINE" ${s.etat==="EXAMINE"?"selected":""}>Examiné</option>
          <option value="EXCLU" ${s.etat==="EXCLU"?"selected":""}>Écarté</option>
          <option value="HORS_PERIMETRE" ${s.etat==="HORS_PERIMETRE"?"selected":""}>Hors périmètre</option></select></td>
        <td data-l=""><details class="menu"><summary aria-label="Autres actions">•••</summary><div class="menu-liste">
          <button class="danger" data-action="suppr-systeme" data-id="${s.id}">Retirer ce système</button>
        </div></details></td></tr>`).join("")}
    </tbody></table>`:`<small>Aucun système déclaré pour le moment.</small>`}
    <div class="actions" style="margin-top:14px"><button class="btn sec petit" data-action="ajout-systeme">Ajouter un système</button></div>
  </div></div>`;
}
function explCouverture(){
  const k=kpiEDR(), c=S.campagne;
  const carte=(lib,val,detail)=>`<div class="stat"><div class="l">${lib}</div>
    <div class="q">${pct(val)}</div><div class="v">${detail}</div>
    <div class="jauge"><i style="width:${borne(val)}%"></i></div></div>`;
  return `
  <h2>Couverture de l'exploration</h2>
  <div class="sub" style="margin:4px 0 16px;color:var(--gris);font-size:14px">
    Vérifiez que les parties importantes de l'organisation ont réellement été examinées.
    La couverture ne garantit jamais que toutes les données ont été trouvées.</div>
  <div class="grille g4">
    ${carte("Services prioritaires explorés",k.CO_p,
      c.unites.filter(u=>u.prio&&u.etat!=="PREVUE").length+" sur "+c.unites.filter(u=>u.prio).length)}
    ${carte("Systèmes connus vérifiés",k.CS,
      c.systemes.filter(s=>["EXAMINE","EXCLU"].includes(s.etat)).length+" sur "+c.systemes.filter(s=>s.etat!=="HORS_PERIMETRE").length)}
    ${carte("Types de données vérifiés",k.CF,(k.tot-k.nc)+" sur "+k.tot+" cases")}
    ${carte("Pistes traitées",k.decision,S.signaux.filter(s=>s.wf==="RESOLU").length+" sur "+S.signaux.length)}
  </div>
  ${avance("Voir les indicateurs détaillés",`<table>
    <tr><td>Personnes sollicitées ayant répondu</td><td>${pct(k.CC_p)}, ${c.contributeurs.repondu} sur ${c.contributeurs.sollicites}</td></tr>
    <tr><td>Rôles représentés</td><td>${pct(k.CC_r)}, ${c.contributeurs.rolesCouverts} sur ${c.contributeurs.rolesAttendus}</td></tr>
    <tr><td>Nouveaux actifs découverts</td><td>${pct(k.novelty)} des actifs cotés n'étaient pas recensés</td></tr>
    <tr><td>Actifs confirmés par plusieurs sources</td><td>${pct(k.croise)}</td></tr>
    <tr><td>Nouveautés trouvées au dernier tour</td><td>${pct(k.RM)}</td></tr>
    <tr><td>Personnes sollicitées</td><td>${champNombreLigne("contrib","sollicites",c.contributeurs.sollicites)}</td></tr>
    <tr><td>Personnes ayant répondu</td><td>${champNombreLigne("contrib","repondu",c.contributeurs.repondu)}</td></tr>
    <tr><td>Rôles attendus</td><td>${champNombreLigne("contrib","rolesAttendus",c.contributeurs.rolesAttendus)}</td></tr>
    <tr><td>Rôles couverts</td><td>${champNombreLigne("contrib","rolesCouverts",c.contributeurs.rolesCouverts)}</td></tr>
    <tr><td>Indicateurs internes</td><td>CO ${f0(k.CO_p)} %, CS ${f0(k.CS)} %, CF ${f0(k.CF)} %, RM ${f0(k.RM)} %,
      statut de couverture ${k.statut.toLowerCase()}</td></tr>
  </table>`)}

  <div class="bloc"><h2>Types de données à vérifier</h2>
  <div class="sub">Vérifiez chaque famille importante dans les services prioritaires.
    Cliquez sur une case pour choisir son état.</div>
  <div class="carte scroll">${grilleCouverture()}</div>
  <div class="tag" style="margin-top:12px">${k.id} trouvées, ${k.ab} absentes, ${k.na} non applicables,
    ${k.nc} encore à vérifier dont ${k.critNC} sur des familles critiques</div>
  </div>`;
}
function champNombreLigne(attr,cle,val){
  return `<input type="text" data-${attr}="${cle}" value="${esc(val)}" style="max-width:120px;min-height:38px"
    aria-label="${esc(cle)}">`;
}
function grilleCouverture(){
  const zones=S.campagne.unites.filter(u=>u.prio);
  if(!zones.length) return `<small>Déclarez au moins un service prioritaire pour construire cette grille.</small>`;
  return `<table class="couv"><thead><tr><th style="min-width:200px">Famille de données</th>
    ${zones.map(z=>`<th>${esc(z.nom)}</th>`).join("")}</tr></thead><tbody>
    ${FAMILLES.map((f,i)=>`<tr><th style="color:var(--encre);font-weight:400">${esc(f)}${
      FAM_CRIT.has(f)?' <span class="tag">à ne pas manquer</span>':''}</th>
      ${zones.map(z=>{const cle=z.id+"|"+i; const v=S.campagne.cellules[cle]||"NC";
        return `<td><details class="cellule e-${v}"><summary>${ETATS_CASE[v]}</summary>
          <div class="choix">${CELL_ETATS.map(e=>
            `<button data-case="${cle}|${e}">${ETATS_CASE[e]}</button>`).join("")}</div></details></td>`;}).join("")}
    </tr>`).join("")}</tbody></table>`;
}
function explPistes(){
  if(S.nav.fiche==="piste" && pisteCourante()) return fichePiste();
  const f=S.nav.listePistes;
  const jeux={ouvertes:S.signaux.filter(s=>s.wf!=="RESOLU"),
              rattachees:S.signaux.filter(s=>s.res==="CONFIRME"||s.res==="FUSIONNE"),
              classees:S.signaux.filter(s=>s.res==="ECARTE")};
  const liste=jeux[f]||[];
  return `
  <h2>Pistes à vérifier</h2>
  <div class="sub" style="margin:4px 0 16px;color:var(--gris);font-size:14px">
    Éléments repérés qui pourraient correspondre à des actifs de données.
    Ils doivent être vérifiés avant d'entrer dans l'inventaire.</div>
  <div class="actions" style="margin-bottom:16px">
    <button class="btn" data-action="ouvrir-ajout-piste">Ajouter une piste</button></div>
  ${S.nav.ajoutPiste?formulairePiste():""}
  ${onglets("listePistes",[["ouvertes","À vérifier",jeux.ouvertes.length],
    ["rattachees","Rattachées",jeux.rattachees.length],
    ["classees","Classées sans suite",jeux.classees.length]],f)}
  ${liste.length?`<div class="carte"><ul class="liste">${liste.map(s=>`<li>
      <span class="principal"><b>${esc(s.nom)}</b>
        <small>${esc((S.campagne.unites.find(u=>u.id===s.zone)||{}).nom||"Service non précisé")},
          signalée par ${esc(s.auteur)}, ${esc(ORIGINES[s.canal]||"origine non précisée")}</small></span>
      <span class="actions">${
        s.wf!=="RESOLU"
          ? `<button class="btn petit" data-action="ouvrir-piste" data-id="${s.id}">Examiner</button>`
          : s.res==="ECARTE"
            ? statPastille("gris","Classée sans suite")
            : `${statPastille("teal",s.res==="CONFIRME"?"Actif créé":"Rattachée")}
               <button class="btn petit sec" data-action="ouvrir-actif" data-id="${s.gis}">Ouvrir l'actif</button>`
      }</span></li>`).join("")}</ul></div>`
    :etatVide(
      f==="ouvertes"?"Aucune piste à vérifier":f==="rattachees"?"Aucune piste rattachée":"Aucune piste classée sans suite",
      "Les éléments repérés pendant l'exploration apparaîtront ici.",
      `<button class="btn" data-action="ouvrir-ajout-piste">Ajouter une piste</button>`)}`;
}
function formulairePiste(){
  return `<div class="carte" style="margin-bottom:18px"><h3>Ajouter une piste</h3>
    <div style="margin-top:14px">
    ${champTexte("neuf","piste-quoi","","Qu'avez-vous repéré ?","Un nom provisoire suffit.","",false)}
    ${champChoix("neuf","piste-ou","","Où ?",S.campagne.unites.map(u=>[u.id,u.nom]))}
    ${champChoix("neuf","piste-comment","","Comment l'avez-vous repéré ?",Object.entries(ORIGINES))}
    ${champTexte("neuf","piste-qui","","Qui l'a signalé ?","Fonction de la personne.","",false)}
    ${champChoix("neuf","piste-pourquoi","","Pourquoi faut-il l'examiner ?",RAISONS)}
    </div>
    <div class="actions"><button class="btn" data-action="add-piste">Ajouter la piste</button>
      <button class="btn neutre" data-action="fermer-ajout-piste">Annuler</button></div></div>`;
}
function fichePiste(){
  const s=pisteCourante();
  return `<button class="retour" data-action="fermer-piste">← Pistes à vérifier</button>
  <div class="tete"><div class="t"><h1>${esc(s.nom)}</h1></div></div>
  <div class="carte"><table class="donnees"><tbody>
    <tr><td style="color:var(--gris);width:34%">Repérée dans</td>
      <td>${esc((S.campagne.unites.find(u=>u.id===s.zone)||{}).nom||"Service non précisé")}</td></tr>
    <tr><td style="color:var(--gris)">Signalée par</td><td>${esc(s.auteur)}</td></tr>
    <tr><td style="color:var(--gris)">Origine</td><td>${esc(ORIGINES[s.canal]||"non précisée")}</td></tr>
    <tr><td style="color:var(--gris)">Raison</td><td>${esc(s.motif)}</td></tr>
  </tbody></table></div>

  <div class="bloc"><h2>Que représente cette piste ?</h2>
  <div class="carte">
    <div style="margin-bottom:18px">
      <button class="btn" data-action="piste-nouvel-actif" data-id="${s.id}">Créer un nouvel actif</button>
      <div class="aide" style="margin-top:8px">Cette piste correspond à des données qui ne sont pas encore recensées.</div>
    </div>
    ${S.gisements.length?`<div style="margin-bottom:6px">
      <div class="question"><label for="rattach">Rattacher à un actif existant</label>
        <div class="aide">Cette piste décrit des données déjà présentes dans l'inventaire.</div>
        <select id="rattach">${S.gisements.map(g=>`<option value="${g.id}">${esc(g.nom)}</option>`).join("")}</select></div>
      <button class="btn sec" data-action="piste-rattacher" data-id="${s.id}">Rattacher</button></div>`:""}
    <details class="menu" style="margin-top:18px"><summary aria-label="Autres actions">•••</summary>
      <div class="menu-liste"><button class="danger" data-action="piste-classer" data-id="${s.id}">Classer sans suite</button></div>
    </details>
  </div></div>`;
}
function explTerminer(){
  const cond=conditionsCloture();
  const ok=cond.filter(c=>c.ok).length;
  if(S.campagne.terminee) return `<h2>Exploration terminée</h2>
    <div class="carte" style="margin-top:14px"><div class="suite succes"><div class="txt">
      <b>L'exploration est déclarée terminée</b>
      <small>Vous pouvez la rouvrir si de nouvelles pistes apparaissent.</small></div>
      <button class="btn petit neutre" data-action="rouvrir-exploration">Rouvrir l'exploration</button></div></div>`;
  return `
  <h2>Terminer l'exploration</h2>
  <div class="sub" style="margin:4px 0 16px;color:var(--gris);font-size:14px">
    ${ok} condition${ok>1?"s":""} sur ${cond.length} ${ok>1?"sont remplies":"est remplie"}.
    Terminer reste une décision humaine, elle est enregistrée dans l'historique.</div>
  <div class="carte"><ul class="liste">${cond.map(c=>`<li>
    <span class="principal"><b>${c.ok?"✓ ":"○ "}${esc(c.t)}</b></span>
    ${!c.ok&&c.go?`<button class="btn petit sec" data-aller='${esc(JSON.stringify(c.go))}'>Voir</button>`:""}
    </li>`).join("")}</ul></div>
  <div class="actions" style="margin-top:18px">
    <button class="btn" data-action="terminer-exploration" ${cond.every(c=>c.ok)?"":"disabled"}>Terminer l'exploration</button>
    ${cond.every(c=>c.ok)?"":`<span class="tag">${cond.length-ok} élément${cond.length-ok>1?"s":""} reste${cond.length-ok>1?"nt":""} à traiter</span>`}
  </div>`;
}

/* ==========================================================================
   7. ACTIFS DE DONNÉES
   ========================================================================== */
function vueActifs(){
  if(!S.gisements.length) return `
    <div class="tete"><div class="t"><h1>Actifs de données</h1>
      <p>Ensembles de données identifiés dans l'organisation.</p></div></div>
    ${etatVide("Aucun actif de données recensé",
      "Commencez par vérifier une piste ou ajoutez directement un actif connu.",
      `<button class="btn sec" data-aller='{"section":"explorer","explorer":"pistes"}'>Voir les pistes</button>
       <button class="btn" data-action="creer-actif">Ajouter un actif</button>`)}`;
  const g=actifCourant();
  const rech=(S.nav.recherche||"").toLowerCase();
  const liste=S.gisements.filter(x=>!rech||x.nom.toLowerCase().includes(rech)||x.famille.toLowerCase().includes(rech));
  const r=calcGisement(g);
  const st=STATUT_ACTIF[r.statut]||{label:r.statut,ton:"gris"};
  const corps={apercu:actifApercu,description:actifDescription,sources:actifSources,
               usage:actifUsage,cas:actifCas}[S.nav.actif]||actifApercu;
  return `
  <div class="tete"><div class="t"><h1>Actifs de données</h1>
    <p>Ensembles de données identifiés dans l'organisation.</p></div>
    <button class="btn" data-action="creer-actif">Ajouter un actif</button></div>
  <div class="md">
    <div class="colonne">
      <input type="text" class="rech" id="rechActifs" placeholder="Rechercher" aria-label="Rechercher un actif"
        value="${esc(S.nav.recherche||"")}" data-recherche="1">
      ${liste.map(x=>`<button class="item" aria-current="${x.id===g.id}" data-action="ouvrir-actif" data-id="${x.id}">
        ${esc(x.nom)}<small>${esc(x.famille)}, ${usagesDe(x.id).length} cas d'usage</small></button>`).join("")
        ||`<div style="padding:12px"><small>Aucun résultat.</small></div>`}
    </div>
    <div>
      <div class="carte" style="margin-bottom:14px">
        <div class="actions" style="justify-content:space-between">
          <div><h2>${esc(g.nom)}</h2>
            <div class="tag">${statPastille(st.ton,st.label)}</div></div>
          <details class="menu"><summary aria-label="Autres actions">•••</summary><div class="menu-liste">
            <button data-action="exporter-fiche-actif" data-id="${g.id}">Exporter la description</button>
            <hr><button class="danger" data-action="suppr-actif" data-id="${g.id}">Archiver cet actif</button>
          </div></details>
        </div>
      </div>
      ${onglets("actif",[["apercu","Aperçu"],["description","Description"],["sources","Sources"],
        ["usage","Usage actuel"],["cas","Cas d'usage",usagesDe(g.id).length||null]],S.nav.actif)}
      ${corps(g,r)}
    </div>
  </div>`;
}
function actifApercu(g,r){
  const usages=usagesDe(g.id);
  const ligne=(l,v)=>`<tr><td style="color:var(--gris);width:38%">${l}</td><td>${esc(v)||'<span class="tag">à compléter</span>'}</td></tr>`;
  return `<div class="carte"><table class="donnees"><tbody>
    ${ligne("Responsable métier",g.rmetier)}
    ${ligne("Responsable technique",g.rtech)}
    ${ligne("Personnes ou activités concernées",g.population)}
    ${ligne("Période et rythme",g.periode)}
    ${ligne("Forme des données",g.modalites)}
    ${ligne("Sensibilité",g.sensibilite)}
    <tr><td style="color:var(--gris)">Usage actuel de l'actif</td>
      <td>${direUsage(r.Ug)}<span class="tag">, ${f1(r.Ug)} sur 100</span></td></tr>
    <tr><td style="color:var(--gris)">Cas d'usage rattachés</td><td>${usages.length}</td></tr>
  </tbody></table>
  ${!usages.length?`<div class="actions" style="margin-top:16px">
    <button class="btn" data-action="creer-usage-pour" data-id="${g.id}">Créer un cas d'usage</button></div>`:""}
  ${avance("Méthode et traçabilité",`<table>
    <tr><td>Identifiant interne</td><td>${g.id}</td></tr>
    <tr><td>Famille méthodologique</td><td>${esc(g.famille)}</td></tr>
    <tr><td>Profil d'usage Ug</td><td>${f1(r.Ug)} sur 100, complétude ${f0(r.K_UG)} %</td></tr>
    <tr><td>Potentiel stratégique S<sub>g</sub></td><td>${f1(r.Sg)}, fiabilité ${f0(r.Confg)} %</td></tr>
    <tr><td>Composantes</td><td>L* ${f1(r.Lstar)}, Pat ${f1(r.Pat)}, Lev ${f1(r.Lev)}, Div ${f1(r.Div)}</td></tr>
    <tr><td>Recensé avant l'exploration</td><td>${g.prealable==="OUI"?"oui":g.prealable==="NON"?"non":"inconnu"}</td></tr>
  </table>`)}</div>`;
}
function actifDescription(g){
  const champs=QUESTIONS_ACTIF.filter(q=>!["sources","producteur","rmetier","rtech"].includes(q[0]));
  return `<div class="carte">
    ${champs.map(([cle,q,code,aide])=>champTexte("gis",g.id+"|"+cle,g[cle],q,aide,code,cle==="definition"))
      .join("")}
    <div class="grille g2">
      ${champChoix("gis",g.id+"|famille",g.famille,"À quelle famille appartiennent ces données ?",
        FAMILLES.concat(["À qualifier"]))}
      ${champChoix("gis",g.id+"|zone",g.zone,"Quel service en est le plus proche ?",
        S.campagne.unites.map(u=>[u.id,u.nom]))}
      ${champChoix("gis",g.id+"|prealable",g.prealable,"Ces données étaient-elles déjà recensées ?",
        [["NON","Non, découvertes pendant l'exploration"],["OUI","Oui, déjà inventoriées"],["INCONNU","Inconnu"]])}
      ${champChoix("gis",g.id+"|gouvernance",g.gouvernance,"Un interlocuteur est-il identifié ?",
        [["A_IDENTIFIER","Pas encore"],["IDENTIFIE","Oui, un responsable est identifié"]])}
    </div></div>`;
}
function actifSources(g){
  const pistes=S.signaux.filter(s=>s.gis===g.id);
  return `<div class="carte">
    ${champTexte("gis",g.id+"|sources",g.sources,"D'où viennent les données ?","","D06",false)}
    ${champTexte("gis",g.id+"|producteur",g.producteur,"Qui produit ces données ?","","D07",false)}
    ${champTexte("gis",g.id+"|rmetier",g.rmetier,"Qui en est responsable côté métier ?","","D08",false)}
    ${champTexte("gis",g.id+"|rtech",g.rtech,"Qui peut répondre sur leur stockage ou leur fonctionnement technique ?","","D09",false)}
  </div>
  <div class="carte"><h3>Comment cet actif a été repéré</h3>
    ${pistes.length?`<ul class="liste" style="margin-top:8px">${pistes.map(s=>`<li>
      <span class="principal"><b>${esc(s.nom)}</b>
        <small>${esc(s.auteur)}, ${esc(ORIGINES[s.canal]||"")}</small></span>
      ${statPastille("gris",s.res==="CONFIRME"?"Piste d'origine":"Piste rattachée")}</li>`).join("")}</ul>`
      :`<small style="display:block;margin-top:8px">Cet actif a été saisi directement, sans passer par une piste.</small>`}
  </div>`;
}
function actifUsage(g,r){
  return `<div class="carte">
    <h3>Usage actuel de l'actif</h3>
    <div class="aide" style="margin:4px 0 4px">Dans quelle mesure cet actif est-il déjà utilisé dans l'organisation ?</div>
    <div class="stat" style="border:0;padding:14px 0">
      <div class="q">${direUsage(r.Ug)}</div>
      <div class="v"><b>${f1(r.Ug)}</b> sur 100, ${f0(r.K_UG)} % des questions renseignées</div>
      <div class="jauge lime"><i style="width:${borne(r.Ug)}%"></i></div></div>
    ${Object.keys(g.ug).map(id=>{const rep=g.ug[id];
      return `<div class="critere">
        <div class="intitule">${esc(LIB[id])}</div>
        <div class="demande">${esc(QUESTION[id]||"")}</div>
        <div class="paire">
          <div>${selecteurNiveau("ug|"+g.id+"|"+id,rep.v)}
            ${repereNiveau(id,rep.v)}</div>
          <div>${selecteurPreuve("ug|"+g.id+"|"+id,rep.e)}
            ${alerteEtayage(rep.v,rep.e)}</div>
        </div></div>`;}).join("")}
    ${avance("Méthode et traçabilité",`<table>
      <tr><td>Bloc</td><td>Profil d'usage patrimonial UG01 à UG05</td></tr>
      <tr><td>Valeur patrimoniale V09 retenue</td><td>${g.V09} sur 4, élément ${PREUVES[g.V09preuve||0].label.toLowerCase()}</td></tr>
      <tr><td>Usage général Ug</td><td>${f1(r.Ug)} sur 100</td></tr></table>
      <div class="grille g2" style="margin-top:12px">
      ${champChoix("gisn",g.id+"|V09",g.V09,"Rareté ou caractère irremplaçable de ces données",[0,1,2,3,4])}
      ${champChoix("gisn",g.id+"|V09preuve",g.V09preuve,"Élément sur lequel repose cette appréciation",
        PREUVES.map((p,i)=>[i,p.label]))}</div>`)}
  </div>`;
}
function actifCas(g){
  const usages=usagesDe(g.id);
  const idees=S.suggestions.filter(s=>s.gis===g.id);
  if(!usages.length&&!idees.length) return etatVide("Aucun cas d'usage",
    "Associez un usage concret à cet actif de données.",
    `<button class="btn" data-action="creer-usage-pour" data-id="${g.id}">Créer un cas d'usage</button>`);
  return `${usages.length?`<div class="carte"><ul class="liste">${usages.map(sc=>{
      const r=calcScenario(sc); const st=STATUTS[r.P];
      return `<li><span class="principal"><b>${esc(sc.titre)}</b>
        <small>${statPastille(st.ton,st.label)}</small></span>
        <button class="btn petit sec" data-action="ouvrir-usage" data-id="${sc.id}">Ouvrir</button></li>`;}).join("")}
    </ul></div>`:""}
    ${idees.length?`<div class="bloc"><h3>Idées proposées</h3>
      <div class="sub">Usages possibles proposés à partir de la description de cet actif.
        Ils ne sont pas évalués tant que vous ne les retenez pas.</div>
      ${idees.map(carteIdee).join("")}</div>`:""}
    <div class="actions" style="margin-top:16px">
      <button class="btn" data-action="creer-usage-pour" data-id="${g.id}">Créer un cas d'usage</button></div>`;
}

/* ==========================================================================
   8. CAS D'USAGE
   ========================================================================== */
function carteIdee(s){
  const g=S.gisements.find(x=>x.id===s.gis);
  return `<div class="carte"><h3>${esc(s.titre)}</h3>
    <table class="donnees" style="margin-top:10px"><tbody>
      <tr><td style="color:var(--gris);width:30%">Actif</td><td>${g?esc(g.nom):""}</td></tr>
      <tr><td style="color:var(--gris)">Pourquoi cette idée</td><td>${esc(s.hypotheses)}</td></tr>
      <tr><td style="color:var(--gris)">Ce que l'on sait encore mal</td><td>${esc(s.inconnues)}</td></tr>
      <tr><td style="color:var(--gris)">Façon de faire actuelle</td><td>${esc(s.baseline)}</td></tr>
    </tbody></table>
    <div class="actions" style="margin-top:14px">
      <button class="btn" data-action="retenir-idee" data-id="${s.id}">Créer ce cas d'usage</button>
      <details class="menu"><summary aria-label="Autres actions">•••</summary><div class="menu-liste">
        <button class="danger" data-action="ignorer-idee" data-id="${s.id}">Ignorer cette suggestion</button>
      </div></details></div></div>`;
}
function vueUsages(){
  if(S.nav.fiche==="creation") return formulaireUsage();
  const sc=(S.nav.fiche&&S.nav.fiche!=="creation")?S.scenarios.find(x=>x.id===S.nav.fiche):null;
  if(S.nav.fiche&&S.nav.fiche!=="creation"&&!sc) S.nav.fiche=null;
  if(sc) return ficheUsage(sc);
  const tous=S.scenarios;
  const aCompleter=tous.filter(s=>calcScenario(s).P==="P4");
  const f=S.nav.listeUsages;
  const entete=`<div class="tete"><div class="t"><h1>Cas d'usage</h1>
    <p>Usages concrets que vous envisagez à partir de vos actifs de données.</p></div>
    ${S.gisements.length?`<button class="btn" data-action="ouvrir-creation-usage">Créer un cas d'usage</button>`:""}</div>
    ${onglets("listeUsages",[["tous","Tous",tous.length],["idees","Idées proposées",S.suggestions.length],
      ["completer","À compléter",aCompleter.length]],f)}`;
  if(f==="idees") return entete+(S.suggestions.length?S.suggestions.map(carteIdee).join("")
    :etatVide("Aucune idée proposée","Les idées apparaissent lorsque la description d'un actif est suffisamment renseignée.",""));
  const liste=f==="completer"?aCompleter:tous;
  if(!liste.length) return entete+etatVide("Aucun cas d'usage",
    "Associez un usage concret à l'un de vos actifs de données.",
    S.gisements.length?`<button class="btn" data-action="ouvrir-creation-usage">Créer un cas d'usage</button>`
      :`<button class="btn" data-aller='{"section":"explorer","explorer":"pistes"}'>Voir les pistes</button>`);
  return entete+`<div class="carte"><table class="donnees cartes"><thead><tr>
    <th>Cas d'usage</th><th>Actif</th><th>Potentiel inexploité</th><th>Mise en œuvre</th><th>Statut</th><th></th>
    </tr></thead><tbody>${liste.map(sc=>{
      const r=calcScenario(sc), g=S.gisements.find(x=>x.id===sc.gis), st=STATUTS[r.P];
      return `<tr><td data-l="Cas d'usage">${esc(sc.titre)}</td>
        <td data-l="Actif">${g?esc(g.nom):""}</td>
        <td data-l="Potentiel inexploité">${direPotentiel(r.L.dec)}</td>
        <td data-l="Mise en œuvre">${direCapacite(r.A.dec)}</td>
        <td data-l="Statut">${statPastille(st.ton,st.label)}</td>
        <td data-l=""><button class="btn petit sec" data-action="ouvrir-usage" data-id="${sc.id}">Ouvrir</button></td></tr>`;
    }).join("")}</tbody></table></div>`;
}
function formulaireUsage(){
  const n=S.nav.brouillon||{};
  return `<button class="retour" data-action="fermer-fiche">← Cas d'usage</button>
  <div class="tete"><div class="t"><h1>Créer un cas d'usage</h1>
    <p>Décrivez l'usage envisagé. L'évaluation viendra ensuite.</p></div></div>
  <div class="carte">
    ${champChoix("brouillon","gis",n.gis||"","Quel actif souhaitez-vous utiliser ?",
      S.gisements.map(g=>[g.id,g.nom]))}
    ${QUESTIONS_USAGE.map(([cle,q,aide])=>champTexte("brouillon",cle,n[cle]||"",q,aide,"",
      ["decision","resultat"].includes(cle))).join("")}
  </div>
  <div class="actions collant" style="margin-top:16px">
    <button class="btn" data-action="creer-usage">Créer le cas d'usage</button>
    <button class="btn neutre" data-action="fermer-fiche">Annuler</button></div>`;
}
function ficheUsage(sc){
  const g=S.gisements.find(x=>x.id===sc.gis); const r=calcScenario(sc); const st=STATUTS[r.P];
  const corps={apercu:usageApercu,evaluation:usageEvaluation,resultat:usageResultat,
               historique:usageHistorique}[S.nav.usage]||usageApercu;
  return `<button class="retour" data-action="fermer-fiche">← Cas d'usage</button>
  <div class="tete"><div class="t"><h1>${esc(sc.titre)}</h1>
    <p>${g?esc(g.nom):""}</p>
    <div style="margin-top:8px">${statPastille(st.ton,st.label)}</div></div>
    <details class="menu"><summary aria-label="Autres actions">•••</summary><div class="menu-liste">
      <button data-action="exporter-dossier" data-id="${sc.id}">Exporter ce cas d'usage</button>
      <hr><button class="danger" data-action="suppr-usage" data-id="${sc.id}">Archiver ce cas d'usage</button>
    </div></details></div>
  ${onglets("usage",[["apercu","Aperçu"],["evaluation","Évaluation"],["resultat","Résultat"],
    ["historique","Historique"]],S.nav.usage)}
  ${corps(sc,r,g)}`;
}
function usageApercu(sc,r,g){
  return `<div class="carte">
    ${champTexte("scn",sc.id+"|titre",sc.titre,"Quel problème voulez-vous résoudre ?","","",false)}
    ${champTexte("scn",sc.id+"|finalite",sc.finalite,"Quelle finalité poursuivez-vous ?","","",true)}
    ${champTexte("scn",sc.id+"|beneficiaire",sc.beneficiaire,"Qui bénéficiera du résultat ?","","",false)}
    ${champTexte("scn",sc.id+"|decision",sc.decision,"Quelle décision ou action sera améliorée ?","","",true)}
    ${champTexte("scn",sc.id+"|resultat",sc.resultat,"Quel résultat concret attendez-vous ?","","",true)}
    ${champTexte("scn",sc.id+"|population",sc.population,"Sur quelle population ?","","",false)}
    ${champTexte("scn",sc.id+"|horizon",sc.horizon,"À quel horizon souhaitez-vous tester cet usage ?","","",false)}
    ${champChoix("scn",sc.id+"|cIA",sc.cIA,"Une composante d'intelligence artificielle est-elle envisagée ?",
      [[false,"Non"],[true,"Oui, évaluer aussi la pertinence pour l'IA"]])}
  </div>
  <div class="actions" style="margin-top:16px">
    <button class="btn" data-aller='${esc(JSON.stringify({section:"usages",fiche:sc.id,usage:"evaluation"}))}'>
      ${r.K_dec>0?"Continuer l'évaluation":"Commencer l'évaluation"}</button></div>`;
}
function etatDimension(sc,cle){
  const compte=(rep,ids)=>{
    let total=0,faits=0;
    ids.forEach(id=>{const a=rep[id]; if(!a) {total++;return;} if(a.v==="NA") return; total++; if(a.v!=="ND") faits++;});
    return [faits,total];
  };
  if(cle==="U") return compte(sc.u,Object.keys(W.U));
  if(cle==="V") return compte(sc.v,[...Object.keys(W.Vv),...Object.keys(W.Vc)]);
  if(cle==="A") return compte(sc.A,Object.keys(W.A));
  if(cle==="C") return compte(sc.c,Object.keys(W.C));
  return compte(sc.ia,Object.keys(W.IA));
}
function usageEvaluation(sc,r){
  const dims=DIMENSIONS.filter(d=>d.cle!=="IA"||sc.cIA);
  const dimCourante=dims.find(d=>d.cle===S.nav.dim)||dims[0];
  const etat=d=>{
    if(d.cle==="C"){ const n=r.C.ecarts.filter(e=>e.gap>0).length;
      return n?n+(n>1?" points à traiter":" point à traiter"):"Aucun point ouvert"; }
    const [f,t]=etatDimension(sc,d.cle);
    return t===0?"Sans objet":f===t?"Terminé":f+" sur "+t+" renseignés";
  };
  return `<div class="carte" style="margin-bottom:16px">
    <h3>Évaluation</h3>
    <div class="aide" style="margin:4px 0 12px">Évaluez la situation actuelle.
      Data Finder calcule ensuite ce qui reste réellement à exploiter.</div>
    <ul class="progression">${dims.map(d=>`<li>
      <button data-onglet="dim|${d.cle}"><b>${esc(d.titre)}</b></button>
      <span class="tag">${esc(etat(d))}</span></li>`).join("")}</ul></div>

  <div class="carte">
    <h3>${esc(dimCourante.titre)}</h3>
    <div class="aide" style="margin:4px 0 6px">${esc(dimCourante.question)}</div>
    ${dimCourante.cle==="C"?blocPrerequis(sc):dimCourante.cle==="U"?blocUsage(sc):blocSimple(sc,dimCourante.cle)}
  </div>
  <div class="actions collant" style="margin-top:16px">
    <button class="btn" data-aller='${esc(JSON.stringify({section:"usages",fiche:sc.id,usage:"resultat"}))}'>Voir le résultat</button>
  </div>`;
}
function blocSimple(sc,bloc){
  const src = bloc==="V"?sc.v:bloc==="A"?sc.A:sc.ia;
  const ids = bloc==="V"?[...Object.keys(W.Vv),...Object.keys(W.Vc)]:Object.keys(bloc==="A"?W.A:W.IA);
  return ids.map(id=>{const a0=src[id]||(src[id]={v:"ND",e:0});
    return `<div class="critere">
      <div class="intitule">${esc(LIB[id])}</div>
      <div class="demande">${esc(QUESTION[id]||"")}</div>
      <div class="paire">
        <div>${selecteurNiveau("ev|"+bloc+"|"+id,a0.v)}${repereNiveau(id,a0.v)}</div>
        <div>${selecteurPreuve("ev|"+bloc+"|"+id,a0.e)}${alerteEtayage(a0.v,a0.e)}</div>
      </div>
      ${avance("Méthode et traçabilité",`<table><tr><td>Code question</td><td>${id}</td></tr>
        <tr><td>Poids dans l'axe</td><td>${(bloc==="V"?{...W.Vv,...W.Vc}:bloc==="A"?W.A:W.IA)[id]} %</td></tr></table>`)}
    </div>`;}).join("");
}
function blocUsage(sc){
  return Object.keys(W.U).map(id=>{const a0=sc.u[id]||(sc.u[id]={v:"ND",e:0,d:null,o:null});
    const contra=num(a0.d)&&num(a0.o)&&Math.abs(a0.d-a0.o)>=2;
    return `<div class="critere">
      <div class="intitule">${esc(LIB[id])}</div>
      <div class="demande">${esc(QUESTION[id])}</div>
      <div class="paire">
        <div>${selecteurNiveau("ev|U|"+id,a0.v,"Votre évaluation")}${repereNiveau(id,a0.v)}</div>
        <div>${selecteurPreuve("ev|U|"+id,a0.e)}${alerteEtayage(a0.v,a0.e)}</div>
      </div>
      ${avance("Comparer ce qui est déclaré et ce qui est constaté",
        `<div class="paire">
          <div>${selecteurNiveau("evd|U|"+id,a0.d===null||a0.d===undefined?"ND":a0.d,"Usage déclaré par les équipes")}</div>
          <div>${selecteurNiveau("evo|U|"+id,a0.o===null||a0.o===undefined?"ND":a0.o,"Usage constaté sur pièces")}</div>
        </div>
        ${contra?`<div class="alerte"><b>Écart d'au moins deux niveaux entre le déclaré et le constaté.</b>
          Aucune moyenne n'est faite. L'écart est signalé et l'estimation prudente retient ${Math.max(a0.d,a0.o)}.</div>`:""}
        <table style="margin-top:10px"><tr><td>Code question</td><td>${id}</td></tr>
        <tr><td>Poids dans l'axe</td><td>${W.U[id]} %</td></tr></table>`)}
    </div>`;}).join("");
}
function blocPrerequis(sc){
  const cib=ciblesC(sc.profil);
  return `<div style="margin-bottom:20px">
    <div class="lab" style="font-weight:500;margin-bottom:4px">Quelles caractéristiques décrivent cet usage ?</div>
    <div class="aide">Elles déterminent automatiquement les niveaux requis. Elles ne sont pas une appréciation libre.</div>
    <div class="niveaux" style="margin-top:10px">${Object.entries(PROFILS_USAGE).map(([k,l])=>
      `<button type="button" role="checkbox" aria-checked="${sc.profil.includes(k)}"
        data-profil="${k}">${esc(l)}</button>`).join("")}</div></div>
  ${Object.keys(W.C).map(id=>{const a0=sc.c[id]||(sc.c[id]={v:"ND",e:0,I:null,P:null});
    const ecart=num(a0.v)?Math.max(0,cib[id]-a0.v):cib[id];
    return `<div class="critere">
      <div class="intitule">${esc(LIB[id])}</div>
      <div class="demande">${esc(QUESTION[id])}</div>
      <div class="paire">
        <div>${selecteurNiveau("ev|C|"+id,a0.v,"Niveau actuel")}${repereNiveau(id,a0.v,ECHELLE_C)}</div>
        <div>${selecteurPreuve("ev|C|"+id,a0.e)}${alerteEtayage(a0.v,a0.e)}</div>
      </div>
      <div class="requis">
        <div><span>Niveau actuel</span><b>${num(a0.v)?a0.v:"N/A"}</b></div>
        <div><span>Niveau requis</span><b>${cib[id]}</b><span class="cadenas">défini automatiquement</span></div>
        <div><span>Écart</span><b>${ecart}</b></div>
      </div>
      ${ecart>0?`<div class="aide" style="margin-top:8px">Une action est nécessaire pour atteindre le niveau requis.
        Elle doit porter un responsable, un élément de preuve et une autorité de validation.</div>`:""}
      ${avance("Méthode et traçabilité",`<table>
        <tr><td>Code question</td><td>${id}</td></tr>
        <tr><td>Éléments attendus</td><td>${esc(PREUVES_C[id]||"")}</td></tr>
        <tr><td>Poids dans l'axe</td><td>${W.C[id]} %</td></tr></table>
        <div class="paire" style="margin-top:10px">
        ${champChoix("ci",sc.id+"|"+id,num(a0.I)?a0.I:"ND","Gravité si le contrôle fait défaut",
          [["ND","À déterminer"],1,2,3,4])}
        ${champChoix("cp",sc.id+"|"+id,num(a0.P)?a0.P:"ND","Exposition au risque",
          [["ND","À déterminer"],1,2,3,4])}</div>`)}
    </div>`;}).join("")}`;
}
function usageResultat(sc,r,g){
  const st=STATUTS[r.P];
  const prerequis=r.C.ecarts.filter(e=>e.gap>0);
  const [renseigne,etaye]=[r.K_dec,r.Conf_dec];
  const phrase = r.P==="P0"
      ? "Un prérequis critique empêche d'aller plus loin pour le moment."
    : r.P==="P4"
      ? "Des informations importantes manquent encore pour décider."
    : prerequis.length
      ? "Cet usage présente un potentiel réel, mais "+prerequis.length+(prerequis.length>1?" prérequis doivent":" prérequis doit")+" encore être traité."
      : "Les conditions sont réunies pour passer à l'étape suivante.";
  return `
  <div class="heros">
    <div class="statut">${esc(st.label)}</div>
    <h2>${esc(sc.titre)}</h2>
    <p>${esc(phrase)}</p>
    <div class="actions" style="margin-top:16px">
      ${prerequis.length?`<button class="btn" data-aller='${esc(JSON.stringify({section:"usages",fiche:sc.id,usage:"evaluation",dim:"C"}))}'>Voir les prérequis</button>`
        :`<button class="btn" data-aller='{"section":"priorites"}'>Voir dans Priorités</button>`}
    </div>
  </div>

  <div class="grille g4" style="margin-top:16px">
    <div class="stat"><div class="l">Potentiel encore inexploité</div>
      <div class="q">${direPotentiel(r.L.dec)}</div><div class="v"><b>${f1(r.L.dec)}</b> sur 100</div>
      <div class="jauge lime"><i style="width:${borne(r.L.dec)}%"></i></div>
      <div class="v" style="margin-top:8px">Valeur potentielle qui n'est pas déjà captée par l'usage actuel.</div></div>
    <div class="stat"><div class="l">Capacité de mise en œuvre</div>
      <div class="q">${direCapacite(r.A.dec)}</div><div class="v"><b>${f1(r.A.dec)}</b> sur 100</div>
      <div class="jauge teal"><i style="width:${borne(r.A.dec)}%"></i></div></div>
    <div class="stat"><div class="l">Fiabilité de l'évaluation</div>
      <div class="q">${r.confLib==="Insuffisante"?"Insuffisante":r.confLib}</div>
      <div class="v"><b>${f0(renseigne)} %</b> renseigné, <b>${f0(etaye)} %</b> étayé</div></div>
    <div class="stat"><div class="l">Prérequis</div>
      <div class="q">${prerequis.length?prerequis.length+" à traiter":"Aucun en attente"}</div>
      <div class="v">${STATUT_PREREQUIS[r.C.statut].label}</div></div>
  </div>

  ${prerequis.length||r.A.regles.length?`<div class="bloc"><h2>Freins à lever</h2>
    <div class="carte"><ul class="liste">
    ${prerequis.map(e=>`<li><span class="principal"><b>${esc(LIB[e.id])}</b>
      <small>Niveau actuel ${e.actuel===null?"non renseigné":e.actuel}, niveau requis ${e.cible}</small></span>
      ${statPastille(e.critique?"encre":"hach",e.critique?"Critique":"Écart de "+e.gap)}</li>`).join("")}
    ${r.A.regles.map(t=>`<li><span class="principal"><b>${esc(t)}</b>
      <small>Limite de mise en œuvre</small></span>${statPastille("hach","À lever")}</li>`).join("")}
    </ul></div></div>`:""}

  ${r.IA?`<div class="bloc"><h2>Pertinence pour l'IA</h2><div class="carte">
    <div class="stat" style="border:0;padding:0"><div class="q">${direCapacite(r.IA.dec)}</div>
      <div class="v"><b>${f1(r.IA.dec)}</b> sur 100. Étape maximale envisageable : ${esc(r.IA.reco.toLowerCase())}.</div></div>
    ${r.IA.suspendu?`<div class="alerte" style="margin-top:12px"><b>Recommandation suspendue</b>
      Les prérequis doivent être traités avant toute conclusion sur la composante IA.</div>`:""}
    ${r.IA.regles.length?`<ul class="liste" style="margin-top:10px">${r.IA.regles.map(t=>
      `<li><span class="principal"><small>${esc(t)}</small></span></li>`).join("")}</ul>`:""}
  </div></div>`:""}

  <div class="bloc">${avance("Méthode et traçabilité",`
    <table>
      <tr><td>Usage actuel</td><td>estimation actuelle ${f1(r.U.obs)}, estimation prudente ${f1(r.U.pru)},
        valeur retenue ${f1(r.U.dec)}, bornes ${f1(r.U.bas)} et ${f1(r.U.haut)}</td></tr>
      <tr><td>Valeur potentielle</td><td>${f1(r.V.obs)}, ${f1(r.V.pru)}, retenue ${f1(r.V.dec)}</td></tr>
      <tr><td>Potentiel latent L</td><td>${f1(r.L.obs)}, ${f1(r.L.pru)}, retenue ${f1(r.L.dec)},
        fourchette ${f1(r.L.fourchette[0])} à ${f1(r.L.fourchette[1])}</td></tr>
      <tr><td>Activabilité A</td><td>${f1(r.A.obs)}, ${f1(r.A.pru)}, retenue ${f1(r.A.dec)}</td></tr>
      <tr><td>Complétude K et confiance</td><td>${f0(r.K_dec)} % et ${f0(r.Conf_dec)} %</td></tr>
      <tr><td>Scores d'opportunité</td><td>O<sub>V</sub> ${f1(r.O_V)}, O<sub>L</sub> ${f1(r.O_L)}, O<sub>Lc</sub> ${f1(r.O_Lc)}</td></tr>
      <tr><td>Bloc C</td><td>${C_LIB[r.C.statut]}${r.C.bloqueMotif?", "+esc(r.C.bloqueMotif):""},
        risque résiduel ${f1(r.C.R)}, indice d'écart ${f1(r.C.GapC)}</td></tr>
      <tr><td>Hypothèses conservatrices</td><td>${r.C.hypotheses.join(", ")||"aucune"}</td></tr>
      <tr><td>Contradictions déclaré et constaté</td><td>${r.U.contradictions.join(", ")||"aucune"}</td></tr>
      <tr><td>Plafonds déclenchés</td><td>${[r.V.plafond,...r.A.regles].filter(Boolean).map(esc).join("<br>")||"aucun"}</td></tr>
      <tr><td>Statut interne</td><td>${r.P}, ${P_LIB[r.P]}</td></tr>
      <tr><td>Référentiel</td><td>Qualification V1.2.2, spécification fonctionnelle V1.2.2</td></tr>
      <tr><td>Identifiants</td><td>${sc.id}, actif ${sc.gis}</td></tr>
    </table>
    <p style="margin-top:12px;color:var(--gris)">Aucun résultat ne vaut autorisation juridique, avis du délégué à la
      protection des données, validation de sécurité ou validation clinique. L'étape maximale recommandée est un pilote encadré.</p>`)}
  </div>`;
}
function usageHistorique(sc){
  const entrees=S.journal.filter(e=>e.o===sc.id);
  return `<div class="carte">
    ${entrees.length?`<ul class="chrono">${entrees.map(e=>`<li><div>${esc(e.l)}</div>
      <div class="quand">${dateCourte(e.t)}</div></li>`).join("")}</ul>`
      :`<small>Aucun événement enregistré pour ce cas d'usage.</small>`}
    ${avance("Identifiants et provenance",`<table>
      <tr><td>Identifiant</td><td>${sc.id}</td></tr>
      <tr><td>Actif rattaché</td><td>${sc.gis}</td></tr>
      <tr><td>Origine</td><td>${esc(sc.origine)}</td></tr></table>`)}</div>`;
}

/* ==========================================================================
   9. PRIORITÉS
   ========================================================================== */
function vuePriorites(){
  const t=S.nav.priorites;
  const entete=`<div class="tete"><div class="t"><h1>Priorités</h1>
    <p>Décidez quels cas d'usage avancer et quels actifs de données méritent un investissement.</p></div></div>
    ${onglets("priorites",[["usages","Cas d'usage"],["actifs","Actifs de données"],
      ["actions","Actions communes"]],t)}`;
  if(!S.scenarios.length&&t==="usages") return entete+etatVide("Pas encore assez d'éléments pour établir les priorités",
    "Créez un cas d'usage et évaluez-le pour le voir apparaître ici.",
    `<button class="btn" data-aller='{"section":"usages"}'>Voir ce qu'il reste à compléter</button>`);
  return entete+{usages:prioUsages,actifs:prioActifs,actions:prioActions}[t]();
}
function prioUsages(){
  const calc=S.scenarios.map(s=>({s,r:calcScenario(s)}));
  const groupes=ORDRE_STATUTS.map(p=>({p,items:calc.filter(x=>x.r.P===p).sort((a,b)=>b.r.O_Lc-a.r.O_Lc)}))
    .filter(g=>g.items.length);
  return groupes.map(gr=>`<div class="bloc">
    <h2>${esc(STATUTS[gr.p].label)} <span class="tag">${gr.items.length}</span></h2>
    <div class="sub">${esc(STATUTS[gr.p].action)}</div>
    ${gr.items.map(({s,r})=>{const g=S.gisements.find(x=>x.id===s.gis);
      return `<div class="carte"><div class="actions" style="justify-content:space-between;align-items:flex-start">
        <div style="min-width:0"><h3>${esc(s.titre)}</h3>
          <div class="tag">${g?esc(g.nom):""}</div>
          <table class="donnees" style="margin-top:10px;font-size:13.5px"><tbody>
            <tr><td style="color:var(--gris);padding:3px 12px 3px 0">Potentiel inexploité</td><td>${direPotentiel(r.L.dec)}</td></tr>
            <tr><td style="color:var(--gris);padding:3px 12px 3px 0">Mise en œuvre</td><td>${direCapacite(r.A.dec)}</td></tr>
            <tr><td style="color:var(--gris);padding:3px 12px 3px 0">Fiabilité</td><td>${r.confLib}</td></tr>
          </tbody></table></div>
        <button class="btn petit sec" data-action="ouvrir-usage" data-id="${s.id}">Ouvrir</button></div>
        ${avance("Afficher les indicateurs détaillés",`<table>
          <tr><td>Potentiel latent L retenu</td><td>${f1(r.L.dec)}</td></tr>
          <tr><td>Activabilité A retenue</td><td>${f1(r.A.dec)}</td></tr>
          <tr><td>Valeur potentielle V retenue</td><td>${f1(r.V.dec)}</td></tr>
          <tr><td>Score d'opportunité O<sub>Lc</sub></td><td>${f1(r.O_Lc)}</td></tr>
          <tr><td>Complétude et confiance</td><td>${f0(r.K_dec)} % et ${f0(r.Conf_dec)} %</td></tr>
          <tr><td>Statut interne</td><td>${r.P}</td></tr></table>`)}
      </div>`;}).join("")}</div>`).join("");
}
function prioActifs(){
  const gis=S.gisements.map(g=>({g,r:calcGisement(g)})).sort((a,b)=>b.r.Sg-a.r.Sg);
  if(!gis.length) return etatVide("Aucun actif de données recensé",
    "Vérifiez une piste ou ajoutez directement un actif connu.",
    `<button class="btn" data-aller='{"section":"actifs"}'>Voir les actifs</button>`);
  return `<h2>Actifs dans lesquels investir</h2>
  <div class="sub" style="margin:4px 0 14px;color:var(--gris);font-size:14px">
    Le potentiel stratégique agrège les cas d'usage d'un actif sans récompenser leur nombre.</div>
  ${gis.map(({g,r})=>{const st=STATUT_ACTIF[r.statut]||{label:r.statut,ton:"gris"};
    const actions=S.chantiers.filter(w=>w.leve.some(id=>usagesDe(g.id).some(s=>s.id===id))).length;
    return `<div class="carte">
      <div class="actions" style="justify-content:space-between;align-items:flex-start">
        <div><h3>${esc(g.nom)}</h3>
          <div style="margin:8px 0">${statPastille(st.ton,st.label)}</div>
          <div class="tag">${usagesDe(g.id).length} cas d'usage, ${r.nf} domaine${r.nf>1?"s":""} de valeur${
            actions?", "+actions+" action"+(actions>1?"s communes peuvent":" commune peut")+" en débloquer plusieurs":""}</div>
        </div>
        <button class="btn petit sec" data-action="ouvrir-actif" data-id="${g.id}">Ouvrir l'actif</button></div>
      ${avance("Afficher les indicateurs détaillés",`<table>
        <tr><td>Potentiel stratégique S<sub>g</sub></td><td>${f1(r.Sg)}</td></tr>
        <tr><td>Potentiel latent agrégé L*</td><td>${f1(r.Lstar)}</td></tr>
        <tr><td>Valeur patrimoniale</td><td>${f1(r.Pat)}</td></tr>
        <tr><td>Effet de levier</td><td>${f1(r.Lev)}</td></tr>
        <tr><td>Diversité des usages</td><td>${f1(r.Div)}</td></tr>
        <tr><td>Fiabilité</td><td>${f0(r.Confg)} %</td></tr>
        <tr><td>Usage actuel Ug</td><td>${f1(r.Ug)}</td></tr></table>`)}
    </div>`;}).join("")}`;
}
function prioActions(){
  if(!S.chantiers.length) return etatVide("Aucune action commune",
    "Les actions qui débloquent plusieurs cas d'usage apparaîtront ici.","");
  return `<h2>Actions qui débloquent plusieurs usages</h2>
  <div class="sub" style="margin:4px 0 14px;color:var(--gris);font-size:14px">
    Chaque relation entre une action, un frein levé et un cas d'usage est explicite.</div>
  ${S.chantiers.map(w=>{
    const concernes=S.scenarios.filter(s=>w.leve.includes(s.id));
    return `<div class="carte"><h3>${esc(w.titre)}</h3>
      <div class="tag" style="margin:8px 0 12px">Permet d'avancer ${concernes.length} cas d'usage</div>
      <table class="donnees"><tbody>
        <tr><td style="color:var(--gris);width:32%">Cas d'usage concernés</td>
          <td>${concernes.map(s=>esc(s.titre)).join("<br>")||"aucun"}</td></tr>
        <tr><td style="color:var(--gris)">Élément disponible</td><td>${PREUVES[w.preuve||0].label}</td></tr>
      </tbody></table></div>`;}).join("")}`;
}

/* ==========================================================================
   10. MÉTHODE ET FORMATION
   ========================================================================== */
function vueMethode(){
  return `<button class="retour" data-aller='{"section":"apercu"}'>← ${P.actif?"Vue d'ensemble":"Accueil"}</button>
  <div class="tete"><div class="t"><h1>Méthode et référentiel</h1>
    <p>Data Finder applique un référentiel de qualification. Le vocabulaire interne reste disponible ici.</p></div></div>
  <div class="carte"><h3>Documents de référence</h3>
    <table class="donnees" style="margin-top:10px"><tbody>
      <tr><td>Référentiel de qualification</td><td>V1.2.2 du 10 août 2026</td></tr>
      <tr><td>Procédure d'exploration structurée</td><td>V1.0, sans connecteur technique</td></tr>
      <tr><td>Spécification fonctionnelle et logique</td><td>V1.2.2 du 22 août 2026</td></tr>
      <tr><td>Modèle physique de données</td><td>V1.1.5</td></tr>
      <tr><td>Guide UX et langage produit</td><td>V1.0</td></tr>
    </tbody></table></div>
  <div class="carte"><h3>Correspondance des termes</h3>
    <div class="aide" style="margin:4px 0 10px">Les termes de gauche apparaissent dans les documents méthodologiques,
      ceux de droite dans l'interface.</div>
    <table class="donnees"><tbody>
      ${[["Campagne EDR","Exploration"],["Signal","Piste de données"],["Gisement","Actif de données"],
        ["Scénario","Cas d'usage"],["Q1","Identifier des cas d'usage"],["Q2","Évaluation"],
        ["U","Usage actuel"],["V","Valeur potentielle"],["L","Potentiel encore inexploité"],
        ["A","Capacité de mise en œuvre"],["C","Prérequis et risques"],["Aptitude IA","Pertinence pour l'IA"],
        ["Complétude K","Informations renseignées"],["Confiance","Fiabilité de l'évaluation"],
        ["Portefeuille","Priorités"],["Chantier commun","Action commune"]]
        .map(([a,b])=>`<tr><td style="color:var(--gris);width:40%">${a}</td><td>${b}</td></tr>`).join("")}
    </tbody></table></div>
  <div class="carte"><h3>Limites</h3>
    <p style="color:var(--gris);font-size:14px">Les poids, seuils et formules du référentiel sont des hypothèses de travail.
      Ils n'ont pas été calibrés sur données terrain. Un résultat ne vaut ni autorisation juridique, ni avis du délégué
      à la protection des données, ni validation de sécurité, ni validation clinique.</p></div>`;
}
const EXERCICES=[
 {t:"Cadrer un périmètre et démontrer sa couverture", depart:"vierge", duree:"30 minutes",
  o:"Distinguer une exploration maîtrisée d'une prétention à l'exhaustivité.",
  e:["Renseignez le nom, le périmètre, le pilote et les exclusions.",
     "Créez quatre services, dont trois prioritaires, et cinq systèmes connus.",
     "Parcourez les types de données à vérifier et traitez chaque famille critique.",
     "Renseignez les personnes sollicitées et celles qui ont répondu."],
  v:"L'exploration ne peut pas être terminée tant qu'une famille critique reste à vérifier, même si tous les services sont explorés."},
 {t:"Faire émerger un actif que personne n'avait recensé", depart:"hopital", duree:"30 minutes",
  o:"Comprendre pourquoi la découverte repose sur le croisement d'origines indépendantes.",
  e:["Créez trois pistes décrivant la même réalité, avec trois origines différentes.",
     "Sur la première, choisissez Créer un nouvel actif.",
     "Sur les deux autres, choisissez Rattacher à un actif existant.",
     "Ouvrez l'actif, onglet Sources, et regardez la provenance conservée."],
  v:"Aucune piste n'a été supprimée. Le rattachement garde l'auteur et l'origine de chaque piste."},
 {t:"Séparer l'actif du cas d'usage", depart:"hopital", duree:"20 minutes",
  o:"Vérifier qu'un même actif peut porter deux résultats opposés.",
  e:["Ouvrez l'actif des comptes rendus d'hospitalisation, onglet Cas d'usage.",
     "Comparez le résultat de la recherche de cohortes et celui de l'alerte prédictive."],
  v:"Même actif, même source, même population. L'un demande à être complété, l'autre ne peut pas être poursuivi en l'état."},
 {t:"Évaluer avec des éléments et non avec des impressions", depart:"hopital", duree:"40 minutes",
  o:"Voir la fiabilité changer une décision sans qu'aucun niveau ne bouge.",
  e:["Ouvrez l'évaluation du cas d'usage de recherche de cohortes.",
     "Dans Valeur potentielle, renseignez les deux questions restées à déterminer, avec un élément documenté.",
     "Ne modifiez aucun autre niveau, puis ouvrez le résultat."],
  v:"Le cas d'usage quitte le statut à compléter dès que la fiabilité atteint le seuil. Le potentiel inexploité, lui, n'a pas changé."},
 {t:"Comprendre un niveau requis", depart:"hopital", duree:"25 minutes",
  o:"Montrer que le niveau requis est déterminé par les caractéristiques de l'usage.",
  e:["Ouvrez un cas d'usage sans prérequis bloquant, onglet Évaluation, Prérequis et risques.",
     "Cochez la caractéristique influence directe sur un soin.",
     "Observez le niveau requis de la sécurité clinique et les écarts qui apparaissent."],
  v:"Les prérequis passent à traiter, sans qu'aucune réponse n'ait été modifiée. Le niveau requis n'est jamais éditable."},
 {t:"Lire les priorités et repartir avec son dossier", depart:"hopital", duree:"30 minutes",
  o:"Interpréter les deux vues de priorités et produire un livrable exploitable.",
  e:["Ouvrez Priorités, onglet Actifs de données.",
     "Repérez l'actif au potentiel stratégique le plus élevé et lisez ses indicateurs détaillés.",
     "Exportez le rapport, puis la sauvegarde de votre espace."],
  v:"Un potentiel élevé ne suffit pas. Un seul cas d'usage peu fiable renvoie l'actif en complément d'instruction."}
];
function vueFormation(){
  return `<button class="retour" data-aller='{"section":"apercu"}'>← Vue d'ensemble</button>
  <div class="tete"><div class="t"><h1>Mode formation</h1>
    <p>Six exercices, du cadrage d'un périmètre à la lecture des priorités.
      Chaque exercice ouvre l'espace dont il a besoin.</p></div></div>
  <div class="grille g2">${EXERCICES.map((x,i)=>`<div class="carte">
    <div class="actions" style="justify-content:space-between">
      ${statPastille("violet","Exercice "+(i+1))}<span class="tag">${esc(CAS[x.depart].nom)}, ${x.duree}</span></div>
    <h3 style="margin:12px 0 6px">${esc(x.t)}</h3>
    <p style="font-size:14px;color:var(--gris)">${esc(x.o)}</p>
    <ol style="font-size:14px;padding-left:20px;margin:0 0 14px">${x.e.map(s=>`<li style="margin-bottom:4px">${esc(s)}</li>`).join("")}</ol>
    <div class="alerte" style="margin-bottom:14px"><b>Ce que vous devez obtenir</b>${esc(x.v)}</div>
    <button class="btn" data-action="demarrer-exercice" data-id="${i}">Démarrer l'exercice</button>
  </div>`).join("")}</div>`;
}

/* ==========================================================================
   11. EXPORT LISIBLE
   ========================================================================== */
function rapportMarkdown(usageSeul){
  const k=kpiEDR(); const L=[];
  L.push("# "+(P.meta?P.meta.nom:"Espace de travail"));
  L.push("");
  L.push("Rapport produit le "+new Date().toLocaleString("fr-FR")+" avec Data Finder.");
  L.push("Document de travail. Il ne vaut ni autorisation, ni validation.");
  L.push("");
  if(!usageSeul){
    L.push("## Exploration");
    L.push("");
    L.push("- Nom : "+S.campagne.nom);
    L.push("- Périmètre : "+(S.campagne.perimetre||"non renseigné"));
    L.push("- Hors périmètre : "+(S.campagne.exclusions||"aucune exclusion déclarée"));
    L.push("- Pilote : "+(S.campagne.pilote||"non désigné"));
    L.push("- Exploration terminée : "+(S.campagne.terminee?"oui":"non"));
    L.push("");
    L.push("| Indicateur | Valeur |");
    L.push("|---|---|");
    L.push("| Services prioritaires explorés | "+pct(k.CO_p)+" |");
    L.push("| Systèmes connus vérifiés | "+pct(k.CS)+" |");
    L.push("| Types de données vérifiés | "+pct(k.CF)+" |");
    L.push("| Pistes traitées | "+pct(k.decision)+" |");
    L.push("| Nouveaux actifs découverts | "+pct(k.novelty)+" |");
    L.push("| Actifs confirmés par plusieurs sources | "+pct(k.croise)+" |");
    L.push("");
    L.push("La couverture mesure ce qui a été exploré dans le périmètre. Elle ne garantit jamais que toutes les données ont été trouvées.");
    L.push("");
    L.push("## Actifs de données");
    L.push("");
    S.gisements.forEach(g=>{
      const r=calcGisement(g); const st=STATUT_ACTIF[r.statut]||{label:r.statut};
      L.push("### "+g.nom);
      L.push("");
      QUESTIONS_ACTIF.forEach(([cle,q])=>L.push("- "+q+" "+(g[cle]||"non renseigné")));
      L.push("- Comment cet actif a été repéré : "+
        (S.signaux.filter(s=>s.gis===g.id).map(s=>s.auteur+", "+(ORIGINES[s.canal]||"")).join(" ; ")||"saisie directe"));
      L.push("- Usage actuel : "+direUsage(r.Ug).toLowerCase()+", "+f1(r.Ug)+" sur 100");
      L.push("- Potentiel stratégique : "+st.label.toLowerCase()+", fiabilité "+f0(r.Confg)+" %");
      L.push("- Identifiant interne : "+g.id);
      L.push("");
    });
  }
  L.push("## Cas d'usage");
  L.push("");
  const liste = usageSeul ? S.scenarios.filter(s=>s.id===usageSeul) : S.scenarios;
  liste.forEach(sc=>{
    const r=calcScenario(sc); const g=S.gisements.find(x=>x.id===sc.gis); const st=STATUTS[r.P];
    L.push("### "+sc.titre);
    L.push("");
    L.push("- Actif utilisé : "+(g?g.nom:"non rattaché"));
    L.push("- Problème à résoudre : "+(sc.finalite||sc.titre));
    L.push("- Bénéficiaire : "+(sc.beneficiaire||"non renseigné"));
    L.push("- Décision ou action améliorée : "+(sc.decision||"non renseignée"));
    L.push("- Résultat attendu : "+(sc.resultat||"non renseigné"));
    L.push("- Population : "+(sc.population||"non renseignée")+", horizon : "+(sc.horizon||"non renseigné"));
    L.push("");
    L.push("| Indicateur | Résultat |");
    L.push("|---|---|");
    L.push("| Potentiel encore inexploité | "+direPotentiel(r.L.dec)+", "+f1(r.L.dec)+" sur 100 |");
    L.push("| Capacité de mise en œuvre | "+direCapacite(r.A.dec)+", "+f1(r.A.dec)+" sur 100 |");
    L.push("| Fiabilité de l'évaluation | "+r.confLib+", "+f0(r.K_dec)+" % renseigné, "+f0(r.Conf_dec)+" % étayé |");
    L.push("| Prérequis | "+STATUT_PREREQUIS[r.C.statut].label+" |");
    L.push("| Décision recommandée | "+st.label+" |");
    L.push("");
    L.push(st.action+".");
    L.push("");
    const freins=r.C.ecarts.filter(e=>e.gap>0);
    if(freins.length||r.A.regles.length){
      L.push("Freins à lever :");
      L.push("");
      freins.forEach(e=>L.push("- "+LIB[e.id]+", niveau actuel "+(e.actuel===null?"non renseigné":e.actuel)+
        ", niveau requis "+e.cible+(e.critique?", contrôle critique":"")));
      r.A.regles.forEach(t=>L.push("- "+t));
      L.push("");
    }
    L.push("Détail méthodologique : U "+f1(r.U.dec)+", V "+f1(r.V.dec)+", L "+f1(r.L.dec)+", A "+f1(r.A.dec)+
      ", statut interne "+r.P+", référentiel de qualification V1.2.2.");
    L.push("");
  });
  L.push("---");
  L.push("");
  L.push("Aucun résultat ne vaut autorisation juridique, avis du délégué à la protection des données, validation de sécurité ou validation clinique.");
  L.push("L'étape maximale recommandée est un pilote encadré, soumis aux validations compétentes.");
  return L.join("\n");
}
function ficheActifMarkdown(g){
  const r=calcGisement(g); const L=[];
  L.push("# "+g.nom); L.push("");
  QUESTIONS_ACTIF.forEach(([cle,q])=>{ L.push("**"+q+"**"); L.push(""); L.push(g[cle]||"non renseigné"); L.push(""); });
  L.push("Usage actuel : "+direUsage(r.Ug).toLowerCase()+", "+f1(r.Ug)+" sur 100.");
  L.push("");
  L.push("Cas d'usage rattachés : "+(usagesDe(g.id).map(s=>s.titre).join(" ; ")||"aucun")+".");
  return L.join("\n");
}

/* ==========================================================================
   12. COQUE, RENDU
   ========================================================================== */
function icone(d){ return `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`; }
function renderNavigation(){
  const rail=$("rail"), bas=$("railBas");
  if(!P.actif){ rail.hidden=true; bas.hidden=true; return; }
  rail.hidden=false; bas.hidden=false;
  rail.innerHTML=SECTIONS.map(([cle,lib,d])=>
    `<button data-aller='{"section":"${cle}"}' aria-current="${S.nav.section===cle?"page":"false"}">
      ${icone(d)}<span>${lib}</span></button>`).join("");
  bas.innerHTML=SECTIONS.map(([cle,lib,d])=>
    `<button data-aller='{"section":"${cle}"}' aria-current="${S.nav.section===cle?"page":"false"}">
      ${icone(d)}<span>${lib==="Actifs de données"?"Actifs":lib==="Cas d'usage"?"Usages":lib==="Vue d'ensemble"?"Accueil":lib}</span></button>`).join("");
}
function renderEnTete(){
  const z=$("enTeteDroite");
  if(!P.actif){ z.innerHTML=""; return; }
  z.innerHTML=`
    <input type="text" class="espace-nom" id="nomEspace" value="${esc(P.meta?P.meta.nom:"")}"
      aria-label="Nom de l'espace de travail">
    <span class="enr" id="etatSauvegarde"></span>
    <details class="menu"><summary aria-label="Menu">•••</summary><div class="menu-liste">
      <button data-aller='{"section":"methode"}'>Méthode et référentiel</button>
      <button data-action="exporter-rapport">Exporter le rapport</button>
      <button data-action="exporter-json">Exporter une sauvegarde</button>
      <button data-action="imprimer">Imprimer</button>
      <hr>
      <button data-aller='{"section":"formation"}'>Mode formation</button>
      <button data-action="voir-espaces">Mes espaces</button>
    </div></details>`;
  majBarre();
}
function majBarre(){
  const b=$("etatSauvegarde"); if(!b) return;
  if(!P.disponible){ b.innerHTML=`<b>Enregistrement indisponible</b>`; return; }
  b.innerHTML = P.etat==="en cours" ? "Enregistrement" : "✓ <b>Enregistré</b>";
}
let vuePrec=null;
function render(){
  renderEnTete(); renderNavigation();
  document.querySelector(".coque").classList.toggle("pleine",!P.actif);
  if(!P.actif){
    $("app").innerHTML = pageGlobale==="methode" ? vueMethode() : vueEspaces();
    if(vuePrec!=="globale|"+pageGlobale){ window.scrollTo({top:0,behavior:"instant"}); }
    vuePrec="globale|"+pageGlobale; return; }
  normaliser(); surveillerStatuts();
  const v={apercu:vueApercu,explorer:vueExplorer,actifs:vueActifs,usages:vueUsages,
           priorites:vuePriorites,methode:vueMethode,formation:vueFormation}[S.nav.section]||vueApercu;
  const cle=S.nav.section+"|"+S.nav.explorer+"|"+S.nav.actif+"|"+S.nav.usage+"|"+S.nav.priorites+"|"+S.nav.fiche+"|"+S.nav.dim;
  const y=window.scrollY||0;
  $("app").innerHTML=banniere()+v();
  if(cle!==vuePrec){ window.scrollTo({top:0,behavior:"instant"}); vuePrec=cle; }
  else window.scrollTo({top:y,behavior:"instant"});
}

/* ==========================================================================
   13. INTERACTIONS
   ========================================================================== */
let pageGlobale=null;   // page consultable avant l'ouverture d'un espace
function aller(o){
  if(!P.actif){ pageGlobale=(o.section==="methode")?"methode":null; return render(); }
  Object.assign(S.nav,o); enregistrerBientot(); render();
}
function fermerMenus(sauf){
  document.querySelectorAll("details.menu[open]").forEach(d=>{ if(d!==sauf) d.open=false; });
  document.querySelectorAll("details.cellule[open]").forEach(d=>{ if(d!==sauf) d.open=false; });
}
document.addEventListener("click",e=>{
  const dt=e.target.closest("details.menu, details.cellule");
  if(dt&&e.target.closest("summary")) fermerMenus(dt);
  const b=e.target.closest("button"); if(!b) return;
  const act=b.dataset.action, id=b.dataset.id;

  if(b.dataset.aller){ fermerMenus(); return aller(JSON.parse(b.dataset.aller)); }
  if(b.dataset.onglet){ const [nom,val]=b.dataset.onglet.split("|"); S.nav[nom]=val;
    enregistrerBientot(); return render(); }
  if(b.dataset.niveau){ const p=b.dataset.niveau.split("|"); ecrireNiveau(p.slice(0,-1).join("|"),p[p.length-1]);
    enregistrerBientot(); return render(); }
  if(b.dataset.preuve){ const p=b.dataset.preuve.split("|"); ecrirePreuve(p.slice(0,-1).join("|"),Number(p[p.length-1]));
    enregistrerBientot(); return render(); }
  if(b.dataset.case){ const p=b.dataset.case.split("|");
    S.campagne.cellules[p[0]+"|"+p[1]]=p[2]; fermerMenus(); enregistrerBientot(); return render(); }
  if(b.dataset.profil){ const sc=usageCourant(); if(!sc) return;
    const i=sc.profil.indexOf(b.dataset.profil);
    i>=0?sc.profil.splice(i,1):sc.profil.push(b.dataset.profil);
    enregistrerBientot(); return render(); }

  /* espaces */
  if(act==="creer-espace"){ pageGlobale=null; const nid=creerEspace(id); ouvrirEspace(nid); normaliser();
    journal("Espace ouvert à partir du "+CAS[id].nom.toLowerCase()); enregistrerMaintenant(); return render(); }
  if(act==="ouvrir-espace"){ pageGlobale=null; ouvrirEspace(id); normaliser(); return render(); }
  if(act==="dupliquer-espace"){ dupliquerEspace(id); return render(); }
  if(act==="supprimer-espace"){
    if(confirm("Supprimer cet espace et tout son contenu ? Cette action est définitive.")){
      supprimerEspace(id); return render(); } return; }
  if(act==="voir-espaces"){ enregistrerMaintenant(); fermerEspace(); pageGlobale=null; return render(); }
  if(act==="importer"){
    const f=$("fichierImport").files[0]; const msg=$("messageImport");
    if(!f){ msg.innerHTML='<span class="p p-hach">Choisissez d\'abord un fichier.</span>'; return; }
    const lecteur=new FileReader();
    lecteur.onload=()=>{ const r=importerEspace(String(lecteur.result));
      if(r.ok){ ouvrirEspace(r.id); normaliser(); render(); }
      else msg.innerHTML='<span class="p p-hach">'+esc(r.message)+'</span>'; };
    lecteur.readAsText(f); return;
  }
  if(act==="aller-commencer"){ const c=$("commencer");
    if(c) c.scrollIntoView({behavior:"smooth",block:"start"}); return; }
  if(act==="imprimer"){ fermerMenus(); window.print(); return; }
  if(act==="exporter-json"){ fermerMenus(); exporterEspace(); return; }
  if(act==="exporter-rapport"){ fermerMenus();
    telecharger(nomFichierSur("rapport","md"), rapportMarkdown(null), "text/markdown"); return; }
  if(act==="exporter-dossier"){ fermerMenus();
    telecharger(nomFichierSur("cas-usage","md"), rapportMarkdown(id), "text/markdown"); return; }
  if(act==="exporter-fiche-actif"){ fermerMenus();
    const g=S.gisements.find(x=>x.id===id);
    telecharger(nomFichierSur("actif","md"), ficheActifMarkdown(g), "text/markdown"); return; }

  if(!P.actif) return;

  /* exploration */
  if(act==="ajout-unite"){
    S.campagne.unites.push({id:idSuivant(S.campagne.unites,"ZON-"),nom:"Nouveau service",prio:true,etat:"PREVUE"});
    synchroniserCases(); enregistrerBientot(); return render(); }
  if(act==="suppr-unite"){ S.campagne.unites=S.campagne.unites.filter(u=>u.id!==id);
    synchroniserCases(); fermerMenus(); enregistrerBientot(); return render(); }
  if(act==="ajout-systeme"){
    S.campagne.systemes.push({id:idSuivant(S.campagne.systemes,"SYS-"),nom:"Nouveau système",etat:"A_REVOIR"});
    enregistrerBientot(); return render(); }
  if(act==="suppr-systeme"){ S.campagne.systemes=S.campagne.systemes.filter(s=>s.id!==id);
    fermerMenus(); enregistrerBientot(); return render(); }
  if(act==="terminer-exploration"){ S.campagne.terminee=true;
    journal("Exploration déclarée terminée"); enregistrerBientot(); return render(); }
  if(act==="rouvrir-exploration"){ S.campagne.terminee=false;
    journal("Exploration rouverte"); enregistrerBientot(); return render(); }

  /* pistes */
  if(act==="ouvrir-ajout-piste"){ S.nav.ajoutPiste=true; return render(); }
  if(act==="fermer-ajout-piste"){ S.nav.ajoutPiste=false; return render(); }
  if(act==="add-piste"){
    const q=$("q-neuf-pistequoi"); const nom=(q.value||"").trim();
    if(!nom){ q.focus(); return; }
    const s={id:idSuivant(S.signaux,"SIG-"),nom,
      zone:(document.querySelector('[data-neuf="piste-ou"]')||{}).value||"",
      canal:(document.querySelector('[data-neuf="piste-comment"]')||{}).value||"R4",
      auteur:(($("q-neuf-pistequi")||{}).value||"Contributeur").trim(),
      wf:"SOUMIS",res:null,gis:null,
      motif:(document.querySelector('[data-neuf="piste-pourquoi"]')||{}).value||RAISONS[0]};
    S.signaux.push(s); S.nav.ajoutPiste=false; S.nav.listePistes="ouvertes";
    journal("Piste ajoutée, "+nom,s.id); enregistrerBientot(); return render(); }
  if(act==="ouvrir-piste"){ S.pisteCourante=id; S.nav.fiche="piste"; return render(); }
  if(act==="fermer-piste"){ S.nav.fiche=null; return render(); }
  if(act==="piste-classer"){ const s=S.signaux.find(x=>x.id===id); s.wf="RESOLU"; s.res="ECARTE";
    S.nav.fiche=null; journal("Piste classée sans suite, "+s.nom,s.id); enregistrerBientot(); return render(); }
  if(act==="piste-nouvel-actif"){
    const s=S.signaux.find(x=>x.id===id); s.wf="RESOLU"; s.res="CONFIRME";
    const gid=idSuivant(S.gisements,"GIS-"); s.gis=gid;
    S.gisements.push(actifVide(gid,s.nom,s.zone));
    S.gisementCourant=gid; S.nav.fiche=null; S.nav.section="actifs"; S.nav.actif="description";
    journal("Actif créé à partir d'une piste, "+s.nom,gid); enregistrerBientot(); return render(); }
  if(act==="piste-rattacher"){
    const s=S.signaux.find(x=>x.id===id); const cible=($("rattach")||{}).value;
    if(!cible) return;
    s.wf="RESOLU"; s.res="FUSIONNE"; s.gis=cible;
    S.nav.fiche=null; journal("Piste rattachée à un actif existant, "+s.nom,cible);
    enregistrerBientot(); return render(); }

  /* actifs */
  if(act==="creer-actif"){
    const gid=idSuivant(S.gisements,"GIS-");
    S.gisements.push(actifVide(gid,"Nouvel actif de données",(S.campagne.unites[0]||{}).id||""));
    S.gisementCourant=gid; S.nav.section="actifs"; S.nav.actif="description";
    journal("Actif ajouté directement",gid); enregistrerBientot(); return render(); }
  if(act==="ouvrir-actif"){ S.gisementCourant=id; S.nav.section="actifs"; S.nav.fiche=null;
    enregistrerBientot(); return render(); }
  if(act==="suppr-actif"){
    if(!confirm("Archiver cet actif ? Les cas d'usage qui en dépendent seront également archivés.")) return;
    S.gisements=S.gisements.filter(g=>g.id!==id);
    S.scenarios=S.scenarios.filter(s=>s.gis!==id);
    S.signaux.forEach(s=>{ if(s.gis===id){ s.gis=null; s.res=null; s.wf="SOUMIS"; } });
    S.gisementCourant=(S.gisements[0]||{}).id||null;
    journal("Actif archivé"); fermerMenus(); enregistrerBientot(); return render(); }

  /* cas d'usage */
  if(act==="ouvrir-creation-usage"){ S.nav.section="usages"; S.nav.fiche="creation";
    S.nav.brouillon={gis:(S.gisements[0]||{}).id||""}; return render(); }
  if(act==="creer-usage-pour"){ S.nav.section="usages"; S.nav.fiche="creation";
    S.nav.brouillon={gis:id}; return render(); }
  if(act==="creer-usage"){
    const n=S.nav.brouillon||{};
    if(!(n.titre||"").trim()){ const c=document.querySelector('[data-brouillon="titre"]'); if(c) c.focus(); return; }
    const sc=usageVide(n.gis||(S.gisements[0]||{}).id,n.titre.trim(),"Formulé par un professionnel");
    ["beneficiaire","decision","resultat","population","horizon"].forEach(k=>{ if(n[k]) sc[k]=n[k]; });
    sc.finalite=n.titre.trim();
    S.scenarios.push(sc); S.scenarioCourant=sc.id; S.nav.fiche=sc.id; S.nav.usage="evaluation"; S.nav.dim="U";
    S.nav.brouillon=null; journal("Cas d'usage créé, "+sc.titre,sc.id);
    enregistrerBientot(); return render(); }
  if(act==="ouvrir-usage"){ S.scenarioCourant=id; S.nav.section="usages"; S.nav.fiche=id; S.nav.usage="apercu";
    enregistrerBientot(); return render(); }
  if(act==="fermer-fiche"){ S.nav.fiche=null; S.nav.brouillon=null; return render(); }
  if(act==="suppr-usage"){
    if(!confirm("Archiver ce cas d'usage et son évaluation ?")) return;
    S.scenarios=S.scenarios.filter(s=>s.id!==id);
    S.scenarioCourant=(S.scenarios[0]||{}).id||null; S.nav.fiche=null;
    journal("Cas d'usage archivé"); fermerMenus(); enregistrerBientot(); return render(); }
  if(act==="retenir-idee"){
    const sug=S.suggestions.find(x=>x.id===id); if(!sug) return;
    const sc=usageVide(sug.gis,sug.titre,"Idée proposée, retenue par un professionnel");
    S.scenarios.push(sc); S.suggestions=S.suggestions.filter(x=>x.id!==id);
    S.scenarioCourant=sc.id; S.nav.section="usages"; S.nav.fiche=sc.id; S.nav.usage="apercu";
    journal("Idée retenue et transformée en cas d'usage, "+sc.titre,sc.id);
    enregistrerBientot(); return render(); }
  if(act==="ignorer-idee"){ S.suggestions=S.suggestions.filter(x=>x.id!==id);
    fermerMenus(); enregistrerBientot(); return render(); }

  /* formation */
  if(act==="demarrer-exercice"){
    const x=EXERCICES[Number(id)];
    const nid=creerEspace(x.depart,"Exercice "+(Number(id)+1)+", "+x.t);
    ouvrirEspace(nid); normaliser();
    S.nav.section = x.depart==="vierge" ? "explorer" : "apercu";
    journal("Exercice démarré, "+x.t); enregistrerMaintenant(); return render(); }
});

function actifVide(gid,nom,zone){
  return {id:gid,nom,famille:"À qualifier",
    definition:"",sources:"",producteur:"",rmetier:"",rtech:"",population:"",periode:"",
    modalites:"",granularite:"",sensibilite:"",usageInitial:"",contraintes:"",
    zone,prealable:"NON",passe:"PAS-"+S.campagne.passe,gouvernance:"A_IDENTIFIER",
    ug:{UG01:a("ND",0),UG02:a("ND",0),UG03:a("ND",0),UG04:a("ND",0),UG05:a("ND",0)},V09:0,V09preuve:0};
}
function usageVide(gis,titre,origine){
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
function reponseCiblee(portee){
  const p=portee.split("|");
  if(p[0]==="ug"){ const g=S.gisements.find(x=>x.id===p[1]); return g?g.ug[p[2]]:null; }
  const sc=usageCourant(); if(!sc) return null;
  const bloc={U:sc.u,V:sc.v,A:sc.A,C:sc.c,IA:sc.ia}[p[1]];
  if(!bloc) return null;
  if(!bloc[p[2]]) bloc[p[2]]={v:"ND",e:0};
  return bloc[p[2]];
}
function ecrireNiveau(portee,valeur){
  const p=portee.split("|"); const r=reponseCiblee(portee); if(!r) return;
  const v=(valeur==="ND"||valeur==="NA")?valeur:Number(valeur);
  if(p[0]==="evd") r.d=(v==="ND"||v==="NA")?null:v;
  else if(p[0]==="evo") r.o=(v==="ND"||v==="NA")?null:v;
  else r.v=v;
}
function ecrirePreuve(portee,valeur){ const r=reponseCiblee(portee); if(r) r.e=valeur; }

/* saisie libre, sans rerendu pour garder le curseur */
document.addEventListener("input",e=>{
  const t=e.target;
  if(t.tagName!=="INPUT"&&t.tagName!=="TEXTAREA") return;
  if(t.id==="nomEspace"){ renommerEspace(P.actif,t.value); enregistrerBientot(); return; }
  if(!P.actif) return;
  if(t.dataset.recherche!==undefined){
    S.nav.recherche=t.value; render();
    const el=$("rechActifs"); if(el){ el.focus(); el.setSelectionRange(el.value.length,el.value.length); }
    return; }
  if(appliquer(t)) enregistrerBientot();
});
document.addEventListener("change",e=>{
  const t=e.target;
  if(t.tagName!=="SELECT") return;
  if(appliquer(t)){ enregistrerBientot(); render(); }
});
function appliquer(t){
  const d=t.dataset; const v=t.value;
  const nb=x=>{const n=Number(x); return isNaN(n)?0:n;};
  if(d.camp){ S.campagne[d.camp]=(d.camp==="contreExploration")?(v==="true"):v; return true; }
  if(d.campn){ S.campagne[d.campn]=nb(v); return true; }
  if(d.contrib){ S.campagne.contributeurs[d.contrib]=nb(v); return true; }
  if(d.unite){ const [uid,ch]=d.unite.split("|"); const u=S.campagne.unites.find(x=>x.id===uid);
    if(u){ u[ch]=(ch==="prio")?(v==="true"):v; if(ch==="prio") synchroniserCases(); } return true; }
  if(d.systeme){ const [sid,ch]=d.systeme.split("|"); const s=S.campagne.systemes.find(x=>x.id===sid);
    if(s) s[ch]=v; return true; }
  if(d.gis){ const [gid,ch]=d.gis.split("|"); const g=S.gisements.find(x=>x.id===gid);
    if(g) g[ch]=v; return true; }
  if(d.gisn){ const [gid,ch]=d.gisn.split("|"); const g=S.gisements.find(x=>x.id===gid);
    if(g) g[ch]=nb(v); return true; }
  if(d.scn){ const [sid,ch]=d.scn.split("|"); const s=S.scenarios.find(x=>x.id===sid);
    if(s) s[ch]=(ch==="cIA")?(v==="true"):v; return true; }
  if(d.ci||d.cp){ const [sid,crit]=(d.ci||d.cp).split("|"); const s=S.scenarios.find(x=>x.id===sid);
    if(s&&s.c[crit]) s.c[crit][d.ci?"I":"P"]=(v==="ND"?null:Number(v)); return true; }
  if(d.brouillon!==undefined){ S.nav.brouillon=S.nav.brouillon||{}; S.nav.brouillon[d.brouillon]=v; return true; }
  if(d.neuf!==undefined) return false;
  return false;
}
document.addEventListener("keydown",e=>{ if(e.key==="Escape") fermerMenus(); });

/* démarrage */
(function demarrer(){
  const liste=indexEspaces();
  if(liste.length===1){ ouvrirEspace(liste[0].id); normaliser(); }
  render();
})();
