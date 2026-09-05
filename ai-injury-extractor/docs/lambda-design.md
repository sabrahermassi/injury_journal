# Lambda Function Design

## Overview

The AI Injury Extractor uses AWS Lambda as the serverless backend processing layer.

The Lambda function receives injury descriptions from the frontend, uses the Groq API to extract structured injury information, stores entries in DynamoDB, and returns responses to the client.

---

## Integration Note

This repository focuses on the AI extraction service and serverless infrastructure.

User management and full injury tracking workflows are handled by the
consuming application (`backend/` + `frontend/` at the repo root).
Authentication is now wired end to end: `backend/` proxies requests here,
presenting a shared secret (`X-Extractor-Secret`) this Lambda checks before
doing anything else, plus the `userId` it already resolved from the
caller's own JWT (`lambda/handler.py` `is_authorised`) — see `CLAUDE.md` §3.

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
```

Purpose:

- Store extracted injury entries
- Retrieve injury history, scoped to the `userId` on the request

Note:

The `/injuries` endpoint scopes reads to a single `userId` via Query rather
than a table-wide Scan. As of issue #32 this is real per-user isolation: the
`userId` comes from the request the host backend sends (resolved from the
caller's own JWT there, not from a Lambda-side JWT claim — see `CLAUDE.md`
§3), and the Lambda rejects any request without a matching shared secret
before this scoping is even reached. Entries written before this change are
stored under the old hardcoded `"test-user-001"` and are unreachable through
the authenticated path.

Production posture (issue #32):

- Authentication and authorization: done, via the shared-secret + host-backend
  pattern above, not a Lambda-side authorizer.
- User identity: taken from the request `userId`, not a hardcoded value.
- IAM permissions: already least-privilege (`PutItem`/`Query` only, see above).
- Throttling: a flat stage-level throttle in `infrastructure/api_gateway.tf`
  (issue #60) is in place; usage-plan-level per-caller quotas remain future work.

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

The Groq API key is provided through environment variables.

Example:

```text
GROQ_API_KEY
```

The key is never stored directly in source code.

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
