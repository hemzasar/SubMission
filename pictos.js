/*
  Pictogrammes des catégories de missions, dessinés en SVG.

  Style unique pour tous :
  - une grille carrée de 96 x 96, un fond bleu clair et un tapis en bas ;
  - deux personnages en kimono blanc : ceinture BLEUE (celui qui fait la technique)
    et ceinture VIOLETTE (le partenaire) ;
  - contours noirs épais, couleurs plates, mêmes épaisseurs de trait partout.

  Un personnage se décrit avec quelques points (x, y) sur la grille :
  la tête, le cou, la hanche, puis ses bras et ses jambes (des lignes brisées).
*/
'use strict';

const PICTO = {
  contour: '#141414',
  kimono: '#ffffff',
  peau: '#f1cfa8',
  bleue: '#1d4ed8',
  violette: '#6d28d9',
  fond: '#e3eafb',
  tapis: '#e4cfa6',
  // épaisseurs de trait (identiques pour tous les pictogrammes)
  membreContour: 9, membre: 4.6,
  torseContour: 17, torse: 12.4,
  teteRayon: 7, teteContour: 3,
  fleche: 3.6,
};

const enChemin = (points) => 'M' + points.map((p) => p.join(' ')).join(' L');
const entre = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// Dessine un personnage en kimono
function personnage({ tete, cou, hanche, bras = [], jambes = [], ceinture }) {
  const P = PICTO;
  const membres = [...jambes, ...bras].map(enChemin);
  const torse = enChemin([cou, hanche]);
  const ceintureChemin = enChemin([entre(cou, hanche, 0.66), entre(cou, hanche, 0.9)]);
  const style = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';
  return `
    <g ${style} stroke="${P.contour}">
      ${membres.map((d) => `<path d="${d}" stroke-width="${P.membreContour}"/>`).join('')}
      <path d="${torse}" stroke-width="${P.torseContour}"/>
    </g>
    <g ${style} stroke="${P.kimono}">
      ${membres.map((d) => `<path d="${d}" stroke-width="${P.membre}"/>`).join('')}
      <path d="${torse}" stroke-width="${P.torse}"/>
    </g>
    <path d="${ceintureChemin}" stroke="${P[ceinture]}" stroke-width="${P.torse}" fill="none"/>
    <circle cx="${tete[0]}" cy="${tete[1]}" r="${P.teteRayon}" fill="${P.peau}"
      stroke="${P.contour}" stroke-width="${P.teteContour}"/>`;
}

// Une tête seule (pour la remettre au premier plan)
const tete = ([x, y]) => `<circle cx="${x}" cy="${y}" r="${PICTO.teteRayon}" fill="${PICTO.peau}"
  stroke="${PICTO.contour}" stroke-width="${PICTO.teteContour}"/>`;

// Un bras ou une jambe seul (pour le remettre au premier plan)
function membre(points) {
  const d = enChemin(points);
  const style = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';
  return `<path d="${d}" ${style} stroke="${PICTO.contour}" stroke-width="${PICTO.membreContour}"/>
    <path d="${d}" ${style} stroke="${PICTO.kimono}" stroke-width="${PICTO.membre}"/>`;
}

// Flèche noire : un chemin SVG + la pointe (3 points)
function fleche(chemin, pointe) {
  const style = `fill="none" stroke="${PICTO.contour}" stroke-width="${PICTO.fleche}" stroke-linecap="round" stroke-linejoin="round"`;
  return `<path d="${chemin}" ${style}/><path d="${enChemin(pointe)}" ${style}/>`;
}

// Petits traits qui montrent un mouvement (tape, impact)
function traits(liste) {
  return liste.map(([a, b]) => `<path d="${enChemin([a, b])}" fill="none" stroke="${PICTO.contour}" stroke-width="2.6" stroke-linecap="round"/>`).join('');
}

const DESSINS = {
  // Bleu (dessous) fauche les jambes de Violet, qui bascule
  balayage: () => `
    ${personnage({ ceinture: 'violette', tete: [80, 18], cou: [74, 26], hanche: [62, 44],
      jambes: [[[62, 44], [72, 54], [80, 66]], [[62, 44], [58, 58], [66, 70]]],
      bras: [[[74, 28], [84, 34], [90, 30]], [[72, 28], [66, 20], [62, 12]]] })}
    ${personnage({ ceinture: 'bleue', tete: [12, 66], cou: [20, 66], hanche: [38, 68],
      jambes: [[[38, 68], [48, 56], [58, 50]], [[38, 68], [56, 72], [70, 72]]],
      bras: [[[22, 64], [32, 56], [40, 52]]] })}
    ${fleche('M30 30 Q44 6 64 8', [[57, 3], [64, 8], [58, 14]])}`,

  // Violet (dessous) a les jambes en garde, Bleu les écarte et contourne
  passage: () => `
    ${personnage({ ceinture: 'violette', tete: [12, 66], cou: [20, 66], hanche: [38, 68],
      jambes: [[[38, 68], [42, 52], [32, 42]], [[38, 68], [48, 54], [42, 42]]],
      bras: [[[22, 64], [28, 56]]] })}
    ${personnage({ ceinture: 'bleue', tete: [56, 22], cou: [62, 30], hanche: [74, 46],
      jambes: [[[74, 46], [70, 60], [66, 74]], [[74, 46], [84, 60], [88, 74]]],
      bras: [[[62, 32], [52, 40], [44, 44]], [[64, 32], [52, 34], [40, 38]]] })}
    ${fleche('M24 30 Q24 12 42 12 Q58 12 60 6', [[53, 4], [60, 6], [56, 13]])}`,

  // Étranglement arrière : Bleu, assis derrière Violet, a le bras autour de son cou. Violet tape.
  soumission: () => `
    ${personnage({ ceinture: 'bleue', tete: [44, 26], cou: [38, 36], hanche: [30, 66],
      jambes: [[[30, 66], [50, 56], [60, 66]], [[30, 66], [46, 70], [62, 72]]],
      bras: [[[38, 38], [28, 46], [36, 52]]] })}
    ${personnage({ ceinture: 'violette', tete: [58, 30], cou: [56, 40], hanche: [50, 66],
      jambes: [[[50, 66], [70, 58], [76, 72]], [[50, 66], [72, 70], [90, 72]]],
      bras: [[[56, 42], [66, 50], [72, 58]]] })}
    ${membre([[40, 38], [52, 44], [64, 38]])}
    ${traits([[[80, 52], [84, 48]], [[82, 58], [88, 58]], [[78, 46], [80, 40]]])}`,

  // Violet est en tortue, Bleu est sur son dos : bras autour du cou, crochets dans les hanches
  dos: () => `
    ${personnage({ ceinture: 'violette', tete: [16, 58], cou: [24, 56], hanche: [58, 52],
      jambes: [[[58, 52], [58, 72], [76, 72]]],
      bras: [[[26, 58], [24, 66], [22, 72]]] })}
    ${personnage({ ceinture: 'bleue', tete: [24, 30], cou: [32, 38], hanche: [62, 34],
      jambes: [[[62, 34], [76, 46], [64, 60]], [[62, 34], [70, 50], [52, 60]]],
      bras: [[[32, 40], [20, 44], [16, 50]], [[34, 40], [32, 50], [26, 56]]] })}
    ${tete([16, 58])}`,

  // Bleu (debout) fait passer Violet par-dessus sa hanche
  projection: () => `
    ${personnage({ ceinture: 'bleue', tete: [30, 24], cou: [34, 32], hanche: [40, 52],
      jambes: [[[40, 52], [32, 62], [28, 74]], [[40, 52], [50, 62], [54, 74]]],
      bras: [[[36, 34], [48, 30], [56, 26]], [[36, 36], [48, 42], [58, 40]]] })}
    ${personnage({ ceinture: 'violette', tete: [76, 48], cou: [70, 40], hanche: [54, 22],
      jambes: [[[54, 22], [44, 12], [32, 10]], [[54, 22], [50, 10], [40, 4]]],
      bras: [[[70, 42], [80, 38]], [[68, 42], [72, 56]]] })}
    ${fleche('M86 14 Q94 26 88 36', [[84, 30], [88, 37], [94, 32]])}`,

  // Bleu est assis en montée sur Violet et le contrôle
  controle: () => `
    ${personnage({ ceinture: 'violette', tete: [12, 66], cou: [20, 66], hanche: [44, 68],
      jambes: [[[44, 68], [58, 58], [70, 70]], [[44, 68], [62, 66], [78, 72]]],
      bras: [[[22, 64], [26, 54], [32, 48]]] })}
    ${personnage({ ceinture: 'bleue', tete: [44, 18], cou: [44, 26], hanche: [44, 50],
      jambes: [[[44, 50], [56, 56], [56, 70]], [[44, 50], [32, 56], [30, 70]]],
      bras: [[[44, 28], [32, 38], [24, 50]], [[46, 28], [58, 36], [62, 46]]] })}`,

  // Violet est sur Bleu ; Bleu le repousse, sort la hanche et s'échappe
  echappement: () => `
    ${personnage({ ceinture: 'violette', tete: [60, 20], cou: [60, 28], hanche: [62, 50],
      jambes: [[[62, 50], [74, 58], [76, 72]], [[62, 50], [52, 58], [50, 70]]],
      bras: [[[60, 30], [52, 40], [46, 50]]] })}
    ${personnage({ ceinture: 'bleue', tete: [20, 64], cou: [28, 62], hanche: [52, 66],
      jambes: [[[52, 66], [66, 70], [84, 72]], [[52, 66], [62, 60], [70, 62]]],
      bras: [[[30, 60], [36, 48], [46, 40]], [[30, 62], [42, 54], [52, 48]]] })}
    ${fleche('M44 85 H12', [[18, 80], [12, 85], [18, 90]])}`,
};

// Le pictogramme complet (fond + tapis + dessin)
function dessinPicto(cle, titre) {
  return `<svg viewBox="0 0 96 96" role="img" aria-label="${titre}">
    <rect width="96" height="96" fill="${PICTO.fond}"/>
    <rect y="74" width="96" height="22" fill="${PICTO.tapis}"/>
    ${DESSINS[cle]()}
  </svg>`;
}
