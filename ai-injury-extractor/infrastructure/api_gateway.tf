resource "aws_api_gateway_rest_api" "injury_api" {
  name = "injury-extractor-api"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_resource" "extract" {
  rest_api_id = aws_api_gateway_rest_api.injury_api.id
  parent_id   = aws_api_gateway_rest_api.injury_api.root_resource_id
  path_part   = "extract"
}

resource "aws_api_gateway_resource" "injuries" {
  rest_api_id = aws_api_gateway_rest_api.injury_api.id
  parent_id   = aws_api_gateway_rest_api.injury_api.root_resource_id
  path_part   = "injuries"
}

resource "aws_api_gateway_method" "extract_post" {
  rest_api_id = aws_api_gateway_rest_api.injury_api.id
  resource_id = aws_api_gateway_resource.extract.id

  http_method = "POST"

  # "NONE" is API Gateway's own authorizer, not the absence of auth: the Lambda
  # itself rejects any request without a matching X-Extractor-Secret (403). A
  # gateway authorizer would have to be an IAM/Cognito/custom one, none of which
  # fits a single trusted server-to-server caller.
  authorization = "NONE"
}

resource "aws_api_gateway_method" "injuries_get" {
  rest_api_id = aws_api_gateway_rest_api.injury_api.id
  resource_id = aws_api_gateway_resource.injuries.id

  http_method = "GET"

  # "NONE" is API Gateway's own authorizer, not the absence of auth: the Lambda
  # itself rejects any request without a matching X-Extractor-Secret (403). A
  # gateway authorizer would have to be an IAM/Cognito/custom one, none of which
  # fits a single trusted server-to-server caller.
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda" {
  rest_api_id = aws_api_gateway_rest_api.injury_api.id
  resource_id = aws_api_gateway_resource.extract.id
  http_method = aws_api_gateway_method.extract_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"

  uri = aws_lambda_function.injury_extractor.invoke_arn
}

resource "aws_api_gateway_integration" "injuries_lambda" {
  rest_api_id = aws_api_gateway_rest_api.injury_api.id
  resource_id = aws_api_gateway_resource.injuries.id
  http_method = aws_api_gateway_method.injuries_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"

  uri = aws_lambda_function.injury_extractor.invoke_arn
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.injury_extractor.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.injury_api.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "deployment" {
  rest_api_id = aws_api_gateway_rest_api.injury_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.extract.id,
      aws_api_gateway_method.extract_post.id,
      aws_api_gateway_integration.lambda.id,

      aws_api_gateway_resource.injuries.id,
      aws_api_gateway_method.injuries_get.id,
      aws_api_gateway_integration.injuries_lambda.id
    ]))
  }

  depends_on = [
    aws_api_gateway_integration.lambda,
    aws_api_gateway_integration.injuries_lambda
  ]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "dev" {
  deployment_id = aws_api_gateway_deployment.deployment.id
  rest_api_id   = aws_api_gateway_rest_api.injury_api.id
  stage_name    = "dev"
}

# Throttling. The backend's own extractorLimiter is the primary control, but
# that only binds callers who come through the backend; this is the ceiling on
# the API itself, so a leaked shared secret cannot mean unbounded Groq spend.
resource "aws_api_gateway_method_settings" "throttle" {
  rest_api_id = aws_api_gateway_rest_api.injury_api.id
  stage_name  = aws_api_gateway_stage.dev.stage_name
  method_path = "*/*"

  settings {
    throttling_rate_limit  = 5
    throttling_burst_limit = 10
  }
}
