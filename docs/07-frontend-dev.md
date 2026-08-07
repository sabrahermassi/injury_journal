# Frontend Development

## Technology Stack

| Area             | Decision                      |
| ---------------- | ----------------------------- |
| Framework        | React                         |
| Styling          | Tailwind CSS                  |
| Routing          | React Router                  |
| API Client       | Axios                         |
| State Management | React State + Context API     |
| Architecture     | Pages + Components + Services |

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

# Authentication Design

## Decision

Use React Context API. The MVP only requires simple global state. It stores:

- Current user.
- Authentication status.
- JWT token.

---

## JWT Token Handling

- JWT is returned by the backend after login.
- Token is stored in localStorage.
- On application startup, the token is loaded to restore authentication state.
- Logout removes the stored token.
- Expired or invalid tokens clear the session and require login again.

Protected API requests include:

```http
Authorization: Bearer <token>
```

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

# State Management

Decision:

Use:

- React state for local component data.
- Context API for shared authentication state.

Reason:

The MVP only requires simple global state management for user authentication and session data.
