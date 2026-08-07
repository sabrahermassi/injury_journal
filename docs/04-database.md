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

## Database Models

| Model          | Fields                                                                             |
| -------------- | ---------------------------------------------------------------------------------- |
| User           | id, email, password, createdAt                                                     |
| Injury         | id, userId, name, bodyArea, side, startDate, cause, description, status, createdAt |
| Timeline Event | id, injuryId, type, date, description, result                                      |
| Symptom        | id, injuryId, date, painLevel, location, trigger, duration, notes                  |
| Treatment      | id, injuryId, name, provider, date, cost, outcome                                  |
| Medical Visit  | id, injuryId, doctor, clinic, date, notes                                          |

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

- Deletion policies prevent orphan records:
  - Users cannot be deleted while they have associated injuries.
  - Injuries cannot be deleted while related timeline events, symptoms, treatments, or medical visits exist.
  - Related records must be removed explicitly before deleting parent records.
