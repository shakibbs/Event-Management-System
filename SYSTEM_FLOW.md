# Event Management System — End-to-End Flow

This document explains how **authentication**, **registration/login**, **user/role/permission management**, and **event management** work end-to-end in this repo.

## 1) High-level architecture

- **Frontend**: `frontend_event/` (React + Vite)
  - Public pages are rendered via an internal `publicView` state (Landing / All Events / Login / Register).
  - Authenticated pages use `react-router-dom` routes.
  - API calls are made via `frontend_event/src/lib/api.ts`.
- **Backend**: Spring Boot (`src/main/java/com/event_management_system/...`)
  - REST endpoints under `/api/...`.
  - Stateless **JWT** authentication via `JwtAuthenticationFilter`.
  - Role/permission-based authorization is enforced in service-layer checks (and sometimes via route gating in the frontend).

## 2) API base URL + client storage

### API base URL
Frontend uses:
- `VITE_API_BASE_URL` (env var)
- fallback: `http://localhost:8083/api`

All frontend paths in `api.ts` are appended to that base URL.

### Local storage keys
Frontend stores session info in local storage:
- `eventflow_user` — JSON of the logged-in user
- `eventflow_token` — access token (JWT)

Notes:
- Some UI code also removes `eventflow_refresh_token`, but the current `AuthContext` does **not** store a refresh token.

## 3) Backend security model (JWT + token cache)

### JWT contents
Backend generates JWTs in `JwtService`:
- `sub` (subject): `userId`
- `tokenUuid`: random UUID used for server-side allow-listing
- `role` and `roleId`: included on access token generation when known

### Token allow-listing (important)
Even if a JWT signature is valid, requests are only treated as authenticated if the token’s `tokenUuid` is present in the server-side cache:
- `TokenCacheService` stores `{ tokenUuid -> (userId, expirationTime) }` in-memory.
- On **logout**, the token UUID is removed from cache.

### Request authentication flow
For each incoming request:
1. `JwtAuthenticationFilter` reads `Authorization: Bearer <token>`.
2. Validates token signature/expiration.
3. Extracts `userId` + `tokenUuid`.
4. Checks `tokenUuid` exists in `TokenCacheService` and matches the user.
5. Loads the user via `CustomUserDetailsService` and sets Spring Security authentication.

### Public vs protected endpoints
Configured in `SecurityConfig`:
- Public (no auth required):
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
  - `GET /api/events/public`
  - `GET /api/events/respond`
  - Swagger endpoints
- Everything else: `authenticated()`

## 4) Roles & permissions (seeded on startup)

### Permissions seeded
`PermissionService.initializeDefaultPermissions()` (runs on startup):
- User/Role permissions: `user.view.all`, `user.manage.all`, `user.manage.own`, `role.view.all`, `role.manage.all`
- Event permissions: `event.manage.all`, `event.manage.own`, `event.view.all`, `event.view.public`, `event.view.invited`, `event.attend`, `event.invite`, `event.approve`, `event.hold`, `event.reactivate`
- History: `history.view.all`, `history.view.own`

### Roles seeded and permissions assigned
`RoleService.initializeDefaultRoles()` creates:
- `SuperAdmin` with broad permissions
- `Admin` with manage-own + event permissions
- `Attendee` with view/attend permissions

### Default super admin user
`UserService.initializeDefaultUsers()` creates (only if DB empty):
- Email: `superadmin@ems.com`
- Password: `SuperAdmin@123`
- Role: `SuperAdmin`

## 5) Authentication flows

### 5.1 Registration (self-register attendee)
**Frontend**: `frontend_event/src/pages/Register.tsx`
- Calls `AuthContext.register(name, email, password)`.
- `register()` calls `registerApi()` then immediately calls `login()`.

**Frontend API call**: `POST /api/auth/register`
- Implemented in `AuthController.selfRegister()`.
- Delegates to `UserService.selfRegisterAttendee()`.
- Intended behavior: assign the **ATTENDEE** role automatically; ignores any `roleId` in request.

**Important note (role name mismatch)**:
- The self-registration code looks up role name `"ATTENDEE"`.
- The default seeded role is named `"Attendee"`.
If the DB does not already contain a role named exactly `ATTENDEE`, self-registration may fail. (Fix would be to align names.)

### 5.2 Login
**Frontend**: `frontend_event/src/pages/Login.tsx`
- Calls `AuthContext.login(email, password)`.

**Frontend API call**: `POST /api/auth/login`
- Implemented in `AuthController.login()` → `AuthService.authenticate()`.

**Backend login details** (`AuthService.authenticate()`):
1. Loads user by email **with role + permissions** (`findByEmailWithRoleAndPermissions`).
2. Verifies password (BCrypt).
3. Generates:
   - access token: `generateAccessToken(userId, roleName, roleId)`
   - refresh token: `generateRefreshToken(userId)`
4. Extracts each token’s `tokenUuid` and caches both UUIDs.
5. Returns `AuthResponseDTO`:
   - `accessToken`, `refreshToken`, `tokenType=Bearer`, `expiresIn`, `user`.

**Frontend session storage** (`AuthContext.tsx`):
- Stores:
  - `eventflow_user` (the `user` field)
  - `eventflow_token` (token chosen from `token/accessToken/jwt/access_token`)

### 5.3 Authenticated API requests
**Frontend**: `apiRequest()` in `frontend_event/src/lib/api.ts`
- Adds `Authorization: Bearer <eventflow_token>` to requests **except** these public paths:
  - `/auth/login`, `/auth/register`, `/events/public`, `/events/respond`

### 5.4 Refresh token
**Backend**: `POST /api/auth/refresh`
- Validates refresh token
- Ensures refresh token UUID is still in cache
- Issues a new access token + caches its UUID

**Frontend status**: currently there is no automatic refresh flow wired into `AuthContext`.

### 5.5 Logout
**Backend**: `POST /api/auth/logout`
- Expects `Authorization: Bearer <accessToken>`
- Validates JWT and removes its `tokenUuid` from cache (invalidates token)

**Frontend**:
- `AuthContext.logout()` clears local storage and permission cache.
- `Settings.handleLogout()` calls `/auth/logout` but does not attach a token explicitly (it relies on `apiRequest()` to attach it).

## 6) User management flow

### UI entry
- Authenticated route: `/users` → `frontend_event/src/pages/UserManagement.tsx`
- Page is gated by permissions derived from `user.role.permissions`:
  - Can view if any of: `user.view.all`, `user.manage.all`, `user.manage.own`

### Backend endpoints
`UserController` (`/api/users`):
- `POST /api/users` — create user
- `GET /api/users` — list users
- `GET /api/users/{userId}` — get user
- `GET /api/users/email/{email}` — lookup
- `PUT /api/users/{userId}` — update user (service checks permission)
- `DELETE /api/users/{userId}` — delete user (service checks permission)
- `POST /api/users/{userId}/roles/{roleId}` — assign role
- `DELETE /api/users/{userId}/roles/{roleId}` — remove role
- `GET /api/users/download/pdf` — export PDF (checks `user.export` or manage permissions)

### Typical UI flow
- List users: `apiRequest('/users')`
- Create user: `apiRequest('/users', { method: 'POST', body: ... })`
- Edit user: `apiRequest('/users/:id', { method: 'PUT', body: ... })`
- Delete user: `apiRequest('/users/:id', { method: 'DELETE' })`
- Role assign/remove uses `/users/:id/roles/:roleId`

## 7) Role & permission management flow

### UI entry
- `/roles` → `frontend_event/src/pages/RoleManagement.tsx`
- `/permissions` → `frontend_event/src/pages/PermissionManagement.tsx`
- Both are gated by `role.manage.all`.

### Backend endpoints
- Roles (`RoleController` — `/api/roles`):
  - `POST /api/roles`
  - `GET /api/roles`
  - `GET /api/roles/{id}`
  - `PUT /api/roles/{id}`
  - `DELETE /api/roles/{id}`
  - `POST /api/roles/{roleId}/permissions/{permissionId}` (assign)
  - `DELETE /api/roles/{roleId}/permissions/{permissionId}` (remove)

- Permissions (`PermissionController` — `/api/permissions`):
  - `POST /api/permissions`
  - `GET /api/permissions`
  - `GET /api/permissions/{id}`
  - `PUT /api/permissions/{id}`
  - `DELETE /api/permissions/{id}`

## 8) Event management flow

### UI entry points
- `/events` → `frontend_event/src/pages/EventsList.tsx`
- `/pending-events` → `frontend_event/src/pages/PendingEventsList.tsx`
- `/event-management/:eventId` → `frontend_event/src/pages/EventManagement.tsx`
- `/invitations` → `frontend_event/src/pages/InvitationsPage.tsx`

### Backend endpoints
`EventController` (`/api/events`):
- `POST /api/events` — create event (requires `event.manage.own` or `event.manage.all`)
- `GET /api/events?page=&size=` — list events visible to current user (visibility + permission filtered)
- `GET /api/events/public` — list public upcoming events (no auth)
- `GET /api/events/{id}` — get event (must be allowed to view)
- `PUT /api/events/{id}` — update event (must be allowed to manage)
- `DELETE /api/events/{id}` — delete event (must be allowed to manage)
- `GET /api/events/{eventId}/attendees` — attendee list + invitation status
- `POST /api/events/{eventId}/invite` (multipart) — bulk invites (CSV + other sources)
- `GET /api/events/respond?token=...&action=ACCEPT|DECLINE` — invitation response (no auth)
- `POST /api/events/{eventId}/register` — self-register authenticated attendee for a **PUBLIC** event
- `POST /api/events/{eventId}/action` — approve/reject (requires `event.approve`)
- `POST /api/events/{eventId}/hold` — hold event (described as SuperAdmin-only)
- `POST /api/events/{eventId}/reactivate` — reactivate held event (described as SuperAdmin-only)
- `GET /api/events/download/pdf` — export events PDF

### Event list → create/edit/delete
**Frontend** (`EventsList.tsx`):
- Loads events via `fetchEventsApi()` → `GET /api/events?page=0&size=100`.
- Create: `POST /api/events`.
- Edit: `PUT /api/events/:id`.
- Delete: `DELETE /api/events/:id`.

### Pending approval
**Frontend** (`PendingEventsList.tsx`):
- Filters `approvalStatus === 'PENDING'` locally after fetching events.
- Row click navigates to `/event-management/:eventId`.

### Approve / reject
**Frontend** (`EventManagement.tsx`):
- Approve: `POST /api/events/:id/action` with `{ action: 'APPROVE', remarks }`
- Reject: `POST /api/events/:id/action` with `{ action: 'REJECT', remarks }`

### Hold / reactivate
**Frontend** (`EventManagement.tsx`):
- Hold: `POST /api/events/:id/hold`
- Reactivate: `POST /api/events/:id/reactivate`

### Invitations (bulk + tracking)
**Backend**:
- Invites are created/managed in `EventService.sendBulkInvitations(...)`.
- Email contains accept/decline links using `/api/events/respond?token=...&action=...`.

**Frontend**:
- `InvitationsPage.tsx`:
  - Loads events (same list endpoint).
  - “Show Attendees” → `GET /api/events/:id/attendees`
  - “Upload CSV” uses `sendBulkInvitationsApi()`.

**Multipart upload note**:
- `apiRequest()` sets `Content-Type: application/json` by default.
- For multipart uploads, `inviteUserApi()` in `api.ts` correctly bypasses the JSON header and uses `fetch()`.
- `sendBulkInvitationsApi()` currently uses `apiRequest()` with `FormData`, which may not work reliably unless headers are adjusted.

### Attendee registration for PUBLIC events
**Frontend** (`EventsList.tsx`):
- “Register” uses `registerForPublicEventApi(eventId)` → `POST /api/events/:id/register`.

**Backend** (`EventService.attendPublicEvent()`):
- Requires `event.attend` permission.
- Only allows if `event.visibility == PUBLIC` and the event hasn’t started.
- Creates `EventAttendees` record with status `ACCEPTED`.

## 9) Frontend navigation flow (what the user experiences)

### Public user flow
1. Land on `Landing` (public)
2. Browse public events via `GET /api/events/public` (Landing/All Events)
3. Register (creates attendee account) → Login → becomes authenticated

### Authenticated user flow
Once authenticated, the app renders the dashboard shell + routes:
- `/dashboard` — dashboard
- `/events` — events list
- `/pending-events` — approval queue
- `/event-management/:eventId` — manage a specific event
- `/users`, `/roles`, `/permissions` — admin screens (permission-gated)
- `/settings` — profile + change password + logout

## 10) Known mismatches / integration notes

These are implementation details worth knowing when wiring flows together:

- **Role name mismatch**: self-registration uses `"ATTENDEE"` but default seed role is `"Attendee"`.
- **Refresh token not stored on frontend**: backend issues refresh token but `AuthContext` only stores an access token.
- **Some API helpers point to endpoints that don’t exist**:
  - `fetchOwnEventsApi()` calls `/events/own` (no matching backend route).
  - `fetchInvitedUsersApi()` calls `/events/:id/invited` (no matching backend route).
- **Multipart uploads**: prefer `inviteUserApi()` (manual `fetch`) or update `apiRequest()` to handle `FormData` without forcing JSON headers.

---

If you want, I can also generate a shorter “API cheat sheet” file (endpoint list + required permissions) based strictly on the controllers above.