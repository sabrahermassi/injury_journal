# Architecture

## Purpose

This document describes the technical structure of the Injury Journal application.
The goal is to define the main system components and how they communicate before implementation.

## Application Type

Injury Journal is a full-stack web application consisting of:

- Frontend application
- Backend API
- Database

## High-Level Architecture

User

↓

React Frontend

↓

Node.js / Express Backend

↓

PostgreSQL Database

## Frontend

Technology:

- React

Responsibilities:

- Display user interface
- Handle user input
- Show injury information
- Communicate with backend API

## Backend

Technology:

- Node.js
- Express

Responsibilities:

- Provide API endpoints
- Authenticate users
- Validate incoming data
- Apply business logic
- Communicate with database

## Database

Technology:

- PostgreSQL

Responsibilities:

Store:

- users
- injuries
- timeline events
- symptoms
- treatments
- medical visits

## Authentication

The application uses JWT-based authentication.

Flow:

1. User logs in
2. Backend verifies credentials
3. Backend returns JWT token
4. Frontend sends token with future requests

## Deployment

Frontend:
Vercel

Backend:
Render

Database:
PostgreSQL cloud database
