# Requirements

## Functional Requirements

### Authentication

The system shall allow users to:

- Create an account.
- Log in and log out.
- Access only their own personal data.

---

## Injury Management

Users shall be able to:

- Create an injury profile.
- View their injuries.
- Update injury information.
- Delete injuries.

Each injury contains:

- Injury name/title.
- Body area.
- Side (left/right/both).
- Start date.
- Cause/context.
- Description.
- Current status.

---

## Timeline Management

Users shall be able to:

- Create timeline events.
- View timeline events.
- Update timeline events.
- Delete timeline events.

Supported event types:

- Symptom.
- Doctor visit.
- Imaging/test.
- Treatment.
- Injection.
- Medication.
- Rehabilitation.

Each event contains:

- Date.
- Type.
- Description.
- Result/outcome.
- Notes.

---

## Symptom Tracking

Users shall be able to record:

- Date.
- Pain level.
- Location.
- Trigger.
- Duration.
- Notes.

---

## Treatment Tracking

Users shall be able to record:

- Treatment name.
- Provider.
- Date.
- Cost.
- Outcome.
- Notes.

---

## Medical Visit Tracking

Users shall be able to record:

- Doctor name.
- Clinic.
- Date.
- Tests performed.
- Notes.
- Recommendations.

---

# Non-Functional Requirements

## Security

The system shall:

- Protect private user information.
- Store passwords securely.
- Prevent users from accessing other users' data.
- Use secure communication in production.

---

## Usability

The system should:

- Have a simple and intuitive interface.
- Work on desktop and mobile browsers.
- Provide clear feedback for user actions.

---

## Reliability

The system should:

- Validate user input.
- Handle errors gracefully.
- Prevent accidental data loss.

---

## Performance

The system should:

- Load user data efficiently.
- Provide responsive interactions for normal usage.

---

# Business Rules

- Each user can only access their own data.
- Each injury belongs to one user.
- Each timeline event belongs to one injury.
- Required information must be provided before saving data.
- Medical information is stored as user-provided information and is not interpreted or modified.

---

# MVP Acceptance Criteria

The MVP is complete when users can:

- Register and log in.
- Create and manage injury profiles.
- Record symptoms, treatments, and medical events.
- View their injury history as a timeline.
- Securely access their own information.
