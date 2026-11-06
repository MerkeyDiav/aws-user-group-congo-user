# Backend — AWS User Group Congo-Kinshasa

Backend serverless sur AWS (compte 533003975207, région **us-east-2 / Ohio**), décrit en Terraform.
Le frontend est hébergé sur Vercel et appelle cette API.

## Phase 1 : formulaires du site

```
Site (Vercel) ── POST /submissions/{contact|join|speaker} ──► API Gateway (HTTP API, limite 5 req/s sur cette route)
                                                                  │
                                                                  ▼
                                                     Lambda awsug-kin-submissions (Node.js 22, arm64)
                                                        ├─► DynamoDB awsug-kin-submissions
                                                        └─► SNS ──► nehemiediav@gmail.com (e-mail texte)
```

| Fichier | Contenu |
| --- | --- |
| `functions/submissions/index.mjs` | Validation, champ piège anti-robots, enregistrement, e-mail |
| `infra/bootstrap/` | Bucket S3 de l'état Terraform (à appliquer une seule fois) |
| `infra/*.tf` | Table, Lambda, IAM, API, topic SNS, alerte budget |

## Déployer

Prérequis : AWS CLI configurée sur le compte, Terraform ≥ 1.10.

```bash
# 1. Une seule fois : bucket d'état
cd backend/infra/bootstrap
terraform init && terraform apply

# 2. Backend
cd ..
terraform init
terraform apply
terraform output api_url
```

Après le premier `apply` :

1. **Cliquer sur « Confirm subscription »** dans l'e-mail « AWS Notification - Subscription Confirmation » reçu sur nehemiediav@gmail.com. Sans ça, les formulaires sont enregistrés mais aucun e-mail ne part. Ne jamais cliquer sur le lien « unsubscribe » en bas des notifications : il coupe l'abonnement (il faudrait redéployer pour le recréer).

   Pourquoi SNS et pas SES : sans nom de domaine, un e-mail SES « de » une adresse Gmail échoue aux contrôles d'authentification de Gmail et finit en spam. Avec un domaine, on pourra revenir à SES (e-mails HTML, bouton Répondre).
2. Dans Vercel, définir `VITE_API_URL` = la valeur de `api_url`, puis redéployer.
3. Ajouter le domaine Vercel aux origines autorisées (CORS), par exemple dans `infra/terraform.tfvars` :
   ```hcl
   allowed_origins = ["https://votre-site.vercel.app", "http://localhost:5173"]
   ```
   puis `terraform apply`.

## Coût estimé

Quelques centimes par mois au volume d'un user group : Lambda, API Gateway et DynamoDB à la demande restent dans
le niveau gratuit, et SNS envoie 1 000 e-mails/mois gratuitement. Une alerte budget prévient à 80 % de 10 $/mois.

## Phase 2 : contenu du site et espace admin

```
Site (Vercel) ── GET /site, GET /events ──────────► Lambda awsug-kin-content (lecture seule)
                                                        └─► DynamoDB awsug-kin-site, awsug-kin-events

/admin ── connexion ──► Cognito (offre Lite, comptes créés par Terraform uniquement)
       └─ jeton ──► /admin/* (autorisation JWT API Gateway) ──► Lambda awsug-kin-admin
                                                        ├─► DynamoDB site, events, submissions
                                                        └─► S3 awsug-kin-media-* ──► CloudFront (photos)
```

| Fichier | Contenu |
| --- | --- |
| `functions/content/index.mjs` | Lecture publique : réglages du site et événements publiés (brouillons exclus) |
| `functions/admin/index.mjs` | Routes admin, validation stricte par schéma, envoi de photos (contenu vérifié) |
| `infra/content.tf` | Tables site et events, Lambdas content et admin, droits IAM |
| `infra/auth.tf` | Cognito : pool d'utilisateurs, client navigateur, comptes admins |
| `infra/media.tf` | Bucket S3 privé, CloudFront avec Origin Access Control |
| `seed/`, `scripts/seed.mjs` | Contenu de départ, à importer une seule fois |

### Après le premier déploiement

```bash
node backend/scripts/seed.mjs   # refuse d'écraser une table déjà remplie (--force pour forcer)
```

Chaque compte admin reçoit un e-mail de `no-reply@verificationemail.com` avec un mot de passe temporaire
(valable 7 jours) à changer à la première connexion sur `/admin`.

### Ajouter ou retirer un admin

Modifier `admin_emails` dans `infra/variables.tf` (ou `terraform.tfvars`), puis `terraform plan` et `terraform apply`.

### Mettre à jour le frontend après un changement d'infrastructure

Les valeurs de `terraform output` (`api_url`, `cognito_client_id`) sont reprises dans `frontend/.env.production`.
