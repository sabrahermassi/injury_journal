# System Design

## Overview

Injury Journal is a full-stack web application that helps users organize their healthcare journey by tracking injuries, symptoms, treatments, and medical events.

The system follows a client-server architecture:

```text
User
 |
React Frontend
 |
REST API
 |
Node.js + Express Backend
 |
PostgreSQL Database
```

The MVP uses a simple monolithic architecture to reduce complexity while keeping the system maintainable and extensible.

---

# Architecture Decisions

## 1. Frontend Technology

### Decision

**React**

### Alternatives Considered

- Vue.js
- Angular
- Next.js

### Why React Was Chosen

- Strong ecosystem and community support.
- Component-based architecture fits dashboard-style applications.
- Good choice for interactive forms and timelines.
- Existing knowledge reduces development time.

### Tradeoffs

**Advantages:**

- Fast development.
- Large number of available libraries.
- Easy component reuse.

**Disadvantages:**

- Requires choosing additional tools for routing, state management, and project structure.
- More configuration decisions compared to opinionated frameworks.

---

# 2. Backend Technology

### Decision

**Node.js + Express**

### Alternatives Considered

- Python + FastAPI
- Java + Spring Boot
- Ruby on Rails

### Why Node.js + Express Was Chosen

- Allows JavaScript across frontend and backend.
- Lightweight and flexible.
- Well suited for REST APIs.
- Large ecosystem.
- Matches existing full-stack experience.

### Tradeoffs

**Advantages:**

- Faster development for a JavaScript developer.
- Shared language between frontend and backend.
- Many available packages.

**Disadvantages:**

- Requires more architectural decisions compared to opinionated frameworks.
- CPU-heavy workloads are not its strongest use case.

---

# 3. Database Technology

### Decision

**PostgreSQL**

### Alternatives Considered

- MongoDB
- MySQL

### Why PostgreSQL Was Chosen

Healthcare journey data has strong relationships:

```text
User
 |
Injury
 |
Timeline Event
 |
Treatment
```

PostgreSQL provides:

- Relational data modeling.
- Foreign keys.
- Data consistency.
- Strong querying capabilities.
- Transaction support.

### Tradeoffs

**Advantages:**

- Excellent for structured and connected data.
- Strong data integrity.
- Powerful SQL queries.

**Disadvantages:**

- Requires designing schemas before development.
- Less flexible than document databases for rapidly changing data structures.

---

# 4. API Design

### Decision

**REST API**

### Alternatives Considered

- GraphQL
- tRPC

### Why REST Was Chosen

- Simple and predictable.
- Works well for CRUD operations.
- Easy to test.
- Appropriate for MVP complexity.

Example:

```text
GET    /api/injuries
POST   /api/injuries
PATCH  /api/injuries/:id
DELETE /api/injuries/:id
```

### Tradeoffs

**Advantages:**

- Easy to understand.
- Easy integration between frontend and backend.
- Good tooling support.

**Disadvantages:**

- Can require multiple requests for complex data.
- Less flexible than GraphQL for highly dynamic clients.

---

# 5. Authentication

### Decision

**JWT-based authentication**

### Alternatives Considered

- Server-side sessions
- OAuth authentication

### Why JWT Was Chosen

- Works well with separated frontend and backend.
- Stateless authentication model.
- Common approach for REST APIs.
- Good learning experience.

Authentication flow:

```text
User Login
    |
Backend verifies credentials
    |
JWT token generated
    |
Frontend stores token
    |
Token included in API requests
    |
Backend validates token
```

### Tradeoffs

**Advantages:**

- Easy to scale horizontally.
- No session storage required on the server.
- Works well with APIs.

**Disadvantages:**

- Token management requires careful security handling.
- Revoking tokens is more complex than server sessions.

---

# 6. Application Architecture

### Decision

**Monolithic Full-Stack Application**

### Alternatives Considered

- Microservices architecture
- Serverless architecture

### Why Monolith Was Chosen

- Appropriate for MVP size.
- Faster development.
- Easier deployment and maintenance.
- Lower infrastructure complexity.

### Tradeoffs

**Advantages:**

- Simple development workflow.
- Easier debugging.
- Lower operational cost.

**Disadvantages:**

- Less independent scaling of components.
- Large systems may eventually require separation.

---

# Backend Structure

```text
backend/

src/

├── routes/
├── controllers/
├── models/
├── middleware/
├── services/
└── utils/
```

Responsibilities:

- Routes define API endpoints.
- Controllers handle requests.
- Models represent database entities.
- Middleware handles authentication and validation.
- Services contain reusable business logic.

---

# Frontend Structure

```text
frontend/

src/

├── pages/
├── components/
├── services/
├── hooks/
├── context/
└── utils/
```

Responsibilities:

- Pages represent application screens.
- Components contain reusable UI elements.
- Services handle API communication.
- Hooks and context manage shared frontend logic.

---

# Deployment Architecture

## Decision

```text
Frontend
↓
Vercel

Backend
↓
Render

Database
↓
Cloud PostgreSQL
```

### Alternatives Considered

- AWS
- Railway
- Fly.io

### Why This Was Chosen

- Simple deployment process.
- Suitable for portfolio-scale applications.
- Good free/low-cost options.
- Easy GitHub integration.

### Tradeoffs

**Advantages:**

- Minimal infrastructure management.
- Fast deployment.

**Disadvantages:**

- Less control compared to managing infrastructure directly.
- May require migration for large-scale production systems.

---

# Security Considerations

The system should:

- Hash passwords securely.
- Protect API routes.
- Validate user input.
- Prevent users from accessing other users' data.
- Store secrets in environment variables.
- Use HTTPS in production.

---

# Final Architecture Decisions

| Area           | Decision                           |
| -------------- | ---------------------------------- |
| Frontend       | React                              |
| Backend        | Node.js + Express                  |
| Database       | PostgreSQL                         |
| API Style      | REST                               |
| Authentication | JWT                                |
| Architecture   | Monolithic application             |
| Deployment     | Vercel + Render + Cloud PostgreSQL |

---

# Future Scalability

The MVP architecture allows future additions:

- Document storage.
- AI-assisted organization.
- Healthcare provider features.
- Additional services.

The goal is to start simple while keeping future expansion possible.
