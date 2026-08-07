# Completion Criteria & Roadmap

# MVP Completion Checklist

## Product

- [ ] Users can register and log in.
- [ ] Users can securely access only their own data.
- [ ] Users can create, view, update, and delete injury profiles.
- [ ] Users can record symptoms, treatments, and medical events.
- [ ] Users can view injury history as a timeline.
- [ ] Users can manage their healthcare journey information.

---

# Backend

- [ ] Express server runs successfully.
- [ ] PostgreSQL connection works.
- [ ] Database schema is implemented.
- [ ] Prisma database layer is configured.
- [ ] User registration and login work.
- [ ] Passwords are securely hashed.
- [ ] JWT authentication works.
- [ ] Protected API routes require authentication.
- [ ] Users can only access their own resources.
- [ ] Injury CRUD operations work.
- [ ] Timeline events work.
- [ ] Symptoms work.
- [ ] Treatments work.
- [ ] Medical visits work.
- [ ] API matches the API Design document.

---

# Frontend

- [ ] Users can register.
- [ ] Users can login.
- [ ] Users can logout.
- [ ] Dashboard displays injuries.
- [ ] Users can create injuries.
- [ ] Users can view timelines.
- [ ] Users can add symptoms.
- [ ] Users can add treatments.
- [ ] Users can add medical visits.
- [ ] Frontend communicates with backend API.

---

# Deployment

- [ ] Frontend is publicly accessible.
- [ ] Backend API is publicly accessible.
- [ ] Database is connected.
- [ ] Authentication works in production.
- [ ] Users can manage injury data online.
- [ ] Production environment works independently from local development.

---

# Future Roadmap

## Version 2 — Patient History Organizer

- [ ] Medical document storage.
- [ ] Upload MRI reports, X-rays, lab results, and medical notes.
- [ ] Secure document access control.
- [ ] AI-generated medical summaries from user data.
- [ ] Appointment preparation tools.
- [ ] Translation support for healthcare communication.

---

## Version 3 — Healthcare Navigation Platform

- [ ] Healthcare provider search.
- [ ] Specialist discovery.
- [ ] Healthcare navigation tools.
- [ ] Community support features.

---

# Future Product Principles

- [ ] Continue protecting user privacy.
- [ ] Improve communication with healthcare professionals.
- [ ] Organize healthcare information.
- [ ] Avoid diagnosis features.
- [ ] Avoid replacing healthcare professionals.
- [ ] Avoid unsafe treatment recommendations.

## Future Improvements

### Planned Features

- [ ] React frontend improvements.
- [ ] Medical document uploads.
- [ ] AI-generated medical timeline summaries.
- [ ] Exportable medical history reports.
- [ ] Improved healthcare navigation support.

---

# Security Improvements

## Authentication Hardening Before Production Deployment

Current MVP authentication:

- JWT authentication.
- Tokens stored in `localStorage`.
- Authorization header used for protected requests.

This implementation is acceptable for development/testing but should be migrated before handling production healthcare data.

Before production deployment:

- [ ] Replace localStorage JWT storage with HttpOnly Secure cookies.
  - Update `frontend/services/utils.ts`.
  - Update frontend authentication flow.
- [ ] Configure SameSite cookie policies.
- [ ] Add CSRF protection for cookie-based authentication.
- [ ] Update frontend API requests to use credentialed requests.
- [ ] Update backend authentication middleware to validate session cookies instead of Authorization headers.

---

## UI Improvements

### Persist sidebar state correctly

**Current implementation**

The sidebar currently saves its open/closed state in a browser cookie (`sidebar_state`).

However, the application does not read this cookie when the sidebar initializes. As a result, the saved preference is ignored after a page refresh.

Current behavior:

1. User opens or collapses the sidebar.
2. Sidebar state is stored in the cookie.
3. User refreshes the page.
4. Sidebar resets to the default state.

---

### Planned improvement

Update:

`frontend/components/ui/sidebar.tsx`

Changes required:

- Read the `sidebar_state` cookie when `SidebarProvider` initializes.
- Use the stored value as the initial sidebar state.
- Keep updating the cookie whenever the user toggles the sidebar.

Expected behavior:
After a page refresh, `SidebarProvider` restores the open or closed state
from the `sidebar_state` cookie.
