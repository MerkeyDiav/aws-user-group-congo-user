# AWS User Group Congo-Kinshasa — Site web

Site officiel de l'AWS User Group Congo-Kinshasa, co-dirigé par **Nehemie Nzuzi** et **Hariton** (AWS Community Leaders).

```
aws-user-group-ck/
├── frontend/      ← Site public + espace admin /admin (Vite + React), hébergé sur Vercel
└── backend/       ← API serverless AWS (Lambda, DynamoDB, Cognito, S3, CloudFront), en Terraform
```

## Frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
npm run build     # génère dist/ (déployé automatiquement par Vercel à chaque push sur main)
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
| `/admin`               | Espace admin (connexion obligatoire)              |

### Modifier le contenu

Tout le contenu se gère depuis l'**espace admin** (`/admin` sur le site), sans toucher au code :

- **Événements** : créer, modifier, supprimer ; brouillon ou publié ; speakers, programme, replay, slides.
- **Contenu du site** : bannière, galerie, leaders, activités, chiffres clés, images d'en-tête, contact et réseaux.
- **Soumissions** : messages de contact, adhésions et candidatures speakers.
- **Photos** : envoyées depuis l'admin, réduites dans le navigateur, stockées sur S3 et servies par CloudFront.

Le contenu est stocké dans DynamoDB et lu par le site via l'API (`GET /site`, `GET /events`). Le contenu de
départ (importé une fois avec `backend/scripts/seed.mjs`) se trouve dans `backend/seed/`.

Les images par défaut de `frontend/public/images/` (photos Unsplash sous [licence Unsplash](https://unsplash.com/license),
bannière de [Valdhy Mbemba](https://unsplash.com/photos/ndkFh1fIsvA), en-tête « À propos » © Jeremiebe) restent
utilisées tant qu'elles ne sont pas remplacées depuis l'admin.

Dans le titre de la bannière, le mot placé entre accolades (`{Cloud}`) s'affiche en orange.

### Configuration

`frontend/.env.production` contient l'URL de l'API et l'identifiant Cognito (valeurs publiques, issues de
`terraform output`). Voir `frontend/.env.example` pour le développement local.

Détails du backend, déploiement et coûts : [`backend/README.md`](backend/README.md).
