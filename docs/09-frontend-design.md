# Frontend Design (UX/UI)

## Overview

The frontend is responsible for providing a simple and clear interface where users can organize and understand their healthcare journey.

The main user experience goal is:

> Help users quickly understand their injury history and communicate it better with healthcare professionals.

The design prioritizes:

- Simplicity.
- Clear information hierarchy.
- Timeline-based navigation.
- Easy data entry.
- Privacy and trust.

---

# Frontend Technology

## Decision

**React**

### Reasons

- Component-based architecture.
- Suitable for interactive applications.
- Strong ecosystem.
- Matches project experience.

### Tradeoffs

Advantages:

- Fast development.
- Reusable components.
- Large community support.

Disadvantages:

- Requires decisions about routing, state management, and project structure.
- Less opinionated than some frameworks.

---

# Styling Approach

## Decision

**Tailwind CSS**

### Reasons

- Fast UI development.
- Flexible customization.
- Good fit for dashboards and forms.

### Alternatives Considered

- Material UI.
- Bootstrap.
- Custom CSS.

### Tradeoffs

Advantages:

- Rapid development.
- Consistent styling.
- Avoids writing large CSS files.

Disadvantages:

- Utility classes can become difficult to manage in very large applications.
- Requires learning Tailwind conventions.

---

# User Experience Principles

## 1. Timeline First

The timeline is the core feature.

Users should easily answer:

- What happened?
- When did it happen?
- What treatments were tried?
- What helped or did not help?

---

## 2. Reduce Cognitive Load

Chronic injury management is already complicated.

The application should avoid:

- Complex navigation.
- Too many screens.
- Unnecessary information.

---

## 3. Simple Data Entry

Adding information should be quick.

Examples:

- Add symptom.
- Record treatment.
- Add doctor visit.

Forms should only request relevant information.

---

## 4. Privacy and Trust

The UI should clearly communicate:

- User data is private.
- The application organizes information.
- The application does not diagnose or replace doctors.

---

# User Flows

## New User

```text
Landing Page

↓

Register

↓

Login

↓

Create First Injury

↓

Add Timeline Information

↓

View Injury Journey
```

---

## Returning User

```text
Login

↓

Dashboard

↓

Select Injury

↓

View Timeline

↓

Add New Information
```

---

# Application Pages

## 1. Login Page

Purpose:

Allow existing users to access their account.

Elements:

- Email input.
- Password input.
- Login button.
- Registration link.

---

## 2. Register Page

Purpose:

Create a new account.

Elements:

- Email.
- Password.
- Confirm password.
- Create account button.

---

## 3. Dashboard

Purpose:

Provide an overview of the user's injuries.

Example:

```text
Welcome

Your Injuries

----------------

Left Hip Pain

Started:
2022

Status:
Under investigation

[View Timeline]

----------------

+ Add Injury
```

Information displayed:

- Injury list.
- Recent activity.
- Quick actions.

---

## 4. Injury Details Page

Purpose:

Show information about one injury.

Displays:

- Injury name.
- Body area.
- Side.
- Start date.
- Cause.
- Current status.
- Timeline summary.

Actions:

- Edit injury.
- Add event.
- Add symptom.
- Add treatment.
- Add medical visit.

---

## 5. Timeline Page

Purpose:

Display the complete injury journey.

Example:

```text
July 2026

Injection

Reason:
Diagnostic investigation

Result:
Temporary improvement


June 2026

MRI

Result:
No major findings
```

Features:

- Chronological ordering.
- Event categories.
- Expandable details.

---

## 6. Forms

### Injury Form

Fields:

- Injury name.
- Body area.
- Side.
- Start date.
- Cause.
- Description.
- Status.

---

### Symptom Form

Fields:

- Date.
- Pain level.
- Location.
- Trigger.
- Duration.
- Notes.

---

### Treatment Form

Fields:

- Treatment name.
- Provider.
- Date.
- Cost.
- Outcome.
- Notes.

---

### Medical Visit Form

Fields:

- Doctor.
- Clinic.
- Date.
- Tests.
- Notes.
- Recommendations.

---

# Navigation Design

## Decision

Simple dashboard-based navigation.

Main navigation:

```text
Navbar

- Dashboard
- Injuries
- Profile
- Logout
```

### Reason

The MVP has one primary purpose:

Managing injury history.

Avoid unnecessary navigation complexity.

---

# React Component Structure

Proposed structure:

```text
frontend/

src/

├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── InjuryDetails.jsx
│   └── Profile.jsx
│
├── components/
│   ├── Navbar.jsx
│   ├── InjuryCard.jsx
│   ├── Timeline.jsx
│   ├── TimelineItem.jsx
│   ├── InjuryForm.jsx
│   └── EventForm.jsx
│
├── services/
│   ├── authService.js
│   ├── injuryService.js
│   └── eventService.js
│
├── hooks/
│
└── context/
```

---

# State Management

## Decision

Start with:

- React state.
- Context API when shared state is required.

---

## Alternatives Considered

- Redux.
- Zustand.
- React Query.

---

## Reason

The MVP has limited frontend complexity:

- Authentication state.
- User information.
- Injury data.

A larger state management solution adds unnecessary complexity.

---

## Tradeoffs

Advantages:

- Simpler codebase.
- Faster development.
- Easier learning and maintenance.

Disadvantages:

- May require migration if the application grows significantly.

---

# Responsive Design

The application should support:

- Desktop.
- Tablet.
- Mobile browsers.

Priority:

Desktop-first.

Reason:

Users may organize medical information during appointments or while reviewing records.

---

# Accessibility Requirements

The frontend should:

- Use clear form labels.
- Support keyboard navigation.
- Provide readable text contrast.
- Avoid depending only on colors.
- Provide meaningful error messages.

---

# Final Frontend Decisions

| Area             | Decision                         |
| ---------------- | -------------------------------- |
| Framework        | React                            |
| Styling          | Tailwind CSS                     |
| Navigation       | Dashboard-based                  |
| Main Feature     | Injury timeline                  |
| State Management | React State + Context            |
| Design Approach  | Simple and user-focused          |
| Priority         | Usability over visual complexity |

---

# Future Frontend Extensions

Not included in MVP:

- Medical document viewer.
- Data visualization dashboards.
- AI-generated summaries.
- Healthcare provider search.
- Mobile application.
