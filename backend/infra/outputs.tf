output "api_url" {
  description = "URL de l'API à renseigner dans VITE_API_URL (Vercel)"
  value       = aws_apigatewayv2_api.this.api_endpoint
}

output "submissions_table" {
  value = aws_dynamodb_table.submissions.name
}

output "site_table" {
  value = aws_dynamodb_table.site.name
}

output "events_table" {
  value = aws_dynamodb_table.events.name
}

output "cognito_client_id" {
  description = "VITE_COGNITO_CLIENT_ID"
  value       = aws_cognito_user_pool_client.admin_web.id
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.admins.id
}

output "media_url" {
  description = "Adresse publique des photos envoyées depuis l'admin"
  value       = "https://${aws_cloudfront_distribution.media.domain_name}"
}
