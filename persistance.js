/* persistance.js, espaces de travail
   Enregistrement local dans le navigateur du poste, sans serveur et sans requête réseau.
   Un espace de travail contient un état complet : campagne, signaux, gisements,
   suggestions, chantiers et scénarios.
   Rien ne quitte le poste, sauf si le participant exporte volontairement un fichier.
*/

'use strict';

/* État courant de l'espace ouvert, partagé avec le moteur et l'interface. */
let S = null;

const VERSION_FORMAT = 1;
const CLE_INDEX = "cius.gisements.index";
const cleEspace = id => "cius.gisements.espace." + id;

const P = {
  actif: null,          // identifiant de l'espace ouvert
  meta: null,           // entrée d'index de l'espace ouvert
  disponible: true,     // le stockage local répond
  etat: "inactif",      // inactif, enregistre, en cours
  dernier: null
};

/* --- accès bas niveau, tolérant à un stockage indisponible --- */
const memoire = {};
function lire(cle){
  try { return P.disponible ? localStorage.getItem(cle) : (memoire[cle] ?? null); }
  catch(e){ P.disponible=false; return memoire[cle] ?? null; }
}
function ecrire(cle,valeur){
  try {
    if(P.disponible){ localStorage.setItem(cle,valeur); return true; }
    memoire[cle]=valeur; return false;
  } catch(e){ P.disponible=false; memoire[cle]=valeur; return false; }
}
function effacer(cle){
  try { if(P.disponible) localStorage.removeItem(cle); } catch(e){}
  delete memoire[cle];
}
(function testerStockage(){
  try { localStorage.setItem("cius.test","1"); localStorage.removeItem("cius.test"); }
  catch(e){ P.disponible=false; }
})();

/* --- index des espaces --- */
function indexEspaces(){
  try { return JSON.parse(lire(CLE_INDEX) || "[]"); } catch(e){ return []; }
}
function ecrireIndex(liste){ ecrire(CLE_INDEX, JSON.stringify(liste)); }

function identifiant(){
  return "ESP-" + Date.now().toString(36).toUpperCase() + "-" +
         Math.random().toString(36).slice(2,6).toUpperCase();
}

/* --- cycle de vie --- */
function creerEspace(cleCas, nom){
  const cas = CAS[cleCas];
  const id = identifiant();
  const meta = {id, nom: nom || cas.nom, cas: cleCas, cree: new Date().toISOString(),
                modifie: new Date().toISOString()};
  const liste = indexEspaces(); liste.unshift(meta); ecrireIndex(liste);
  ecrire(cleEspace(id), JSON.stringify({version:VERSION_FORMAT, etat: cas.creer()}));
  return id;
}
function ouvrirEspace(id){
  const brut = lire(cleEspace(id));
  if(!brut) return false;
  let paquet;
  try { paquet = JSON.parse(brut); } catch(e){ return false; }
  S = paquet.etat;
  P.actif = id;
  P.meta = indexEspaces().find(m=>m.id===id) || null;
  P.etat = "enregistre";
  return true;
}
function fermerEspace(){ P.actif=null; P.meta=null; P.etat="inactif"; }

function supprimerEspace(id){
  effacer(cleEspace(id));
  ecrireIndex(indexEspaces().filter(m=>m.id!==id));
  if(P.actif===id) fermerEspace();
}
function dupliquerEspace(id){
  const brut = lire(cleEspace(id)); if(!brut) return null;
  const source = indexEspaces().find(m=>m.id===id);
  const neuf = identifiant();
  const meta = {id:neuf, nom:(source?source.nom:"Espace")+" (copie)", cas:source?source.cas:"vierge",
                cree:new Date().toISOString(), modifie:new Date().toISOString()};
  const liste = indexEspaces(); liste.unshift(meta); ecrireIndex(liste);
  ecrire(cleEspace(neuf), brut);
  return neuf;
}
function renommerEspace(id, nom){
  const liste = indexEspaces();
  const m = liste.find(x=>x.id===id); if(!m) return;
  m.nom = nom; ecrireIndex(liste);
  if(P.actif===id) P.meta = m;
}

/* --- enregistrement automatique, différé de 500 ms --- */
let minuteur = null;
function enregistrerBientot(){
  if(!P.actif) return;
  P.etat = "en cours";
  majBarre();
  clearTimeout(minuteur);
  minuteur = setTimeout(enregistrerMaintenant, 500);
}
function enregistrerMaintenant(){
  if(!P.actif) return;
  ecrire(cleEspace(P.actif), JSON.stringify({version:VERSION_FORMAT, etat:S}));
  const liste = indexEspaces();
  const m = liste.find(x=>x.id===P.actif);
  if(m){ m.modifie = new Date().toISOString(); ecrireIndex(liste); P.meta = m; }
  P.etat = "enregistre";
  P.dernier = new Date();
  majBarre();
}
window.addEventListener("beforeunload", ()=>{ if(P.actif && P.etat!=="enregistre") enregistrerMaintenant(); });

/* --- export et import --- */
function telecharger(nomFichier, contenu, type){
  const lien = document.createElement("a");
  const blob = new Blob([contenu], {type: type+";charset=utf-8"});
  lien.href = URL.createObjectURL(blob);
  lien.download = nomFichier;
  document.body.appendChild(lien); lien.click();
  setTimeout(()=>{ URL.revokeObjectURL(lien.href); lien.remove(); }, 1000);
}
function nomFichierSur(base, extension){
  const propre = (P.meta ? P.meta.nom : "espace").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50);
  const jour = new Date().toISOString().slice(0,10);
  return base + "-" + propre + "-" + jour + "." + extension;
}
function exporterEspace(){
  if(!P.actif) return;
  enregistrerMaintenant();
  const paquet = {
    format: "moteur-gisements", version: VERSION_FORMAT,
    exporte: new Date().toISOString(),
    espace: {nom: P.meta.nom, cas: P.meta.cas, cree: P.meta.cree},
    etat: S
  };
  telecharger(nomFichierSur("espace","json"), JSON.stringify(paquet,null,1), "application/json");
}
function importerEspace(texte){
  let paquet;
  try { paquet = JSON.parse(texte); }
  catch(e){ return {ok:false, message:"Le fichier n'est pas un JSON lisible."}; }
  if(paquet.format!=="moteur-gisements" || !paquet.etat)
    return {ok:false, message:"Ce fichier n'est pas un espace de travail exporté par l'outil."};
  if(paquet.version>VERSION_FORMAT)
    return {ok:false, message:"Ce fichier vient d'une version plus récente de l'outil."};
  const id = identifiant();
  const meta = {id, nom:(paquet.espace&&paquet.espace.nom?paquet.espace.nom:"Espace importé"),
                cas:(paquet.espace&&paquet.espace.cas)||"vierge",
                cree:new Date().toISOString(), modifie:new Date().toISOString()};
  const liste = indexEspaces(); liste.unshift(meta); ecrireIndex(liste);
  ecrire(cleEspace(id), JSON.stringify({version:VERSION_FORMAT, etat:paquet.etat}));
  return {ok:true, id};
}
