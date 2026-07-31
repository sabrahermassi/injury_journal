# Backend Development

## Overview

This document defines the backend implementation plan for the Injury Journal MVP.

The backend is responsible for:

- Authentication.
- Business logic.
- Database communication.
- API endpoints.
- Security.
- Data validation.

---

# Backend Technology Stack

## Runtime

**Node.js**

Purpose:

- Runs JavaScript on the server.
- Provides the execution environment for the backend.

---

## Framework

**Express.js**

Purpose:

- Handles HTTP requests.
- Defines API routes.
- Manages middleware.
- Returns API responses.

---

## Database

**PostgreSQL**

Purpose:

Stores:

- Users.
- Injuries.
- Timeline events.
- Symptoms.
- Treatments.
- Medical visits.

---

## Database Layer

### Decision

Use an ORM.

Selected:

**Prisma**

### Reasons:

- Modern developer experience.
- Easy PostgreSQL integration.
- Database migrations.
- Clear schema definition.
- Reduces repetitive SQL code.

### Tradeoff:

Advantages:

- Faster development.
- Easier database management.
- Good developer tooling.

Disadvantages:

- Adds an abstraction layer.
- Complex queries may still require SQL knowledge.

---

# Backend Project Structure

The backend will follow a layered architecture.

```text
backend/

src/

├── config/
│
├── controllers/
│
├── middleware/
│
├── models/
│
├── routes/
│
├── services/
│
├── utils/
│
├── app.js
└── server.js
```

---

# Layer Responsibilities

## Routes

Responsible for:

- Defining API endpoints.
- Connecting requests to controllers.

Example:

```
POST /api/injuries
GET /api/injuries
```

---

## Controllers

Responsible for:

- Receiving requests.
- Validating input.
- Returning responses.

Example:

```
injuryController.js
```

---

## Services

Responsible for:

- Business logic.
- Database operations.
- Reusable functions.

Example:

```
injuryService.js
```

---

## Models

Responsible for:

- Database entities.
- Data relationships.

Models:

- User.
- Injury.
- Timeline Event.
- Symptom.
- Treatment.
- Medical Visit.

---

## Middleware

Responsible for:

- Authentication.
- Authorization.
- Error handling.
- Validation.

---

# Environment Configuration

Sensitive configuration is stored using environment variables.

Example:

```env
PORT=3001

DATABASE_URL=

JWT_SECRET=
```

Reasons:

- Keep secrets outside source code.
- Support different environments.
- Improve security.

---

# Database Setup

The backend uses PostgreSQL with Prisma.

Database workflow:

```
Define schema

↓

Create migration

↓

Update database

↓

Use Prisma client
```

---

# Database Models

The backend will implement the following models:

## User

Stores account information.

Fields:

- id
- email
- password_hash
- created_at

---

## Injury

Stores injury profiles.

Fields:

- id
- user_id
- name
- body_area
- side
- start_date
- cause
- description
- status

---

## Timeline Event

Stores chronological injury history.

Fields:

- id
- injury_id
- type
- date
- description
- result
- notes

---

## Symptom

Stores symptom tracking.

Fields:

- id
- injury_id
- date
- pain_level
- location
- trigger
- duration
- notes

---

## Treatment

Stores treatments.

Fields:

- id
- injury_id
- name
- provider
- date
- cost
- outcome
- notes

---

## Medical Visit

Stores healthcare visits.

Fields:

- id
- injury_id
- doctor
- clinic
- date
- tests
- notes
- recommendations

---

# Authentication Implementation

## Authentication Method

Decision:

JWT authentication.

---

## Registration Flow

```
User enters email/password

↓

Backend validates input

↓

Password hashed using bcrypt

↓

User saved in database

↓

Account created
```

---

## Login Flow

```
User enters credentials

↓

Backend checks database

↓

Password verified

↓

JWT token generated

↓

Token returned to frontend
```

---

# Authentication Middleware

Protected routes require:

```
Authorization: Bearer <token>
```

Example:

```
GET /api/injuries
```

The backend verifies:

- Token exists.
- Token is valid.
- User owns requested data.

---

# API Implementation Order

Development sequence:

```
1. Setup Express application

2. Configure PostgreSQL connection

3. Setup Prisma

4. Create database schema

5. Create migrations

6. Create User model

7. Implement authentication

8. Create Injury model

9. Implement Injury CRUD

10. Implement Timeline Events

11. Implement Symptoms

12. Implement Treatments

13. Implement Medical Visits
```

---

# Error Handling

The backend returns consistent JSON errors.

Examples:

## Bad Request

Status:

```
400
```

Response:

```json
{
  "error": "Invalid input"
}
```

---

## Unauthorized

Status:

```
401
```

Response:

```json
{
  "error": "Invalid token"
}
```

---

## Not Found

Status:

```
404
```

Response:

```json
{
  "error": "Resource not found"
}
```

---

# Validation Rules

The backend validates:

- Required fields.
- Email format.
- Password requirements.
- Valid dates.
- User ownership of resources.

---

# Testing Strategy

Tools:

- Jest.
- Supertest.
- Postman.

Testing focus:

- Authentication.
- API endpoints.
- Validation.
- Authorization.
- Error handling.

---

# Backend Completion Criteria

The backend is complete when:

- Express server runs.
- PostgreSQL connection works.
- Database schema is implemented.
- Users can register and login.
- JWT authentication works.
- Protected routes work.
- Injury CRUD works.
- Timeline events work.
- Symptoms work.
- Treatments work.
- Medical visits work.
- API matches the API Design document.

---

# Final Backend Decisions

| Area              | Decision                        |
| ----------------- | ------------------------------- |
| Runtime           | Node.js                         |
| Framework         | Express.js                      |
| Database          | PostgreSQL                      |
| Database Layer    | Prisma ORM                      |
| Authentication    | JWT                             |
| Password Security | bcrypt                          |
| API Style         | REST                            |
| Architecture      | Routes + Controllers + Services |
| Testing           | Jest + Supertest                |
