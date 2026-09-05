# Lambda Function Design

## Overview

The AI Injury Extractor uses AWS Lambda as the serverless backend processing layer.

The Lambda function receives injury descriptions from the frontend, uses the Groq API to extract structured injury information, stores entries in DynamoDB, and returns responses to the client.

---

## Integration Note

This repository focuses on the AI extraction service and serverless infrastructure.

Authentication, user management, and full injury tracking workflows are handled by the consuming application.

---

# Lambda Function

## Function Name

`injury-extractor`

## Purpose

Convert unstructured injury journal text into structured injury data using an LLM.

Example input:

> "I hurt my left knee doing squats two weeks ago. Pain is 6/10."

Example output:

```json
{
  "injury_name": "Knee injury",
  "body_area": "left knee",
  "pain_level": 6,
  "symptoms": ["pain during exercise"],
  "possible_causes": ["squats"]
}
```

---

# High-Level Flow

```text
Frontend
 |
 | POST /extract
 ↓
API Gateway
 |
 ↓
Lambda
 |
 |-- Validate input
 |
 |-- Call Groq API
 |
 |-- Parse AI response
 |
 |-- Store injury entry
 ↓
DynamoDB


Frontend
 |
 | GET /injuries
 ↓
API Gateway
 |
 ↓
Lambda
 |
 |-- Retrieve injury history
 ↓
DynamoDB
 |
 ↓
Return injury history
```

---

# Lambda Processing Steps

## 1. Receive Request

The Lambda function receives an HTTP request from API Gateway.

Example request:

```json
{
  "text": "I hurt my left knee doing squats two weeks ago. Pain is 6/10."
}
```

---

## 2. Validate Input

Before processing:

- Check that injury text exists
- Check that the input is not empty
- Validate request format
- Enforce maximum input length

Invalid requests return an error response.

Example:

```json
{
  "error": "Invalid request body"
}
```

---

## 3. Call Groq API

Lambda sends the injury description to Groq with instructions to extract structured information.

The LLM converts unstructured text into JSON with these required fields: `injury_name`,
`body_area`, `pain_level`, `symptoms`, `possible_causes` — same shape as the example in
"Purpose" above.

---

## 4. Store Data in DynamoDB

Lambda stores the extracted injury information together with the original text. See
`docs/dynamodb-design.md` for the full item shape.

---

## 5. Retrieve Injury History

The Lambda also supports retrieving previously stored injury entries.

Request:

```text
GET /injuries
```

The function reads stored entries from DynamoDB and returns the injury history list.

---

## 6. Return Response

For extraction requests, Lambda returns the structured injury data (same shape as the example in
"Purpose" above). For history requests, Lambda returns saved injury entries.

---

# Required AWS Permissions

The Lambda execution role requires the following permissions.

## DynamoDB

Permissions:

```text
dynamodb:PutItem
dynamodb:Query
secretsmanager:GetSecretValue
```

Purpose:

- Store extracted injury entries
- Retrieve injury history, scoped to the hardcoded `userId`

Note:

The `/injuries` endpoint already scopes reads to a single `userId` via Query
rather than a table-wide Scan. `userId` is still hardcoded (no auth exists
yet — see `CLAUDE.md` §3), so this scoping doesn't provide real user
isolation until authentication is added.

Before production use:

- Add authentication and authorization
- Extract user identity from JWT claims instead of the hardcoded userId
- Apply least-privilege IAM permissions

---

## CloudWatch Logs

Permissions:

```text
logs:CreateLogGroup
logs:CreateLogStream
logs:PutLogEvents
```

Purpose:

Enable application logging and debugging.

---

## Groq API Access

The Groq API key is held in AWS Secrets Manager and read once per container,
at cold start, by `load_groq_api_key()` in `handler.py`.

The Lambda's environment carries only the ARN of the secret:

```text
GROQ_SECRET_ARN
```

The key is never stored in source code, and deliberately never passed as an
environment variable: Terraform records environment variable values in its state
file in plaintext, so that route would expose the key to anyone able to read the
state (issue #36). Terraform manages an empty secret — a container with no
version — and the value is written into it out of band with the AWS CLI, so the
value never enters a Terraform attribute.

---

# MVP Design Decision

The MVP uses a single Lambda function:

```text
injury-extractor
```

It handles:

- HTTP request processing
- Input validation
- AI extraction
- DynamoDB storage
- Injury history retrieval
- Response generation

Future improvements could split responsibilities into separate functions for:

- AI processing
- Data processing
- Analytics
- Background jobs

See the README "Architecture" diagram for the current request flow.
