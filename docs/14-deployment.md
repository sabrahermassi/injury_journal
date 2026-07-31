# Deployment

## Overview

This document defines the deployment strategy for the Injury Journal MVP.

The goal is to move the application from local development to a production environment where users can access it online.

Deployment includes:

- Frontend hosting.
- Backend hosting.
- Database hosting.
- Environment configuration.
- Automatic deployments.
- Production security.

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

# Hosting Decisions

## Frontend Hosting

Decision:

**Vercel**

Purpose:

Host the React frontend application.

Reasons:

- Designed for frontend applications.
- Easy GitHub integration.
- Automatic deployments.
- Simple environment variable management.

Tradeoff:

Advantages:

- Fast setup.
- Good developer experience.
- Free tier available.

Disadvantages:

- Primarily optimized for frontend workloads.

---

## Backend Hosting

Decision:

**Render**

Purpose:

Host the Node.js and Express backend API.

Reasons:

- Supports Node.js applications.
- Connects easily with GitHub.
- Supports environment variables.
- Simple deployment workflow.

Tradeoff:

Advantages:

- Easy setup.
- Suitable for portfolio projects.
- Supports backend services.

Disadvantages:

- Free tier has limitations.

---

## Database Hosting

Decision:

Cloud PostgreSQL database.

Possible providers:

- Neon.
- Supabase.
- Railway.
- Render PostgreSQL.

Requirements:

- PostgreSQL compatibility.
- Secure connection.
- Reliable backups.
- Environment variable support.

---

# Environment Strategy

The application uses separate environments.

```text
Development

↓

Production
```

---

# Development Environment

Used during local development.

Example:

```text
Frontend:
localhost:5173

Backend:
localhost:3001

Database:
Local PostgreSQL
```

---

# Production Environment

Used by real users.

Example:

```text
Frontend:
Production URL

Backend:
Production API URL

Database:
Cloud PostgreSQL
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

# Deployment Workflow

The deployment process:

```text
Developer writes code

↓

Push changes to GitHub

↓

Hosting platform detects changes

↓

Application builds

↓

Tests run

↓

New version deployed
```

---

# Backend Deployment Process

Steps:

1. Prepare backend for production.
2. Configure production environment variables.
3. Connect GitHub repository.
4. Select backend application.
5. Deploy service.
6. Test API endpoints.

Requirements:

- Production start script.
- Database connection.
- CORS configuration.
- Environment variables.

---

# Frontend Deployment Process

Steps:

1. Connect frontend repository.
2. Configure API URL.
3. Create production build.
4. Deploy application.
5. Verify user flows.

---

# Database Deployment Process

Steps:

1. Create cloud PostgreSQL database.
2. Configure database connection.
3. Add DATABASE_URL.
4. Run database migrations.
5. Verify database access.

---

# CI/CD Strategy

Decision:

Use Git-based automatic deployment.

Workflow:

```text
Git Push

↓

Automatic Build

↓

Automatic Deployment
```

---

# Production Checklist

## Backend

- [ ] Server starts successfully.
- [ ] Database connection works.
- [ ] Environment variables are configured.
- [ ] API endpoints are tested.
- [ ] CORS is configured.
- [ ] Authentication works.

---

## Frontend

- [ ] Production build succeeds.
- [ ] API URL is configured.
- [ ] Login works.
- [ ] Pages load correctly.
- [ ] Data displays correctly.

---

## Database

- [ ] Database migrations completed.
- [ ] Data persists correctly.
- [ ] Connection is secure.

---

# Security Requirements

Production must include:

- HTTPS communication.
- Protected environment variables.
- Secure database credentials.
- Restricted CORS configuration.
- Password hashing.
- Protected JWT secret.

---

# Deployment Completion Criteria

Deployment is complete when:

- Frontend is publicly accessible.
- Backend API is publicly accessible.
- Database is connected.
- Authentication works in production.
- Users can create and manage injury data online.
- Production environment works independently from local development.

---

# Final Deployment Decisions

| Area              | Decision                       |
| ----------------- | ------------------------------ |
| Frontend Hosting  | Vercel                         |
| Backend Hosting   | Render                         |
| Database          | Cloud PostgreSQL               |
| Deployment Method | Git-based automatic deployment |
| Environments      | Development + Production       |
| Configuration     | Environment variables          |
| CI/CD             | Automatic deployment           |
