# AWS User Group Congo-Kinshasa — Site web

Site officiel de l'AWS User Group Congo-Kinshasa, co-dirigé par **Nehemie Nzuzi** et **Hariton** (AWS Community Leaders).

```
aws-user-group-ck/
├── frontend/      ← Site public (Vite + React)            ✅ en place
├── backend/       ← API serverless (Lambda + DynamoDB)     🔜 à venir
└── backoffice/    ← Interface d'administration (Cognito)   🔜 à venir
```

## Frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
npm run build     # génère dist/ (à déployer sur S3 + CloudFront)
```

### Pages

| Route                  | Page                                              |
| ---------------------- | ------------------------------------------------- |
| `/`                    | Accueil : bannière, prochain événement, stats…    |
| `/a-propos`            | Mission, valeurs, leaders, FAQ                    |
| `/evenements`          | Événements à venir / passés (recherche + filtres) |
| `/evenements/:id`      | Détail d'un événement (programme, speakers…)      |
| `/rejoindre`           | Avantages + formulaire d'adhésion                 |
| `/speakers`            | Call for Speakers + formulaire de candidature     |
| `/contact`             | Coordonnées + formulaire de contact               |

### Modifier le contenu (en attendant le back office)

Tout le contenu est séparé du code :

- **`frontend/src/data/site.json`** : textes de la bannière, images du hero, statistiques, contact, réseaux sociaux, leaders.
- **`frontend/src/data/events.json`** : liste des événements. Le classement « à venir » / « passés » se fait automatiquement selon la date.
- **Images** : à placer dans `frontend/public/images/` et à référencer par exemple ainsi : `"/images/team/nehemie.jpg"`.

Photos attendues par défaut (si une image est absente, un fond bleu nuit s'affiche à la place) :

| Fichier                                       | Emplacement sur le site                   |
| --------------------------------------------- | ----------------------------------------- |
| `public/images/hero/banner.jpg`               | Bannière d'accueil (paysage, ≥ 1920 px). Actuellement : Kinshasa vue du fleuve, photo de [Valdhy Mbemba sur Unsplash](https://unsplash.com/photos/ndkFh1fIsvA) (licence Unsplash, crédit affiché via `hero.credit`) |
| `public/images/activities/*.jpg`              | Tuiles Meetups / Webinaires / Workshops / Certifications (photos Unsplash, à remplacer par vos photos d'événements) |
| `public/images/pages/kinshasa-echangeur.jpg`  | En-tête « À propos » (photo fournie, © Jeremiebe) |
| `public/images/pages/tour-echangeur.jpg`      | En-tête « Événements » et pages événement (photo fournie) |
| `public/images/pages/rejoindre.jpg`, `speakers.jpg`, `contact.jpg` | En-têtes Rejoindre / Speakers / Contact (Unsplash) |
| `public/images/logo/`                         | Logo du groupe (menu, pied de page, favicon) |
| `public/images/gallery/*.jpg`                 | Galerie « En images » de l'accueil : photos d'illustration Unsplash, **à remplacer par les vraies photos des événements**. Liste et légendes dans `site.json` → `gallery` (`size` : `big`, `tall`, `wide` ou rien) |
| `public/images/team/…`                        | Photos des leaders (champ `photo`)        |
| `public/images/events/…`                      | Visuel d'un événement (champ `image`)     |

Les images des en-têtes se changent dans `site.json` → `pageImages`. Les photos Unsplash sont sous [licence Unsplash](https://unsplash.com/license) (usage libre) : [Meetups](https://unsplash.com/photos/dxyyr_UzH6Q), [Webinaires](https://unsplash.com/photos/T_CkxezKRTA), [Workshops](https://unsplash.com/photos/IgUR1iX0mqM), [Certifications](https://unsplash.com/photos/rg1y72eKw6o), [Speakers](https://unsplash.com/photos/j6QC0XoxMrE), [Rejoindre](https://unsplash.com/photos/rOIIHqh2itM), [Contact](https://unsplash.com/photos/dRcmuwABzKI).

**Bannière** : si vous mettez plusieurs images dans `hero.images` (dans `site.json`), elles défilent automatiquement en fondu. Dans le titre, le mot placé entre accolades (`{Cloud}`) s'affiche en orange.

### Préparation du backend

Toute la lecture et l'écriture de données passent par `frontend/src/services/api.js`. Une fois l'API prête, il suffit de définir :

```
VITE_API_URL=https://xxxx.execute-api.<region>.amazonaws.com/prod
```

Les pages consomment alors automatiquement l'API, sans autre modification :

- `GET /site`, `GET /events` : même format que les JSON actuels
- `POST /submissions/{contact|join|speaker}` : formulaires

Sans `VITE_API_URL`, le site tourne en **mode démo** : les formulaires simulent un envoi réussi, visible dans la console.

### Architecture cible (serverless)

- **Hébergement** : S3 + CloudFront (rediriger les erreurs 403/404 vers `/index.html` pour le routage SPA)
- **API** : API Gateway + Lambda
- **Données** : DynamoDB (events, site, submissions)
- **Médias** : S3 (upload depuis le back office)
- **Back office** : authentification Cognito, CRUD des événements et du contenu, lecture des candidatures
- **Notifications** : SES pour les e-mails de confirmation
