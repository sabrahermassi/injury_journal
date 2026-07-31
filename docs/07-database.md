# Database Design

## Database Choice

**Database:** PostgreSQL

### Why PostgreSQL?

The application contains highly related data:

- Users own injuries.
- Injuries contain timeline events.
- Injuries have symptoms, treatments, and medical visits.

PostgreSQL provides:

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
Timeline Event


Injury
 |
 | 1:N
 |
Symptom


Injury
 |
 | 1:N
 |
Treatment


Injury
 |
 | 1:N
 |
Medical Visit
```

---

# Database Tables

## Users

Stores application users.

| Column        | Description           |
| ------------- | --------------------- |
| id            | Primary key           |
| email         | Unique user email     |
| password_hash | Encrypted password    |
| created_at    | Account creation date |

---

## Injuries

Stores user injuries.

| Column      | Description           |
| ----------- | --------------------- |
| id          | Primary key           |
| user_id     | Reference to user     |
| name        | Injury name           |
| body_area   | Affected body area    |
| side        | Left, right, or both  |
| start_date  | When injury started   |
| cause       | Cause/context         |
| description | Additional details    |
| status      | Current injury status |
| created_at  | Creation date         |

Relationship:

```
User 1 ---- N Injury
```

---

## Timeline Events

Stores the chronological history of an injury.

| Column      | Description         |
| ----------- | ------------------- |
| id          | Primary key         |
| injury_id   | Reference to injury |
| type        | Event category      |
| date        | Event date          |
| description | Event details       |
| result      | Outcome             |
| notes       | Additional notes    |
| created_at  | Creation date       |

Supported event types:

- Symptom
- Doctor visit
- Imaging/test
- Treatment
- Injection
- Medication
- Rehabilitation

Relationship:

```
Injury 1 ---- N Timeline Events
```

---

## Symptoms

Stores symptom tracking information.

| Column     | Description            |
| ---------- | ---------------------- |
| id         | Primary key            |
| injury_id  | Reference to injury    |
| date       | Symptom date           |
| pain_level | Pain score             |
| location   | Symptom location       |
| trigger    | Triggering activity    |
| duration   | Duration               |
| notes      | Additional information |

Relationship:

```
Injury 1 ---- N Symptoms
```

---

## Treatments

Stores treatments and interventions.

| Column    | Description         |
| --------- | ------------------- |
| id        | Primary key         |
| injury_id | Reference to injury |
| name      | Treatment name      |
| provider  | Healthcare provider |
| date      | Treatment date      |
| cost      | Treatment cost      |
| outcome   | Result              |
| notes     | Additional details  |

Relationship:

```
Injury 1 ---- N Treatments
```

---

## Medical Visits

Stores healthcare appointments.

| Column          | Description              |
| --------------- | ------------------------ |
| id              | Primary key              |
| injury_id       | Reference to injury      |
| doctor          | Doctor name              |
| clinic          | Clinic name              |
| date            | Visit date               |
| tests           | Tests performed          |
| notes           | Visit notes              |
| recommendations | Provider recommendations |

Relationship:

```
Injury 1 ---- N Medical Visits
```

---

# Design Decisions

## Separate Tables vs Single Timeline Table

### Alternative 1: Single Events Table

Store everything in one table:

```
events

type = treatment
type = symptom
type = medical_visit
```

### Alternative 2: Separate Tables

Store different data types separately:

```
symptoms
treatments
medical_visits
```

### Decision

Use a hybrid approach:

- Timeline Events provide the chronological view.
- Dedicated tables store detailed information.

Example:

```
Timeline Event:
"Injection performed"

Treatment:
Name: Cortisone injection
Provider: Clinic A
Cost: 200€
Outcome: Temporary improvement
```

### Tradeoff

Advantages:

- Better data organization.
- Easier future expansion.
- More structured information.

Disadvantages:

- More tables.
- More relationships to maintain.

---

# Data Integrity Rules

The database should enforce:

- Every injury belongs to one user.
- Every event belongs to one injury.
- Users can only access their own data.
- User emails must be unique.
- Required fields cannot be empty.
- Related records should be handled safely when deleted.

---

# Future Database Extensions

Not included in MVP:

## Medical Documents

For storing:

- MRI reports.
- X-rays.
- Lab results.
- Medical files.

Example:

```
documents

id
injury_id
file_url
document_type
uploaded_at
```

---

## Healthcare Providers

For future healthcare navigation features:

```
providers

id
name
specialty
location
language
```

---

# Final Database Decisions

| Decision           | Choice                                                          |
| ------------------ | --------------------------------------------------------------- |
| Database           | PostgreSQL                                                      |
| Data Model         | Relational                                                      |
| Main Entities      | User, Injury, Timeline Event, Symptom, Treatment, Medical Visit |
| Relationship Style | One-to-many relationships                                       |
| Data Integrity     | Foreign keys and validation                                     |
| Architecture       | Designed for MVP with future expansion                          |
