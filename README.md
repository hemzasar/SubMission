# SubMission

Le jeu de missions secrètes pour le sparring de JJB : *submission* (soumission) + *mission*.
Une web app qu'on installe sur l'écran d'accueil du téléphone et qu'on se passe entre joueurs.
Pas de serveur, pas de compte, et ça marche hors ligne une fois installé.

## Les fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | La page (presque vide, le jeu est dessiné par `app.js`) |
| `style.css` | Les couleurs et la mise en page (thème sombre, gros boutons) |
| `app.js` | Toute la logique du jeu (Duel, Undercover, chrono, scores) |
| `missions.json` | **La liste des missions** : c'est ici que tu en ajoutes |
| `manifest.json` | La carte d'identité de l'app pour l'installation (nom, icône, couleurs) |
| `sw.js` | Le « service worker » : garde une copie de l'app pour jouer sans réseau |
| `icons/` | Le logo, en plusieurs tailles |

## Les modes de jeu

- **Duel** (2 joueurs) : missions secrètes, chrono, points, devinette.
- **Undercover** (3 à 10 joueurs) : tout le monde a la même technique sauf un intrus, à démasquer.
- **Qui paie ?** (3 à 16 joueurs) : tournoi à l'envers. Chaque match se joue comme un Duel,
  le gagnant est sauvé, les perdants continuent. Le dernier a le gage (par défaut « Paie le repas »).

Au premier lancement dans le navigateur, un guide explique comment installer l'appli sur l'écran d'accueil.
On le retrouve avec le lien « Installer l'appli » sur l'accueil.

## Ajouter ou modifier une mission

Ouvre `missions.json` et copie une ligne existante :

```json
{ "nom": "Kimura", "niveau": "blanche", "difficulte": "soumission", "tenue": "les deux", "categorie": "clé de bras" },
```

- `niveau` : `blanche`, `bleue` ou `violette` (violette = violette et plus). Un joueur bleu reçoit aussi les missions blanches.
- `difficulte` : `facile` (1 pt), `moyen` (2 pts), `difficile` (3 pts), `soumission` (5 pts).
- `tenue` : `gi`, `no-gi` ou `les deux`.
- `categorie` : choisit le pictogramme (balayage, passage, prise de dos, projection, position, échappement ;
  étranglement, clé de bras, clé de jambe et torsion ont le pictogramme « Soumission »). Elle sert aussi au mode Undercover, où l'intrus reçoit une technique de la même catégorie, donc proche.

Attention à la virgule entre chaque mission (mais pas après la dernière) et aux guillemets droits `"`.
Une mission mal écrite est simplement ignorée.

## Tester sur ton ordinateur

Double-cliquer sur `index.html` ne marche pas : le navigateur refuse de lire `missions.json` en direct.
Ouvre un terminal dans le dossier du projet et lance :

```bash
python3 -m http.server 8000
```

Puis ouvre http://localhost:8000 dans ton navigateur.

## Mettre en ligne (gratuit, avec GitHub Pages)

1. Sur GitHub, dans le dépôt : **Settings → Pages**.
2. Sous « Build and deployment », choisis **Deploy from a branch**, la branche `main` et le dossier `/ (root)`, puis **Save**.
3. Après une minute, l'app est en ligne à l'adresse `https://<ton-pseudo>.github.io/SubMission/`.

## Installer sur le téléphone

- **iPhone (Safari)** : ouvre l'adresse, touche le bouton Partager, puis **Sur l'écran d'accueil**.
- **Android (Chrome)** : ouvre l'adresse, menu ⋮, puis **Installer l'application** (ou **Ajouter à l'écran d'accueil**).

## Après une modification

Change le numéro dans `sw.js` (`submission-v1` → `submission-v2`) pour que les téléphones récupèrent la nouvelle version.

## Statistiques (anonymes, sans cookies)

- **Visites** : Cloudflare Web Analytics est déjà installé (le code est en bas de `index.html`).
- **Événements** (partie lancée, partie terminée, mode joué) : Cloudflare ne sait pas les suivre.
  L'app les envoie à **GoatCounter**, gratuit et sans cookies, dès que tu l'actives :
  1. Crée un compte gratuit sur https://www.goatcounter.com et choisis un code (par exemple `submission`).
  2. Dans `index.html`, en bas, enlève les lignes `<!--` et `-->` autour du script GoatCounter
     et remplace `TON-CODE` par ton code.
  3. Change la version dans `sw.js`, puis envoie sur GitHub.

  Les événements apparaissent dans GoatCounter sous les noms `partie-lancee`, `partie-terminee`,
  `mode-duel` et `mode-undercover`. Les noms des joueurs ne sont jamais envoyés.
