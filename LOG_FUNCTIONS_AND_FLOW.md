# LOG FUNCTIONS AND FLOW - COMPLETE GUIDE

This document explains all logging functions, how they work, and how the logging flow works throughout your application.

---

## PART 1: APPLICATIONLOGGERSERVICE - COMPLETE CODE & FUNCTIONS

### File Location
```
src/main/java/com/event_management_system/service/ApplicationLoggerService.java
```

### The Main Logger Class - Complete Code

```java
package com.event_management_system.service;

import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

/**
 * ApplicationLoggerService
 * 
 * Centralized logging service for the entire application.
 * Provides consistent logging across all controllers and services.
 * 
 * Log Levels (from least to most verbose):
 * - ERROR: Failures (database errors, exceptions)
 * - WARN: Recoverable errors (resource not found, access denied)
 * - INFO: Business actions (created, updated, deleted successfully)
 * - DEBUG: Technical details, method parameters, request data
 * - TRACE: Variable values, detailed step-by-step execution
 */
@Slf4j                          // Lombok annotation - creates 'log' variable automatically
@Service                        // Spring marks this as a service bean
public class ApplicationLoggerService {

    // ==================== TRACE LEVEL ====================
    // Most verbose - rarely used in production
    
    /**
     * TRACE: Variable values, detailed debugging info
     * 
     * Example:
     * logger.trace("Processing user ID: 123");
     * logger.trace("Current timestamp: 2025-12-29 10:30:45");
     * 
     * When to use:
     * - Loop iterations
     * - Variable assignments
     * - Step-by-step execution
     * 
     * Output: [TRACE] Processing user ID: 123
     */
    public void trace(String message) {
        log.trace(message);
    }
    
    /**
     * TRACE with parameters
     * 
     * Example:
     * logger.trace("User {} has {} events", "john@example.com", 5);
     * 
     * Output: [TRACE] User john@example.com has 5 events
     */
    public void trace(String message, Object... args) {
        log.trace(message, args);
    }

    // ==================== DEBUG LEVEL ====================
    // Detailed technical information
    
    /**
     * DEBUG: Technical details, method parameters, request data
     * 
     * Example:
     * logger.debug("EventController.createEvent called");
     * logger.debug("Received event request with title: 'Tech Conference'");
     * 
     * When to use:
     * - Method entry/exit
     * - Request/response details
     * - Database queries
     * - Parameter values
     * 
     * Output: [DEBUG] EventController.createEvent called
     */
    public void debug(String message) {
        log.debug(message);
    }
    
    /**
     * DEBUG with parameters
     * 
     * Example:
     * logger.debug("Querying events for user: {}, status: {}", userId, "ACTIVE");
     * 
     * Output: [DEBUG] Querying events for user: 5, status: ACTIVE
     */
    public void debug(String message, Object... args) {
        log.debug(message, args);
    }
    
    /**
     * DEBUG with exception
     * 
     * Example:
     * try {
     *     eventRepository.save(event);
     * } catch (Exception e) {
     *     logger.debug("Error saving event", e);
     * }
     * 
     * Output: [DEBUG] Error saving event
     *         java.sql.SQLException: Connection timeout...
     */
    public void debug(String message, Exception exception) {
        log.debug(message, exception);
    }

    // ==================== INFO LEVEL ====================
    // Business actions and milestones
    
    /**
     * INFO: Business actions (created, updated, deleted successfully)
     * 
     * Example:
     * logger.info("User created successfully");
     * logger.info("Event deleted");
     * logger.info("Password changed");
     * 
     * When to use:
     * - Resource creation
     * - Resource update
     * - Resource deletion
     * - Authentication events
     * - Important business events
     * 
     * Output: [INFO] User created successfully
     */
    public void info(String message) {
        log.info(message);
    }
    
    /**
     * INFO with parameters
     * 
     * Example:
     * logger.info("User {} created with email: {}", userId, "john@example.com");
     * logger.info("Event {} updated by user {}", eventId, currentUserId);
     * 
     * Output: [INFO] User 5 created with email: john@example.com
     */
    public void info(String message, Object... args) {
        log.info(message, args);
    }

    // ==================== WARN LEVEL ====================
    // Recoverable errors and warnings
    
    /**
     * WARN: Recoverable errors (resource not found, access denied)
     * 
     * Example:
     * logger.warn("User not found");
     * logger.warn("Access denied - insufficient permissions");
     * logger.warn("Deprecated API endpoint called");
     * 
     * When to use:
     * - Resource not found (but request was valid)
     * - Unauthorized access attempts
     * - Validation failures
     * - Suspicious but recoverable situations
     * 
     * Output: [WARN] User not found
     */
    public void warn(String message) {
        log.warn(message);
    }
    
    /**
     * WARN with parameters
     * 
     * Example:
     * logger.warn("User {} attempted to access resource {}", userId, resourceId);
     * logger.warn("Maximum retry attempts exceeded: {}", retryCount);
     * 
     * Output: [WARN] User 5 attempted to access resource 10
     */
    public void warn(String message, Object... args) {
        log.warn(message, args);
    }
    
    /**
     * WARN with exception
     * 
     * Example:
     * try {
     *     someOperation();
     * } catch (TimeoutException e) {
     *     logger.warn("Operation timed out", e);
     * }
     * 
     * Output: [WARN] Operation timed out
     *         java.util.concurrent.TimeoutException...
     */
    public void warn(String message, Exception exception) {
        log.warn(message, exception);
    }

    // ==================== ERROR LEVEL ====================
    // Critical failures
    
    /**
     * ERROR: Failures (database errors, exceptions)
     * 
     * Example:
     * logger.error("Database connection failed");
     * logger.error("Failed to send email notification");
     * logger.error("Unexpected error during processing");
     * 
     * When to use:
     * - Database failures
     * - File I/O errors
     * - External API failures
     * - Unrecoverable exceptions
     * - Business operation failures
     * 
     * Output: [ERROR] Database connection failed
     */
    public void error(String message) {
        log.error(message);
    }
    
    /**
     * ERROR with parameters
     * 
     * Example:
     * logger.error("Failed to create user: {}. Reason: {}", userEmail, reason);
     * logger.error("Event {} could not be saved to database", eventId);
     * 
     * Output: [ERROR] Failed to create user: john@example.com. Reason: Email already exists
     */
    public void error(String message, Object... args) {
        log.error(message, args);
    }
    
    /**
     * ERROR with exception (most important!)
     * 
     * Example:
     * try {
     *     eventRepository.save(event);
     * } catch (SQLException e) {
     *     logger.error("Failed to save event to database", e);
     * }
     * 
     * Output: [ERROR] Failed to save event to database
     *         java.sql.SQLException: Connection timeout
     *         at com.mysql.jdbc.SQLError...
     *         at com.mysql.jdbc.MysqlIO...
     *         ... (full stack trace)
     */
    public void error(String message, Exception exception) {
        log.error(message, exception);
    }

    // ==================== CONTEXTUAL LOGGING ====================
    // Add context (class/method name) automatically
    
    /**
     * DEBUG with context
     * 
     * Adds [ContextName] prefix to message
     * 
     * Example:
     * logger.debugWithContext("EventController", "Event request received: {}", eventId);
     * 
     * Output: [EventController] Event request received: 5
     */
    public void debugWithContext(String context, String message, Object... args) {
        // Format: [context] message args
        log.debug("[{}] {}", context, formatMessage(message, args));
    }
    
    /**
     * INFO with context
     * 
     * Example:
     * logger.infoWithContext("EventService", "Event {} created successfully", eventId);
     * 
     * Output: [EventService] Event 5 created successfully
     */
    public void infoWithContext(String context, String message, Object... args) {
        log.info("[{}] {}", context, formatMessage(message, args));
    }
    
    /**
     * WARN with context
     * 
     * Example:
     * logger.warnWithContext("AuthController", "Invalid login attempt for user {}", email);
     * 
     * Output: [AuthController] Invalid login attempt for user john@example.com
     */
    public void warnWithContext(String context, String message, Object... args) {
        log.warn("[{}] {}", context, formatMessage(message, args));
    }
    
    /**
     * ERROR with context (most used!)
     * 
     * Example:
     * logger.errorWithContext("UserService", "Failed to delete user", exception);
     * 
     * Output: [UserService] Failed to delete user
     *         java.sql.SQLException: Foreign key constraint...
     */
    public void errorWithContext(String context, String message, Exception exception) {
        log.error("[{}] {}", context, message, exception);
    }
    
    /**
     * TRACE with context
     * 
     * Example:
     * logger.traceWithContext("EventReminderJob", "Processing event {}", eventId);
     * 
     * Output: [EventReminderJob] Processing event 5
     */
    public void traceWithContext(String context, String message, Object... args) {
        log.trace("[{}] {}", context, formatMessage(message, args));
    }

    // ==================== UTILITY METHODS ====================
    
    /**
     * Format parameterized message
     * Replaces {} placeholders with actual values
     * 
     * Example:
     * Input: "User {} created with email {}", "john@example.com", userId
     * Output: "User john@example.com created with email 5"
     * 
     * How it works:
     * 1. Loop through each argument
     * 2. Find first {} in message
     * 3. Replace {} with argument value
     * 4. Continue to next argument
     */
    private String formatMessage(String message, Object... args) {
        if (args.length == 0) {
            return message;  // No arguments, return message as-is
        }
        String result = message;
        for (Object arg : args) {
            // replaceFirst("\\{\\}", ...) replaces first occurrence of {}
            result = result.replaceFirst("\\{\\}", String.valueOf(arg));
        }
        return result;
    }
    
    /**
     * Log method entry
     * 
     * Example:
     * logger.methodEntry("UserService.createUser");
     * 
     * Output: [DEBUG] → Entering UserService.createUser
     */
    public void methodEntry(String methodName) {
        log.debug("→ Entering {}", methodName);
    }
    
    /**
     * Log method exit
     * 
     * Example:
     * logger.methodExit("UserService.createUser");
     * 
     * Output: [DEBUG] ← Exiting UserService.createUser
     */
    public void methodExit(String methodName) {
        log.debug("← Exiting {}", methodName);
    }
    
    /**
     * Log method exception
     * 
     * Example:
     * logger.methodException("UserService.createUser", exception);
     * 
     * Output: [ERROR] ✗ Exception in UserService.createUser: Connection timeout
     *         java.sql.SQLException: Connection timeout...
     */
    public void methodException(String methodName, Exception exception) {
        log.error("✗ Exception in {}: {}", methodName, exception.getMessage(), exception);
    }
}
```

---

## PART 2: HOW TO USE THE LOGGER

### Step 1: Inject the Logger into Your Class

```java
@Service
public class EventService {
    
    // STEP 1: Add this line to inject the logger
    @Autowired
    private ApplicationLoggerService logger;
    
    // Now you can use logger in your methods...
}
```

### Step 2: Use Logger in Your Methods

#### Example 1: Creating a Resource (INFO level)

```java
@Transactional
public EventResponseDTO createEvent(@NonNull EventRequestDTO eventRequestDTO, @NonNull Long currentUserId) {
    try {
        // Log what we're doing
        logger.infoWithContext("EventService", 
            "Creating event for user: {}", currentUserId);
        
        // Create the event
        Event event = new Event();
        event.setTitle(eventRequestDTO.getTitle());
        event.setDescription(eventRequestDTO.getDescription());
        
        // Save to database
        Event savedEvent = eventRepository.save(event);
        
        // Log success
        logger.infoWithContext("EventService", 
            "Event {} created successfully", savedEvent.getId());
        
        return eventMapper.toDTO(savedEvent);
        
    } catch (Exception e) {
        // Log error with exception details
        logger.errorWithContext("EventService", 
            "Failed to create event", e);
        throw new RuntimeException("Failed to create event", e);
    }
}
```

**Log Output:**
```
2025-12-29 10:30:45 [main] INFO EventService - [EventService] Creating event for user: 5
2025-12-29 10:30:46 [main] INFO EventService - [EventService] Event 15 created successfully
```

---

#### Example 2: Handling Errors (ERROR level)

```java
@Transactional
public Optional<EventResponseDTO> getEventById(@NonNull Long id, @NonNull Long currentUserId) {
    try {
        logger.debugWithContext("EventService", 
            "Fetching event: {}", id);
        
        // Query database
        Optional<Event> event = eventRepository.findById(id);
        
        if (event.isEmpty()) {
            // Event not found - warning level (recoverable error)
            logger.warnWithContext("EventService", 
                "Event {} not found", id);
            return Optional.empty();
        }
        
        // Event found
        logger.debugWithContext("EventService", 
            "Event {} found, converting to DTO", id);
        
        return event.map(eventMapper::toDTO);
        
    } catch (Exception e) {
        // Unexpected error
        logger.errorWithContext("EventService", 
            "Unexpected error fetching event", e);
        return Optional.empty();
    }
}
```

**Log Output:**
```
2025-12-29 10:31:20 [main] DEBUG EventService - [EventService] Fetching event: 5
2025-12-29 10:31:21 [main] WARN EventService - [EventService] Event 5 not found
```

---

#### Example 3: Authentication (Login/Logout)

```java
public AuthResponseDTO authenticate(LoginRequestDTO loginRequest) {
    try {
        // Log login attempt
        logger.infoWithContext("AuthService", 
            "Authentication attempt for user: {}", loginRequest.getEmail());
        
        // Find user
        Optional<User> user = userRepository.findByEmail(loginRequest.getEmail());
        
        if (user.isEmpty()) {
            // User not found
            logger.warnWithContext("AuthService", 
                "Authentication failed - user not found: {}", 
                loginRequest.getEmail());
            throw new IllegalArgumentException("Invalid credentials");
        }
        
        // Check password
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.get().getPassword())) {
            // Wrong password
            logger.warnWithContext("AuthService", 
                "Authentication failed - wrong password for user: {}", 
                loginRequest.getEmail());
            throw new IllegalArgumentException("Invalid credentials");
        }
        
        // Generate JWT token
        String token = jwtService.generateToken(user.get());
        
        // Log successful login
        logger.infoWithContext("AuthService", 
            "User {} authenticated successfully", loginRequest.getEmail());
        
        return new AuthResponseDTO(token);
        
    } catch (Exception e) {
        logger.errorWithContext("AuthService", 
            "Authentication failed", e);
        throw e;
    }
}
```

**Log Output:**
```
2025-12-29 10:32:15 [main] INFO AuthService - [AuthService] Authentication attempt for user: john@example.com
2025-12-29 10:32:16 [main] INFO AuthService - [AuthService] User john@example.com authenticated successfully
```

---

## PART 3: LOG LEVELS - WHEN TO USE EACH

### Log Level Hierarchy

```
ERROR   ← Most Critical (show only failures)
WARN    ← Warnings (recoverable errors)
INFO    ← Information (business events)
DEBUG   ← Debug (technical details)
TRACE   ← Trace (very verbose, rarely used)
```

### Decision Tree: Which Level to Use?

```
┌─────────────────────────────────────────┐
│ What are you logging?                   │
└─────────────────────────────────────────┘
           ↓
    ┌─────┴──────┬──────────┬────────┬───────┐
    │            │          │        │       │
    v            v          v        v       v
Application  Technical  Resource  Recoverable  Critical
Event        Detail     Not Found  Error      Failure
(User        (Query    (Valid)     (Invalid)   (Database
 login,       params,                         crash,
 creation,    variable              (Wrong    exception)
 deletion)    values)               password)
    │            │          │        │       │
    v            v          v        v       v
  INFO        DEBUG       WARN     WARN    ERROR
    │            │          │        │       │
    └────────────┴──────────┴────────┴───────┘
           ↓
      Log the message
```

### Specific Examples

| Level | Use Case | Example | Code |
|-------|----------|---------|------|
| **TRACE** | Variable values in loops | Processing iteration 5 of 100 | `logger.trace("Processing item {}", i);` |
| **DEBUG** | Method entry/exit | Entering updateEvent method | `logger.debug("Fetching user by ID");` |
| **DEBUG** | Query parameters | SQL parameters, filters | `logger.debug("Querying events with status: {}", status);` |
| **INFO** | Business actions | User created, event updated | `logger.info("User created successfully");` |
| **INFO** | Authentication | Login success, logout | `logger.info("User authenticated");` |
| **WARN** | Resource not found | User doesn't exist but request valid | `logger.warn("User {} not found", userId);` |
| **WARN** | Access denied | User lacks permissions | `logger.warn("User {} denied access", userId);` |
| **ERROR** | Database failure | Connection lost, query failed | `logger.error("Database error", exception);` |
| **ERROR** | Unrecoverable error | NullPointerException, timeout | `logger.error("Unexpected error", exception);` |

---

## PART 4: COMPLETE LOGGING FLOW IN APPLICATION

### Flow Diagram: How a Request Gets Logged

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER MAKES REQUEST (POST /api/events)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. CONTROLLER RECEIVES REQUEST                                  │
│    EventController.createEvent()                                │
│    logger.debugWithContext("EventController", ...)             │
└─────────────────────────────────────────────────────────────────┘
         Log Output: [DEBUG] [EventController] Event request received
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. VALIDATES REQUEST DATA                                        │
│    @Valid annotation validates @RequestBody                     │
│    If invalid → Spring throws MethodArgumentNotValidException   │
└─────────────────────────────────────────────────────────────────┘
         Log Output: (none, validation automatic)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. CONTROLLER CALLS SERVICE                                     │
│    eventService.createEvent(eventDTO, userId)                  │
└─────────────────────────────────────────────────────────────────┘
         Log Output: (none yet, moving to service layer)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. SERVICE LAYER - BUSINESS LOGIC                               │
│    EventService.createEvent()                                   │
│    logger.infoWithContext("EventService", ...)                 │
│                                                                 │
│    Steps inside:                                                │
│    1. Check permissions (DEBUG)                                 │
│    2. Validate data (DEBUG)                                     │
│    3. Create entity (DEBUG)                                     │
│    4. Save to database (DEBUG)                                  │
│    5. Log success (INFO) or error (ERROR)                      │
└─────────────────────────────────────────────────────────────────┘
         Log Output: [INFO] [EventService] Event 15 created successfully
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. OPTIONAL: ACTIVITY AUDIT LOGGING                             │
│    activityHistoryService.recordActivity()                     │
│    Saves to database:                                            │
│    - What action (CREATE, UPDATE, DELETE)                       │
│    - Who did it (userId)                                        │
│    - When (timestamp)                                           │
│    - What data (event details)                                  │
└─────────────────────────────────────────────────────────────────┘
         Log Output: (none, but saved to database)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. CONTROLLER RETURNS RESPONSE                                  │
│    ResponseEntity<EventResponseDTO>                             │
│    logger.debugWithContext("EventController", ...)             │
└─────────────────────────────────────────────────────────────────┘
         Log Output: [DEBUG] [EventController] Event created response sent
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. RESPONSE SENT TO CLIENT                                      │
│    HTTP 201 Created                                             │
│    Body: EventResponseDTO with event details                    │
└─────────────────────────────────────────────────────────────────┘
```

---

### Real Example: Complete Log Sequence for Creating an Event

```
2025-12-29 10:35:20.123 [http-nio-8083-exec-1] DEBUG EventController - [EventController] POST /api/events request received
2025-12-29 10:35:20.124 [http-nio-8083-exec-1] DEBUG EventController - [EventController] Event request: title='Tech Conference', startTime='2025-12-30 09:00:00'
2025-12-29 10:35:20.125 [http-nio-8083-exec-1] INFO  EventService - [EventService] Creating event for user: 5
2025-12-29 10:35:20.126 [http-nio-8083-exec-1] DEBUG EventService - [EventService] Creating event entity with title: 'Tech Conference'
2025-12-29 10:35:20.127 [http-nio-8083-exec-1] DEBUG EventService - [EventService] Setting event organizer: User{id=5, email='john@example.com'}
2025-12-29 10:35:20.128 [http-nio-8083-exec-1] DEBUG EventService - [EventService] Saving event to database
2025-12-29 10:35:20.150 [http-nio-8083-exec-1] INFO  EventService - [EventService] Event 15 created successfully
2025-12-29 10:35:20.151 [http-nio-8083-exec-1] DEBUG EventService - [EventService] Mapping event to response DTO
2025-12-29 10:35:20.152 [http-nio-8083-exec-1] DEBUG EventController - [EventController] Event 15 created, sending response

HTTP/1.1 201 Created
{
  "id": 15,
  "title": "Tech Conference",
  "startTime": "2025-12-30T09:00:00",
  "organizer": "john@example.com",
  "status": "ACTIVE"
}
```

---

### Real Example: Complete Log Sequence for Failed Login

```
2025-12-29 10:36:45.230 [http-nio-8083-exec-2] DEBUG AuthController - [AuthController] POST /api/auth/login request received
2025-12-29 10:36:45.231 [http-nio-8083-exec-2] DEBUG AuthController - [AuthController] Login request for email: wrong@example.com
2025-12-29 10:36:45.232 [http-nio-8083-exec-2] INFO  AuthService - [AuthService] Authentication attempt for user: wrong@example.com
2025-12-29 10:36:45.233 [http-nio-8083-exec-2] DEBUG AuthService - [AuthService] Querying user by email: wrong@example.com
2025-12-29 10:36:45.235 [http-nio-8083-exec-2] WARN  AuthService - [AuthService] Authentication failed - user not found: wrong@example.com
2025-12-29 10:36:45.236 [http-nio-8083-exec-2] ERROR AuthService - [AuthService] Authentication failed
    java.lang.IllegalArgumentException: Invalid credentials
    at com.event_management_system.service.AuthService.authenticate(AuthService.java:125)
    at com.event_management_system.controller.AuthController.login(AuthController.java:45)

HTTP/1.1 401 Unauthorized
{
  "message": "Invalid credentials",
  "timestamp": "2025-12-29T10:36:45.236Z"
}
```

---

## PART 5: WHERE LOGS ARE STORED

### Log File Organization

```
logs/
├── application.log
│   └── ALL logs from entire application
│   └── Changes daily at midnight
│   └── Example content:
│       2025-12-29 10:35:20 [http-nio-8083-exec-1] DEBUG [EventController] Event request received
│       2025-12-29 10:35:21 [http-nio-8083-exec-1] INFO [EventService] Event 15 created successfully
│
├── event-controller.log
│   └── ONLY EventController logs
│   └── Better organized for API request tracking
│
├── service.log
│   └── ONLY Service layer logs
│   └── Business logic execution details
│
├── error.log
│   └── ONLY ERROR level logs
│   └── Quick access to failures
│
└── archive/
    └── Compressed previous days' logs
    └── application-2025-12-28.1.log.gz
    └── application-2025-12-27.1.log.gz
    └── (kept for 30 days, then deleted)
```

---

## PART 6: LOGGER IN ACTION - REAL CODE EXAMPLES

### Example 1: UserService.createUser()

```java
@Transactional
public UserResponseDTO createUser(UserRequestDTO userRequestDTO) {
    try {
        // Log the start
        logger.infoWithContext("UserService", 
            "Creating new user with email: {}", userRequestDTO.getEmail());
        
        // Validate email doesn't exist
        if (userRepository.findByEmail(userRequestDTO.getEmail()).isPresent()) {
            logger.warnWithContext("UserService", 
                "User creation failed - email already exists: {}", 
                userRequestDTO.getEmail());
            throw new IllegalArgumentException("Email already exists");
        }
        
        // Create user entity
        User user = new User();
        user.setEmail(userRequestDTO.getEmail());
        user.setFirstName(userRequestDTO.getFirstName());
        user.setLastName(userRequestDTO.getLastName());
        
        // Log password hashing
        logger.debugWithContext("UserService", 
            "Hashing password for user: {}", userRequestDTO.getEmail());
        user.setPassword(passwordEncoder.encode(userRequestDTO.getPassword()));
        
        // Save user
        User savedUser = userRepository.save(user);
        
        // Log success
        logger.infoWithContext("UserService", 
            "User created successfully - ID: {}, Email: {}", 
            savedUser.getId(), savedUser.getEmail());
        
        // Record activity
        activityHistoryService.recordActivity(
            savedUser, 
            UserActivityHistory.ActivityType.CREATE_USER,
            "User account created"
        );
        
        return userMapper.toDTO(savedUser);
        
    } catch (Exception e) {
        logger.errorWithContext("UserService", 
            "Failed to create user: " + userRequestDTO.getEmail(), e);
        throw new RuntimeException("Failed to create user", e);
    }
}
```

**Log Output:**
```
2025-12-29 10:37:10 [main] INFO UserService - [UserService] Creating new user with email: newuser@example.com
2025-12-29 10:37:10 [main] DEBUG UserService - [UserService] Hashing password for user: newuser@example.com
2025-12-29 10:37:11 [main] INFO UserService - [UserService] User created successfully - ID: 8, Email: newuser@example.com
```

---

### Example 2: EventReminderJob.sendEventReminders()

```java
@Scheduled(fixedDelay = 300000, initialDelay = 10000)
public void sendEventReminders() {
    try {
        // Log job start
        logger.infoWithContext("EventReminderJob", 
            "Scheduler job started - Checking for upcoming events");
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime next24Hours = now.plusHours(24);
        
        // Log time range
        logger.debugWithContext("EventReminderJob", 
            "Searching for events between {} and {}", now, next24Hours);
        
        // Query events
        List<Event> upcomingEvents = eventRepository.findAll()
                .stream()
                .filter(event -> !event.isDeleted())
                .filter(event -> "ACTIVE".equals(event.getStatus().toString()))
                .filter(event -> event.getStartTime().isAfter(now))
                .filter(event -> event.getStartTime().isBefore(next24Hours))
                .toList();
        
        // Log results
        logger.infoWithContext("EventReminderJob", 
            "Found {} upcoming events to remind attendees", upcomingEvents.size());
        
        // Process each event
        for (Event event : upcomingEvents) {
            try {
                logger.debugWithContext("EventReminderJob", 
                    "Processing event: {} (ID: {})", event.getTitle(), event.getId());
                
                int attendeeCount = event.getAttendees() != null ? event.getAttendees().size() : 0;
                
                logger.infoWithContext("EventReminderJob", 
                    "Would send reminders to {} attendees for event: {}", 
                    attendeeCount, event.getTitle());
                
            } catch (Exception e) {
                logger.errorWithContext("EventReminderJob", 
                    "Error processing reminders for event: " + event.getId(), e);
            }
        }
        
        // Log completion
        logger.infoWithContext("EventReminderJob", 
            "Event reminder job completed successfully. Processed {} events", 
            upcomingEvents.size());
        
    } catch (Exception e) {
        logger.errorWithContext("EventReminderJob", 
            "Unexpected error in sendEventReminders()", e);
    }
}
```

**Log Output:**
```
2025-12-29 10:40:45 [scheduler-1] INFO EventReminderJob - [EventReminderJob] Scheduler job started - Checking for upcoming events
2025-12-29 10:40:45 [scheduler-1] DEBUG EventReminderJob - [EventReminderJob] Searching for events between 2025-12-29T10:40:45 and 2025-12-30T10:40:45
2025-12-29 10:40:45 [scheduler-1] INFO EventReminderJob - [EventReminderJob] Found 3 upcoming events to remind attendees
2025-12-29 10:40:45 [scheduler-1] DEBUG EventReminderJob - [EventReminderJob] Processing event: Tech Conference (ID: 15)
2025-12-29 10:40:45 [scheduler-1] INFO EventReminderJob - [EventReminderJob] Would send reminders to 25 attendees for event: Tech Conference
2025-12-29 10:40:45 [scheduler-1] INFO EventReminderJob - [EventReminderJob] Event reminder job completed successfully. Processed 3 events
```

---

## PART 7: BEST PRACTICES

### 1. Always Include Context

❌ **Bad:**
```java
logger.info("User created");
```

✅ **Good:**
```java
logger.infoWithContext("UserService", "User {} created successfully", userId);
```

### 2. Use Appropriate Log Level

❌ **Bad:**
```java
logger.error("User created successfully");  // This is success, not an error!
```

✅ **Good:**
```java
logger.infoWithContext("UserService", "User created successfully");
```

### 3. Log Both Entry and Exit

❌ **Bad:**
```java
public void processEvent(Event event) {
    // ... do something ...
}
```

✅ **Good:**
```java
public void processEvent(Event event) {
    logger.methodEntry("EventService.processEvent");
    try {
        // ... do something ...
        logger.methodExit("EventService.processEvent");
    } catch (Exception e) {
        logger.methodException("EventService.processEvent", e);
    }
}
```

### 4. Always Log Exceptions with Stack Trace

❌ **Bad:**
```java
catch (Exception e) {
    logger.error("Error occurred");
}
```

✅ **Good:**
```java
catch (Exception e) {
    logger.errorWithContext("UserService", "Error creating user", e);
}
```

### 5. Include Relevant Data

❌ **Bad:**
```java
logger.info("Event processed");
```

✅ **Good:**
```java
logger.infoWithContext("EventService", 
    "Event {} processed for user {} in {} ms", eventId, userId, duration);
```

---

## Summary: Logging Flow

```
┌─────────────────────────────────────┐
│ 1. ApplicationLoggerService         │
│    (Centralized logger class)       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 2. @Autowired Injection             │
│    (Available in all services)      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 3. logger.infoWithContext(...)      │
│    logger.errorWithContext(...)     │
│    logger.debugWithContext(...)     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 4. SLF4J (Logging Facade)           │
│    Routes to Logback implementation │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 5. Logback Configuration            │
│    (logback-spring.xml)             │
│    - Console appender               │
│    - File appender (daily rotation) │
│    - Error appender                 │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 6. Log Output to Files              │
│    logs/application.log             │
│    logs/error.log                   │
│    logs/event-controller.log        │
│    logs/service.log                 │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 7. Daily Rotation at Midnight       │
│    Old file → archive/              │
│    Compressed with gzip             │
│    Kept for 30 days                 │
└─────────────────────────────────────┘
```

This is your complete logging system! 🎯📊
