# Project Roadmap

## Completed Features

### AI Injury Extraction Pipeline

- [x] Create Lambda function
- [x] Integrate GROQ API for AI extraction
- [x] Create API Gateway REST API
- [x] Configure CORS for frontend communication
- [x] Store extracted injury data in DynamoDB

### Frontend

- [x] Create Next.js frontend
- [x] Connect frontend to API Gateway
- [x] Build injury extraction user interface
- [x] Add loading and error states
- [x] Display extracted injury results

### Injury History

- [x] Add GET /injuries API endpoint
- [x] Retrieve saved injury entries from DynamoDB
- [x] Display injury history entries
- [x] Create reusable injury history cards

## Future Improvements

Tracked as GitHub issues (`security` / `bug` / `tech-debt` / `tests` labels), not duplicated here:

```
gh issue list --repo sabrahermassi/injury_journal --state open --label security,bug,tech-debt,tests
```
