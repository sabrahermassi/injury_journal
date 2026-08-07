## Future Improvements

Planned features:

- React frontend improvements
- Medical document uploads
- AI-generated medical timeline summaries
- Exportable medical history reports
- Improved healthcare navigation support

### Security Improvements

The MVP currently uses JWT authentication with tokens stored in localStorage.

Future authentication hardening:

- Replace localStorage JWT storage with HttpOnly, Secure cookies (change in frontend/services/utils.ts file)
- Use SameSite cookie policies to reduce cross-site attacks.
- Add CSRF protection for cookie-based authentication.
- Update frontend API requests to use credentialed requests.
- Update backend authentication middleware to validate session cookies instead of Authorization headers.

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
