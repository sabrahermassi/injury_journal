# Backend Development

## Technology Stack

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

---

## Why Prisma

Prisma is used as the database layer because it provides:

- Clear schema definition.
- Database migrations.
- Type-safe database access.
- Less repetitive SQL code.

---

The backend follows a layered structure:

```text
backend/

src/

├── config/
├── routes/
├── controllers/
├── services/
├── middleware/
├── models/
└── utils/
```

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
