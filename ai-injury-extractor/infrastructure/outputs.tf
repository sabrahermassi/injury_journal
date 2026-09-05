output "api_gateway_url" {
  value = "${aws_api_gateway_stage.dev.invoke_url}/extract"
}

# The ARN, not the name: the name is a fixed string you already know, whereas
# the ARN carries a generated suffix and is what `aws lambda
# update-function-configuration` needs for GROQ_SECRET_ARN.
output "groq_secret_arn" {
  value = aws_secretsmanager_secret.groq_api_key.arn
}
