# Project Planning

## Overview

This document defines how the Injury Journal MVP will be developed, organized, and delivered.

The goal is to transform the product design into an incremental implementation plan.

---

# Development Strategy

The MVP will be developed step by step.

Development flow:

```text
Project Setup
      ↓
Backend Development
      ↓
Database Implementation
      ↓
Authentication
      ↓
API Features
      ↓
Frontend Development
      ↓
Testing
      ↓
Deployment
```

The focus is to build a working product incrementally instead of building everything at once.

---

# Development Milestones

## Milestone 1 — Project Setup

Goal:

Create the application foundation.

Tasks:

- Create Git repository.
- Create frontend and backend projects.
- Setup project structure.
- Configure environment variables.
- Connect frontend and backend.

Completed when:

- Frontend runs successfully.
- Backend runs successfully.
- Repository structure is ready.

---

## Milestone 2 — Backend Foundation

Goal:

Create the backend architecture.

Tasks:

- Setup Node.js and Express.
- Configure PostgreSQL connection.
- Create database structure.
- Setup backend folder organization.
- Add error handling.

Backend structure:

```text
backend/

src/

├── models/
├── controllers/
├── routes/
├── middleware/
├── services/
└── utils/
```

---

## Milestone 3 — Authentication

Goal:

Secure user accounts and private data.

Tasks:

- User registration.
- User login.
- Password hashing.
- JWT token generation.
- Authentication middleware.
- Protected API routes.

Completed when:

- Users can create accounts.
- Users can login.
- Private resources require authentication.

---

## Milestone 4 — Core Backend Features

Goal:

Implement the main healthcare journey functionality.

Features:

- Injury CRUD.
- Timeline events.
- Symptom tracking.
- Treatment tracking.
- Medical visit tracking.

Completed when:

- All API endpoints from the API Design document are implemented.

---

## Milestone 5 — Frontend Development

Goal:

Build the user interface.

Tasks:

- Authentication pages.
- Dashboard.
- Injury management pages.
- Timeline interface.
- Forms.
- API integration.

Completed when:

- Users can manage their injury journey through the application.

---

## Milestone 6 — Testing

Goal:

Ensure application reliability.

Tasks:

- Backend API testing.
- Frontend component testing.
- Validation testing.
- User flow testing.

Completed when:

- Main user scenarios work correctly.

---

## Milestone 7 — Deployment

Goal:

Make the application available online.

Tasks:

- Deploy frontend.
- Deploy backend.
- Setup production database.
- Configure environment variables.
- Test production environment.

Completed when:

- The application is publicly accessible.

---

# Repository Structure

The project will use a monorepo structure.

```text
injury-journal/

├── frontend/
├── backend/
├── docs/
└── README.md
```

---

# Git Workflow

## Branch Strategy

Main branch:

```text
main
```

Feature branches:

```text
feature/authentication

feature/injury-crud

feature/timeline
```

Workflow:

```text
Create feature branch

↓

Implement feature

↓

Test changes

↓

Merge into main
```

---

# Git Commit Strategy

Commits should describe meaningful changes.

Examples:

Good:

```text
Create user database model

Implement JWT authentication

Add injury CRUD endpoints
```

Avoid:

```text
update stuff

changes

fix
```

---

# Project Tracking

GitHub Issues will be used to track development tasks.

Examples:

Backend:

```text
Setup Express server

Create database models

Implement authentication

Create injury endpoints
```

Frontend:

```text
Create login page

Build dashboard

Create timeline component
```

---

# Definition of Done

A feature is complete when:

- Code is implemented.
- Functionality works as expected.
- Tests pass.
- No major errors exist.
- Changes are committed.
- Documentation is updated if necessary.

---

# Implementation Order

The coding order will be:

```text
1. Backend project setup

2. PostgreSQL database connection

3. Database models

4. Controllers

5. Routes

6. Authentication

7. Core API features

8. Frontend setup

9. Frontend pages and components

10. API integration

11. Testing

12. Deployment
```

---

# Phase 11 Preparation — Backend Development

The next phase starts implementation.

The first backend tasks will be:

## Models

Create database models:

- User
- Injury
- Timeline Event
- Symptom
- Treatment
- Medical Visit

## Controllers

Implement business logic:

- Create resources.
- Retrieve resources.
- Update resources.
- Delete resources.

## Routes

Create REST API endpoints based on the API Design document.

## Authentication

Implement:

- User registration.
- User login.
- Password hashing.
- JWT authentication.
- Protected routes.

---

# Final Project Planning Decisions

| Area                       | Decision                                    |
| -------------------------- | ------------------------------------------- |
| Repository                 | Monorepo                                    |
| Git workflow               | Feature branches                            |
| Task tracking              | GitHub Issues                               |
| Development approach       | Incremental milestones                      |
| First implementation focus | Backend                                     |
| Backend structure          | Models, Controllers, Routes, Authentication |
| MVP strategy               | Build core features first                   |
