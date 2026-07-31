# Frontend Development

## Overview

This document defines the frontend implementation plan for the Injury Journal MVP.

The frontend is responsible for:

- User interface.
- User interactions.
- Form handling.
- Communication with the backend API.
- Displaying injury history and timelines.

---

# Frontend Technology Stack

## Framework

**React**

Purpose:

- Build reusable UI components.
- Create interactive pages.
- Manage application state.

---

## Styling

**Tailwind CSS**

### Reasons:

- Fast UI development.
- Flexible styling system.
- Easy creation of responsive layouts.

### Tradeoff:

Advantages:

- Faster development.
- Highly customizable.

Disadvantages:

- Requires learning utility classes.
- Can make JSX more verbose.

---

## Routing

**React Router**

Purpose:

Manage navigation between application pages.

Main routes:

```text id="f7z4q2"
/login

/register

/dashboard

/injuries/:id

/profile
```

---

## HTTP Client

**Axios**

Purpose:

Communicate with backend REST API.

Reasons:

- Simple API calls.
- Better error handling.
- Supports request interceptors for JWT authentication.

Tradeoff:

Alternative:

Fetch API

Advantages of Axios:

- Easier configuration.
- Better support for authenticated requests.

---

# Frontend Architecture

The frontend follows a component-based structure.

```text id="4m0p1x"
frontend/

src/

├── pages/
│
├── components/
│
├── services/
│
├── context/
│
├── hooks/
│
├── utils/
│
├── App.jsx
└── main.jsx
```

---

# Folder Responsibilities

## Pages

Pages represent complete application screens.

Example:

```text id="6o5z9q"
pages/

Login.jsx

Register.jsx

Dashboard.jsx

InjuryDetails.jsx

Profile.jsx
```

---

## Components

Reusable UI elements.

Example:

```text id="8q6t1w"
components/

Navbar.jsx

InjuryCard.jsx

Timeline.jsx

TimelineItem.jsx

InjuryForm.jsx

EventForm.jsx
```

---

## Services

Handles communication with backend APIs.

Example:

```text id="q4z1vy"
services/

authService.js

injuryService.js

eventService.js
```

Responsibilities:

- Send API requests.
- Process responses.
- Keep API logic separate from UI components.

---

## Context

Stores global application state.

Example:

```text id="s8x2vv"
context/

AuthContext.jsx
```

Used for:

- Current user.
- Authentication status.
- JWT token.

---

# User Interface Pages

## Login Page

Purpose:

Allow existing users to access their account.

Contains:

- Email field.
- Password field.
- Login button.
- Register link.

Flow:

```text id="8e4w0k"
Enter credentials

↓

Send login request

↓

Receive JWT token

↓

Store authentication state

↓

Redirect to dashboard
```

---

# Register Page

Purpose:

Create a new user account.

Fields:

- Email.
- Password.
- Confirm password.

---

# Dashboard Page

Purpose:

Provide an overview of the user's injuries.

Example:

```text id="d4p2ay"
Welcome User


Your Injuries

----------------

Left Hip Pain

Started:
2022

Status:
Under investigation


[View Timeline]


+ Add Injury
```

Displays:

- User injuries.
- Injury status.
- Recent activity.
- Quick actions.

---

# Injury Details Page

Purpose:

Display information about a single injury.

Contains:

- Injury information.
- Timeline.
- Symptoms.
- Treatments.
- Medical visits.

Actions:

- Edit injury.
- Add timeline event.
- Add symptom.
- Add treatment.
- Add medical visit.

---

# Timeline Component

The timeline is the main product feature.

Purpose:

Help users understand their healthcare journey chronologically.

Example:

```text id="u5q7n2"
July 2026

Injection

Temporary improvement


June 2026

MRI

No major findings
```

Features:

- Chronological ordering.
- Event categories.
- Expandable details.

---

# Authentication Design

## Decision

Use React Context API.

Reason:

The MVP only requires simple global state.

Stores:

- Current user.
- Authentication status.
- JWT token.

---

## Authentication Flow

```text id="7kq8m1"
User logs in

↓

Backend returns JWT

↓

Frontend stores token

↓

Token attached to API requests

↓

Protected pages become accessible
```

---

# Form Design

All forms should include:

- Validation.
- Error messages.
- Required field checks.
- Clear labels.

---

## Injury Form

Fields:

- Injury name.
- Body area.
- Side.
- Start date.
- Cause.
- Description.
- Status.

---

## Symptom Form

Fields:

- Date.
- Pain level.
- Location.
- Trigger.
- Duration.
- Notes.

---

## Treatment Form

Fields:

- Treatment name.
- Provider.
- Date.
- Cost.
- Outcome.
- Notes.

---

## Medical Visit Form

Fields:

- Doctor.
- Clinic.
- Date.
- Tests.
- Notes.
- Recommendations.

---

# State Management Decision

## Decision

Use:

- React state.
- Context API.

---

## Reason

The MVP has limited global state requirements:

- Authentication.
- User session.

Most data can remain local to components.

---

## Tradeoff

Advantages:

- Simple architecture.
- Faster development.
- Less dependency complexity.

Disadvantages:

- May require migration to a larger state solution as the product grows.

---

# Responsive Design

The application should support:

- Desktop.
- Tablet.
- Mobile.

Priority:

Desktop-first.

Reason:

Users may manage detailed medical information during healthcare appointments.

---

# Frontend Development Order

```text id="p9h7w3"
1. Create React project

2. Install dependencies

3. Configure Tailwind CSS

4. Configure React Router

5. Create application layout

6. Create authentication pages

7. Implement login/register

8. Create dashboard

9. Create injury pages

10. Create timeline component

11. Create forms

12. Connect frontend to API

13. Improve UI and usability
```

---

# Frontend Completion Criteria

The frontend is complete when:

- Users can register.
- Users can login.
- Users can logout.
- Dashboard displays injuries.
- Users can create injuries.
- Users can view timelines.
- Users can add symptoms.
- Users can add treatments.
- Users can add medical visits.
- Frontend communicates correctly with backend.

---

# Final Frontend Decisions

| Area             | Decision                      |
| ---------------- | ----------------------------- |
| Framework        | React                         |
| Styling          | Tailwind CSS                  |
| Routing          | React Router                  |
| API Client       | Axios                         |
| State Management | React State + Context API     |
| Architecture     | Pages + Components + Services |
| Main Feature     | Injury Timeline               |
| Design Priority  | Simplicity and usability      |
