# API Design

## Overview

The application uses a REST API for communication between the React frontend and Node.js/Express backend.

The API handles:

- Authentication
- Injury management
- Timeline events
- Symptoms
- Treatments
- Medical visits

---

# API Style

**Decision: REST API**

REST was chosen because the application mainly requires CRUD operations and simple resource-based communication.

## Data Format

JSON requests use:

```http
Content-Type: application/json
```

---

# Authentication API

## Register User

### POST

```text
/api/auth/register
```

Purpose:

Create a new user account.

Request:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "message": "User created successfully"
}
```

---

## Login User

### POST

```text
/api/auth/login
```

Purpose:

Authenticate user and generate JWT token.

Request:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "token": "jwt_token",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

---

# Injury Endpoints

## Create Injury

### POST

```text
/api/injuries
```

Authentication:

Required

Creates a new injury profile.

Request:

```json
{
  "name": "Left hip pain",
  "bodyArea": "Hip",
  "side": "Left",
  "startDate": "2022-01-01",
  "cause": "Weightlifting injury",
  "description": "Chronic pain",
  "status": "Under investigation"
}
```

---

## Get User Injuries

### GET

```text
/api/injuries
```

Authentication:

Required

Returns all injuries belonging to the logged-in user.

---

## Get Single Injury

### GET

```text
/api/injuries/:id
```

Returns one injury and related information.

---

## Update Injury

### PUT

```text
/api/injuries/:id
```

Updates injury information.

---

## Delete Injury

### DELETE

```text
/api/injuries/:id
```

Deletes an injury.

---

# Timeline Event Endpoints

## Create Timeline Event

### POST

```text
/api/injuries/:injuryId/events
```

Creates an event connected to an injury.

Request:

```json
{
  "type": "Treatment",
  "date": "2026-07-01",
  "description": "Physiotherapy session",
  "result": "No improvement",
  "notes": "Pain continued"
}
```

---

## Get Timeline Events

### GET

```text
/api/injuries/:injuryId/events
```

Returns injury history ordered chronologically.

---

## Update Timeline Event

### PUT

```text
/api/events/:id
```

---

## Delete Timeline Event

### DELETE

```text
/api/events/:id
```

---

# Symptom Endpoints

## Create Symptom

### POST

```text
/api/injuries/:injuryId/symptoms
```

Request:

```json
{
  "date": "2026-07-30",
  "painLevel": 7,
  "location": "Left hip",
  "trigger": "Squatting",
  "duration": "3 hours",
  "notes": "Pain after sitting"
}
```

---

## Get Symptoms

### GET

```text
/api/injuries/:injuryId/symptoms
```

---

# Treatment Endpoints

## Create Treatment

### POST

```text
/api/injuries/:injuryId/treatments
```

Request:

```json
{
  "name": "Physiotherapy",
  "provider": "Clinic A",
  "date": "2026-06-01",
  "cost": 500,
  "outcome": "No improvement"
}
```

---

## Get Treatments

### GET

```text
/api/injuries/:injuryId/treatments
```

---

# Medical Visit Endpoints

## Create Medical Visit

### POST

```text
/api/injuries/:injuryId/visits
```

Request:

```json
{
  "doctor": "Sports Medicine Specialist",
  "clinic": "Clinic A",
  "date": "2026-07-15",
  "notes": "Assessment notes"
}
```

---

## Get Medical Visits

### GET

```text
/api/injuries/:injuryId/visits
```

---

# Error Handling

The API returns consistent JSON error responses.

## Bad Request

Status:

```text
400 Bad Request
```

Example:

```json
{
  "error": "Invalid input"
}
```

---

## Unauthorized

Status:

```text
401 Unauthorized
```

Example:

```json
{
  "error": "Authorization token missing"
}
```

---

## Not Found

Status:

```text
404 Not Found
```

Example:

```json
{
  "error": "Resource not found"
}
```

---

# Security Requirements

The API must:

- Require authentication for private resources.
- Verify users own requested resources.
- Validate incoming data.
- Never expose password information.
- Store secrets using environment variables.

---

# Final API Decisions

| Decision               | Choice               |
| ---------------------- | -------------------- |
| Architecture           | REST API             |
| Data format            | JSON                 |
| Authentication         | JWT                  |
| Communication          | React ↔ Express      |
| Database communication | Backend only         |
| Error format           | JSON                 |
| API versioning         | Not required for MVP |

---

# Future API Extensions

Not included in MVP:

- Document upload endpoints.
- Healthcare provider search.
- AI summary generation.
- External healthcare integrations.
