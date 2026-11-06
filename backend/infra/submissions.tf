# ---------------------------------------------------------------------------
# Formulaires du site : table DynamoDB + Lambda + e-mail SES
# ---------------------------------------------------------------------------

resource "aws_dynamodb_table" "submissions" {
  name         = "${var.prefix}-submissions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
  attribute {
    name = "type"
    type = "S"
  }
  attribute {
    name = "createdAt"
    type = "S"
  }

  # Pour lister les soumissions d'un type, de la plus récente à la plus ancienne (back office).
  global_secondary_index {
    name            = "byTypeAndDate"
    hash_key        = "type"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  deletion_protection_enabled = true
}

# Adresse d'envoi/réception. AWS envoie un lien de confirmation à cette adresse au premier déploiement.
resource "aws_sesv2_email_identity" "notify" {
  email_identity = var.notify_email
}

data "archive_file" "submissions" {
  type        = "zip"
  source_dir  = "${path.module}/../functions/submissions"
  output_path = "${path.module}/../.build/submissions.zip"
}

resource "aws_iam_role" "submissions" {
  name = "${var.prefix}-submissions-lambda"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# Droits minimaux : écrire dans la table, envoyer depuis l'identité SES, écrire ses logs.
resource "aws_iam_role_policy" "submissions" {
  name = "submissions"
  role = aws_iam_role.submissions.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:PutItem"]
        Resource = aws_dynamodb_table.submissions.arn
      },
      {
        Effect   = "Allow"
        Action   = ["ses:SendEmail"]
        Resource = aws_sesv2_email_identity.notify.arn
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.submissions.arn}:*"
      },
    ]
  })
}

resource "aws_cloudwatch_log_group" "submissions" {
  name              = "/aws/lambda/${var.prefix}-submissions"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "submissions" {
  function_name    = "${var.prefix}-submissions"
  role             = aws_iam_role.submissions.arn
  runtime          = "nodejs22.x"
  architectures    = ["arm64"]
  handler          = "index.handler"
  filename         = data.archive_file.submissions.output_path
  source_code_hash = data.archive_file.submissions.output_base64sha256
  memory_size      = 256
  timeout          = 10

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.submissions.name
      NOTIFY_TO  = var.notify_email
      MAIL_FROM  = "AWS User Group Kinshasa <${var.notify_email}>"
    }
  }

  depends_on = [aws_cloudwatch_log_group.submissions]
}
