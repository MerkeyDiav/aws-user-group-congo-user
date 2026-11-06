# ---------------------------------------------------------------------------
# Formulaires du site : table DynamoDB + Lambda + notification e-mail via SNS
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

# Notifications par e-mail via SNS : pas besoin de nom de domaine, et les e-mails partent
# de no-reply@sns.amazonaws.com (authentifié par AWS, donc pas classé en spam par Gmail).
# Au premier déploiement, AWS envoie un e-mail « Subscription Confirmation » : cliquer sur le lien.
resource "aws_sns_topic" "notify" {
  name = "${var.prefix}-submissions-notify"
}

resource "aws_sns_topic_subscription" "notify_email" {
  topic_arn = aws_sns_topic.notify.arn
  protocol  = "email"
  endpoint  = var.notify_email
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

# Droits minimaux : écrire dans la table, publier sur le topic de notification, écrire ses logs.
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
        Action   = ["sns:Publish"]
        Resource = aws_sns_topic.notify.arn
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
      TOPIC_ARN  = aws_sns_topic.notify.arn
    }
  }

  depends_on = [aws_cloudwatch_log_group.submissions]
}
