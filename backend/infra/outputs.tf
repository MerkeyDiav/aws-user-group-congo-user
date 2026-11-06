output "api_url" {
  description = "URL de l'API à renseigner dans VITE_API_URL (Vercel)"
  value       = aws_apigatewayv2_api.this.api_endpoint
}

output "submissions_table" {
  value = aws_dynamodb_table.submissions.name
}
