# AI Injury Extractor

A serverless AI-powered application that transforms free-text injury descriptions into structured injury data using AWS Lambda, API Gateway, DynamoDB, Terraform, Groq LLMs, and Next.js. This project demonstrates an end-to-end serverless AWS architecture.

The application accepts free-text injury descriptions, uses an LLM to extract structured information, stores the extracted data in DynamoDB, and exposes REST API endpoints for retrieving previous entries.

## Tech Stack

- Python
- AWS Lambda
- Amazon API Gateway
- Amazon DynamoDB
- Terraform
- Groq API (Llama 3.1)
- GitHub Actions (extractor and frontend CI)

## Features

- Extracts structured injury information from natural language
- Serverless architecture built on AWS
- REST API powered by API Gateway and Lambda
- Stores extracted records in DynamoDB
- Infrastructure managed with Terraform
- Integrated with a Next.js frontend

## Screenshots

### Injury Description Input

Users can describe their injury in natural language and submit it for AI extraction.

![Injury description input](docs/screenshots/injury-description-input.png)

### AI Extraction Result

The LLM converts unstructured text into structured injury information.

![AI extraction result](docs/screenshots/ai-extraction-result.png)

### Injury History

Previously extracted injuries can be retrieved from DynamoDB through the history API.

![Injury history](docs/screenshots/injury-history-timeline.png)

## Integration

This was designed as a standalone serverless demo, then integrated into the injury_journal monorepo. That integration is now real (issue #32), not just intended:

- User authentication is handled by the host application (`backend/`), which verifies the caller's JWT.
- This API receives requests only from that host application's backend, proven by a shared secret (`X-Extractor-Secret`) it checks before doing anything else — the browser no longer calls it directly.
- Extracted injury data is scoped per user (the `userId` the host app resolved), not a single hardcoded id.

Extraction records still live in this repository's own DynamoDB table, separate from the host app's primary PostgreSQL database.

DynamoDB is used in this repository to demonstrate a complete serverless AWS architecture and end-to-end data flow.

## Architecture

```mermaid
sequenceDiagram
  participant Client
  participant Journal Backend
  participant API Gateway
  participant Injury Extractor Lambda
  participant Groq API
  participant InjuryEntries DynamoDB

  Client->>Journal Backend: POST /api/extractions/extract with injury text (cookie auth)
  Journal Backend->>API Gateway: POST /extract, X-Extractor-Secret + userId
  API Gateway->>Injury Extractor Lambda: Proxy request
  Injury Extractor Lambda->>Injury Extractor Lambda: Verify shared secret
  Injury Extractor Lambda->>Groq API: Extract structured injury data
  Groq API-->>Injury Extractor Lambda: Injury JSON
  Injury Extractor Lambda->>InjuryEntries DynamoDB: Store injury entry (keyed by userId)
  Injury Extractor Lambda-->>API Gateway: HTTP 200 response
  API Gateway-->>Journal Backend: Extraction result
  Journal Backend-->>Client: Extraction result

  Client->>Journal Backend: GET /api/extractions/history (cookie auth)
  Journal Backend->>API Gateway: GET /injuries?userId, X-Extractor-Secret
  API Gateway->>Injury Extractor Lambda: Proxy request
  Injury Extractor Lambda->>Injury Extractor Lambda: Verify shared secret
  Injury Extractor Lambda->>InjuryEntries DynamoDB: Query entries for userId
  InjuryEntries DynamoDB-->>Injury Extractor Lambda: Injury history
  Injury Extractor Lambda-->>API Gateway: HTTP 200 response
  API Gateway-->>Journal Backend: Injury history list
  Journal Backend-->>Client: Injury history list
```

## Prerequisites

Before deployment, ensure you have:

- AWS CLI configured with valid credentials
- Terraform installed
- Python 3.12 installed
- Groq API key configured as a Lambda environment variable

## Frontend

The frontend that calls this API now lives in the main app's `frontend/`
(`frontend/app/dashboard/extractor/page.tsx` and
`frontend/components/extractor/`), not in this directory. Run it via the
main `frontend/` app's own README/CLAUDE.md.

It does not call this Lambda directly — the browser has no way to attach the
shared secret this Lambda now requires, and never had a way to reach it
without going through an authenticated caller. It calls the main app's own
`backend/` (`NEXT_PUBLIC_API_URL`), which proxies to this Lambda with the
shared secret and the caller's resolved userId; see
`backend/src/services/extractorService.js`. Set `EXTRACTOR_API_URL` and
`EXTRACTOR_SHARED_SECRET` in the repo-root `.env` for that proxy to work (see
root `.env.example`).

There is currently no local/mocked backend for the Lambda itself — the proxy
always calls a real deployed API Gateway + Lambda stack.

## Deploy Lambda and Infrastructure

From the Lambda directory:

```bash
cd lambda
./deploy.sh

```

This installs Lambda dependencies into `package/`, zips `function.zip`, and
runs `terraform apply` in `../infrastructure`. It requires AWS CLI
credentials, Terraform, and `groq_api_key` and `extractor_shared_secret`
Terraform variables (e.g. via `TF_VAR_groq_api_key`/`TF_VAR_extractor_shared_secret`
or a gitignored `terraform.tfvars`). `extractor_shared_secret` must match the
main app's `EXTRACTOR_SHARED_SECRET` (root `.env`) — it's how the Lambda
verifies who's calling; generate one with
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

There is no CORS variable any more — this API has no browser caller.

The Groq model id is configurable via the `groq_model` Terraform variable
(default `openai/gpt-oss-20b`, e.g. via `TF_VAR_groq_model`) so it can be
swapped without a code change if the model is deprecated.

## Testing

- Backend: `cd lambda && pytest` (pytest + moto, mocks AWS/Groq). CI runs
  this on every push/PR touching `ai-injury-extractor/lambda/**` or
  `ai-injury-extractor/infrastructure/**` (see `.github/workflows/extractor-ci.yml`).
- Frontend: the extractor's component tests moved along with the
  components into `frontend/components/extractor/*.test.tsx` and
  `frontend/services/extractor-api.test.ts`. The main `frontend/` app now
  runs them with Vitest (`cd frontend && npm test`), also run in CI via
  `.github/workflows/frontend-ci.yml`.

There is no end-to-end/API integration test suite yet — changes touching
request/response behavior should still be verified manually using the
`curl` examples below and by running the frontend against a real deployed
API.

## Test injury data extractor API

> Requires the shared secret and a userId — see "Integration" above. A request without a matching `X-Extractor-Secret` gets a 403 regardless of body content.

```bash
curl -X POST \
https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/dev/extract \
-H "Content-Type: application/json" \
-H "X-Extractor-Secret: YOUR_SHARED_SECRET" \
-d '{"userId":"1","text":"I have had left hip pain for four years after gym training."}'
```

## Test injury history API

> Also requires the shared secret; `userId` is a query parameter since GET has no body.

```bash
curl "https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/dev/injuries?userId=1" \
-H "X-Extractor-Secret: YOUR_SHARED_SECRET"
```

# Useful Commands

## Test Groq API directly

```bash
curl https://api.groq.com/openai/v1/chat/completions \
-H "Authorization: Bearer YOUR_GROQ_API_KEY" \
-H "Content-Type: application/json" \
-d '{
  "model": "llama-3.1-8b-instant",
  "messages": [
    {
      "role": "user",
      "content": "Say hello"
    }
  ]
}'
```

---

## Update Lambda code

```bash
aws lambda update-function-code \
--function-name injury-extractor \
--zip-file fileb://function.zip
```

---

## Update Lambda environment variable

```bash
aws lambda update-function-configuration \
--function-name injury-extractor \
--environment "Variables={GROQ_API_KEY=YOUR_KEY,GROQ_MODEL=openai/gpt-oss-20b,DYNAMODB_TABLE=InjuryEntries,EXTRACTOR_SHARED_SECRET=YOUR_SECRET}"
```

---

## Get current Lambda environment variables

```bash
aws lambda get-function-configuration \
--function-name injury-extractor
```

---

## Tail Lambda logs

```bash
aws logs tail /aws/lambda/injury-extractor --follow
```

---

## Invoke Lambda directly

```bash
aws lambda invoke \
--function-name injury-extractor \
--cli-binary-format raw-in-base64-out \
--payload '{"httpMethod":"POST","headers":{"Authorization":"Bearer YOUR_JWT"},"body":"{\"text\":\"I have hip pain\"}"}' \
response.json

cat response.json
```

---

## Inspect DynamoDB table (development only)

Scan all injury entries:

```bash
aws dynamodb scan \
--table-name InjuryEntries
```

---

## Zip Lambda package

PowerShell

```powershell
Remove-Item function.zip -ErrorAction Ignore

Compress-Archive -Path handler.py,package\* -DestinationPath function.zip
```

## Troubleshooting

### ModuleNotFoundError

Reinstall dependencies into the `package/` directory and recreate `function.zip`.

### Lambda updated but code didn't change

Upload a new `function.zip` and verify the `LastModified` timestamp in the Lambda console.

### Groq returns 401

- Verify `GROQ_API_KEY`
- Test the API directly with `curl`
- Confirm the key is active

### API Gateway returns 500

Check CloudWatch logs:

```bash
aws logs tail /aws/lambda/injury-extractor --follow
```

### API Gateway returns 403

Verify the endpoint URL and deployment stage.

### API Gateway returns 404

Confirm the API Gateway resources and methods are deployed:

- `/extract` with `POST`
- `/injuries` with `GET`

After changing Terraform resources, create a new deployment.
