/*
  SubMission — le jeu de missions secrètes pour le sparring de JJB.

  Comment ce fichier est organisé :
    1. Réglages et constantes (points, niveaux…)
    2. Petits outils (mélanger, tirer au hasard…)
    3. Son, vibration et écran toujours allumé
    4. Écrans communs (accueil, sécurité, passer le téléphone, chrono, règles)
    5. Mode Duel
    6. Mode Undercover
    7. Démarrage de l'app

  Chaque "écran" est une fonction qui remplace le contenu de la page.
*/
'use strict';

/* =========================================================
   1. Réglages et constantes
   ========================================================= */

// Points gagnés selon la difficulté d'une mission
const POINTS = { facile: 1, moyen: 2, difficile: 3, soumission: 5 };
const LIBELLE_DIFFICULTE = { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile', soumission: 'Soumission' };

// Niveaux, du plus bas au plus haut. Un niveau voit aussi les missions des niveaux en dessous.
const NIVEAUX = ['blanche', 'bleue', 'violette'];
const LIBELLE_NIVEAU = { blanche: 'Blanche', bleue: 'Bleue', violette: 'Violette +' };

const DUREES_ROUND = [3, 5, 6];        // en minutes
const NB_PROPOSITIONS_DEVINETTE = 8;   // nombre de missions proposées pour deviner
const JOUEURS_MIN_UNDERCOVER = 3;
const JOUEURS_MAX_UNDERCOVER = 10;
const JOUEURS_MIN_QP = 3;
const JOUEURS_MAX_QP = 16;
const GAGE_PAR_DEFAUT = 'Paie le repas';

// Nombre de joueurs possible selon le mode : [minimum, maximum]
const BORNES_JOUEURS = {
  'duel': [2, 2],
  'undercover': [JOUEURS_MIN_UNDERCOVER, JOUEURS_MAX_UNDERCOVER],
  'qui-paie': [JOUEURS_MIN_QP, JOUEURS_MAX_QP],
};
function nbJoueursMode(mode) {
  const [min, max] = BORNES_JOUEURS[mode] || [2, 2];
  return Math.min(max, Math.max(min, Number(reglages.nbJoueurs) || 4));
}

// Réglages choisis sur l'accueil (gardés en mémoire sur le téléphone)
const reglages = Object.assign(
  { mode: 'duel', nbJoueurs: 4, niveau: 'blanche', tenue: 'gi', nbMissions: 2, duree: 5, noms: [], gage: GAGE_PAR_DEFAUT },
  lireReglages()
);

let MISSIONS = [];   // rempli depuis missions.json au démarrage
const app = document.getElementById('app');

function lireReglages() {
  try { return JSON.parse(localStorage.getItem('submission-reglages')) || {}; } catch { return {}; }
}
function sauverReglages() {
  try { localStorage.setItem('submission-reglages', JSON.stringify(reglages)); } catch { /* pas grave */ }
}

/* =========================================================
   2. Petits outils
   ========================================================= */

// Renvoie une copie du tableau dans un ordre aléatoire
function melanger(tableau) {
  const t = tableau.slice();
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}
const auHasard = (t) => t[Math.floor(Math.random() * t.length)];

// Protège le texte tapé par les joueurs avant de l'afficher
function esc(texte) {
  return String(texte).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const pts = (m) => POINTS[m.difficulte];
const plurielPts = (n) => `${n} pt${Math.abs(n) > 1 ? 's' : ''}`;
// Barrette noire avec des galons blancs, comme au bout d'une ceinture.
// "allumes" = combien de galons sont blancs (les autres sont gris).
const barrette = (n, allumes = n) => `<span class="barrette" aria-hidden="true">${
  Array.from({ length: n }, (_, i) => `<i${i < allumes ? '' : ' class="eteint"'}></i>`).join('')}</span>`;

// Étiquettes d'une mission : son niveau (couleur de ceinture) et sa difficulté (1 galon = 1 point)
const LIBELLE_CEINTURE = { blanche: 'Blanche', bleue: 'Bleue', violette: 'Violette +' };
const badge = (m) => `<span class="etiquettes">
  <span class="etiquette ${m.niveau}">${LIBELLE_CEINTURE[m.niveau]}</span>
  <span class="etiquette difficulte">${LIBELLE_DIFFICULTE[m.difficulte]} · ${plurielPts(pts(m))} ${barrette(pts(m))}</span>
</span>`;

/* ---------- Pictogrammes des catégories (dessinés en SVG) ---------- */

// Chaque catégorie de missions.json utilise un des 7 pictogrammes
const PICTO_DE_CATEGORIE = {
  'balayage': 'balayage', 'passage': 'passage', 'prise de dos': 'dos', 'projection': 'projection',
  'position': 'controle', 'échappement': 'echappement',
  'étranglement': 'soumission', 'clé de bras': 'soumission', 'clé de jambe': 'soumission',
  'torsion': 'soumission',
};
const LIBELLE_PICTO = {
  balayage: 'Balayage', passage: 'Passage de garde', dos: 'Prise de dos', projection: 'Projection',
  controle: 'Contrôle / position', echappement: 'Échappement', soumission: 'Soumission',
};

// Les dessins eux-mêmes sont dans pictos.js (fonction dessinPicto)
const cleePicto = (m) => PICTO_DE_CATEGORIE[m.categorie] || 'controle';

function picto(m) {
  const cle = cleePicto(m);
  return dessinPicto(cle, LIBELLE_PICTO[cle]);
}

// La photo de la mission si le champ "image" est rempli, sinon le pictogramme.
// Si la photo ne se charge pas, on remet le pictogramme.
function illustration(m) {
  if (!m.image) return `<div class="illustration">${picto(m)}</div>`;
  return `<div class="illustration">
    <img src="${esc(m.image)}" alt="${esc(m.nom)}" onerror="this.hidden=true;this.nextElementSibling.hidden=false">
    <span hidden>${picto(m)}</span>
  </div>`;
}

// Fiche complète d'une mission : dessin, catégorie, nom, étiquettes, étapes
function ficheMission(m, compacte = false) {
  const cle = cleePicto(m);
  const categorie = cle === 'soumission' ? `Soumission · ${m.categorie}` : LIBELLE_PICTO[cle];
  const etapes = Array.isArray(m.etapes) && m.etapes.length
    ? `<ol class="etapes">${m.etapes.map((e) => `<li>${esc(e)}</li>`).join('')}</ol>` : '';
  return `<div class="carte fiche${compacte ? ' compacte' : ''}">
    ${illustration(m)}
    <span class="categorie">${esc(categorie)}</span>
    <span class="nom-mission">${esc(m.nom)}</span>
    ${badge(m)}
    ${etapes}
  </div>`;
}

// Missions qui correspondent au niveau et à la tenue choisis
function missionsDisponibles() {
  const niveauMax = NIVEAUX.indexOf(reglages.niveau);
  return MISSIONS.filter((m) =>
    NIVEAUX.indexOf(m.niveau) <= niveauMax && (m.tenue === 'les deux' || m.tenue === reglages.tenue));
}

// Noms des joueurs ("Joueur 1"… si rien n'est tapé), sans doublon
function nomsJoueurs(n) {
  const noms = [];
  for (let i = 0; i < n; i++) {
    const base = (reglages.noms[i] || '').trim() || `Joueur ${i + 1}`;
    let nom = base, k = 2;
    while (noms.includes(nom)) nom = `${base} ${k++}`;
    noms.push(nom);
  }
  return noms;
}

// Affiche un nouvel écran
function afficher(html, { boutonQuitter = true, garderScroll = false } = {}) {
  arreterChrono();
  const scroll = window.scrollY;
  app.innerHTML = (boutonQuitter ? '<button class="quitter" id="quitter">✕ Quitter</button>' : '') + html;
  window.scrollTo(0, garderScroll ? scroll : 0);
  if (boutonQuitter) {
    clic('quitter', () => { if (confirm('Quitter la partie et revenir à l\'accueil ?')) ecranAccueil(); });
  }
}

// Branche une action sur le bouton qui a cet id
function clic(id, action) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', action);
}

/* =========================================================
   3. Son, vibration et écran toujours allumé
   ========================================================= */

let audio = null;

// Les navigateurs exigent un toucher de l'utilisateur avant de jouer un son :
// on appelle cette fonction quand on appuie sur "Commencer" ou "Démarrer".
function debloquerSon() {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
  } catch { audio = null; }
}

function bip(frequence, debut, duree, volume = 0.5) {
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'square';
  osc.frequency.value = frequence;
  gain.gain.setValueAtTime(volume, debut);
  gain.gain.exponentialRampToValueAtTime(0.001, debut + duree);
  osc.connect(gain).connect(audio.destination);
  osc.start(debut);
  osc.stop(debut + duree);
}

function sonAttention() { // 10 secondes restantes
  debloquerSon(); if (!audio) return;
  const t = audio.currentTime;
  bip(660, t, 0.15, 0.3); bip(660, t + 0.25, 0.15, 0.3);
}

function sonFin() { // fin du round
  debloquerSon();
  if (audio) {
    const t = audio.currentTime;
    [0, 0.4, 0.8].forEach((d) => bip(880, t + d, 0.3));
    bip(587, t + 1.2, 1.2, 0.6);
  }
  if (navigator.vibrate) navigator.vibrate([400, 150, 400, 150, 900]);
}

// Empêche l'écran de s'éteindre pendant un round (si le téléphone le permet)
let verrouEcran = null;
async function garderEcranAllume() {
  try { if ('wakeLock' in navigator) verrouEcran = await navigator.wakeLock.request('screen'); } catch { /* pas supporté */ }
}
function libererEcran() {
  if (verrouEcran) { verrouEcran.release().catch(() => {}); verrouEcran = null; }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && chrono && chrono.enCours) garderEcranAllume();
});

/* ---------- Statistiques anonymes (événements) ----------
   Cloudflare Web Analytics compte les visites mais ne sait pas suivre des événements.
   Les événements sont envoyés à GoatCounter (gratuit, sans cookies) si son script
   est présent dans index.html. Sinon, cette fonction ne fait rien.
   On n'envoie jamais les noms des joueurs : seulement le nom de l'événement. */
function suivreEvenement(nom) {
  try {
    if (window.goatcounter && typeof window.goatcounter.count === 'function') {
      window.goatcounter.count({ path: nom, title: nom, event: true });
    }
  } catch { /* les statistiques ne doivent jamais gêner le jeu */ }
}

/* =========================================================
   4. Écrans communs
   ========================================================= */

// Un bouton de choix (mode, niveau, tenue…), allumé s'il correspond au réglage actuel
function boutonChoix(cle, valeur, contenu) {
  const actif = String(reglages[cle]) === String(valeur);
  return `<button class="choix" data-reglage="${cle}" data-valeur="${valeur}" aria-pressed="${actif}">${contenu}</button>`;
}

// Grand bouton d'un mode de jeu, avec son pictogramme
function boutonMode(valeur, titre, detail) {
  const actif = reglages.mode === valeur;
  return `<button class="choix mode-jeu" data-reglage="mode" data-valeur="${valeur}" aria-pressed="${actif}">
    <span class="picto-mode">${dessinPicto('mode-' + valeur, titre)}</span>
    <span class="texte"><strong>${titre}</strong><small>${detail}</small></span>
  </button>`;
}

function ecranAccueil(garderScroll = false) {
  duelContexte = null;
  const mode = reglages.mode;
  const duel = mode === 'duel';
  const [nMin, nMax] = BORNES_JOUEURS[mode];
  const n = nbJoueursMode(mode);
  if (!duel) reglages.nbJoueurs = n;
  const champsNoms = Array.from({ length: n }, (_, i) =>
    `<input class="champ" data-nom="${i}" maxlength="16" placeholder="Joueur ${i + 1}"
      value="${esc(reglages.noms[i] || '')}" autocomplete="off" enterkeyhint="done">`).join('');

  afficher(`
    <header class="logo">
      <img src="icons/icon.svg" alt="">
      <h1>Sub<span>Mission</span></h1>
      <p class="accroche">Des missions secrètes pour pimenter le sparring</p>
      <div class="deco-ceintures" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
    </header>

    <section class="bloc">
      <h2>Mode de jeu</h2>
      <div class="liste-modes">
        ${boutonMode('duel', 'Duel', '2 joueurs · missions secrètes')}
        ${boutonMode('undercover', 'Undercover', '3 à 10 joueurs · trouve l\'intrus')}
        ${boutonMode('qui-paie', 'Qui paie ?', '3 à 16 joueurs · le dernier perdant a le gage')}
      </div>
    </section>

    <section class="bloc">
      <h2>Joueurs</h2>
      ${duel ? '' : `
        <div class="compteur">
          <button class="rond" id="moins" aria-label="Un joueur de moins" ${n <= nMin ? 'disabled' : ''}>−</button>
          <span>${n}</span>
          <button class="rond" id="plus" aria-label="Un joueur de plus" ${n >= nMax ? 'disabled' : ''}>+</button>
        </div>`}
      <div class="noms">${champsNoms}</div>
    </section>

    ${mode === 'qui-paie' ? `
    <section class="bloc">
      <h2>Le gage du perdant</h2>
      <input class="champ champ-gage" id="gage" maxlength="60" placeholder="${GAGE_PAR_DEFAUT}"
        value="${esc(reglages.gage ?? GAGE_PAR_DEFAUT)}" autocomplete="off" enterkeyhint="done">
    </section>` : ''}

    <section class="bloc">
      <h2>Niveau</h2>
      <div class="grille-3">
        ${NIVEAUX.map((nv) => boutonChoix('niveau', nv, `<span class="ceinture ${nv}"></span>${LIBELLE_NIVEAU[nv]}`)).join('')}
      </div>
    </section>

    <section class="bloc">
      <h2>Tenue</h2>
      <div class="grille-2">${boutonChoix('tenue', 'gi', 'Gi')}${boutonChoix('tenue', 'no-gi', 'No-gi')}</div>
    </section>

    ${mode !== 'undercover' ? `
    <section class="bloc">
      <h2>Missions par joueur</h2>
      <div class="grille-3">${[1, 2, 3].map((k) => boutonChoix('nbMissions', k, String(k))).join('')}</div>
    </section>` : ''}

    <div class="actions">
      <button class="btn btn-primaire" id="commencer">Commencer</button>
      <button class="btn btn-lien" id="regles">Comment jouer ?</button>
      ${estInstallee() ? '' : '<button class="btn btn-lien" id="installer-appli">📲 Installer l\'appli</button>'}
    </div>
  `, { boutonQuitter: false, garderScroll });

  app.querySelectorAll('[data-reglage]').forEach((b) => b.addEventListener('click', () => {
    const cle = b.dataset.reglage;
    reglages[cle] = cle === 'nbMissions' ? Number(b.dataset.valeur) : b.dataset.valeur;
    sauverReglages();
    ecranAccueil(true);
  }));
  app.querySelectorAll('[data-nom]').forEach((champ) => champ.addEventListener('input', () => {
    reglages.noms[Number(champ.dataset.nom)] = champ.value;
    sauverReglages();
  }));
  clic('moins', () => { reglages.nbJoueurs = n - 1; sauverReglages(); ecranAccueil(true); });
  clic('plus', () => { reglages.nbJoueurs = n + 1; sauverReglages(); ecranAccueil(true); });
  const champGage = document.getElementById('gage');
  if (champGage) champGage.addEventListener('input', () => { reglages.gage = champGage.value; sauverReglages(); });
  clic('regles', ecranRegles);
  clic('installer-appli', () => ecranInstallation(false));
  clic('commencer', () => {
    debloquerSon();
    if (reglages.mode === 'duel') {
      scoreMatch = null; // nouvelle partie : on remet le score du match à zéro
      ecranSecurite(nouveauDuel);
    } else if (reglages.mode === 'qui-paie') {
      ecranSecurite(nouveauTournoi);
    } else {
      ecranSecurite(nouvelUndercover);
    }
  });
}

// Règle de sécurité, affichée avant chaque partie
function ecranSecurite(suite) {
  afficher(`
    <div class="centre">
      <div class="icone-grande">🛡️</div>
      <h2 class="titre">Règle de sécurité</h2>
      <div class="carte securite">
        <p><strong>Une mission de soumission compte dès que la position et le grip sont établis.</strong></p>
        <p>On ne force jamais jusqu'au tap : on montre, on lâche.</p>
        <p>Si ton partenaire tape, tu lâches immédiatement. Aucune mission ne vaut une blessure.</p>
      </div>
    </div>
    <div class="actions"><button class="btn btn-primaire" id="ok">J'ai compris, on y va</button></div>
  `);
  clic('ok', suite);
}

// Écran "cache" entre deux joueurs
function ecranPasser(nom, suite, consigne = 'Les autres, ne regardez pas l\'écran !') {
  afficher(`
    <div class="centre">
      <div class="icone-grande">📱</div>
      <p class="petit">Passe le téléphone à</p>
      <h2 class="nom-joueur">${esc(nom)}</h2>
      <p class="discret">${consigne}</p>
    </div>
    <div class="actions"><button class="btn btn-primaire" id="ok">Je suis ${esc(nom)}</button></div>
  `);
  clic('ok', suite);
}

/*
  Chrono de round.
  - etape, titre, infoHtml : ce qui s'affiche au-dessus du chrono
  - actionsAvant : boutons en plus avant de démarrer   [{ libelle, action }]
  - actionsFin   : boutons affichés quand le temps est fini
*/
let chrono = null;

function arreterChrono() {
  if (chrono) clearInterval(chrono.minuteur);
  chrono = null;
  libererEcran();
}

function formatTemps(ms) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function ecranChrono({ etape, titre, infoHtml = '', actionsAvant = [], actionsFin }) {
  afficher(`
    <p class="etape">${etape}</p>
    <h2 class="titre">${titre}</h2>
    ${infoHtml}
    <div class="chrono" id="chrono">
      <div class="temps" id="temps" role="timer"></div>
      <!-- La ceinture se remplit, et un galon blanc s'allume à chaque quart du round -->
      <div class="chrono-ceinture" aria-hidden="true">
        <div class="corps"><div class="rempli" id="prog"></div></div>
        ${barrette(4, 0)}
      </div>
    </div>
    <div class="grille-3" id="durees">
      ${DUREES_ROUND.map((d) => `<button class="choix" data-duree="${d}" aria-pressed="${d === reglages.duree}">${d} min</button>`).join('')}
    </div>
    <div class="actions" id="actions"></div>
  `);

  const elTemps = document.getElementById('temps');
  const elProg = document.getElementById('prog');
  const elChrono = document.getElementById('chrono');
  const elActions = document.getElementById('actions');
  const elDurees = document.getElementById('durees');
  const galons = elChrono.querySelectorAll('.barrette i');

  let total = reglages.duree * 60 * 1000;
  let restant = total;
  let finPrevue = 0;
  let alerteFaite = false;
  chrono = { minuteur: null, enCours: false };
  const monChrono = chrono;

  function dessiner() {
    elTemps.textContent = formatTemps(restant);
    const ecoule = 1 - restant / total;
    elProg.style.width = `${ecoule * 100}%`;
    galons.forEach((g, i) => g.classList.toggle('eteint', ecoule < (i + 1) / 4));
    elChrono.classList.toggle('bientot', restant > 0 && restant <= 10000);
  }

  function boutons(liste) {
    elActions.innerHTML = liste.map((b, i) =>
      `<button class="btn ${b.secondaire ? '' : 'btn-primaire'}" data-i="${i}">${b.libelle}</button>`).join('');
    elActions.querySelectorAll('[data-i]').forEach((el) =>
      el.addEventListener('click', () => liste[Number(el.dataset.i)].action()));
  }

  function tic() {
    restant = Math.max(0, finPrevue - Date.now());
    if (!alerteFaite && restant <= 10000 && restant > 0) { alerteFaite = true; sonAttention(); }
    dessiner();
    if (restant === 0) terminer(true);
  }

  function lancer() {
    debloquerSon();
    elDurees.hidden = true;
    finPrevue = Date.now() + restant;
    monChrono.enCours = true;
    monChrono.minuteur = setInterval(tic, 200);
    garderEcranAllume();
    boutons([
      { libelle: 'Pause', action: pause },
      { libelle: 'Finir le round', secondaire: true, action: () => { if (confirm('Finir le round maintenant ?')) terminer(false); } },
    ]);
  }

  function pause() {
    clearInterval(monChrono.minuteur);
    monChrono.enCours = false;
    restant = Math.max(0, finPrevue - Date.now());
    dessiner();
    boutons([
      { libelle: 'Reprendre', action: lancer },
      { libelle: 'Finir le round', secondaire: true, action: () => { if (confirm('Finir le round maintenant ?')) terminer(false); } },
    ]);
  }

  function terminer(avecSon) {
    clearInterval(monChrono.minuteur);
    monChrono.enCours = false;
    libererEcran();
    restant = 0;
    dessiner();
    elChrono.classList.remove('bientot');
    elChrono.classList.add('fini');
    elTemps.textContent = 'TEMPS !';
    if (avecSon) sonFin();
    boutons(actionsFin);
  }

  elDurees.querySelectorAll('[data-duree]').forEach((b) => b.addEventListener('click', () => {
    reglages.duree = Number(b.dataset.duree);
    sauverReglages();
    total = restant = reglages.duree * 60 * 1000;
    elDurees.querySelectorAll('[data-duree]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    dessiner();
  }));

  dessiner();
  boutons([{ libelle: 'Démarrer le round', action: lancer }, ...actionsAvant.map((a) => ({ ...a, secondaire: true }))]);
}

function ecranRegles() {
  afficher(`
    <h2 class="titre">Comment jouer</h2>
    <div class="regles">
      <h3>🛡️ Sécurité</h3>
      <p>Une mission de soumission compte dès que la position et le grip sont établis. On ne force jamais jusqu'au tap.</p>

      <h3>⚔️ Duel (2 joueurs)</h3>
      <ul>
        <li>Chacun découvre en secret ses missions, puis passe le téléphone.</li>
        <li>Lancez le chrono et faites votre sparring en essayant de placer vos missions.</li>
        <li>À la fin, chacun coche ses missions réussies, puis essaie de deviner celles de l'autre.</li>
        <li>Bien deviné une mission réussie par l'autre ? Tu lui voles ses points !</li>
        <li>Points : facile 1 · moyen 2 · difficile 3 · soumission 5.</li>
      </ul>

      <h3>🕵️ Undercover (3 à 10 joueurs)</h3>
      <ul>
        <li>Tout le monde reçoit la même technique secrète… sauf un joueur, l'undercover, qui en a une autre (souvent proche).</li>
        <li>L'undercover ne sait pas qu'il l'est ! À vous de le comprendre en roulant.</li>
        <li>Les rounds tournent : l'app indique qui roule avec qui.</li>
        <li>À la fin, chacun vote en secret. Si l'undercover n'est pas le plus voté (égalité comprise), il gagne.</li>
      </ul>

      <h3>💸 Qui paie ? (3 à 16 joueurs)</h3>
      <ul>
        <li>Un tournoi à l'envers pour décider qui a le gage (par défaut : payer le repas).</li>
        <li>Chaque match se joue comme un Duel : missions secrètes, chrono, points, devinette.</li>
        <li>Le gagnant est sauvé et sort du tournoi. Le perdant passe au tour suivant.</li>
        <li>Nombre impair ? Un joueur tiré au sort est exempt et passe directement au tour suivant.</li>
        <li>Égalité de points : mort subite, le premier qui place une mission gagne.</li>
        <li>Le dernier qui reste a le gage !</li>
      </ul>
    </div>
    <div class="actions"><button class="btn btn-primaire" id="ok">Retour</button></div>
  `);
  clic('ok', () => ecranAccueil());
}

/* =========================================================
   Guide d'installation sur l'écran d'accueil
   ========================================================= */

const CLE_GUIDE = 'submission-guide-vu';
// Chrome (Android, ordinateur) nous donne une "invitation" quand l'installation est possible.
// On la garde pour l'ouvrir quand on appuie sur « Installer l'appli ».
let invitationInstall = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  invitationInstall = e;
  // Si le guide est affiché, on le redessine pour montrer le bouton d'installation
  const guide = document.getElementById('guide-installation');
  if (guide) ecranInstallation(guide.dataset.premier === '1');
});
window.addEventListener('appinstalled', () => { invitationInstall = null; marquerGuideVu(); });

// Vrai si l'appli est ouverte depuis l'écran d'accueil (plein écran)
function estInstallee() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || window.navigator.standalone === true;
}

function typeAppareil() {
  const ua = navigator.userAgent;
  const iPadRecent = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (/iPad|iPhone|iPod/.test(ua) || iPadRecent) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'ordinateur';
}

function guideDejaVu() {
  try { return localStorage.getItem(CLE_GUIDE) === '1'; } catch { return false; }
}
function marquerGuideVu() {
  try { localStorage.setItem(CLE_GUIDE, '1'); } catch { /* pas grave */ }
}

const ETAPES_INSTALLATION = {
  ios: [
    { icone: 'partager', texte: 'Appuie sur le bouton <strong>Partager</strong> (en bas de Safari)' },
    { icone: 'ajouter', texte: 'Choisis <strong>« Sur l\'écran d\'accueil »</strong> (fais défiler la liste si besoin)' },
    { icone: 'valider', texte: 'Appuie sur <strong>« Ajouter »</strong> en haut à droite' },
  ],
  android: [
    { icone: 'menu', texte: 'Appuie sur le menu <strong>⋮</strong> en haut à droite de Chrome' },
    { icone: 'installer', texte: 'Choisis <strong>« Installer l\'application »</strong> (ou « Ajouter à l\'écran d\'accueil »)' },
    { icone: 'valider', texte: 'Confirme avec <strong>« Installer »</strong>' },
  ],
  ordinateur: [
    { icone: 'ordinateur', texte: 'Dans Chrome ou Edge, clique sur l\'icône d\'installation à droite de la barre d\'adresse' },
    { icone: 'installer', texte: 'Le plus pratique : ouvre cette page <strong>sur ton téléphone</strong> pour l\'installer' },
  ],
};

function listeEtapes(etapes) {
  return `<ol class="etapes-install">${etapes.map((e, i) => `
    <li><span class="icone-install">${iconeInstall(e.icone)}</span>
      <span><span class="num-install">Étape ${i + 1}</span>${e.texte}</span></li>`).join('')}</ol>`;
}

function ecranInstallation(premierLancement = false) {
  const appareil = typeAppareil();
  const installable = appareil !== 'ios' && invitationInstall;
  const autreNavigateurIos = appareil === 'ios' && /CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);

  let contenu;
  if (installable) {
    contenu = `<p class="discret centre-txt">Un seul bouton : ton téléphone te demande de confirmer, et c'est fait.</p>`;
  } else {
    contenu = `${listeEtapes(ETAPES_INSTALLATION[appareil])}
      ${autreNavigateurIos ? '<p class="discret centre-txt">Astuce : sur iPhone, c\'est plus simple depuis <strong>Safari</strong>.</p>' : ''}`;
  }

  afficher(`
    <div id="guide-installation" data-premier="${premierLancement ? '1' : '0'}">
      <div class="entete-install">
        <img src="icons/icon.svg" alt="">
        <h2 class="titre">Installe SubMission</h2>
        <p class="discret centre-txt">Sur ton écran d'accueil, comme une vraie appli :
          plein écran, et ça marche même sans réseau au club.</p>
      </div>
      ${contenu}
    </div>
    <div class="actions">
      ${installable ? '<button class="btn btn-primaire" id="installer">Installer l\'appli</button>' : ''}
      <button class="btn" id="plus-tard">${premierLancement ? 'Plus tard' : 'Retour'}</button>
    </div>
  `, { boutonQuitter: false });

  clic('installer', async () => {
    const invitation = invitationInstall;
    invitationInstall = null; // une invitation ne sert qu'une fois
    invitation.prompt();
    const { outcome } = await invitation.userChoice;
    if (outcome === 'accepted') {
      marquerGuideVu();
      ecranAccueil();
    } else {
      ecranInstallation(premierLancement); // on montre les étapes à la main
    }
  });
  clic('plus-tard', () => { marquerGuideVu(); ecranAccueil(); });
}

/* =========================================================
   5. Mode Duel
   ========================================================= */

let duel = null;        // la manche en cours
let scoreMatch = null;  // le score cumulé sur plusieurs revanches
// Quand un duel fait partie du tournoi « Qui paie ? », ce contexte donne les deux joueurs,
// le titre du match et ce qu'il faut faire à la fin (surFin). Sinon, il vaut null.
let duelContexte = null;

function nouveauDuel() {
  const noms = duelContexte ? duelContexte.noms : nomsJoueurs(2);
  const k = reglages.nbMissions;
  const dispo = melanger(missionsDisponibles());
  if (dispo.length < 2 * k + 2) {
    alert('Pas assez de missions pour ces réglages. Ajoute-en dans missions.json.');
    return ecranAccueil();
  }

  const joueurs = noms.map((nom, i) => ({
    nom,
    missions: dispo.slice(i * k, (i + 1) * k), // ses missions secrètes
    reussies: new Set(),                         // celles qu'il a cochées
    devinettes: new Set(),                       // ce qu'il pense que l'autre avait
    propositions: [],                            // la liste dans laquelle il devine
  }));
  // Fausses pistes : des missions qu'aucun des deux n'a reçues
  const leurres = dispo.slice(2 * k);
  joueurs.forEach((j, i) => {
    const adversaire = joueurs[1 - i];
    j.propositions = melanger([
      ...adversaire.missions,
      ...melanger(leurres).slice(0, NB_PROPOSITIONS_DEVINETTE - k),
    ]);
  });

  duel = { joueurs };
  if (!duelContexte) {
    suivreEvenement('partie-lancee');
    suivreEvenement('mode-duel');
    if (!scoreMatch || scoreMatch.noms.join('|') !== noms.join('|')) {
      scoreMatch = { noms, totaux: [0, 0], manches: 0 };
    }
  }
  ecranPasser(joueurs[0].nom, () => duelMontrerMissions(0));
}

function duelMontrerMissions(i) {
  const j = duel.joueurs[i];
  afficher(`
    <p class="etape">Tes missions secrètes</p>
    <h2 class="titre petit-titre">${esc(j.nom)}</h2>
    <div class="liste">${j.missions.map((m) => ficheMission(m, j.missions.length > 1)).join('')}</div>
    <p class="discret centre-txt">Mémorise-les, puis cache l'écran avant de passer le téléphone.</p>
    <div class="actions apres-contenu"><button class="btn btn-primaire" id="ok">C'est mémorisé, cacher</button></div>
  `);
  clic('ok', () => {
    if (i === 0) ecranPasser(duel.joueurs[1].nom, () => duelMontrerMissions(1));
    else duelRound();
  });
}

function duelRound() {
  const [a, b] = duel.joueurs;
  ecranChrono({
    etape: duelContexte ? duelContexte.etape : 'Round',
    titre: `${esc(a.nom)} <span class="accent-txt">vs</span> ${esc(b.nom)}`,
    actionsFin: [{ libelle: 'Valider les missions', action: () => ecranPasser(a.nom, () => duelCocher(0)) }],
  });
}

// Bouton cochable utilisé pour valider ou deviner une mission
function ligneMission(m, index, coche) {
  return `<button class="choix ligne" data-index="${index}" aria-pressed="${coche}">
    <span class="case"></span>
    <span class="texte"><span>${esc(m.nom)}</span>${badge(m)}</span>
  </button>`;
}

// Étape 1 pour un joueur : cocher ses missions réussies
function duelCocher(i) {
  const j = duel.joueurs[i];
  afficher(`
    <p class="etape">Fin du round</p>
    <h2 class="titre">${esc(j.nom)}, qu'as-tu réussi ?</h2>
    <p class="discret centre-txt">Touche les missions que tu as réussies. Sois honnête !</p>
    <div class="liste">${j.missions.map((m, x) => ligneMission(m, x, j.reussies.has(m))).join('')}</div>
    <div class="actions"><button class="btn btn-primaire" id="ok">Valider</button></div>
  `);
  app.querySelectorAll('[data-index]').forEach((b) => b.addEventListener('click', () => {
    const m = j.missions[Number(b.dataset.index)];
    if (j.reussies.has(m)) j.reussies.delete(m); else j.reussies.add(m);
    b.setAttribute('aria-pressed', String(j.reussies.has(m)));
  }));
  clic('ok', () => duelDeviner(i));
}

// Étape 2 pour un joueur : deviner les missions de l'autre
function duelDeviner(i) {
  const j = duel.joueurs[i];
  const adversaire = duel.joueurs[1 - i];
  const k = adversaire.missions.length;
  const s = k > 1 ? 's' : '';
  afficher(`
    <p class="etape">Devinette</p>
    <h2 class="titre">Quelle${s} mission${s} avait ${esc(adversaire.nom)} ?</h2>
    <p class="discret centre-txt">Si tu trouves une mission qu'il a réussie, tu lui voles ses points.</p>
    <p class="compte-choix" id="compte"></p>
    <div class="liste">${j.propositions.map((m, x) => ligneMission(m, x, j.devinettes.has(m))).join('')}</div>
    <div class="actions"><button class="btn btn-primaire" id="ok">Valider mes choix</button></div>
  `);
  const majCompte = () => {
    document.getElementById('compte').textContent = `${j.devinettes.size} / ${k} choisie${s}`;
    document.getElementById('ok').disabled = j.devinettes.size !== k;
  };
  app.querySelectorAll('[data-index]').forEach((b) => b.addEventListener('click', () => {
    const m = j.propositions[Number(b.dataset.index)];
    if (j.devinettes.has(m)) j.devinettes.delete(m);
    else if (j.devinettes.size < k) j.devinettes.add(m);
    b.setAttribute('aria-pressed', String(j.devinettes.has(m)));
    majCompte();
  }));
  majCompte();
  clic('ok', () => {
    if (i === 0) ecranPasser(duel.joueurs[1].nom, () => duelCocher(1));
    else duelCalculerScores();
  });
}

function duelCalculerScores() {
  const [A, B] = duel.joueurs;
  // Points volés par un joueur : missions de l'adversaire bien devinées ET réussies
  const vols = (j, adv) => [...j.devinettes]
    .filter((m) => adv.missions.includes(m) && adv.reussies.has(m))
    .reduce((s, m) => s + pts(m), 0);
  const base = (j) => j.missions.filter((m) => j.reussies.has(m)).reduce((s, m) => s + pts(m), 0);

  const volsA = vols(A, B), volsB = vols(B, A);
  duel.scores = [base(A) + volsA - volsB, base(B) + volsB - volsA];
  if (!duelContexte) {
    scoreMatch.totaux[0] += duel.scores[0];
    scoreMatch.totaux[1] += duel.scores[1];
    scoreMatch.manches++;
    suivreEvenement('partie-terminee');
  }
  duelResultats();
}

function duelResultats() {
  const { joueurs, scores } = duel;

  const carteJoueur = (i) => {
    const j = joueurs[i];
    const adv = joueurs[1 - i];
    const lignesMissions = j.missions.map((m) => {
      const reussie = j.reussies.has(m);
      const volee = reussie && adv.devinettes.has(m);
      let detail = reussie ? `+${plurielPts(pts(m))}` : 'Pas réussie';
      if (volee) detail = `Réussie, mais devinée par ${esc(adv.nom)} : points volés !`;
      return `<div class="resultat-ligne">
        <span class="icone ${reussie ? 'oui' : 'non'}">${reussie ? '✓' : '✗'}</span>
        <span>${esc(m.nom)}<span class="detail">${detail}</span></span>
      </div>`;
    }).join('');
    const lignesDevinettes = [...j.devinettes].map((m) => {
      const juste = adv.missions.includes(m);
      let detail = 'Raté';
      if (juste && adv.reussies.has(m)) detail = `Bien vu ! +${plurielPts(pts(m))} volé${pts(m) > 1 ? 's' : ''}`;
      else if (juste) detail = 'Bien vu, mais pas réussie : rien à voler';
      return `<div class="resultat-ligne">
        <span class="icone ${juste ? 'oui' : 'non'}">${juste ? '🎯' : '✗'}</span>
        <span>${esc(m.nom)}<span class="detail">${detail}</span></span>
      </div>`;
    }).join('');
    return `<div class="carte score-joueur">
      <div class="score-entete"><h3>${esc(j.nom)}</h3><span class="pts">${plurielPts(scores[i])}</span></div>
      <p class="sous-titre">Ses missions</p>${lignesMissions}
      <p class="sous-titre">Ses devinettes</p>${lignesDevinettes}
    </div>`;
  };

  const egalite = scores[0] === scores[1];
  const gagnant = scores[0] > scores[1] ? 0 : 1;

  // Match du tournoi « Qui paie ? » : pas de revanche, on continue le tournoi
  if (duelContexte) {
    const ctx = duelContexte;
    const banniereTournoi = egalite
      ? '⚡ Égalité : mort subite !'
      : `🛟 ${esc(joueurs[gagnant].nom)} échappe au gage !`;
    afficher(`
      <p class="etape">${esc(ctx.etape)}</p>
      <div class="banniere">${banniereTournoi}</div>
      ${egalite ? '' : `<p class="match">${esc(joueurs[1 - gagnant].nom)} reste en jeu pour le tour suivant.</p>`}
      ${carteJoueur(0)}
      ${carteJoueur(1)}
      <div class="actions">
        <button class="btn btn-primaire" id="continuer">${egalite ? 'Lancer la mort subite' : 'Continuer le tournoi'}</button>
      </div>
    `);
    clic('continuer', () => (egalite ? duelMortSubite() : ctx.surFin(gagnant, false)));
    return;
  }

  let banniere = '🤝 Égalité !';
  if (!egalite) banniere = `🏆 ${esc(joueurs[gagnant].nom)} gagne la manche`;

  afficher(`
    <p class="etape">Résultats</p>
    <div class="banniere">${banniere}</div>
    ${scoreMatch.manches > 1 ? `<p class="match">Score du match (${scoreMatch.manches} manches) :<br>
      <strong>${esc(joueurs[0].nom)} ${scoreMatch.totaux[0]} — ${scoreMatch.totaux[1]} ${esc(joueurs[1].nom)}</strong></p>` : ''}
    ${carteJoueur(0)}
    ${carteJoueur(1)}
    <div class="actions">
      <button class="btn btn-primaire" id="revanche">Revanche</button>
      <button class="btn" id="accueil">Accueil</button>
    </div>
  `, { boutonQuitter: false });
  clic('revanche', () => ecranSecurite(nouveauDuel));
  clic('accueil', () => ecranAccueil());
}

// Égalité dans le tournoi : le premier qui place une de ses missions gagne
function duelMortSubite() {
  const [a, b] = duel.joueurs;
  afficher(`
    <p class="etape">Mort subite</p>
    <h2 class="titre">Le premier qui place une mission gagne !</h2>
    <div class="carte mort-subite">
      <p>Repartez au combat avec les mêmes missions.</p>
      <p>Dès qu'un joueur place une de ses missions (position et grip établis, sans forcer),
        <strong>touchez son nom</strong>.</p>
    </div>
    <div class="actions">
      <button class="btn btn-primaire" data-gagnant="0">${esc(a.nom)} a placé une mission</button>
      <button class="btn btn-primaire" data-gagnant="1">${esc(b.nom)} a placé une mission</button>
    </div>
  `);
  app.querySelectorAll('[data-gagnant]').forEach((bouton) => bouton.addEventListener('click', () => {
    const g = Number(bouton.dataset.gagnant);
    if (confirm(`Confirmer : ${duel.joueurs[g].nom} a placé sa mission en premier ?`)) duelContexte.surFin(g, true);
  }));
}

/* =========================================================
   6. Mode Undercover
   ========================================================= */

let uc = null;

function nouvelUndercover() {
  const noms = nomsJoueurs(nbJoueursMode('undercover'));
  const dispo = missionsDisponibles();
  if (dispo.length < 2) {
    alert('Pas assez de missions pour ces réglages. Ajoute-en dans missions.json.');
    return ecranAccueil();
  }
  // Technique des civils, puis une technique proche (même catégorie) pour l'undercover
  const civil = auHasard(dispo);
  let proches = dispo.filter((m) => m !== civil && m.categorie === civil.categorie);
  if (proches.length === 0) proches = dispo.filter((m) => m !== civil);
  const intrus = auHasard(proches);

  uc = {
    noms, civil, intrus,
    undercover: Math.floor(Math.random() * noms.length),
    rounds: planningRounds(noms.length),
    round: 0,
    votes: [],
  };
  suivreEvenement('partie-lancee');
  suivreEvenement('mode-undercover');
  ecranPasser(noms[0], () => ucMontrerTechnique(0, true));
}

const techniqueDe = (i) => (i === uc.undercover ? uc.intrus : uc.civil);

// Rotation "chacun contre chacun" (méthode du cercle). Si nombre impair, un joueur se repose.
function planningRounds(n) {
  const ordre = melanger([...Array(n).keys()]);
  if (ordre.length % 2) ordre.push(null);
  const m = ordre.length;
  const rounds = [];
  for (let r = 0; r < m - 1; r++) {
    const paires = [], repos = [];
    for (let i = 0; i < m / 2; i++) {
      const a = ordre[i], b = ordre[m - 1 - i];
      if (a === null) repos.push(b);
      else if (b === null) repos.push(a);
      else paires.push([a, b]);
    }
    rounds.push({ paires, repos });
    ordre.splice(1, 0, ordre.pop()); // on fait tourner tout le monde sauf le premier
  }
  return rounds;
}

function ucMontrerTechnique(i, distribution) {
  const m = techniqueDe(i);
  afficher(`
    <p class="etape">Ta technique secrète</p>
    <h2 class="titre petit-titre">${esc(uc.noms[i])}</h2>
    ${ficheMission(m)}
    <p class="discret centre-txt">Tout le monde a la même technique… sauf l'undercover, qui en a une autre.
      C'est peut-être toi ! Place-la pendant les rounds sans te faire griller.</p>
    <div class="actions apres-contenu"><button class="btn btn-primaire" id="ok">C'est mémorisé, cacher</button></div>
  `);
  clic('ok', () => {
    if (distribution && i + 1 < uc.noms.length) ecranPasser(uc.noms[i + 1], () => ucMontrerTechnique(i + 1, true));
    else ucRound();
  });
}

function ucRound() {
  const r = uc.rounds[uc.round];
  const dernier = uc.round === uc.rounds.length - 1;
  const nom = (i) => esc(uc.noms[i]);
  const infoHtml = `
    <ul class="paires">${r.paires.map(([a, b]) => `<li>${nom(a)}<span>vs</span>${nom(b)}</li>`).join('')}</ul>
    ${r.repos.length ? `<p class="discret centre-txt">Au repos (observe bien !) : ${r.repos.map(nom).join(', ')}</p>` : ''}`;

  const actionsFin = dernier
    ? [{ libelle: 'Passer au vote', action: () => ucVoter(0) }]
    : [
      { libelle: 'Round suivant', action: () => { uc.round++; ucRound(); } },
      { libelle: 'Passer au vote', secondaire: true, action: () => ucVoter(0) },
    ];
  const actionsAvant = [{ libelle: 'Revoir ma technique', action: ucChoisirQuiRevoit }];
  if (uc.round > 0) actionsAvant.push({ libelle: 'Passer au vote', action: () => ucVoter(0) });

  ecranChrono({ etape: `Round ${uc.round + 1} / ${uc.rounds.length}`, titre: 'Sparring !', infoHtml, actionsAvant, actionsFin });
}

function ucChoisirQuiRevoit() {
  afficher(`
    <h2 class="titre">Qui veut revoir sa technique ?</h2>
    <div class="grille-2">${uc.noms.map((n, i) => `<button class="choix" data-i="${i}">${esc(n)}</button>`).join('')}</div>
    <div class="actions"><button class="btn" id="retour">Retour</button></div>
  `);
  app.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.dataset.i);
    ecranPasser(uc.noms[i], () => ucMontrerTechnique(i, false));
  }));
  clic('retour', ucRound);
}

function ucVoter(i) {
  ecranPasser(uc.noms[i], () => ucBulletin(i), 'Vote secret : les autres ne regardent pas !');
}

function ucBulletin(i) {
  let choix = null;
  afficher(`
    <p class="etape">Vote</p>
    <h2 class="titre">${esc(uc.noms[i])}, qui est l'undercover ?</h2>
    <div class="grille-2">
      ${uc.noms.map((n, x) => (x === i ? '' : `<button class="choix" data-i="${x}" aria-pressed="false">${esc(n)}</button>`)).join('')}
    </div>
    <div class="actions"><button class="btn btn-primaire" id="ok" disabled>Confirmer mon vote</button></div>
  `);
  app.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => {
    choix = Number(b.dataset.i);
    app.querySelectorAll('[data-i]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    document.getElementById('ok').disabled = false;
  }));
  clic('ok', () => {
    uc.votes[i] = choix;
    if (i + 1 < uc.noms.length) ucVoter(i + 1);
    else ucResultats();
  });
}

function ucResultats() {
  const { noms, votes, undercover } = uc;
  suivreEvenement('partie-terminee');
  const compte = noms.map(() => 0);
  votes.forEach((v) => compte[v]++);
  const max = Math.max(...compte);
  const plusVotes = compte.map((c, i) => (c === max ? i : -1)).filter((i) => i >= 0);
  const demasque = plusVotes.length === 1 && plusVotes[0] === undercover;

  const ordre = noms.map((_, i) => i).sort((a, b) => compte[b] - compte[a]);
  const barres = ordre.map((i) => {
    const qui = votes.map((v, x) => (v === i ? esc(noms[x]) : null)).filter(Boolean);
    return `<div class="barre-vote ${i === undercover ? 'intrus' : ''}">
      <div class="haut"><span>${i === undercover ? '🕵️ ' : ''}${esc(noms[i])}</span><span>${compte[i]} vote${compte[i] > 1 ? 's' : ''}</span></div>
      <div class="jauge"><div style="width:${(compte[i] / noms.length) * 100}%"></div></div>
      ${qui.length ? `<span class="detail">Voté par : ${qui.join(', ')}</span>` : ''}
    </div>`;
  }).join('');

  afficher(`
    <p class="etape">Résultats</p>
    <h2 class="titre">L'undercover était…<br><span class="accent-txt">${esc(noms[undercover])}</span></h2>
    <div class="banniere">${demasque ? '🎉 Démasqué ! Les autres gagnent' : `🕵️ Pas démasqué : ${esc(noms[undercover])} gagne !`}</div>
    <div class="carte">
      <p class="sous-titre">Technique de tout le monde</p>
      <p class="nom-mission" style="margin:4px 0 12px">${esc(uc.civil.nom)}</p>
      <p class="sous-titre">Technique de l'undercover</p>
      <p class="nom-mission" style="margin:4px 0 0">${esc(uc.intrus.nom)}</p>
    </div>
    <div class="carte" style="margin-top:12px">
      <p class="sous-titre">Les votes</p>
      ${barres}
    </div>
    <div class="actions">
      <button class="btn btn-primaire" id="rejouer">Rejouer</button>
      <button class="btn" id="accueil">Accueil</button>
    </div>
  `, { boutonQuitter: false });
  clic('rejouer', () => ecranSecurite(nouvelUndercover));
  clic('accueil', () => ecranAccueil());
}

/* =========================================================
   7. Mode « Qui paie ? » (tournoi à gage)

   Tournoi inversé : le GAGNANT de chaque match est sauvé et sort.
   Les perdants se rencontrent tour après tour. Le dernier qui reste a le gage.
   Si le nombre de joueurs encore en jeu est impair, un joueur tiré au sort
   est exempt : il passe directement au tour suivant.
   ========================================================= */

let qp = null;

function nouveauTournoi() {
  const noms = nomsJoueurs(nbJoueursMode('qui-paie'));
  const k = reglages.nbMissions;
  if (missionsDisponibles().length < 2 * k + 2) {
    alert('Pas assez de missions pour ces réglages. Ajoute-en dans missions.json.');
    return ecranAccueil();
  }
  qp = {
    noms,
    gage: (reglages.gage || '').trim() || GAGE_PAR_DEFAUT,
    enJeu: noms.map((_, i) => i), // ceux qui risquent encore le gage
    sauves: [],                    // { joueur, tour } dans l'ordre où ils se sont sauvés
    tours: [],                     // { numero, matchs: [{ a, b, gagnant, mortSubite }], exempt }
  };
  suivreEvenement('partie-lancee');
  suivreEvenement('mode-qui-paie');
  qpNouveauTour();
}

const qpTour = () => qp.tours[qp.tours.length - 1];
const qpMatchAJouer = () => qpTour().matchs.find((m) => m.gagnant === null);

function qpNouveauTour() {
  const ordre = melanger(qp.enJeu);
  // Nombre impair : le dernier du tirage au sort est exempt
  const exempt = ordre.length % 2 === 1 ? ordre.pop() : null;
  const matchs = [];
  for (let i = 0; i < ordre.length; i += 2) matchs.push({ a: ordre[i], b: ordre[i + 1], gagnant: null, mortSubite: false });
  qp.tours.push({ numero: qp.tours.length + 1, matchs, exempt });
  qpTableau();
}

function qpJouerMatch() {
  const tour = qpTour();
  const match = qpMatchAJouer();
  const numero = tour.matchs.indexOf(match) + 1;
  duelContexte = {
    noms: [qp.noms[match.a], qp.noms[match.b]],
    etape: `Tour ${tour.numero} · Match ${numero}/${tour.matchs.length}`,
    surFin: (gagnant, mortSubite) => {
      match.gagnant = gagnant === 0 ? match.a : match.b;
      match.mortSubite = mortSubite;
      qp.sauves.push({ joueur: match.gagnant, tour: tour.numero });
      qp.enJeu = qp.enJeu.filter((i) => i !== match.gagnant);
      duelContexte = null;
      qpTableau();
    },
  };
  nouveauDuel();
}

// Le tableau du tournoi : qui est sauvé, qui reste en jeu, les matchs du tour
function qpTableau() {
  const tour = qpTour();
  const match = qpMatchAJouer();
  const nom = (i) => esc(qp.noms[i]);

  const ligneMatch = (m) => {
    if (m.gagnant === null) {
      const actuel = m === match;
      return `<li class="match-qp ${actuel ? 'actuel' : ''}">
        <span>${nom(m.a)} <span class="accent-txt">vs</span> ${nom(m.b)}</span>
        <span class="statut">${actuel ? 'À jouer' : 'Ensuite'}</span></li>`;
    }
    const perdant = m.gagnant === m.a ? m.b : m.a;
    return `<li class="match-qp joue">
      <span><strong>${nom(m.gagnant)}</strong> échappe au gage${m.mortSubite ? ' (mort subite)' : ''}
        <span class="detail">${nom(perdant)} reste en jeu</span></span>
      <span class="statut sauve">🛟</span></li>`;
  };
  const carteTour = (t) => `<div class="carte tour-qp">
    <p class="sous-titre">Tour ${t.numero}</p>
    <ul class="liste-qp">
      ${t.matchs.map(ligneMatch).join('')}
      ${t.exempt !== null ? `<li class="match-qp exempt"><span>🎲 <strong>${nom(t.exempt)}</strong> est exempt
        <span class="detail">Tiré au sort : passe directement au tour suivant</span></span></li>` : ''}
    </ul></div>`;

  const fini = qp.enJeu.length === 1;
  let bouton;
  if (match) bouton = `Jouer : ${nom(match.a)} vs ${nom(match.b)}`;
  else if (fini) bouton = 'Découvrir qui paie… 😬';
  else bouton = `Lancer le tour ${tour.numero + 1}`;

  afficher(`
    <p class="etape">Qui paie ?</p>
    <h2 class="titre">Tour ${tour.numero}</h2>
    <p class="gage-rappel">Gage : <strong>${esc(qp.gage)}</strong></p>
    <div class="grille-2 bilan-qp">
      <div class="carte colonne-qp sauves">
        <p class="sous-titre">Sauvés · ${qp.sauves.length}</p>
        ${qp.sauves.length ? qp.sauves.map((s) => `<span class="pastille bleue">${nom(s.joueur)}</span>`).join('') : '<p class="discret">Personne… pour l\'instant</p>'}
      </div>
      <div class="carte colonne-qp en-jeu">
        <p class="sous-titre">Encore en jeu · ${qp.enJeu.length}</p>
        ${qp.enJeu.map((i) => `<span class="pastille violette">${nom(i)}</span>`).join('')}
      </div>
    </div>
    ${carteTour(tour)}
    ${qp.tours.length > 1 ? `<p class="sous-titre centre-txt">Tours précédents</p>
      ${qp.tours.slice(0, -1).reverse().map(carteTour).join('')}` : ''}
    <div class="actions">
      <button class="btn btn-primaire" id="jouer">${bouton}</button>
    </div>
  `);
  clic('jouer', () => {
    if (match) qpJouerMatch();
    else if (fini) qpFinal();
    else qpNouveauTour();
  });
}

function qpFinal() {
  const perdant = qp.enJeu[0];
  suivreEvenement('partie-terminee');
  const pluie = Array.from({ length: 18 }, (_, i) =>
    `<span style="left:${(i * 37) % 100}%;animation-delay:${(i % 6) * 0.45}s;animation-duration:${3 + (i % 4) * 0.6}s">${
      ['💸', '🍕', '🧾', '🍔', '🍟', '💶'][i % 6]}</span>`).join('');

  afficher(`
    <div class="pluie" aria-hidden="true">${pluie}</div>
    <p class="etape">Fin du tournoi</p>
    <div class="final-qp">
      <div class="final-picto">${dessinPicto('mode-qui-paie', 'Qui paie ?')}</div>
      <p class="petit">Et c'est…</p>
      <h2 class="nom-perdant">${esc(qp.noms[perdant])}</h2>
      <p class="qui-paie-txt">qui s'y colle ! 😅</p>
      <div class="gage-carte">
        <span class="sous-titre">Le gage</span>
        <strong>${esc(qp.gage)}</strong>
      </div>
    </div>
    <div class="carte">
      <p class="sous-titre">Ordre de sortie</p>
      <ol class="classement-qp">
        ${qp.sauves.map((s) => `<li><span>${esc(qp.noms[s.joueur])}</span><span class="detail">sorti au tour ${s.tour}</span></li>`).join('')}
        <li class="perdant"><span>${esc(qp.noms[perdant])}</span><span class="detail">💸 a le gage</span></li>
      </ol>
    </div>
    <div class="actions">
      <button class="btn btn-primaire" id="rejouer">Nouveau tournoi</button>
      <button class="btn" id="accueil">Accueil</button>
    </div>
  `, { boutonQuitter: false });
  clic('rejouer', () => ecranSecurite(nouveauTournoi));
  clic('accueil', () => ecranAccueil());
}

/* =========================================================
   8. Démarrage
   ========================================================= */

async function demarrer() {
  try {
    const reponse = await fetch('missions.json', { cache: 'no-cache' });
    const liste = await reponse.json();
    // On garde seulement les missions bien écrites (et on signale les autres)
    MISSIONS = liste.filter((m) => {
      const ok = m && m.nom && NIVEAUX.includes(m.niveau) && POINTS[m.difficulte]
        && ['gi', 'no-gi', 'les deux'].includes(m.tenue);
      if (!ok) console.warn('Mission ignorée (champ manquant ou mal écrit) :', m);
      return ok;
    });
  } catch (e) {
    app.innerHTML = `<div class="centre"><div class="icone-grande">⚠️</div>
      <h2 class="titre">Impossible de charger les missions</h2>
      <p class="discret">Vérifie que missions.json est bien écrit et que l'app est ouverte depuis un serveur
      (voir le README), pas en double-cliquant sur le fichier.</p></div>`;
    console.error(e);
    return;
  }
  // Si les réglages sauvegardés sont bizarres, on revient à des valeurs sûres
  if (!NIVEAUX.includes(reglages.niveau)) reglages.niveau = 'blanche';
  if (!['gi', 'no-gi'].includes(reglages.tenue)) reglages.tenue = 'gi';
  if (!DUREES_ROUND.includes(reglages.duree)) reglages.duree = 5;
  if (!BORNES_JOUEURS[reglages.mode]) reglages.mode = 'duel';
  reglages.nbJoueurs = Math.min(JOUEURS_MAX_QP, Math.max(JOUEURS_MIN_UNDERCOVER, Number(reglages.nbJoueurs) || 4));
  // Premier lancement dans le navigateur : on propose d'installer l'appli
  if (!estInstallee() && !guideDejaVu()) ecranInstallation(true);
  else ecranAccueil();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

demarrer();
