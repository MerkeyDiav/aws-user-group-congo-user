# ---------------------------------------------------------------------------
# Connexion à l'espace admin : Cognito (offre Lite, gratuite sous 10 000 utilisateurs actifs/mois)
# ---------------------------------------------------------------------------
# Pas d'inscription libre : seuls les comptes listés dans var.admin_emails existent.
# Chaque admin reçoit un mot de passe temporaire par e-mail (expéditeur no-reply@verificationemail.com)
# et doit le changer à la première connexion.

resource "aws_cognito_user_pool" "admins" {
  name                = "${var.prefix}-admins"
  user_pool_tier      = "LITE"
  deletion_protection = "ACTIVE"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  admin_create_user_config {
    allow_admin_create_user_only = true

    invite_message_template {
      email_subject = "Votre accès à l'espace admin - AWS User Group Kinshasa"
      email_message = "Bonjour,<br><br>Un compte admin a été créé pour vous sur le site de l'AWS User Group Congo-Kinshasa.<br><br>Identifiant : {username}<br>Mot de passe temporaire : <b>{####}</b><br><br>Connectez-vous sur la page /admin du site : vous choisirez alors votre propre mot de passe. Ce mot de passe temporaire expire dans 7 jours."
      sms_message   = "AWS UG Kinshasa - identifiant {username}, mot de passe temporaire {####}"
    }
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Code de vérification - AWS User Group Kinshasa"
    email_message        = "Votre code de vérification : <b>{####}</b><br><br>Si vous n'avez rien demandé, ignorez cet e-mail."
  }

  password_policy {
    minimum_length                   = 12
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }
}

# Client « navigateur » : pas de secret (application publique), connexion par e-mail + mot de passe.
resource "aws_cognito_user_pool_client" "admin_web" {
  name         = "${var.prefix}-admin-web"
  user_pool_id = aws_cognito_user_pool.admins.id

  generate_secret                      = false
  explicit_auth_flows                  = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  prevent_user_existence_errors        = "ENABLED"
  enable_token_revocation              = true
  auth_session_validity                = 10
  access_token_validity                = 60
  id_token_validity                    = 60
  refresh_token_validity               = 30
  allowed_oauth_flows_user_pool_client = false

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}

resource "aws_cognito_user" "admins" {
  for_each     = toset(var.admin_emails)
  user_pool_id = aws_cognito_user_pool.admins.id
  username     = each.value

  attributes = {
    email          = each.value
    email_verified = true
  }

  desired_delivery_mediums = ["EMAIL"]
}
