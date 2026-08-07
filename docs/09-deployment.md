# Deployment

| Area              | Decision                       |
| ----------------- | ------------------------------ |
| Frontend Hosting  | Vercel                         |
| Backend Hosting   | Render                         |
| Database          | Cloud PostgreSQL               |
| Deployment Method | Git-based automatic deployment |
| Environments      | Development + Production       |
| Configuration     | Environment variables          |
| CI/CD             | Automatic deployment           |

---

# Deployment Architecture

Production architecture:

```text
User

↓

React Frontend

(Vercel)

↓

REST API Requests

↓

Node.js Backend

(Render)

↓

PostgreSQL Database

(Cloud Provider)
```

---

# Environment Variables

Sensitive information must not be committed to Git.

## Backend Variables

Example:

```env
PORT=

DATABASE_URL=

JWT_SECRET=
```

---

## Frontend Variables

Example:

```env
VITE_API_URL=
```

---

# Security Requirements

Production must include:

- HTTPS communication.
- Protected environment variables.
- Secure database credentials.
- Restricted CORS configuration.
- Password hashing.
- Protected JWT secret.
