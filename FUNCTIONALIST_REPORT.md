# Event Management System — Functionalist Report (Code-Grounded)

This report describes what the system **actually implements** based on the current repository code (Spring Boot backend + React frontend), with cross-checks against existing docs.

- Backend root: `src/main/java/com/event_management_system/`
- Frontend root: `frontend_event/src/`

## 1) System Summary

**What it is:** A role-based event management platform with an approval workflow, invitations (email + tokenized responses), attendee registration for public events, user/role/permission management, audit/history tracking, scheduled reminder emails, and PDF exports (JasperReports).

**Core modules (backend):**
- Authentication & session: JWT + server-side token UUID allow-list
- RBAC: roles, permissions, role-permission mapping
- Events: create/update/delete, visibility (public/private), approval workflow, hold/reactivate
- Invitations: bulk invite via CSV + registered users + temp email table, tokenized accept/decline
- Attendees: registration for public events; attendee list per event
- History/audit: activity, login/logout, password change history
- Reporting: dynamic JRXML → PDF export for events/users/activity
- Scheduler: event reminders (24h + ~2h before) and placeholder “audit log archival”

## 1A) Diagram-Ready Functional Specification (Read This For Diagrams)

This section is written so you can produce diagrams by copying the **actors**, **use cases**, **workflow steps**, **state transitions**, and **data relationships**.

### Actors
- **SuperAdmin**: full control; can approve events; can hold/reactivate events; can view all history.
- **Admin**: manages own events and (in practice) “own” users; can invite and approve events.
- **Attendee**: views public/invited events; registers for public events; accepts/declines invitations.
- **External Invitee (No Account)**: invited by email; can accept/decline using invitation token; may get an auto-created account on accept.
- **System Scheduler**: runs reminder job every 5 minutes and archival job daily.
- **Email Server (SMTP)**: delivers invitations, reminders, confirmations, and credentials.

### Actor-Wise Functionalities (for Actor-Based Diagrams)

Use this part to build diagrams **per actor** (one swimlane per actor, or one sequence diagram per actor-driven workflow).

#### Common to all authenticated roles (SuperAdmin/Admin/Attendee)
- **UC-01** Login → `POST /api/auth/login`
- **UC-03** Refresh token → `POST /api/auth/refresh`
- **UC-04** Logout → `POST /api/auth/logout`
- **UC-05** Change password → `POST /api/auth/change-password`

**WF-AUTH-01: Login and start session (UC-01)**
- 1) Client calls `POST /api/auth/login` with email/password.
- 2) Server authenticates; issues access+refresh JWT (each contains `tokenUuid`).
- 3) Server stores token UUID(s) in `TokenCacheService` (allow-list) with expirations.
- 4) Server writes login/activity history.
- 5) Client stores access token (`eventflow_token`) and uses `Authorization: Bearer`.

**WF-AUTH-02: Logout and invalidate token (UC-04)**
- 1) Client calls `POST /api/auth/logout`.
- 2) Server removes token UUID(s) from cache → token is rejected immediately.
- 3) Server writes logout/activity history.

#### Public user (not logged in)
- **UC-02** Self-register attendee → `POST /api/auth/register`
- **Browse public events** → `GET /api/events/public`

**WF-PUB-01: Self-register attendee (UC-02)**
- 1) Client calls `POST /api/auth/register`.
- 2) Server attempts to assign role by name `ATTENDEE`.
- 3) Server persists `User`.
- Known mismatch: default role is `Attendee` (not `ATTENDEE`) → registration may fail unless role `ATTENDEE` exists.

#### SuperAdmin
- **Event administration**
  - **UC-10/12/13** Create/Update/Delete event → `POST|PUT|DELETE /api/events` (permissions: `event.manage.all`)
  - **UC-14** Approve/Reject event → `POST /api/events/{eventId}/action` (permission: `event.approve`)
  - **UC-15** Hold/Reactivate event → `POST /api/events/{eventId}/hold|reactivate` (SuperAdmin-only + `event.hold` / `event.reactivate`)
  - **UC-16** Export events PDF → `GET /api/events/download/pdf`
- **RBAC administration**
  - **UC-30/31** Manage users/roles assignment → `/api/users/**` (permissions: `user.manage.all`)
  - **UC-32** Manage roles → `/api/roles/**` (permissions: `role.manage.all`)
  - **UC-33** Manage permissions → `/api/permissions/**`
- **History**
  - **UC-40** View history for anyone → `/api/history/**` (permission: `history.view.all`)
  - **UC-41** Export history PDF → `GET /api/history/download/pdf?type=...` (permission names vary by type; see mismatch in section 15)

**WF-SA-01: Approve/Reject event (UC-14)**
- 1) Client calls `POST /api/events/{eventId}/action` with `{ action: APPROVE|REJECT, remarks? }`.
- 2) Server verifies `event.approve`.
- 3) APPROVE → `approvalStatus=APPROVED`.
- 4) REJECT → requires remarks; sets `approvalStatus=REJECTED` and `eventStatus=CANCELLED`.
- 5) Server stores `approvedBy`, `approvedAt`.

**WF-SA-02: Hold / Reactivate event (UC-15)**
- Hold: `POST /api/events/{eventId}/hold` allowed only if role is SuperAdmin and permission `event.hold`, and event is `UPCOMING` → `INACTIVE`.
- Reactivate: `POST /api/events/{eventId}/reactivate` allowed only if role is SuperAdmin and permission `event.reactivate`, and event is `INACTIVE` → `UPCOMING`.

#### Admin
- **Own event management**
  - **UC-10/12/13** Create/Update/Delete own event → `POST|PUT|DELETE /api/events` (permissions: `event.manage.own` or `event.manage.all`)
  - **UC-11** View events → `GET /api/events?page=&size=` (filtered by `canViewEvent()`)
  - **UC-20** Bulk invite attendees → `POST /api/events/{eventId}/invite` (organizer or `event.manage.all`)
  - **UC-21** View attendees for event → `GET /api/events/{eventId}/attendees`
  - **UC-14** Approve/Reject event → `POST /api/events/{eventId}/action` (permission: `event.approve`)
    - Rule: organizer cannot approve/reject own event unless role is SuperAdmin.
  - **UC-16** Export events PDF → `GET /api/events/download/pdf`
- **“Own” user management (as implemented)**
  - **UC-30** Manage users under `user.manage.own` → code path allows managing users whose role name equals `Attendee`.
  - **UC-31** Assign/remove role → `/api/users/{userId}/roles/{roleId}` (subject to `canManageUser` checks).
- **History**
  - **UC-40** View own history → `/api/history/**` (permission: `history.view.own`)

**WF-ADM-01: Create event (UC-10)**
- 1) `POST /api/events`.
- 2) Server validates `event.manage.own` or `event.manage.all`.
- 3) Saves event with `approvalStatus=PENDING`, `eventStatus=UPCOMING`, organizer=current user.

**WF-ADM-02: Bulk invite attendees (UC-20)**
- 1) `POST /api/events/{eventId}/invite` (multipart).
- 2) Server validates organizer (or `event.manage.all`) and event in future.
- 3) Targets = CSV + `temp_email` + registered users (excluding organizer).
- 4) Creates `EventAttendees(PENDING, invitationToken)` and emails links.

#### Attendee
- **Browse/view**
  - View public upcoming events without auth: `GET /api/events/public`
  - View authorized events: `GET /api/events?page=&size=` (must pass `canViewEvent()` checks)
- **Participation**
  - **UC-23** Register for PUBLIC event → `POST /api/events/{eventId}/register` (permission: `event.attend`)
  - **UC-22** Respond to invitation → `GET /api/events/respond?token=...&action=...` (public endpoint; invite must exist)
- **History**
  - **UC-40** View own history (permission: `history.view.own`)

**WF-ATT-01: Register for public event (UC-23)**
- 1) Authenticated attendee calls `POST /api/events/{eventId}/register`.
- 2) Server checks permission `event.attend`, event is `PUBLIC`, and start time is in the future.
- 3) Server creates/ensures `EventAttendees` with `invitationStatus=ACCEPTED`.

#### External Invitee (No Account)
- **UC-22** Respond to invitation (accept/decline) → `GET /api/events/respond?token=...&action=ACCEPT|DECLINE` (explicitly `permitAll`)

**WF-EXT-01: Respond to invitation (UC-22)**
- 1) Invitee opens `GET /api/events/respond?token=...&action=ACCEPT|DECLINE`.
- 2) Server finds `EventAttendees` by `invitationToken` and requires status `PENDING`.
- 3) ACCEPT → status `ACCEPTED`; DECLINE → status `DECLINED`.
- 4) On ACCEPT, if no `User` exists, server auto-creates a `User` with role `Attendee` and emails temp credentials.

#### System Scheduler
- **UC-24** Send reminders (24h + ~2h windows)
- Daily archival placeholder

**WF-SYS-01: Reminder job (UC-24)**
- 1) Every 5 minutes, find approved upcoming events in reminder windows.
- 2) For accepted attendees with a linked `User`, send emails and set reminder flags.

#### Email Server (SMTP)
- Delivers invitation/reminder/confirmation/credential emails initiated by backend (`EmailService`).

### Full Use-Case Index (flat list)
- **UC-01** Authenticate (Login)
- **UC-02** Register (Self-register attendee)
- **UC-03** Refresh session token
- **UC-04** Logout
- **UC-05** Change password
- **UC-10** Create event
- **UC-11** View event(s)
- **UC-12** Update event
- **UC-13** Delete event (soft)
- **UC-14** Approve/Reject event
- **UC-15** Hold / Reactivate event
- **UC-16** Export events PDF
- **UC-20** Bulk invite attendees (CSV + temp_email + registered users)
- **UC-21** View attendees for event
- **UC-22** Respond to invitation (accept/decline)
- **UC-23** Self-register for PUBLIC event
- **UC-24** Receive event reminders (24h and ~2h)
- **UC-30** Manage users (CRUD, export PDF)
- **UC-31** Assign / remove role for user
- **UC-32** Manage roles (CRUD + add/remove permissions)
- **UC-33** Manage permissions (CRUD)
- **UC-40** View history (activity, login/logout, password)
- **UC-41** Export history PDF

### State Machines (for State Diagram)

#### Event approval state (`Event.approvalStatus`)
- `PENDING` → `APPROVED` via `POST /api/events/{id}/action` (action=APPROVE)
- `PENDING` → `REJECTED` via `POST /api/events/{id}/action` (action=REJECT, remarks required)
- Terminal in practice: once not `PENDING`, further approve/reject is blocked.

#### Event runtime state (`Event.eventStatus`)
- Default on create: `UPCOMING`
- Hold/reactivate:
  - `UPCOMING` → `INACTIVE` via `POST /api/events/{id}/hold` (SuperAdmin + permission)
  - `INACTIVE` → `UPCOMING` via `POST /api/events/{id}/reactivate`
- Time-derived (helper method `getCurrentEventStatus()`):
  - Before start → UPCOMING
  - Between start/end → ONGOING
  - After end → COMPLETED
- Reject path: REJECT sets `eventStatus=CANCELLED`.

#### Invitation state (`EventAttendees.invitationStatus`)
- `PENDING` → `ACCEPTED` via `GET /api/events/respond?...action=ACCEPT`
- `PENDING` → `DECLINED` via `GET /api/events/respond?...action=DECLINE`
- After response, additional responses are rejected.

Diagram mapping:
- External Invitee uses **WF-EXT-01** to drive these transitions.
- Attendee uses **WF-ATT-01** (public registration) which creates an `ACCEPTED` attendee record without using invitation response.

#### Session allow-list state (token UUID)
- Issued and cached at login/refresh → request allowed
- Removed from cache at logout → request denied (even if JWT not expired)

### Data Model Relationships (for ERD)
- `User` → `Role` (many users can share one role)
- `Role` ↔ `Permission` (many-to-many via `RolePermission` join table)
- `Event` → `User` (organizer; many events per organizer)
- `EventAttendees` → `Event` (many attendees per event)
- `EventAttendees` → `User` (optional; external invitees may be null until auto-account creation)
- `UserActivityHistory` → `User` (many activity rows per user)
- `UserLoginLogoutHistory` → `User` (many sessions per user)
- `UserPasswordHistory` → `User` (many password change rows per user; stores old/new hashed passwords)

## 2) Tech Stack & Architecture

### Backend
- Spring Boot REST API (controllers under `.../controller`)
- Spring Security stateless JWT (`SecurityConfig`, `JwtAuthenticationFilter`)
- Persistence: Spring Data JPA entities in `.../entity`
- Email: `JavaMailSender` (HTML emails)
- Reporting: JasperReports (JRXML generated at runtime)
- Scheduler: Spring `@Scheduled`

### Frontend
- React + TypeScript (Vite)
- Routes defined in `frontend_event/src/App.tsx`
- Auth state stored in `localStorage`: `eventflow_user`, `eventflow_token`
- API wrapper: `frontend_event/src/lib/api.ts` using `Authorization: Bearer <token>`

## 3) Users, Roles, Permissions (Implemented)

### Default permissions created at startup
`PermissionService.initializeDefaultPermissions()` creates (if missing):
- SuperAdmin:
  - `user.view.all`, `user.manage.all`
  - `role.view.all`, `role.manage.all`
  - `event.manage.all`, `event.approve`, `event.hold`, `event.reactivate`
  - `system.config`
  - `history.view.all`
- Admin:
  - `user.manage.own`
  - `event.manage.own`, `event.view.all`, `event.invite`, `event.approve`
- Attendee:
  - `event.view.public`, `event.view.invited`, `event.attend`
- Shared:
  - `history.view.own`

### Default roles created at startup
`RoleService.initializeDefaultRoles()` creates/updates roles and assigns permissions:
- `SuperAdmin`: broad management + approval + hold/reactivate + `history.view.all`
- `Admin`: manage own users/events, view all events, invite, approve, `history.view.own`
- `Attendee`: view public/invited, attend, `history.view.own`

### How permissions are checked
- In services (not in `@PreAuthorize` annotations):
  - `UserService.hasPermission(userId, permissionName)` → loads role permissions via `RoleService.getPermissionsForRole(roleId)`
  - Event access uses `event.manage.all`, `event.manage.own`, `event.view.all`, `event.view.public`, `event.view.invited`, `event.attend`

## 4) Authentication & Session Model

### Auth endpoints (public)
From `SecurityConfig` + `AuthController`:
- `POST /api/auth/login`
- `POST /api/auth/register` (self-register)
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Also: `POST /api/auth/change-password` (requires auth)

### JWT + allow-list behavior
- JWT contains a `tokenUuid` claim (`JwtService`)
- Requests pass `JwtAuthenticationFilter` only if:
  1) JWT signature + expiry are valid, and
  2) `tokenUuid` exists in `TokenCacheService` and matches the user
- Logout removes token UUID from server cache → token becomes invalid immediately (even if JWT not expired).

## 5) Event Management (Backend)

### Event entity behavior
`Event` (`events` table):
- `visibility`: `PUBLIC` | `PRIVATE`
- `approvalStatus`: `PENDING` | `APPROVED` | `REJECTED`
- `eventStatus`: `UPCOMING` | `INACTIVE` | `ONGOING` | `COMPLETED` | `CANCELLED`
- `hold()` → `INACTIVE`; `reactivate()` → `UPCOMING`; `cancel()` → `CANCELLED`

### Event API (controller)
From `EventController` (base path: `/api/events`):
- `POST /api/events` — create event (requires `event.manage.own` or `event.manage.all`)
- `GET /api/events?page=&size=` — returns events *visible to current user* (manual pagination)
- `GET /api/events/public` — list public upcoming events (no auth required)
- `GET /api/events/{id}` — get event (visibility rules apply)
- `PUT /api/events/{id}` — update event (manage rules apply)
- `DELETE /api/events/{id}` — soft delete event (manage rules apply)
- `GET /api/events/{eventId}/attendees` — list attendees for an event (requires view permission/relationship)
- `POST /api/events/{eventId}/invite` (multipart) — bulk invite processing (organizer or `event.manage.all`)
- `POST /api/events/{eventId}/action` — approve/reject (requires `event.approve`)
- `GET /api/events/respond?token=...&action=ACCEPT|DECLINE` — invitation response (public)
- `POST /api/events/{eventId}/hold` — hold event (SuperAdmin + `event.hold`)
- `POST /api/events/{eventId}/reactivate` — reactivate (SuperAdmin + `event.reactivate`)
- `GET /api/events/download/pdf` — PDF export of visible events

### Event visibility rules (service)
`EventService.canViewEvent(event, userId)` returns true if any:
- user has `event.manage.all` or `event.view.all`
- user is organizer
- user is attending (exists `EventAttendees` linked to user)
- event is `PUBLIC` and user has `event.view.public`
- event is `PRIVATE`, user has `event.view.invited`, and user is invited

### Public self-registration
- `POST /api/events/{eventId}/register` allows authenticated users with `event.attend` to register **only if**:
  - event visibility is `PUBLIC`
  - event start time is in the future
  - user not already registered

Registration is stored as `EventAttendees` with status `ACCEPTED`.

## 6) Invitations & Attendees

### Invitation storage
`EventAttendees` (`event_attendees` table):
- `invitationStatus`: `PENDING` | `ACCEPTED` | `DECLINED`
- `invitationToken` auto-generated UUID at persist
- timestamps: sentAt, responseAt
- reminder flags: `advanceReminderSent`, `lastMinuteReminderSent`

### Bulk invitation sources (implemented)
`EventService.sendBulkInvitations(eventId, file, organizerId)` loads invites from:
1) CSV file (emails in first column; header optionally skipped)
2) `temp_email` table (via `JdbcTemplate`)
3) All registered users except organizer

Invitation processing is async/batched (size 10) with a 2s throttle between batches.

### Invitation email flow
- For each invited email, creates an `EventAttendees` row (PENDING) and sends email with token links:
  - accept: `/api/events/respond?token=...&action=ACCEPT`
  - decline: `/api/events/respond?token=...&action=DECLINE`

### Accept/decline behavior
`EventService.respondToInvitation(token, action)`:
- Only allowed once if current status is `PENDING`
- On ACCEPT:
  - sets status `ACCEPTED`
  - if attendee has no user account, auto-creates a user account with role `Attendee` and a temporary password
  - sends confirmation email
  - sends credentials email (with retry) if auto-account was created
- On DECLINE:
  - sets status `DECLINED`
  - sends confirmation email

## 7) Event Approval Workflow

- New events default to `approvalStatus=PENDING`
- `POST /api/events/{eventId}/action` with body `{ action: APPROVE|REJECT, remarks? }`
  - requires `event.approve`
  - organizer cannot approve/reject their own event unless they have role `SuperAdmin`
  - only processes events still in `PENDING`
  - REJECT requires remarks; sets `approvalStatus=REJECTED` and `eventStatus=CANCELLED`
  - APPROVE sets `approvalStatus=APPROVED`

## 8) User Management (Backend)

From `UserController` (base `/api/users`):
- `POST /api/users` — create user
- `GET /api/users` — list users
- `GET /api/users/{userId}` — get user
- `GET /api/users/email/{email}` — get user by email
- `PUT /api/users/{userId}` — update user (permission-filtered)
- `DELETE /api/users/{userId}` — delete user (hard delete + cascade deletes in services)
- `POST /api/users/{userId}/roles/{roleId}` — assign role
- `DELETE /api/users/{userId}/roles/{roleId}` — remove role
- `GET /api/users/download/pdf` — export users list PDF (permission-filtered)

**Management rules:** `UserService.canManageUser(currentUserId, targetUserId)`:
- If `user.manage.all` → can manage anyone
- If `user.manage.own` → can manage users whose role name equals `Attendee` (case-sensitive in code path)
- Else: can manage self only

**Deletion behavior:** `UserService.deleteUser()` deletes:
- password history
- login/logout history (if service wired)
- activity history
- event attendee rows for the user
- then deletes the user record

## 9) Role & Permission Management (Backend)

### Roles
From `RoleController` (base `/api/roles`):
- CRUD: create/get/list/update/delete (soft delete)
- `POST /api/roles/{roleId}/permissions/{permissionId}` — add permission
- `DELETE /api/roles/{roleId}/permissions/{permissionId}` — remove permission

`RolePermission` is a join entity with composite key `(roleId, permissionId)`.

### Permissions
From `PermissionController` (base `/api/permissions`):
- CRUD: create/get/list/update/delete (soft delete)

## 10) History / Audit (Backend)

### What is tracked
1) Login/logout history (`UserLoginLogoutHistory`)
2) Password change history (`UserPasswordHistory`) — stores old/new *hashed* passwords
3) Activity history (`UserActivityHistory`) — typed activity codes and metadata

### History API
From `HistoryController` (base `/api/history`):
- `GET /api/history/login?userId=&all=`
- `GET /api/history/login/range?startDate=&endDate=`
- `GET /api/history/login/failed`
- `GET /api/history/password?userId=&all=`
- `GET /api/history/activity?userId=&all=`
- `GET /api/history/activity/recent?days=`
- `GET /api/history/activity/type/{type}`
- `GET /api/history/activity/range?startDate=&endDate=`
- `GET /api/history/activity/session/{sessionId}` (sessionId is token UUID)
- `GET /api/history/all?userId=&all=` (bundles all 3 types)
- `GET /api/history/download/pdf?type=activity|login|password` (PDF export)

**Access rules:**
- If user has `history.view.all` they can query others/all.
- Otherwise they can only see their own history.

## 11) Reporting / Exports (PDF)

`ReportServiceImpl` generates JRXML dynamically based on DTO fields and exports PDFs.

Backend endpoints:
- `GET /api/events/download/pdf` → `generateEventsPdf()`
- `GET /api/users/download/pdf` → `generateUsersPdf()`
- `GET /api/history/download/pdf`:
  - activity uses `generateActivityPdf()`
  - login/password currently fall back to `generateEventsPdf()` (placeholder behavior)

## 12) Email Notifications

`EmailService` sends HTML emails:
- Event reminders
- Invitation emails with accept/decline links
- Invitation response confirmation
- Auto-account credential email (temp password) after accept

Includes retry support via `sendWithRetry(supplier, recipient, maxAttempts)`.

## 13) Scheduled Jobs (Background Processing)

### Event reminders
`EventReminderScheduler` runs every 5 minutes:
- 24-hour reminders: finds approved upcoming events starting within the next 24 hours, for accepted attendees, where `advanceReminderSent=false`
- “2-hour” reminders: finds events starting in a narrow window ~2h–2.5h from now, where `lastMinuteReminderSent=false`

It skips attendees without a linked `User` (external emails without auto-created accounts).

### Audit log archival (placeholder)
`AuditLogArchivalJob` runs every 24 hours and logs intent to delete records older than 90 days, but deletion counters are currently hard-coded to 0 (no actual DB deletion implemented).

## 14) Frontend Functionality (Implemented UI)

Routes in `frontend_event/src/App.tsx` include:
- Auth: `/login`, `/register`
- Main app: `/dashboard`, `/events`, `/pending-events`, `/event-management/:eventId`, `/calendar`, `/analytics`, `/settings`, `/users`, `/roles`, `/permissions`, `/activity`, `/invitations`
- Public: landing/all events/about (internal state)

Frontend actions map to backend endpoints via `frontend_event/src/lib/api.ts` and page-level calls (create/update events, approve/reject/hold/reactivate, bulk invite upload, attendee list, users/roles/permissions, PDF downloads).

## 15) Known Mismatches / Gaps (Important)

These are code-level inconsistencies that can affect end-to-end functionality:

1) Role naming mismatch in self-registration
- `UserService.selfRegisterAttendee()` looks up role name `ATTENDEE`.
- Default role created by `RoleService` is `Attendee`.
- Result: self-register can fail unless a role named `ATTENDEE` exists.

2) History export permission names don’t exist in defaults
- `HistoryController.downloadHistoryPdf()` checks for `loginhistory.*`, `passwordhistory.*`, `history.export`.
- `PermissionService` does not create those permissions by default.
- Result: export may always be forbidden unless permissions are manually added.

3) History PDF generation for login/password is placeholder
- For `type=login` and `type=password`, controller uses `reportService.generateEventsPdf(...)` as a fallback.

4) Token refresh not wired in frontend session handling
- Backend provides `/api/auth/refresh`; frontend stores only `eventflow_token` and does not implement automatic refresh.

5) Event approval does not automatically update `eventStatus` on approve
- Approve changes `approvalStatus` only; `eventStatus` remains default `UPCOMING` unless explicitly changed elsewhere.

## 16) Deliverables & Source References

Primary code references:
- Security/auth: `.../config/SecurityConfig.java`, `.../security/JwtAuthenticationFilter.java`, `.../service/AuthService.java`, `.../service/JwtService.java`, `.../service/TokenCacheService.java`
- Events: `.../controller/EventController.java`, `.../service/EventService.java`, entities `Event`, `EventAttendees`
- Users/RBAC: `UserController`, `UserService`, `RoleController`, `RoleService`, `PermissionController`, `PermissionService`
- History: `HistoryController`, `UserActivityHistoryService`, `UserLoginLogoutHistoryService`, `UserPasswordHistoryService`
- Reporting: `ReportService`, `ReportServiceImpl`
- Email: `EmailService`
- Scheduler: `EventReminderScheduler`, `AuditLogArchivalJob`

Related docs (for context, not authority over code): `PRD.md`, `REQUIREMENTS.md`, `SYSTEM_FLOW.md`, `FEATURES.md`, `DIAGRAMS.md`.
