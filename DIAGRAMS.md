# Event Management System - UML Diagrams

This document contains four UML diagrams for the EventFlow Event Management System:
1. **Use Case Diagram** - Shows actors and their interactions with the system
2. **Activity Diagram** - Shows the workflow of event creation and management
3. **Sequence Diagram** - Shows the interaction between components during event invitation process
4. **Swimlane Diagram** - Shows the event approval workflow across different roles

---

## 1. Use Case Diagram

Simple PlantUML source (recommended): `diagrams/use-case.puml`

```mermaid
graph TD
    Attendee((Event Attendee))
    Admin((Administrator))
    SuperAdmin((SuperAdmin))

    Attendee -->|Sign Up/Login| UC1["Register/Login<br/>Authentication"]
    Attendee -->|Browse Events| UC2["Search & Filter<br/>Events"]
    Attendee -->|Register| UC4["Register/Attend<br/>Public Events"]
    Attendee -->|Respond| UC5["Accept/Decline<br/>Invitation"]
    Attendee -->|View| UC7["View Event<br/>Details & Calendar"]
    
    Admin -->|Create| UC3["Create Own<br/>Events"]
    Admin -->|Manage| UC6["Manage Own<br/>Events & Attendees"]
    Admin -->|Approve| UC8["Approve/Reject<br/>Own Events"]
    Admin -->|Invite| UC10["Send Invitations<br/>to Attendees"]
    Admin -->|View| UC9["View All Events<br/>& Activity Logs"]
    
    SuperAdmin -->|Approve/Reject| UC11["Approve/Reject<br/>All Events"]
    SuperAdmin -->|Control| UC13["Hold/Reactivate<br/>Events"]
    SuperAdmin -->|Delete| UC14["Soft Delete<br/>Events"]
    SuperAdmin -->|Manage| UC12["Manage All Users<br/>& Roles"]
    SuperAdmin -->|System| UC15["System Config &<br/>Reports"]
    SuperAdmin -->|View| UC16["View All Activity<br/>Logs & History"]
    
    UC3 -->|Requires| UC1
    UC4 -->|Requires| UC1
    UC6 -->|Admin Creates| UC3
    UC8 -->|Requires| UC3
    UC11 -->|Updates| UC3
    UC12 -->|Manages| Attendee
    UC12 -->|Manages| Admin
    UC10 -->|Requires| UC3

    style Attendee fill:#fff9c4
    style Admin fill:#f8bbd0
    style SuperAdmin fill:#e0bee7
```

---

## 2. Activity Diagram - Event Creation & Management Workflow

```mermaid
graph TD
    Start([Start]) --> Login{User<br/>Authenticated?}
    Login -->|No| LoginPage["Navigate to Login"]
    LoginPage --> Auth["Authenticate User"]
    Auth --> CheckRole{User<br/>Role?}
    
    CheckRole -->|Attendee| AttendeeFlow[\"Attendee Flow\"]
    CheckRole -->|Admin| AdminFlow[\"Admin Flow\"]
    CheckRole -->|SuperAdmin| SuperAdminFlow[\"SuperAdmin Flow\"]
    
    AttendeeFlow --> BrowseOrCreate{Attendee<br/>Action?}
    BrowseOrCreate -->|Browse Events| BrowseEvents[\"Browse Events\"]
    BrowseOrCreate -->|Create Event| CreateEvent[\"Fill Event Details<br/>Title, Description, Date<br/>Location, Capacity, etc.\"]
    
    BrowseEvents --> SearchFilter[\"Search/Filter<br/>by Date/Location/Category\"]
    SearchFilter --> ViewDetails[\"View Event Details\"]
    ViewDetails --> Register{Eligible to<br/>Register?}
    Register -->|Yes - Public| AttendPublic[\"Direct Registration<br/>ACCEPTED\"]
    Register -->|Yes - Private| WaitInvite[\"Wait for<br/>Invitation\"]
    WaitInvite --> ReceiveInvite[\"Receive Invitation<br/>Email\"]
    ReceiveInvite --> RespondInvite{Accept or<br/>Decline?}
    RespondInvite -->|Accept| AcceptFlow[\"Status: ACCEPTED<br/>Send Confirmation\"]
    RespondInvite -->|Decline| DeclineFlow[\"Status: DECLINED<br/>Send Notification\"]
    AttendPublic --> Reminder24[\"Receive 24hr<br/>Reminder\"]
    AcceptFlow --> Reminder24
    Reminder24 --> Reminder2[\"Receive 2hr<br/>Reminder\"]
    Reminder2 --> End1([End - Attendee])
    DeclineFlow --> End2([End - Declined])
    
    CreateEvent --> ValidateInput{Input<br/>Valid?}
    ValidateInput -->|No| ErrorMsg[\"Show Error<br/>Message\"]
    ErrorMsg --> CreateEvent
    ValidateInput -->|Yes| SaveDraft[\"Save as Draft<br/>ApprovalStatus: PENDING<br/>EventStatus: UPCOMING\"]
    SaveDraft --> EditEvent{Continue<br/>Editing?}
    EditEvent -->|Yes| CreateEvent
    EditEvent -->|No| SubmitApproval[\"Submit for Approval\"]
    SubmitApproval --> WaitApproval[\"Wait for SuperAdmin<br/>Approval\"]
    
    AdminFlow --> ViewPending[\"View Created Events<br/>Only Own Events\"]
    ViewPending --> ManageOwn{Own<br/>Event?}
    ManageOwn -->|Yes| EditOwn[\"Edit Event Details\"]
    ManageOwn -->|No| ViewActivity[\"View Activity Logs<br/>& Audit Trail\"]
    EditOwn --> ViewPending
    
    WaitApproval --> CheckStatus{Event<br/>Approved?}
    CheckStatus -->|No| RejectedStatus["ApprovalStatus: REJECTED"]
    CheckStatus -->|Yes| SendInvites["Send Bulk Invitations<br/>via CSV/Email"]
    SendInvites --> TrackResponse["Track RSVP<br/>Responses"]
    TrackResponse --> SendReminders["Auto-send Reminders<br/>24hr & 2hr before"]
    SendReminders --> EventOccurs["Event Occurs<br/>EventStatus: ONGOING"]
    EventOccurs --> Complete["EventStatus: COMPLETED"]
    
    ApprovedStatus["ApprovalStatus: APPROVED<br/>EventStatus: UPCOMING"] --> OptionMenu{"Organizer<br/>Action?"}
    OptionMenu -->|Edit| EditDetails["Edit Event Details"]
    EditDetails --> ApprovedStatus
    OptionMenu -->|Send Invites| SendInvites
    OptionMenu -->|Delete| DeleteEvent["Soft Delete<br/>(recoverable 30 days)"]
    DeleteEvent --> End4([End - Deleted])
    
    SuperAdminFlow["⭐ SuperAdmin Path"] --> ViewAllPending["View All Pending<br/>Events"]
    ViewAllPending --> ReviewSuper["Review Event<br/>Details"]
    ReviewSuper --> DecideSuper{Approve or<br/>Reject?}
    DecideSuper -->|Reject| RejectSuper["ApprovalStatus: REJECTED"]
    DecideSuper -->|Approve| ApproveSuper["ApprovalStatus: APPROVED"]
    ApproveSuper --> ApprovedStatus
    RejectSuper --> RejectedStatus
    ApprovedStatus --> HoldOption{Hold<br/>Event?}
    HoldOption -->|Yes| HoldEvent["Put Event on Hold<br/>EventStatus: INACTIVE"]
    HoldOption -->|No| OptionMenu
    HoldEvent --> ReactivateOption{Reactivate<br/>Later?}
    ReactivateOption -->|Yes| ReactivateEvent["Reactivate Event<br/>EventStatus: UPCOMING"]
    ReactivateEvent --> ApprovedStatus
    ReactivateOption -->|No| End3([End - On Hold])
    
    Complete --> GenerateReport["Generate Analytics<br/>& Reports"]
    GenerateReport --> End5([End - Event Complete])
    
    RejectedStatus --> AppealOption{Appeal<br/>Decision?}
    AppealOption -->|Yes| SubmitAppeal["Submit Appeal<br/>with Details"]
    AppealOption -->|No| End6([End - Rejected])
    SubmitAppeal --> ReviewAppeal["SuperAdmin Reviews<br/>Appeal"]
    ReviewAppeal --> AppealDecision{Appeal<br/>Approved?}
    AppealDecision -->|Yes| ApproveSuper
    AppealDecision -->|No| End6
    
    style Start fill:#90EE90
    style End1 fill:#FFB6C6
    style End2 fill:#FFB6C6
    style End3 fill:#FFB6C6
    style End4 fill:#FFB6C6
    style End5 fill:#FFB6C6
    style End6 fill:#FFB6C6
    style SendInvites fill:#87CEEB
    style SendReminders fill:#87CEEB
    style ApproveSuper fill:#90EE90
    style RejectSuper fill:#FF6B6B
    style SuperAdminFlow fill:#FFE0B2
```

---

## 3. Sequence Diagram - Event Invitation & Response Process

```mermaid
sequenceDiagram
    actor Organizer as Event Organizer
    participant EventCtrl as Event Controller
    participant EventSvc as Event Service
    participant EmailSvc as Email Service
    participant DB as Database
    participant EmailSystem as Email System
    actor Attendee as External Attendee

    Organizer->>EventCtrl: POST /api/events/{id}/invite<br/>(CSV file with emails)
    EventCtrl->>EventSvc: sendBulkInvitations(eventId, file)
    EventSvc->>EventSvc: validateEvent(eventId, organizerId)
    EventSvc->>DB: loadExternalInvites(CSV)
    EventSvc->>DB: loadPendingEmails()
    EventSvc->>DB: loadRegisteredUsers()
    
    loop For each attendee email
        EventSvc->>DB: Check if email<br/>already invited
        alt Email not invited
            EventSvc->>DB: Create EventAttendees<br/>Status: PENDING
            EventSvc->>DB: Generate<br/>invitationToken
            EventSvc->>EmailSvc: sendInvitationEmail(event,<br/>email, token)
            EmailSvc->>EmailSystem: Send Email
            EmailSystem-->>Attendee: Invitation Email<br/>with Accept/Decline Links
            EventSvc->>DB: Save<br/>invitationSentAt
        else Email already exists
            EventSvc->>DB: Skip duplicate
        end
    end
    
    EventSvc-->>EventCtrl: Return summary<br/>(sent, failed, skipped)
    EventCtrl-->>Organizer: 200 OK - Invitations queued

    par Parallel Process
        Attendee->>Attendee: Receive Email
        Attendee->>Attendee: Click Accept Link
        Attendee->>EventCtrl: GET /api/events/respond<br/>?token=XXX&action=ACCEPT
        EventCtrl->>EventSvc: respondToInvitation<br/>(token, ACCEPT)
        EventSvc->>DB: Find EventAttendees<br/>by token
        
        alt User doesn't have account
            EventSvc->>DB: Auto-create account<br/>for attendee
            EventSvc->>DB: Generate<br/>temp password
            EventSvc->>EmailSvc: Send credentials email
            EmailSvc->>EmailSystem: Send Email
            EmailSystem-->>Attendee: Login credentials
        end
        
        EventSvc->>DB: Update EventAttendees<br/>Status: ACCEPTED<br/>responseAt: now()
        EventSvc->>EmailSvc: sendInvitationResponseConfirmation
        EmailSvc->>EmailSystem: Send confirmation
        EmailSystem-->>Attendee: Acceptance confirmed
        EventSvc-->>EventCtrl: 200 OK
        EventCtrl-->>Attendee: Success page
    and
        EventSvc->>DB: Schedule reminder tasks<br/>for accepted attendees
        activate DB
        Note over DB: 24-hour before event
        EventSvc->>EmailSvc: send24HourReminder()
        EmailSvc->>EmailSystem: Send reminders
        deactivate DB
    end

    par Alternative Path - Decline
        Attendee->>EventCtrl: GET /api/events/respond<br/>?token=YYY&action=DECLINE
        EventCtrl->>EventSvc: respondToInvitation<br/>(token, DECLINE)
        EventSvc->>DB: Update EventAttendees<br/>Status: DECLINED<br/>responseAt: now()
        EventSvc->>EmailSvc: sendInvitationResponseConfirmation
        EmailSvc->>EmailSystem: Send confirmation
        EmailSystem-->>Attendee: Decline confirmed
    end

    rect rgb(200, 150, 255)
        Note over EventSvc,DB: Scheduled Jobs (Background)
        EventSvc->>DB: Query events<br/>starting in 24 hours
        EventSvc->>DB: Find ACCEPTED attendees<br/>where advanceReminderSent=false
        EventSvc->>EmailSvc: Send 24-hour reminders
        EventSvc->>DB: Update<br/>advanceReminderSent=true
    end
    
    rect rgb(150, 200, 255)
        Note over EventSvc,DB: 2 Hours Before Event
        EventSvc->>DB: Query events<br/>starting in 2 hours
        EventSvc->>DB: Find ACCEPTED attendees<br/>where lastMinuteReminderSent=false
        EventSvc->>EmailSvc: Send 2-hour reminders
        EventSvc->>DB: Update<br/>lastMinuteReminderSent=true
    end
```

---

## 4. Swimlane Diagram - Event Approval Workflow

```mermaid
graph TD
    subgraph Attendee["👥 Attendee (Event Creator)"]
        A1["1. Create Event"]
        A2["2. Enter Event Details<br/>Title, Description, Date<br/>Location, Attendees, etc."]
        A3["3. Save as Draft<br/>ApprovalStatus: PENDING"]
        A4["4. Submit for Approval<br/>Request SuperAdmin Review"]
        A5["5. Wait for Response"]
        A6{{"6. Approved or<br/>Rejected?"}}
        A7["7. Edit & Resubmit<br/>if rejected"]
        A8["8. Start Sending<br/>Invitations"]
        A9["9. Manage Attendees<br/>Track RSVPs"]
        A10["10. Delete Event<br/>(if needed, soft delete)"]
    end
    
    subgraph Admin["👨‍💼 Administrator"]
        AD1["1. View Own Created<br/>Events"]
        AD2["2. Can Edit Own<br/>Events Only"]
        AD3["3. Cannot Approve/Reject<br/>(SuperAdmin only)"]
        AD4["4. Can View All Users<br/>& Activity Logs"]
        AD5["5. Can Manage Attendee<br/>Accounts Only"]
    end
    
    subgraph SuperAdmin["👑 SuperAdmin"]
        S1["1. Dashboard: View<br/>All Pending Events"]
        S2["2. Review Event<br/>for Compliance"]
        S3{{"3. Make<br/>Decision"}}
        S4["4. Approve Event<br/>ApprovalStatus: APPROVED"]
        S5["5. Reject Event<br/>ApprovalStatus: REJECTED<br/>+ Feedback"]
        S6["6. Monitor Event<br/>Execution"]
        S7{{"7. Need to Hold<br/>Event?"}}
        S8["8. Put on Hold<br/>EventStatus: INACTIVE"]
        S9["9. Reactivate Event<br/>EventStatus: UPCOMING"]
        S10["10. Soft Delete Event<br/>(30-day recovery)"]
        S11["11. Generate Reports<br/>& View Audit Trail"]
    end
    
    subgraph System["⚙️ System/Background"]
        SY1["Validation:<br/>Check input data<br/>Field constraints"]
        SY2["Notification:<br/>Send email to SuperAdmin"]
        SY3["Status Update:<br/>Change approval status<br/>Record timestamp"]
        SY4["Scheduler:<br/>24hr reminder"]
        SY5["Scheduler:<br/>2hr reminder"]
        SY6["Archive:<br/>Mark completed<br/>events"]
        SY7["EventStatus Update:<br/>UPCOMING→ONGOING→COMPLETED<br/>based on time"]
    end

    O1 --> O2
    O2 --> SY1
    SY1 --> O3
    O3 --> O4
    O4 --> SY2
    SY2 --> S1
    O5 --> O6
    
    S1 --> S2
    S2 --> S3
    
    S3 -->|Compliant| S4
    S3 -->|Non-Compliant| S5
    S5 --> O7
    O7 --> O4
    
    S4 --> SY3
    SY3 --> O8
    
    O6 -->|Approved| O8
    O6 -->|Rejected| O7
    
    O8 --> O9
    O9 --> O10
    
    S6 --> S7
    S7 -->|Yes| S8
    S7 -->|No| S11
    S8 --> S9
    S9 --> O8
    
    O10 --> S10
    O10 --> S10
    S10 --> S11
    
    O8 --> SY4
    SY4 --> SY5
    SY5 --> SY7
    SY7 --> SY6
    
    S11 --> End["End"]

    A1 --> A2
    A2 --> SY1
    SY1 --> A3
    A3 --> A4
    A4 --> SY2
    SY2 --> S1
    A5 --> A6
    
    S1 --> S2
    S2 --> S3
    
    S3 -->|Compliant| S4
    S3 -->|Non-Compliant| S5
    S5 --> A7
    A7 --> A4
    
    S4 --> SY3
    SY3 --> A8
    
    A6 -->|Approved| A8
    A6 -->|Rejected| A7
    
    A8 --> A9
    A9 --> A10
    
    S6 --> S7
    S7 -->|Yes| S8
    S7 -->|No| S11
    S8 --> S9
    S9 --> A8
    
    A10 --> S10
    A10 --> S10
    S10 --> S11
    
    A8 --> SY4
    SY4 --> SY5
    SY5 --> SY7
    SY7 --> SY6
    
    S11 --> End["End"]

    A1 --> A2
    A2 --> A4
    A4 --> A5
    A3 -.->|Only SuperAdmin| S3

    style Attendee fill:#c8e6c9,stroke:#2e7d32,color:#000
    style Admin fill:#f8bbd0,stroke:#c2185b,color:#000
    style SuperAdmin fill:#e0bee7,stroke:#6a1b9a,color:#000
    style System fill:#fff9c4,stroke:#f57f17,color:#000
    
    classDef decision fill:#ffecb3,stroke:#f57c00,stroke-width:2px
    classDef process fill:#b3e5fc,stroke:#01579b,stroke-width:2px
    classDef critical fill:#ffccbc,stroke:#d84315,stroke-width:2px
    
    class A6,S3,S7 decision
    class A1,A2,A4,S1,S2,S4,S5 process
    class S4,S5,S8,S10 critical
```

---

## Diagram Summary

**System Architecture Overview:**
The EventFlow system implements a Role-Based Access Control (RBAC) model with 3 distinct roles: **Attendee** (event participants), **Admin** (event creators/managers), and **SuperAdmin** (system administrators). Events follow a two-stage status model: **ApprovalStatus** (PENDING → APPROVED/REJECTED) and **EventStatus** (UPCOMING → ONGOING → COMPLETED/CANCELLED, with INACTIVE for holds). **Important**: Each role has separate, non-overlapping permissions - an Attendee cannot create events, and an Admin cannot perform SuperAdmin functions like approving events created by others.

### 1. **Use Case Diagram**
- Shows 3 main actors with distinct roles: **Attendee**, **Admin**, **SuperAdmin**
- **Attendee** (No event creation): Can register for public events, accept/decline invitations, browse events, view event details
- **Admin** (Creates & manages own events): Can create events, manage attendees, send invitations, approve/reject own events, view all events
- **SuperAdmin** (Full system control): Approves/rejects all events, holds/reactivates events, manages users and roles, soft deletes events, views system config and activity logs
- 16 primary use cases clearly separated by actor capability
- Demonstrates strict role separation with different permission levels

### 2. **Activity Diagram**
- Comprehensive workflow covering:
  - **Attendee Path (Browse/Register)**: Search → Filter → View Details → Register → Track Status → Receive Reminders
  - **Admin Path (Create & Manage)**: Create Event → Enter Details → Save Draft → Submit → Wait SuperAdmin Approval → Invite → Track Attendees
  - **Admin Path (Approval)**: Can only approve/reject own events
  - **SuperAdmin Path**: Review all submissions → Approve/Reject → Monitor execution → Hold/Reactivate as needed
- Includes decision points (Approve? Reject? Hold?), validations, and error handling
- Shows automatic event status transitions and scheduler tasks (reminders, status updates)
- **Clear separation**: Attendees register, Admins create, SuperAdmin approves

### 3. **Sequence Diagram**
- Details the invitation and response process:
  - Attendee (event creator) uploads CSV with attendee emails
  - System validates and creates EventAttendees records
  - Invitations sent via email with unique tokens
  - Attendees click links to accept/decline invitations
  - Auto-account creation for external attendees
  - Scheduled reminder emails (24-hour and 2-hour before event)
- Shows synchronous API calls and asynchronous email tasks
- Includes parallel paths for acceptance and decline scenarios

### 4. **Swimlane Diagram**
- Shows complete event approval workflow across 4 swim lanes:
  - **Attendee**: Views public/invited events, registers for events, receives reminders and updates
  - **Admin (Event Creator)**: Creates events, submits for approval, waits for SuperAdmin decision, manages attendees, sends invitations, tracks RSVPs
  - **SuperAdmin**: Reviews all pending events, approves/rejects with feedback, monitors execution, can hold/reactivate, manages soft deletes, generates reports
  - **System**: Validates inputs, sends notifications, updates status timestamps, auto-generates reminders and archives completed events
- Decision points for approval, hold status, and event completion
- Feedback loops for rejected submissions (return to edit/resubmit)
- Color-coded for easy role identification and process type
- **Clear role boundaries**: Attendees register, Admins create, SuperAdmin approves (not Admin)
