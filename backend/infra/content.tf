# ---------------------------------------------------------------------------
# Contenu du site : tables DynamoDB + Lambda publique (lecture) + Lambda admin (écriture)
# ---------------------------------------------------------------------------

data "aws_caller_identity" "current" {}

# Un seul élément (id = "site") : bannière, galerie, leaders, contact, réseaux…
resource "aws_dynamodb_table" "site" {
  name         = "${var.prefix}-site"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  deletion_protection_enabled = true
}

# Un élément par événement (id = identifiant lisible utilisé dans l'URL).
resource "aws_dynamodb_table" "events" {
  name         = "${var.prefix}-events"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  deletion_protection_enabled = true
}

# Publications de la section « Actualités » (posts écrits et vidéos, programmés par date).
resource "aws_dynamodb_table" "posts" {
  name         = "${var.prefix}-posts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  deletion_protection_enabled = true
}

# --- Lambda publique : GET /site, GET /events, GET /posts (lecture seule) ---

data "archive_file" "content" {
  type        = "zip"
  source_dir  = "${path.module}/../functions/content"
  output_path = "${path.module}/../.build/content.zip"
}

resource "aws_iam_role" "content" {
  name               = "${var.prefix}-content-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "content" {
  name = "content"
  role = aws_iam_role.content.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:Scan"]
        Resource = [aws_dynamodb_table.site.arn, aws_dynamodb_table.events.arn, aws_dynamodb_table.posts.arn]
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.content.arn}:*"
      },
    ]
  })
}

resource "aws_cloudwatch_log_group" "content" {
  name              = "/aws/lambda/${var.prefix}-content"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "content" {
  function_name    = "${var.prefix}-content"
  role             = aws_iam_role.content.arn
  runtime          = "nodejs22.x"
  architectures    = ["arm64"]
  handler          = "index.handler"
  filename         = data.archive_file.content.output_path
  source_code_hash = data.archive_file.content.output_base64sha256
  memory_size      = 256
  timeout          = 10

  environment {
    variables = {
      SITE_TABLE   = aws_dynamodb_table.site.name
      EVENTS_TABLE = aws_dynamodb_table.events.name
      POSTS_TABLE  = aws_dynamodb_table.posts.name
    }
  }

  depends_on = [aws_cloudwatch_log_group.content]
}

# --- Lambda admin : routes /admin/* (protégées par Cognito) -----------------

data "archive_file" "admin" {
  type        = "zip"
  source_dir  = "${path.module}/../functions/admin"
  output_path = "${path.module}/../.build/admin.zip"
}

resource "aws_iam_role" "admin" {
  name               = "${var.prefix}-admin-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy" "admin" {
  name = "admin"
  role = aws_iam_role.admin.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:Scan", "dynamodb:PutItem", "dynamodb:DeleteItem"]
        Resource = [aws_dynamodb_table.site.arn, aws_dynamodb_table.events.arn, aws_dynamodb_table.posts.arn]
      },
      {
        Effect   = "Allow"
        Action   = ["dynamodb:Scan", "dynamodb:UpdateItem", "dynamodb:DeleteItem"]
        Resource = aws_dynamodb_table.submissions.arn
      },
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject"]
        Resource = "${aws_s3_bucket.media.arn}/uploads/*"
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.admin.arn}:*"
      },
    ]
  })
}

resource "aws_cloudwatch_log_group" "admin" {
  name              = "/aws/lambda/${var.prefix}-admin"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "admin" {
  function_name    = "${var.prefix}-admin"
  role             = aws_iam_role.admin.arn
  runtime          = "nodejs22.x"
  architectures    = ["arm64"]
  handler          = "index.handler"
  filename         = data.archive_file.admin.output_path
  source_code_hash = data.archive_file.admin.output_base64sha256
  memory_size      = 512
  timeout          = 15

  environment {
    variables = {
      SITE_TABLE        = aws_dynamodb_table.site.name
      EVENTS_TABLE      = aws_dynamodb_table.events.name
      SUBMISSIONS_TABLE = aws_dynamodb_table.submissions.name
      POSTS_TABLE       = aws_dynamodb_table.posts.name
      MEDIA_BUCKET      = aws_s3_bucket.media.bucket
      MEDIA_BASE_URL    = "https://${aws_cloudfront_distribution.media.domain_name}"
    }
  }

  depends_on = [aws_cloudwatch_log_group.admin]
}
