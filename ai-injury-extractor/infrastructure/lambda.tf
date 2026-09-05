resource "aws_lambda_function" "injury_extractor" {
  function_name = "injury-extractor"

  filename = "../lambda/function.zip"

  source_code_hash = filebase64sha256("../lambda/function.zip")

  handler = "handler.lambda_handler"
  runtime = "python3.12"

  timeout = 20

  role = aws_iam_role.lambda_role.arn

  environment {
    variables = {
      GROQ_API_KEY = var.groq_api_key
      GROQ_MODEL = var.groq_model
      DYNAMODB_TABLE = aws_dynamodb_table.injury_entries.name
      ALLOWED_ORIGIN = var.allowed_origin
      JWT_SECRET = var.jwt_secret
    }
  }
}
