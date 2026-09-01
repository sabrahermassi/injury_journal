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

  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "injuries_get" {
  rest_api_id = aws_api_gateway_rest_api.injury_api.id
  resource_id = aws_api_gateway_resource.injuries.id

  http_method   = "GET"
  # Development-only endpoint.
  # Authentication and user-scoped access are handled by the consuming application.
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
      aws_api_gateway_method.extract_options.id,
      aws_api_gateway_integration.lambda.id,
      aws_api_gateway_integration.extract_options.id,
      aws_api_gateway_integration_response.extract_options.id,
      var.allowed_origin,

      aws_api_gateway_resource.injuries.id,
      aws_api_gateway_method.injuries_get.id,
      aws_api_gateway_integration.injuries_lambda.id
    ]))
  }

  depends_on = [
    aws_api_gateway_integration.lambda,
    aws_api_gateway_integration.extract_options
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

resource "aws_api_gateway_method" "extract_options" {
  rest_api_id   = aws_api_gateway_rest_api.injury_api.id
  resource_id   = aws_api_gateway_resource.extract.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "extract_options" {
  rest_api_id = aws_api_gateway_rest_api.injury_api.id
  resource_id = aws_api_gateway_resource.extract.id
  http_method = aws_api_gateway_method.extract_options.http_method

  type = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "extract_options" {
  rest_api_id = aws_api_gateway_rest_api.injury_api.id
  resource_id = aws_api_gateway_resource.extract.id
  http_method = aws_api_gateway_method.extract_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "extract_options" {
  rest_api_id = aws_api_gateway_rest_api.injury_api.id
  resource_id = aws_api_gateway_resource.extract.id
  http_method = aws_api_gateway_method.extract_options.http_method
  status_code = aws_api_gateway_method_response.extract_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST,GET'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${var.allowed_origin}'"
  }

  depends_on = [
    aws_api_gateway_integration.extract_options
  ]
}