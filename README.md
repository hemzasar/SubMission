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

## Ajouter ou modifier une mission

Ouvre `missions.json` et copie une ligne existante :

```json
{ "nom": "Kimura", "niveau": "blanche", "difficulte": "soumission", "tenue": "les deux", "categorie": "clé de bras" },
```

- `niveau` : `blanche`, `bleue` ou `violette` (violette = violette et plus). Un joueur bleu reçoit aussi les missions blanches.
- `difficulte` : `facile` (1 pt), `moyen` (2 pts), `difficile` (3 pts), `soumission` (5 pts).
- `tenue` : `gi`, `no-gi` ou `les deux`.
- `categorie` : sert au mode Undercover, où l'intrus reçoit une technique de la même catégorie, donc proche.

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
