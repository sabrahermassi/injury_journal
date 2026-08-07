# Database Design

## Database Choice

**PostgreSQL with Prisma ORM**

PostgreSQL was chosen because the application contains strongly related healthcare journey data:

- Users own injuries.
- Injuries contain timeline events.
- Injuries have symptoms, treatments, and medical visits.

A relational database provides:

- Strong relationships using foreign keys.
- Data consistency.
- Reliable transactions.
- Powerful querying capabilities.

---

# Entity Relationship Overview

```text
User
 |
 | 1:N
 |
Injury
 |
 | 1:N
 |
Timeline Events


Injury
 |
 +---- Symptoms
 |
 +---- Treatments
 |
 +---- Medical Visits
```

# Data Integrity Rules

The system should enforce:

- Every injury belongs to exactly one user.
- Every timeline event belongs to one injury.
- User emails must be unique.
- Required fields must be validated before saving.
- Related records must be handled safely when data is deleted.
- Users must only access their own data through application authorization.
