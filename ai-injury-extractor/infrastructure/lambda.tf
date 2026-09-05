resource "aws_lambda_function" "injury_extractor" {
  function_name = "injury-extractor"

  filename = "../lambda/function.zip"

  source_code_hash = filebase64sha256("../lambda/function.zip")

  handler = "handler.lambda_handler"
  runtime = "python3.12"

  timeout = 20

  role = aws_iam_role.lambda_role.arn

  # GROQ_SECRET_ARN is the ARN, never the key itself: Terraform records
  # environment variable values in its state file in plaintext (issue #36).
  # handler.py resolves it via Secrets Manager at cold start.
  environment {
    variables = {
      GROQ_SECRET_ARN = aws_secretsmanager_secret.groq_api_key.arn
      GROQ_MODEL      = var.groq_model
      DYNAMODB_TABLE  = aws_dynamodb_table.injury_entries.name
      ALLOWED_ORIGIN  = var.allowed_origin
    }
  }
}
