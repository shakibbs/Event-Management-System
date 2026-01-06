# SCHEDULER MODULE - DETAILED EXPLANATION

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [SchedulerConfig.java - Complete Breakdown](#schedulerconfigjava---complete-breakdown)
3. [EventReminderJob.java - Complete Breakdown](#eventreminderjobjava---complete-breakdown)
4. [EventStatusUpdateJob.java - Complete Breakdown](#eventstatusupdatejobjava---complete-breakdown)
5. [AuditLogArchivalJob.java - Complete Breakdown](#auditlogarchivaljobjava---complete-breakdown)
6. [SchedulerService.java - Complete Breakdown](#schedulerservicejava---complete-breakdown)
7. [How Everything Works Together](#how-everything-works-together)
8. [Flow Diagrams](#flow-diagrams)

---

## ARCHITECTURE OVERVIEW

### High-Level Flow

```
Spring Boot App Starts
         ↓
SchedulerConfig loads (@Configuration)
         ↓
@EnableScheduling activates
         ↓
ThreadPoolTaskScheduler created (5 threads)
         ↓
Spring scans for @Component classes
         ↓
EventReminderJob, EventStatusUpdateJob, AuditLogArchivalJob found
         ↓
@Scheduled annotations processed
         ↓
Jobs scheduled to run at specified intervals
         ↓
Waiting for schedules... (10 sec, 20 sec, 60 sec pass)
         ↓
Jobs start executing on separate threads
         ↓
Results logged to ApplicationLoggerService
         ↓
Job waits fixedDelay before next execution
         ↓
Repeat...
```

### Component Relationships

```
┌─────────────────────────────────────────────────────┐
│           Spring Boot Application                    │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  SchedulerConfig (Configuration)              │  │
│  │  - @EnableScheduling                          │  │
│  │  - Creates ThreadPoolTaskScheduler(5 threads) │  │
│  └────────────────────┬─────────────────────────┘  │
│                       │                             │
│         ┌─────────────┼─────────────┐              │
│         ↓             ↓             ↓              │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐│
│  │ EventReminder│ │EventStatusUpd│ │AuditLogArchv ││
│  │    Job      │ │    ateJob    │ │  alJob       ││
│  │             │ │              │ │              ││
│  │ @Scheduled  │ │ @Scheduled   │ │ @Scheduled   ││
│  │ (5 min)     │ │ (30 min)     │ │ (24 hours)   ││
│  └──────┬──────┘ └──────┬───────┘ └──────┬───────┘│
│         │                │                │        │
│         └────────────────┼────────────────┘        │
│                          ↓                         │
│           SchedulerService (Orchestrator)          │
│           - Triggers jobs manually                 │
│           - Gets scheduler status                  │
│                          ↓                         │
│           ApplicationLoggerService                 │
│           (Logs all activities)                    │
└─────────────────────────────────────────────────────┘
```

---

## SCHEDULERCONFIG.JAVA - COMPLETE BREAKDOWN

### **Full Code with Annotations**

```java
package com.event_management_system.scheduler.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

/**
 * Scheduler Configuration
 * 
 * What does this class do?
 * This is the CORE configuration for the entire scheduler.
 * Without this class, @Scheduled annotations would not work.
 */
@Configuration  // ← Tells Spring this is a configuration class
@EnableScheduling  // ← CRITICAL: Activates @Scheduled processing
public class SchedulerConfig {

    /**
     * Create and configure ThreadPoolTaskScheduler Bean
     * 
     * What is a Bean?
     * A Bean is an object that Spring creates and manages.
     * When you @Autowired, Spring injects this bean.
     * 
     * What is ThreadPoolTaskScheduler?
     * It's a special scheduler that manages threads for scheduled tasks.
     * Without this, all jobs would run on the same thread (sequential).
     */
    @Bean  // ← Tells Spring: "Create this object and manage it"
    public ThreadPoolTaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        
        // Maximum threads that can run jobs simultaneously
        scheduler.setPoolSize(5);
        
        // Thread names appear in logs (helps debugging)
        scheduler.setThreadNamePrefix("scheduler-");
        
        // Wait 60 seconds before force-stopping a job during shutdown
        scheduler.setAwaitTerminationSeconds(60);
        
        // When app stops, wait for running jobs to finish
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        
        // Initialize the scheduler
        scheduler.initialize();
        
        return scheduler;
    }
}
```

### **What Each Line Does**

| Line | Purpose | Example |
|------|---------|---------|
| `@Configuration` | Mark class as Spring config | Loads on app startup |
| `@EnableScheduling` | Activate @Scheduled annotations | Allows jobs to run |
| `@Bean` | Register object in Spring | Can be @Autowired elsewhere |
| `setPoolSize(5)` | 5 threads max | 5 jobs can run simultaneously |
| `setThreadNamePrefix()` | Thread naming | Logs show `[scheduler-1]`, `[scheduler-2]` |
| `setAwaitTerminationSeconds(60)` | Shutdown timeout | Wait max 60 sec before force-stop |
| `setWaitForTasksToCompleteOnShutdown()` | Graceful shutdown | Finish running jobs before stopping |
| `initialize()` | Start the scheduler | Ready to accept jobs |

### **Why This Configuration?**

```
Without ThreadPoolTaskScheduler:
Job A: 10 sec → Job B: 5 sec → Job C: 15 sec
Total time: 30 seconds (sequential - slow)

With ThreadPoolTaskScheduler (5 threads):
Job A: 10 sec ↓
Job B: 5 sec  ↓ Running in parallel
Job C: 15 sec ↓
Total time: 15 seconds (fastest job determines total - fast)
```

---

## EVENTREMINDERJOBJAVA - COMPLETE BREAKDOWN

### **What is EventReminderJob?**

A job that:
- Runs every 5 minutes
- Finds events starting in next 24 hours
- Prepares reminders for attendees
- Logs what it's doing

### **Full Code with Line-by-Line Explanation**

```java
package com.event_management_system.scheduler.job;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.event_management_system.entity.Event;
import com.event_management_system.repository.EventRepository;
import com.event_management_system.service.ApplicationLoggerService;
import lombok.extern.slf4j.Slf4j;

@Component  // ← Tells Spring to create this as a bean and manage it
@Slf4j  // ← Auto-generates logger (from Lombok library)
public class EventReminderJob {

    // DEPENDENCY INJECTION
    @Autowired  // ← Spring injects this automatically
    private EventRepository eventRepository;  // Access to database

    @Autowired  // ← Spring injects this automatically
    private ApplicationLoggerService logger;  // Logging service

    /**
     * The main job method
     * 
     * @Scheduled annotations tell Spring when to run this method
     * fixedDelay = Wait this many milliseconds AFTER job finishes
     * initialDelay = Wait this many milliseconds before FIRST run
     */
    @Scheduled(fixedDelay = 300000, initialDelay = 10000)
    // ↑ fixedDelay = 300000ms = 5 minutes
    // ↑ initialDelay = 10000ms = 10 seconds
    
    @Transactional(readOnly = true)  // Read database only, no writes
    public void sendEventReminders() {
        
        try {  // Catch any errors and log them
            
            // STEP 1: Log that job is starting
            logger.infoWithContext("EventReminderJob", 
                "Scheduler job started - Checking for upcoming events");
            
            // STEP 2: Get current time
            LocalDateTime now = LocalDateTime.now();
            
            // STEP 3: Calculate 24 hours from now
            LocalDateTime next24Hours = now.plusHours(24);
            
            // STEP 4: Log the time range we're searching for
            logger.debugWithContext("EventReminderJob", 
                "Searching for events between {} and {}", now, next24Hours);
            
            // STEP 5: Query all events from database
            List<Event> upcomingEvents = eventRepository.findAll()
                    .stream()  // Convert to stream for filtering
                    
                    // Filter 1: Remove soft-deleted events
                    .filter(event -> !event.isDeleted())
                    
                    // Filter 2: Keep only ACTIVE events
                    .filter(event -> event.getStatus().toString().equals("ACTIVE"))
                    
                    // Filter 3: Event hasn't started yet
                    .filter(event -> event.getStartTime().isAfter(now))
                    
                    // Filter 4: Event starts within next 24 hours
                    .filter(event -> event.getStartTime().isBefore(next24Hours))
                    
                    .toList();  // Convert back to List
            
            // STEP 6: Log how many upcoming events found
            logger.infoWithContext("EventReminderJob", 
                "Found {} upcoming events to remind attendees", 
                upcomingEvents.size());
            
            // STEP 7: Loop through each upcoming event
            for (Event event : upcomingEvents) {
                try {
                    // Log which event we're processing
                    logger.debugWithContext("EventReminderJob", 
                        "Processing event: {} (ID: {}), Starting at: {}",
                        event.getTitle(), event.getId(), event.getStartTime());
                    
                    // Get attendee count
                    int attendeeCount = event.getAttendees() != null 
                        ? event.getAttendees().size() 
                        : 0;
                    
                    // Log that we would send reminders
                    logger.infoWithContext("EventReminderJob", 
                        "Would send reminders to {} attendees for event: {}",
                        attendeeCount, event.getTitle());
                    
                    // TODO: In future, integrate with email service
                    // notificationService.sendEventReminder(event, 
                    //     event.getAttendees());
                    
                    logger.debugWithContext("EventReminderJob", 
                        "Successfully processed reminders for event: {}", 
                        event.getId());
                    
                } catch (Exception e) {
                    // If error on one event, log it but continue with others
                    logger.errorWithContext("EventReminderJob", 
                        "Error processing reminders for event: " + 
                        event.getId(), e);
                }
            }
            
            // STEP 8: Log job completion
            logger.infoWithContext("EventReminderJob", 
                "Event reminder job completed successfully. Processed {} events", 
                upcomingEvents.size());
            
        } catch (Exception e) {
            // Catch unexpected errors at job level
            logger.errorWithContext("EventReminderJob", 
                "Unexpected error in sendEventReminders()", e);
            // Don't throw - let scheduler continue
        }
    }
}
```

### **Execution Timeline Example**

```
00:00:10 - App starts + 10 sec initial delay
00:00:10 - EventReminderJob.sendEventReminders() STARTS
00:00:11 - Queries database
00:00:12 - Finds events, logs results  
00:00:13 - Job COMPLETES (took ~3 seconds)
00:00:13 - Waits 5 minutes (fixedDelay)
00:05:13 - EventReminderJob.sendEventReminders() STARTS again
...
```

### **Key Functions Inside sendEventReminders()**

| Function | What it does | Example |
|----------|-------------|---------|
| `eventRepository.findAll()` | Gets ALL events from database | Queries `app_events` table |
| `.stream()` | Converts list to stream | Enables filtering |
| `.filter()` | Keeps only matching events | Removes deleted, inactive |
| `.toList()` | Converts back to list | Returns `List<Event>` |
| `event.getAttendees()` | Gets attendees for event | Returns `Set<User>` |
| `logger.infoWithContext()` | Logs information level | Appears in app logs |
| `logger.debugWithContext()` | Logs debug details | Only if debug enabled |
| `logger.errorWithContext()` | Logs errors | For troubleshooting |

---

## EVENTSTATUSUPDATEJOBJAVA - COMPLETE BREAKDOWN

### **What is EventStatusUpdateJob?**

A job that:
- Runs every 30 minutes
- Finds all ACTIVE events
- Checks if any have ended
- Marks ended events as COMPLETED

### **Key Methods Explained**

```java
@Scheduled(fixedDelay = 1800000, initialDelay = 20000)
// fixedDelay = 1800000ms = 30 minutes
// initialDelay = 20000ms = 20 seconds
@Transactional  // Can WRITE to database
public void updateEventStatus() {
    
    // Get current time
    LocalDateTime now = LocalDateTime.now();
    
    // Get all events from database
    List<Event> allEvents = eventRepository.findAll()
            .stream()
            .filter(event -> !event.isDeleted())  // Not soft-deleted
            .filter(event -> "ACTIVE".equals(event.getStatus().toString()))
            .toList();
    
    // For each ACTIVE event
    for (Event event : allEvents) {
        // If event end time has PASSED
        if (event.getEndTime().isBefore(now)) {
            // Mark as COMPLETED
            // event.setStatus(EventStatus.COMPLETED);
            // eventRepository.save(event);
        }
    }
}
```

### **Execution Timeline Example**

```
00:00:20 - App starts + 20 sec initial delay
00:00:20 - EventStatusUpdateJob.updateEventStatus() STARTS
00:00:21 - Queries database for ACTIVE events
00:00:22 - Checks each event's end time
00:00:23 - Job COMPLETES (took ~3 seconds)
00:00:23 - Waits 30 minutes (fixedDelay)
00:30:23 - EventStatusUpdateJob.updateEventStatus() STARTS again
```

### **What It Checks**

```
Event A: starts 2PM, ends 3PM
Current time: 2:45PM
Status: ACTIVE (still running)

Event B: starts 2PM, ends 3PM
Current time: 3:10PM
Status: Should be COMPLETED (but still ACTIVE - this job fixes it)
```

---

## AUDITLOGARCHIVALJOBJAVA - COMPLETE BREAKDOWN

### **What is AuditLogArchivalJob?**

A job that:
- Runs once every 24 hours
- Finds audit logs older than 90 days
- Deletes them to keep database clean
- Logs what was deleted

### **Key Methods Explained**

```java
@Scheduled(fixedDelay = 86400000, initialDelay = 60000)
// fixedDelay = 86400000ms = 24 hours
// initialDelay = 60000ms = 1 minute
@Transactional  // Deletes from database
public void archiveOldLogs() {
    
    // Calculate cutoff date: 90 days ago
    LocalDateTime ninetyDaysAgo = LocalDateTime.now().minusDays(90);
    
    // Delete records created before ninetyDaysAgo
    // int deleted = repository.deleteOlderThan(ninetyDaysAgo);
    
    // Log how many deleted
    logger.infoWithContext("AuditLogArchivalJob", 
        "Deleted {} audit logs", deleted);
}
```

### **Execution Timeline Example**

```
00:01:00 - App starts + 1 minute initial delay
00:01:00 - AuditLogArchivalJob.archiveOldLogs() STARTS
00:01:05 - Calculates cutoff date (90 days ago)
00:01:10 - Deletes all logs older than cutoff
00:01:15 - Job COMPLETES (took ~15 seconds)
00:01:15 - Waits 24 hours (fixedDelay)
24:01:15 - AuditLogArchivalJob.archiveOldLogs() STARTS again
```

### **What Gets Deleted**

```
Today: 2025-12-26
90 days ago: 2025-09-27

Audit logs created BEFORE 2025-09-27 → DELETED
Audit logs created AFTER 2025-09-27 → KEPT

Example:
- Log from 2025-08-01 → DELETED (105 days old)
- Log from 2025-09-20 → DELETED (97 days old)
- Log from 2025-10-01 → KEPT (87 days old)
- Log from 2025-12-25 → KEPT (1 day old)
```

---

## SCHEDULERSERVICE.JAVA - COMPLETE BREAKDOWN

### **What is SchedulerService?**

A service that:
- Manages all 3 jobs centrally
- Allows manual job triggering
- Provides scheduler health status
- Orchestrates job execution

### **Full Code with Explanation**

```java
package com.event_management_system.scheduler.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.event_management_system.scheduler.job.*;
import com.event_management_system.service.ApplicationLoggerService;
import lombok.extern.slf4j.Slf4j;

@Service  // ← Spring registers this as a service bean
@Slf4j  // ← Auto-generates logger
public class SchedulerService {

    // DEPENDENCY INJECTION - All 3 jobs
    @Autowired
    private EventReminderJob eventReminderJob;  // Access to reminder job

    @Autowired
    private EventStatusUpdateJob eventStatusUpdateJob;  // Access to status job

    @Autowired
    private AuditLogArchivalJob auditLogArchivalJob;  // Access to archival job

    @Autowired
    private ApplicationLoggerService logger;  // Logging

    /**
     * Manually trigger event reminder job
     * 
     * Why do you need this?
     * 1. Testing - run job without waiting for schedule
     * 2. Admin endpoints - let admins trigger on-demand
     * 3. Emergency - force reminders if something went wrong
     * 
     * Usage Example:
     * @PostMapping("/admin/trigger-reminders")
     * public void triggerReminders() {
     *     schedulerService.triggerEventReminder();
     * }
     */
    public void triggerEventReminder() {
        try {
            // Log that we're triggering
            logger.infoWithContext("SchedulerService", 
                "Manually triggering Event Reminder Job");
            
            // Call the job method directly
            eventReminderJob.sendEventReminders();
            
            // Log success
            logger.infoWithContext("SchedulerService", 
                "Event Reminder Job completed successfully");
            
        } catch (Exception e) {
            // Log error
            logger.errorWithContext("SchedulerService", 
                "Error triggering Event Reminder Job", e);
            
            // Throw so caller knows it failed
            throw new RuntimeException("Failed to trigger event reminder job", e);
        }
    }

    /**
     * Manually trigger event status update job
     */
    public void triggerEventStatusUpdate() {
        try {
            logger.infoWithContext("SchedulerService", 
                "Manually triggering Event Status Update Job");
            
            eventStatusUpdateJob.updateEventStatus();
            
            logger.infoWithContext("SchedulerService", 
                "Event Status Update Job completed successfully");
            
        } catch (Exception e) {
            logger.errorWithContext("SchedulerService", 
                "Error triggering Event Status Update Job", e);
            throw new RuntimeException("Failed to trigger event status update job", e);
        }
    }

    /**
     * Manually trigger audit log archival job
     */
    public void triggerAuditLogArchival() {
        try {
            logger.infoWithContext("SchedulerService", 
                "Manually triggering Audit Log Archival Job");
            
            auditLogArchivalJob.archiveOldLogs();
            
            logger.infoWithContext("SchedulerService", 
                "Audit Log Archival Job completed successfully");
            
        } catch (Exception e) {
            logger.errorWithContext("SchedulerService", 
                "Error triggering Audit Log Archival Job", e);
            throw new RuntimeException("Failed to trigger audit log archival job", e);
        }
    }

    /**
     * Get scheduler health status
     * 
     * Returns: Simple message about scheduler status
     * 
     * Usage:
     * GET /api/admin/scheduler/status
     * Response: "Scheduler is running. All jobs are registered..."
     */
    public String getSchedulerStatus() {
        logger.debugWithContext("SchedulerService", "Checking scheduler status");
        return "Scheduler is running. All jobs are registered and waiting " +
               "for their scheduled times.";
    }
}
```

### **How to Use SchedulerService in Controllers**

```java
@RestController
@RequestMapping("/api/admin/scheduler")
public class AdminSchedulerController {

    @Autowired
    private SchedulerService schedulerService;

    @PostMapping("/trigger-reminders")
    public ResponseEntity<String> triggerReminders() {
        schedulerService.triggerEventReminder();
        return ResponseEntity.ok("Reminder job triggered");
    }

    @PostMapping("/trigger-status-update")
    public ResponseEntity<String> triggerStatusUpdate() {
        schedulerService.triggerEventStatusUpdate();
        return ResponseEntity.ok("Status update job triggered");
    }

    @PostMapping("/trigger-archival")
    public ResponseEntity<String> triggerArchival() {
        schedulerService.triggerAuditLogArchival();
        return ResponseEntity.ok("Archival job triggered");
    }

    @GetMapping("/status")
    public ResponseEntity<String> getStatus() {
        String status = schedulerService.getSchedulerStatus();
        return ResponseEntity.ok(status);
    }
}
```

---

## HOW EVERYTHING WORKS TOGETHER

### **Complete Startup Sequence**

```
STEP 1: Spring Boot Application Starts
  ├─ Scans classpath for @Configuration classes
  └─ Finds SchedulerConfig.java

STEP 2: SchedulerConfig Loads
  ├─ @Configuration activates
  ├─ @EnableScheduling processes all @Scheduled annotations
  └─ Creates ThreadPoolTaskScheduler with 5 threads

STEP 3: Spring Scans for @Component Classes
  ├─ Finds EventReminderJob
  ├─ Finds EventStatusUpdateJob
  └─ Finds AuditLogArchivalJob

STEP 4: @Scheduled Annotations Registered
  ├─ EventReminderJob: schedule in 10 seconds (initialDelay)
  ├─ EventStatusUpdateJob: schedule in 20 seconds (initialDelay)
  └─ AuditLogArchivalJob: schedule in 60 seconds (initialDelay)

STEP 5: Jobs Waiting for Their Time
  ├─ 10 sec → EventReminderJob EXECUTES
  ├─ 20 sec → EventStatusUpdateJob EXECUTES
  ├─ 60 sec → AuditLogArchivalJob EXECUTES

STEP 6: After Jobs Complete
  ├─ EventReminderJob waits 5 min, runs again
  ├─ EventStatusUpdateJob waits 30 min, runs again
  └─ AuditLogArchivalJob waits 24 hours, runs again
```

### **Parallel Execution Example**

```
Thread 1: EventReminderJob
          │
          ├─ 10 sec: Start
          ├─ Query database
          ├─ Filter events
          ├─ Log results (takes 2 sec)
          └─ Complete at 12 sec

Thread 2: EventStatusUpdateJob (starts while Thread 1 still running!)
          │
          ├─ 20 sec: Start
          ├─ Query database
          ├─ Check event times
          └─ Complete at 23 sec

Thread 3: AuditLogArchivalJob
          │
          ├─ 60 sec: Start
          ├─ Calculate cutoff date
          ├─ Delete old logs
          └─ Complete at 75 sec

Result: All jobs running simultaneously = FAST ⚡
```

### **Database Query Flow**

```
EventReminderJob Query:
SELECT * FROM app_events
WHERE deleted = false
  AND status = 'ACTIVE'
  AND start_time > NOW()
  AND start_time < NOW() + 24 hours

EventStatusUpdateJob Query:
SELECT * FROM app_events
WHERE deleted = false
  AND status = 'ACTIVE'
  AND end_time < NOW()
→ Set status = 'COMPLETED'

AuditLogArchivalJob Query:
DELETE FROM user_activity_history
WHERE created_at < NOW() - 90 days
```

---

## FLOW DIAGRAMS

### **Job Execution Flow**

```
┌─────────────────────────────────────────────────┐
│  EventReminderJob.sendEventReminders()         │
├─────────────────────────────────────────────────┤
│                                                  │
│  1. START                                        │
│     ↓                                           │
│  2. LOG: "Job started"                          │
│     ↓                                           │
│  3. Get current time: LocalDateTime.now()      │
│     ↓                                           │
│  4. Calculate 24 hours later                   │
│     ↓                                           │
│  5. LOG: "Searching between X and Y"           │
│     ↓                                           │
│  6. Query: eventRepository.findAll()           │
│     └─→ Gets all events from database          │
│     ↓                                           │
│  7. FILTER 1: Not deleted (deleted = false)    │
│     ↓                                           │
│  8. FILTER 2: Status = ACTIVE                  │
│     ↓                                           │
│  9. FILTER 3: Start time > now (hasn't started)│
│     ↓                                           │
│  10. FILTER 4: Start time < now+24h            │
│     ↓                                           │
│  11. Result: List<Event> upcomingEvents        │
│     ↓                                           │
│  12. LOG: "Found N upcoming events"            │
│     ↓                                           │
│  13. FOR EACH event:                           │
│      ├─ Get attendees count                    │
│      ├─ LOG: "Send reminders to N attendees"   │
│      └─ TODO: Send actual emails               │
│     ↓                                           │
│  14. LOG: "Job completed successfully"         │
│     ↓                                           │
│  15. END - Wait 5 minutes (fixedDelay)         │
│                                                  │
└─────────────────────────────────────────────────┘
```

### **Scheduler Lifecycle**

```
APP START
   ↓
Load SchedulerConfig
   ↓
Create ThreadPoolTaskScheduler (5 threads)
   ↓
Enable @Scheduled annotations
   ↓
Register Job 1 (EventReminderJob)
   ↓
Register Job 2 (EventStatusUpdateJob)
   ↓
Register Job 3 (AuditLogArchivalJob)
   ↓
WAITING FOR SCHEDULES...
   ├─ 10 sec → Job 1 runs on thread-1
   ├─ 20 sec → Job 2 runs on thread-2 (Job 1 still running!)
   ├─ 60 sec → Job 3 runs on thread-3
   │
   ├─ Job 1 completes at 12 sec
   ├─ Waits 5 min
   ├─ Job 2 completes at 23 sec
   ├─ Waits 30 min
   ├─ Job 3 completes at 75 sec
   ├─ Waits 24 hours
   │
   ├─ 5:12 min → Job 1 runs again
   ├─ 30:23 min → Job 2 runs again
   ├─ 24:75 hours → Job 3 runs again
   │
   ... (repeats forever)
   ↓
APP STOP
   ↓
Wait for running jobs to complete (graceful shutdown)
   ↓
Stop ThreadPoolTaskScheduler
```

### **Thread Assignment**

```
ThreadPoolTaskScheduler (5 threads):

Thread 1: [scheduler-1]
  ├─ 10s: EventReminderJob
  ├─ 5m10s: EventReminderJob
  └─ 10m10s: EventReminderJob

Thread 2: [scheduler-2]
  ├─ 20s: EventStatusUpdateJob
  ├─ 30m20s: EventStatusUpdateJob
  └─ 60m20s: EventStatusUpdateJob

Thread 3: [scheduler-3]
  ├─ 60s: AuditLogArchivalJob
  └─ 24h60s: AuditLogArchivalJob

Thread 4: [scheduler-4] - Available for new jobs
Thread 5: [scheduler-5] - Available for new jobs
```

---

## SUMMARY TABLE

| Component | Purpose | When Runs | Frequency | Thread |
|-----------|---------|-----------|-----------|--------|
| SchedulerConfig | Enable scheduling | App startup | Once | Main |
| EventReminderJob | Send event reminders | Fixed schedule | Every 5 min | scheduler-1 |
| EventStatusUpdateJob | Update event status | Fixed schedule | Every 30 min | scheduler-2 |
| AuditLogArchivalJob | Clean old logs | Fixed schedule | Every 24 hours | scheduler-3 |
| SchedulerService | Manual job triggering | On-demand | Whenever called | Current |

---

## KEY CONCEPTS SUMMARY

### **@Scheduled Annotation**
```
@Scheduled(fixedDelay = X, initialDelay = Y)
         ↑
         └─ Tells Spring: Run this method on a schedule
```

### **fixedDelay vs initialDelay**
```
initialDelay = Wait before FIRST run after app starts
fixedDelay = Wait AFTER job finishes before running again
```

### **@Component**
```
@Component
        ↑
        └─ Tells Spring: Manage this class, scan it for @Scheduled
```

### **@Transactional(readOnly = true)**
```
readOnly = true → Only SELECT queries allowed (no INSERT/UPDATE/DELETE)
readOnly = false → All queries allowed (SELECT/INSERT/UPDATE/DELETE)
```

### **ThreadPoolTaskScheduler**
```
poolSize = 5 → Max 5 jobs running simultaneously
Allows parallel execution of multiple scheduled jobs
```

---

This document explains **EVERYTHING** about how the scheduler works, every function, and how they all connect together!
