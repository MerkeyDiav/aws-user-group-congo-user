# ---------------------------------------------------------------------------
# API HTTP (API Gateway v2) — point d'entrée unique du backend
# ---------------------------------------------------------------------------

resource "aws_apigatewayv2_api" "this" {
  name          = "${var.prefix}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = var.allowed_origins
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["content-type", "authorization"]
    max_age       = 3600
  }
}

# Limite de débit globale : protège contre les abus et plafonne la facture.
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 10
    throttling_rate_limit  = 5
  }
}

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
