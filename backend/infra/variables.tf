variable "region" {
  description = "Région AWS du backend"
  type        = string
  default     = "us-east-2"
}

variable "prefix" {
  description = "Préfixe des noms de ressources"
  type        = string
  default     = "awsug-kin"
}

variable "notify_email" {
  description = "Adresse qui reçoit les notifications des formulaires (abonnée au topic SNS)"
  type        = string
  default     = "nehemiediav@gmail.com"
}

variable "allowed_origins" {
  description = "Origines autorisées à appeler l'API (CORS) : domaine Vercel + développement local"
  type        = list(string)
  default     = ["http://localhost:5173", "http://localhost:4173"]
}

variable "budget_limit_usd" {
  description = "Seuil mensuel de l'alerte budget, en dollars"
  type        = string
  default     = "10"
}

variable "log_retention_days" {
  description = "Durée de conservation des logs CloudWatch"
  type        = number
  default     = 14
}
