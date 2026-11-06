# Backend — AWS User Group Congo-Kinshasa

Backend serverless sur AWS (compte 533003975207, région **us-east-2 / Ohio**), décrit en Terraform.
Le frontend est hébergé sur Vercel et appelle cette API.

## Phase 1 : formulaires du site

```
Site (Vercel) ── POST /submissions/{contact|join|speaker} ──► API Gateway (HTTP API, limite 5 req/s)
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

## Voir les soumissions (en attendant le back office)

```bash
aws dynamodb query --region us-east-2 --table-name awsug-kin-submissions \
  --index-name byTypeAndDate --key-condition-expression "#t = :t" \
  --expression-attribute-names '{"#t":"type"}' --expression-attribute-values '{":t":{"S":"speaker"}}' \
  --no-scan-index-forward
```
