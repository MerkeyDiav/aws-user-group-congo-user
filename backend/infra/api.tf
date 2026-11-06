# ---------------------------------------------------------------------------
# API HTTP (API Gateway v2) — point d'entrée unique du backend
# ---------------------------------------------------------------------------

resource "aws_apigatewayv2_api" "this" {
  name          = "${var.prefix}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = var.allowed_origins
    allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    allow_headers = ["content-type", "authorization"]
    max_age       = 3600
  }
}

locals {
  public_content_routes = ["GET /site", "GET /events", "GET /posts"]
  admin_routes = [
    "GET /admin/events",
    "PUT /admin/events/{id}",
    "DELETE /admin/events/{id}",
    "PUT /admin/site",
    "GET /admin/submissions",
    "PATCH /admin/submissions/{id}",
    "DELETE /admin/submissions/{id}",
    "POST /admin/uploads",
    "POST /admin/uploads/video",
    "GET /admin/posts",
    "PUT /admin/posts/{id}",
    "DELETE /admin/posts/{id}",
  ]
}

# Limites de débit : larges pour la lecture du site, strictes pour les formulaires publics.
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 100
    throttling_rate_limit  = 50
  }

  route_settings {
    route_key              = aws_apigatewayv2_route.submissions.route_key
    throttling_burst_limit = 10
    throttling_rate_limit  = 5
  }
}

# --- Formulaires publics ----------------------------------------------------

resource "aws_apigatewayv2_integration" "submissions" {
  api_id                 = aws_apigatewayv2_api.this.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.submissions.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "submissions" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "POST /submissions/{type}"
  target    = "integrations/${aws_apigatewayv2_integration.submissions.id}"
}

resource "aws_lambda_permission" "api_submissions" {
  statement_id  = "AllowApiGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.submissions.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}

# --- Lecture publique du contenu ---------------------------------------------

resource "aws_apigatewayv2_integration" "content" {
  api_id                 = aws_apigatewayv2_api.this.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.content.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "content" {
  for_each  = toset(local.public_content_routes)
  api_id    = aws_apigatewayv2_api.this.id
  route_key = each.value
  target    = "integrations/${aws_apigatewayv2_integration.content.id}"
}

resource "aws_lambda_permission" "api_content" {
  statement_id  = "AllowApiGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.content.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}

# --- Espace admin (jeton Cognito obligatoire) --------------------------------

resource "aws_apigatewayv2_authorizer" "admin" {
  api_id           = aws_apigatewayv2_api.this.id
  name             = "cognito-admins"
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.admin_web.id]
    issuer   = "https://${aws_cognito_user_pool.admins.endpoint}"
  }
}

resource "aws_apigatewayv2_integration" "admin" {
  api_id                 = aws_apigatewayv2_api.this.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.admin.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "admin" {
  for_each           = toset(local.admin_routes)
  api_id             = aws_apigatewayv2_api.this.id
  route_key          = each.value
  target             = "integrations/${aws_apigatewayv2_integration.admin.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.admin.id
}

resource "aws_lambda_permission" "api_admin" {
  statement_id  = "AllowApiGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.admin.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}
