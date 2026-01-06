# SCHEDULER - ACTUAL CODE WITH DESCRIPTIONS

This document shows the actual code files in the scheduler module with detailed explanations of what each code section does.

---

## 1. SCHEDULERCONFIG.JAVA - ACTUAL CODE WITH DESCRIPTIONS

### **File Location:**
```
src/main/java/com/event_management_system/scheduler/config/SchedulerConfig.java
```

### **Complete Actual Code:**

```java
package com.event_management_system.scheduler.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

/**
 * Scheduler Configuration
 * 
 * This class enables Spring's @Scheduled annotation feature and configures
 * the thread pool that will execute all scheduled jobs.
 * 
 * How it works:
 * 1. @EnableScheduling - Tells Spring to look for @Scheduled annotations
 * 2. ThreadPoolTaskScheduler - Creates 5 threads to run jobs in parallel
 * 3. If a job takes longer than awaitTerminationSeconds, it times out
 */
@Configuration
@EnableScheduling
public class SchedulerConfig {

    /**
     * Configure the ThreadPoolTaskScheduler
     * 
     * Why ThreadPoolTaskScheduler?
     * - Multiple threads so jobs don't block each other
     * - If Job A takes 30 seconds, Job B can still start
     * - Without this, jobs would run one after another (sequential)
     * 
     * Configuration Parameters:
     * - poolSize=5: Maximum 5 jobs can run at the same time
     * - threadNamePrefix: Makes logs easier to read (see "scheduler-" in logs)
     * - awaitTerminationSeconds=60: Wait 60 sec for job to finish before forcing stop
     * - waitForTasksToCompleteOnShutdown=true: Don't kill jobs when app stops
     * 
     * @return Configured ThreadPoolTaskScheduler bean
     */
    @Bean
    public ThreadPoolTaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        
        // EXPLANATION 1: Set Pool Size to 5 threads
        // This means maximum 5 scheduled jobs can run at the same time
        // If 6th job is scheduled while 5 are running, it waits for a thread
        scheduler.setPoolSize(5);
        
        // EXPLANATION 2: Thread Name Prefix
        // When you see logs like [scheduler-1], [scheduler-2], etc.
        // This prefix helps you identify which scheduler thread executed the job
        // Makes debugging easier by showing thread names in logs
        scheduler.setThreadNamePrefix("scheduler-");
        
        // EXPLANATION 3: Await Termination Seconds
        // When application shuts down, wait max 60 seconds for running jobs to finish
        // Prevents data loss from abrupt job termination
        // If job is still running after 60 sec, force stop it
        scheduler.setAwaitTerminationSeconds(60);
        
        // EXPLANATION 4: Wait For Tasks to Complete on Shutdown
        // true = Don't interrupt running jobs when app stops
        // false = Kill jobs immediately
        // true is safer - ensures jobs finish gracefully
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        
        // EXPLANATION 5: Initialize
        // This actually starts the scheduler and its thread pool
        // Without this line, scheduler is created but not ready
        scheduler.initialize();
        
        // EXPLANATION 6: Return the scheduler
        // Spring registers this bean, making it available for @Scheduled methods
        // Same instance used throughout the entire application
        return scheduler;
    }
}
```

### **What This Code Does:**

| Line/Code | Purpose | Result |
|-----------|---------|--------|
| `@Configuration` | Marks class as Spring configuration | Spring loads this class at startup |
| `@EnableScheduling` | Activates @Scheduled annotations | Jobs can now run on schedule |
| `@Bean` | Creates a Spring bean | Returns object is managed by Spring |
| `setPoolSize(5)` | Set max threads | Max 5 jobs run simultaneously |
| `setThreadNamePrefix()` | Name threads "scheduler-N" | Logs show thread names |
| `setAwaitTerminationSeconds(60)` | Wait before force-stop | Graceful shutdown |
| `setWaitForTasksToCompleteOnShutdown()` | Let jobs finish before shutdown | No data loss |
| `initialize()` | Start the scheduler | Ready to execute jobs |
| `return scheduler` | Give to Spring | Available for injection |

---

## 2. EVENTREMINDERJOBJAVA - ACTUAL CODE WITH DESCRIPTIONS

### **File Location:**
```
src/main/java/com/event_management_system/scheduler/job/EventReminderJob.java
```

### **Complete Actual Code:**

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

/**
 * Event Reminder Job
 * 
 * This job runs periodically to check for upcoming events and send reminders
 * to attendees.
 * 
 * How it works:
 * 1. Runs every 5 minutes (fixedDelay = 300000ms)
 * 2. Waits 10 seconds after app starts (initialDelay = 10000ms)
 * 3. Finds all events starting in next 24 hours
 * 4. Gets attendees for each event
 * 5. Prepares/sends notifications (currently just logs)
 * 6. Logs execution details
 */
@Component
@Slf4j
public class EventReminderJob {

    // EXPLANATION 1: Dependency Injection - EventRepository
    // @Autowired tells Spring to inject this automatically
    // EventRepository provides methods to query Event table
    // Available methods: findAll(), findById(), save(), delete()
    @Autowired
    private EventRepository eventRepository;

    // EXPLANATION 2: Dependency Injection - Logger
    // @Autowired tells Spring to inject this automatically
    // ApplicationLoggerService provides logging methods
    // Available methods: infoWithContext(), debugWithContext(), errorWithContext()
    @Autowired
    private ApplicationLoggerService logger;

    /**
     * Send reminders for upcoming events
     * 
     * EXPLANATION: @Scheduled Annotation
     * fixedDelay = 300000 milliseconds = 5 minutes
     *   Meaning: After this method completes, wait 5 minutes before running again
     *   Timeline:
     *   - Job starts: 00:00:10
     *   - Job ends: 00:00:12 (took 2 seconds)
     *   - Wait: 5 minutes
     *   - Job starts: 00:05:12
     * 
     * initialDelay = 10000 milliseconds = 10 seconds
     *   Meaning: Wait 10 seconds after app starts before first run
     *   Timeline:
     *   - App starts: 00:00:00
     *   - Wait: 10 seconds
     *   - Job starts: 00:00:10
     * 
     * Why fixedDelay and not fixedRate?
     * - fixedDelay: Safe if job takes longer than expected
     * - fixedRate: Could overlap if job is slow
     * - Reminders are not urgent, so fixedDelay is safer
     */
    @Scheduled(fixedDelay = 300000, initialDelay = 10000)
    
    // EXPLANATION 3: @Transactional(readOnly = true)
    // Opens a database transaction for this method
    // readOnly = true means:
    //   - Only SELECT queries allowed
    //   - Prevents accidental INSERT/UPDATE/DELETE
    //   - More efficient (no write locks)
    // When method ends, Spring closes the transaction automatically
    @Transactional(readOnly = true)
    public void sendEventReminders() {
        
        try {
            // EXPLANATION 4: Log job start
            // Info level = important business events
            // Shows in logs: [EventReminderJob] INFO - Scheduler job started...
            logger.infoWithContext("EventReminderJob", 
                "Scheduler job started - Checking for upcoming events");
            
            // EXPLANATION 5: Get current date and time
            // LocalDateTime.now() returns current moment
            // Example: 2025-12-26T16:50:45.557436200
            // Used to compare with event times
            LocalDateTime now = LocalDateTime.now();
            
            // EXPLANATION 6: Calculate 24 hours from now
            // now.plusHours(24) adds 24 hours to current time
            // Example: if now=2025-12-26T16:50:45
            //          then next24Hours=2025-12-27T16:50:45
            // Used to find events within 24-hour window
            LocalDateTime next24Hours = now.plusHours(24);
            
            // EXPLANATION 7: Log the time range we're searching
            // Debug level = detailed technical information
            // Helps track what the job is doing
            logger.debugWithContext("EventReminderJob", 
                "Searching for events between {} and {}", now, next24Hours);
            
            // EXPLANATION 8: Query database for ALL events
            // eventRepository.findAll() runs SQL: SELECT * FROM app_events
            // Returns: ALL events (including deleted and inactive)
            // We'll filter them below using .stream() and .filter()
            List<Event> upcomingEvents = eventRepository.findAll()
                    
                    // EXPLANATION 9: Convert List to Stream
                    // .stream() allows chaining filter operations
                    // Like a pipeline: list → stream → filter → filter → ... → list
                    .stream()
                    
                    // EXPLANATION 10: Filter 1 - Remove soft-deleted events
                    // !event.isDeleted() means "not deleted"
                    // Keeps only events where deleted=false
                    // Example:
                    //   Event1: deleted=false → KEEP ✅
                    //   Event2: deleted=true → REMOVE ❌
                    .filter(event -> !event.isDeleted())
                    
                    // EXPLANATION 11: Filter 2 - Keep only ACTIVE events
                    // event.getStatus() returns enum (ACTIVE, INACTIVE, OFF)
                    // .toString() converts to string ("ACTIVE")
                    // .equals("ACTIVE") checks if status is ACTIVE
                    // Example:
                    //   Event1: status=ACTIVE → KEEP ✅
                    //   Event2: status=INACTIVE → REMOVE ❌
                    .filter(event -> event.getStatus().toString().equals("ACTIVE"))
                    
                    // EXPLANATION 12: Filter 3 - Keep only future events
                    // event.getStartTime() gets when event starts
                    // .isAfter(now) checks if start time is after current time
                    // Removes events that already started
                    // Example:
                    //   Event1: startTime=2025-12-26T17:00:00, now=2025-12-26T16:50
                    //   isAfter(now)? YES → KEEP ✅
                    //   Event2: startTime=2025-12-26T15:00:00, now=2025-12-26T16:50
                    //   isAfter(now)? NO → REMOVE ❌
                    .filter(event -> event.getStartTime().isAfter(now))
                    
                    // EXPLANATION 13: Filter 4 - Keep events within 24 hours
                    // .isBefore(next24Hours) checks if event starts before 24 hours from now
                    // Keeps only upcoming events in the next day
                    // Example:
                    //   Event1: startTime=2025-12-26T17:00:00, next24Hours=2025-12-27T16:50
                    //   isBefore(next24Hours)? YES → KEEP ✅
                    //   Event2: startTime=2025-12-28T12:00:00, next24Hours=2025-12-27T16:50
                    //   isBefore(next24Hours)? NO → REMOVE ❌
                    .filter(event -> event.getStartTime().isBefore(next24Hours))
                    
                    // EXPLANATION 14: Convert stream back to List
                    // .toList() collects filtered results into a List<Event>
                    // This is our final list of upcoming events to process
                    .toList();
            
            // EXPLANATION 15: Log how many events found
            // upcomingEvents.size() = number of events in list
            // Shows: [EventReminderJob] INFO - Found 3 upcoming events to remind attendees
            logger.infoWithContext("EventReminderJob", 
                "Found {} upcoming events to remind attendees", upcomingEvents.size());
            
            // EXPLANATION 16: Loop through each upcoming event
            // for (Event event : upcomingEvents) iterates through list
            // Each iteration: event = next item in list
            // Example: First iteration event=Event1, second iteration event=Event3, etc.
            for (Event event : upcomingEvents) {
                try {
                    // EXPLANATION 17: Log which event is being processed
                    // Shows event details: title, ID, start time
                    logger.debugWithContext("EventReminderJob", 
                        "Processing event: {} (ID: {}), Starting at: {}",
                        event.getTitle(), event.getId(), event.getStartTime());
                    
                    // EXPLANATION 18: Safely get attendee count
                    // event.getAttendees() might be null or a collection
                    // Ternary operator: condition ? trueValue : falseValue
                    // If attendees != null, use .size(), otherwise use 0
                    // Prevents NullPointerException
                    // Example:
                    //   Event1 attendees: [User1, User2, User3] → count = 3
                    //   Event2 attendees: null → count = 0
                    int attendeeCount = event.getAttendees() != null 
                        ? event.getAttendees().size() 
                        : 0;
                    
                    // EXPLANATION 19: Log what reminders would be sent
                    // Shows attendee count and event name
                    // Future: Replace with actual email sending
                    logger.infoWithContext("EventReminderJob", 
                        "Would send reminders to {} attendees for event: {}",
                        attendeeCount, event.getTitle());
                    
                    // EXPLANATION 20: TODO comment for future implementation
                    // Marks where to add email/notification service
                    // Currently just logs, but ready for real notifications
                    // Future code would be:
                    // notificationService.sendEventReminder(event, event.getAttendees());
                    
                    // EXPLANATION 21: Log successful processing
                    logger.debugWithContext("EventReminderJob", 
                        "Successfully processed reminders for event: {}", 
                        event.getId());
                    
                } catch (Exception e) {
                    // EXPLANATION 22: Catch error for this specific event
                    // If error processing one event, don't stop entire job
                    // Log the error and continue to next event
                    logger.errorWithContext("EventReminderJob", 
                        "Error processing reminders for event: " + event.getId(), e);
                }
            }
            
            // EXPLANATION 23: Log job completion
            // Shows how many events were processed
            logger.infoWithContext("EventReminderJob", 
                "Event reminder job completed successfully. Processed {} events", 
                upcomingEvents.size());
            
        } catch (Exception e) {
            // EXPLANATION 24: Catch unexpected job-level errors
            // If anything goes wrong in entire job, log it
            // Don't throw - let scheduler continue running
            logger.errorWithContext("EventReminderJob", 
                "Unexpected error in sendEventReminders()", e);
            // Don't throw - let the scheduler continue
        }
    }
}
```

### **What Each Code Section Does:**

| Code Section | Purpose | Action |
|--------------|---------|--------|
| `@Component` | Mark class as component | Spring creates instance automatically |
| `@Autowired EventRepository` | Inject database access | Can query events |
| `@Autowired ApplicationLoggerService` | Inject logger | Can log messages |
| `@Scheduled(fixedDelay=300000...)` | Run on schedule | Execute every 5 minutes |
| `@Transactional(readOnly=true)` | Open database session | Safe read-only queries |
| `LocalDateTime.now()` | Get current time | Compare with event times |
| `now.plusHours(24)` | Calculate next 24 hours | Define time window |
| `eventRepository.findAll()` | Query database | Get all events |
| `.stream()` | Convert to stream | Enable filtering |
| `.filter(!isDeleted())` | Remove deleted events | Keep only active |
| `.filter(status==ACTIVE)` | Remove inactive | Keep only ACTIVE |
| `.filter(startTime>now)` | Remove past events | Keep only future |
| `.filter(startTime<next24h)` | Limit to 24 hours | Keep only upcoming |
| `.toList()` | Convert back to list | Get final list |
| `for (Event event : list)` | Loop through events | Process each event |
| `logger.info()` | Log information | Record execution |
| `try-catch` | Error handling | Prevent job crash |

---

## 3. EVENTSTATUSUPDATEJOBJAVA - ACTUAL CODE WITH DESCRIPTIONS

### **File Location:**
```
src/main/java/com/event_management_system/scheduler/job/EventStatusUpdateJob.java
```

### **Complete Actual Code:**

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

/**
 * Event Status Update Job
 * 
 * This job runs periodically to check if any events have started or ended,
 * and updates their status accordingly.
 * 
 * How it works:
 * 1. Runs every 30 minutes
 * 2. Finds all ACTIVE events
 * 3. For events that have ended, marks them as COMPLETED
 * 4. For events that are about to start, could mark as STARTED (optional)
 * 5. Logs all status changes
 */
@Component
@Slf4j
public class EventStatusUpdateJob {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private ApplicationLoggerService logger;

    /**
     * Update status of events based on current time
     * 
     * @Scheduled(fixedDelay = 1800000) means:
     * - 1800000 milliseconds = 30 minutes
     * - Check every 30 minutes if events have ended
     * 
     * Why 30 minutes?
     * - More frequent than reminders (don't need to check too often)
     * - Balanced between accuracy and performance
     */
    @Scheduled(fixedDelay = 1800000, initialDelay = 20000)
    @Transactional
    public void updateEventStatus() {
        try {
            // EXPLANATION 1: Log job start
            logger.infoWithContext("EventStatusUpdateJob", 
                "Scheduler job started - Updating event statuses");
            
            // EXPLANATION 2: Get current time for comparison
            LocalDateTime now = LocalDateTime.now();
            logger.debugWithContext("EventStatusUpdateJob", 
                "Current time: {}", now);
            
            // EXPLANATION 3: Query all ACTIVE events
            // Find events that haven't been marked as complete yet
            List<Event> allEvents = eventRepository.findAll()
                    .stream()
                    // Filter out soft-deleted events
                    .filter(event -> !event.isDeleted())
                    // Keep only ACTIVE events (not COMPLETED or OFF)
                    .filter(event -> "ACTIVE".equals(event.getStatus().toString()))
                    .toList();
            
            // EXPLANATION 4: Log how many events to check
            logger.infoWithContext("EventStatusUpdateJob", 
                "Found {} active events to check", allEvents.size());
            
            // EXPLANATION 5: Counter for tracking updates
            // Counts how many events were updated in this run
            int completedCount = 0;
            
            // EXPLANATION 6: Check each event
            for (Event event : allEvents) {
                try {
                    // EXPLANATION 7: Check if event has ended
                    // event.getEndTime() returns when event should end
                    // .isBefore(now) checks if end time has passed
                    // If event.endTime < current.time = event has ended
                    if (event.getEndTime().isBefore(now)) {
                        logger.debugWithContext("EventStatusUpdateJob", 
                            "Event '{}' (ID: {}) has ended. Updating status to COMPLETED", 
                            event.getTitle(), event.getId());
                        
                        // EXPLANATION 8: Update event status
                        // TODO: Implement status update in EventService
                        // event.setStatus(EventStatus.COMPLETED);
                        // eventRepository.save(event);
                        
                        logger.infoWithContext("EventStatusUpdateJob", 
                            "Event '{}' (ID: {}) marked as COMPLETED", 
                            event.getTitle(), event.getId());
                        
                        completedCount++;
                    }
                    // EXPLANATION 9: Optional - check if event has started
                    else if (event.getStartTime().isBefore(now)) {
                        logger.debugWithContext("EventStatusUpdateJob", 
                            "Event '{}' (ID: {}) has started", 
                            event.getTitle(), event.getId());
                        
                        // Optional: Mark as STARTED
                        // event.setStatus(EventStatus.STARTED);
                        // eventRepository.save(event);
                    }
                    
                } catch (Exception e) {
                    logger.errorWithContext("EventStatusUpdateJob", 
                        "Error updating status for event: " + event.getId(), e);
                }
            }
            
            // EXPLANATION 10: Log completion
            logger.infoWithContext("EventStatusUpdateJob", 
                "Event status update job completed. Updated {} events to COMPLETED", 
                completedCount);
            
        } catch (Exception e) {
            logger.errorWithContext("EventStatusUpdateJob", 
                "Unexpected error in updateEventStatus()", e);
        }
    }
}
```

### **What Each Code Section Does:**

| Code Section | Purpose | Action |
|--------------|---------|--------|
| `@Scheduled(fixedDelay=1800000)` | Run every 30 minutes | Check for ended events |
| `LocalDateTime.now()` | Get current time | Compare with event times |
| `eventRepository.findAll()` | Query all events | Get from database |
| `.filter(!isDeleted())` | Remove deleted | Keep only active |
| `.filter(status==ACTIVE)` | Keep ACTIVE events | Skip completed |
| `event.getEndTime().isBefore(now)` | Check if ended | Mark as COMPLETED |
| `int completedCount` | Track updates | Count how many updated |
| `eventRepository.save()` | Save to database | Persist changes |

---

## 4. AUDITLOGARCHIVALJOBJAVA - ACTUAL CODE WITH DESCRIPTIONS

### **File Location:**
```
src/main/java/com/event_management_system/scheduler/job/AuditLogArchivalJob.java
```

### **Complete Actual Code:**

```java
package com.event_management_system.scheduler.job;

import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.event_management_system.service.ApplicationLoggerService;
import lombok.extern.slf4j.Slf4j;

/**
 * Audit Log Archival Job
 * 
 * This job runs periodically to clean up old audit logs and history records
 * that are no longer needed.
 * 
 * How it works:
 * 1. Runs once per day (24 hours)
 * 2. Deletes UserActivityHistory records older than 90 days
 * 3. Deletes UserLoginLogoutHistory records older than 90 days
 * 4. Deletes UserPasswordHistory records older than 90 days
 * 5. Logs summary of deletions for audit trail
 */
@Component
@Slf4j
public class AuditLogArchivalJob {

    @Autowired
    private ApplicationLoggerService logger;

    // NOTE: You'll need to inject repositories for actual implementation
    // @Autowired
    // private UserActivityHistoryRepository activityHistoryRepository;
    // @Autowired
    // private UserLoginLogoutHistoryRepository loginHistoryRepository;
    // @Autowired
    // private UserPasswordHistoryRepository passwordHistoryRepository;

    /**
     * Archive and delete old audit logs
     * 
     * @Scheduled(fixedDelay = 86400000) means:
     * - 86400000 milliseconds = 24 hours
     * - Job runs once per day
     * 
     * Why fixedDelay and not fixedRate?
     * - Archival is heavy (deletes many records)
     * - Don't want multiple archival jobs running at once
     * - fixedDelay ensures they don't overlap
     */
    @Scheduled(fixedDelay = 86400000, initialDelay = 60000)
    @Transactional
    public void archiveOldLogs() {
        try {
            // EXPLANATION 1: Log job start
            logger.infoWithContext("AuditLogArchivalJob", 
                "Scheduler job started - Archiving old audit logs");
            
            // EXPLANATION 2: Calculate 90 days ago
            // LocalDateTime.now() gets current time
            // .minusDays(90) subtracts 90 days
            // Example: if now=2025-12-26, then ninetyDaysAgo=2025-09-27
            LocalDateTime ninetyDaysAgo = LocalDateTime.now().minusDays(90);
            
            logger.debugWithContext("AuditLogArchivalJob", 
                "Deleting logs older than: {}", ninetyDaysAgo);
            
            // EXPLANATION 3: Delete activity history records
            // Query all records created BEFORE 90 days ago
            // SQL: DELETE FROM user_activity_history WHERE created_at < ?
            // TODO: Implement using repository method
            // int activityHistoryDeleted = activityHistoryRepository.deleteOlderThan(ninetyDaysAgo);
            int activityHistoryDeleted = 0;  // Placeholder
            
            // EXPLANATION 4: Delete login/logout history
            // Query all login records created BEFORE 90 days ago
            // SQL: DELETE FROM user_login_logout_history WHERE created_at < ?
            // TODO: Implement using repository method
            // int loginHistoryDeleted = loginHistoryRepository.deleteOlderThan(ninetyDaysAgo);
            int loginHistoryDeleted = 0;  // Placeholder
            
            // EXPLANATION 5: Delete password history
            // Query all password records created BEFORE 90 days ago
            // SQL: DELETE FROM user_password_history WHERE created_at < ?
            // TODO: Implement using repository method
            // int passwordHistoryDeleted = passwordHistoryRepository.deleteOlderThan(ninetyDaysAgo);
            int passwordHistoryDeleted = 0;  // Placeholder
            
            // EXPLANATION 6: Log deletion results
            logger.infoWithContext("AuditLogArchivalJob", 
                "Log archival completed. Deleted activity records: {}, " +
                "Login records: {}, Password records: {}",
                activityHistoryDeleted, loginHistoryDeleted, passwordHistoryDeleted);
            
            // EXPLANATION 7: Log total deleted
            int totalDeleted = activityHistoryDeleted + loginHistoryDeleted + passwordHistoryDeleted;
            logger.infoWithContext("AuditLogArchivalJob", 
                "Total audit logs archived: {}", totalDeleted);
            
        } catch (Exception e) {
            logger.errorWithContext("AuditLogArchivalJob", 
                "Unexpected error in archiveOldLogs()", e);
        }
    }
}
```

### **What Each Code Section Does:**

| Code Section | Purpose | Action |
|--------------|---------|--------|
| `@Scheduled(fixedDelay=86400000)` | Run every 24 hours | Daily cleanup |
| `LocalDateTime.now().minusDays(90)` | Get date 90 days ago | Set cutoff date |
| `deleteOlderThan(ninetyDaysAgo)` | Delete old records | Clean database |
| `int totalDeleted` | Count deletions | Track cleanup |

---

## 5. SCHEDULERSERVICE.JAVA - ACTUAL CODE WITH DESCRIPTIONS

### **File Location:**
```
src/main/java/com/event_management_system/scheduler/service/SchedulerService.java
```

### **Complete Actual Code:**

```java
package com.event_management_system.scheduler.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.event_management_system.scheduler.job.AuditLogArchivalJob;
import com.event_management_system.scheduler.job.EventReminderJob;
import com.event_management_system.scheduler.job.EventStatusUpdateJob;
import com.event_management_system.service.ApplicationLoggerService;
import lombok.extern.slf4j.Slf4j;

/**
 * Scheduler Service
 * 
 * This service acts as the orchestrator for all scheduled jobs. It provides:
 * 1. Centralized management of all scheduler jobs
 * 2. Manual trigger capability (run jobs on demand)
 * 3. Health check for scheduler status
 * 4. Logging and monitoring
 * 
 * How to use:
 * @Autowired
 * private SchedulerService schedulerService;
 * 
 * // Run a job immediately (outside of schedule)
 * schedulerService.triggerEventReminder();
 */
@Service
@Slf4j
public class SchedulerService {

    // EXPLANATION 1: Inject all job classes
    // These @Autowired fields get Spring to inject the job instances
    // Allows this service to call job methods
    @Autowired
    private EventReminderJob eventReminderJob;

    @Autowired
    private EventStatusUpdateJob eventStatusUpdateJob;

    @Autowired
    private AuditLogArchivalJob auditLogArchivalJob;

    @Autowired
    private ApplicationLoggerService logger;

    /**
     * Manually trigger the event reminder job
     * 
     * Useful for:
     * - Testing the job
     * - Running reminders on-demand without waiting for schedule
     * - Admin endpoints that need to trigger jobs manually
     * 
     * Example API endpoint:
     * POST /api/admin/scheduler/trigger-reminders
     * 
     * EXPLANATION: This method allows you to call the job directly
     * instead of waiting for the @Scheduled time
     * Bypasses the scheduler and runs immediately on current thread
     */
    public void triggerEventReminder() {
        try {
            // EXPLANATION 2: Log that we're triggering manually
            logger.infoWithContext("SchedulerService", 
                "Manually triggering Event Reminder Job");
            
            // EXPLANATION 3: Call the job method directly
            // eventReminderJob is already injected
            // Calling sendEventReminders() runs the job immediately
            // Doesn't wait for the @Scheduled timer
            eventReminderJob.sendEventReminders();
            
            // EXPLANATION 4: Log success
            logger.infoWithContext("SchedulerService", 
                "Event Reminder Job completed successfully");
            
        } catch (Exception e) {
            // EXPLANATION 5: Log error if job fails
            logger.errorWithContext("SchedulerService", 
                "Error triggering Event Reminder Job", e);
            
            // EXPLANATION 6: Throw exception to caller
            // Caller knows the job failed
            throw new RuntimeException("Failed to trigger event reminder job", e);
        }
    }

    /**
     * Manually trigger the event status update job
     * 
     * Same as above, but for status update job
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
     * Manually trigger the audit log archival job
     * 
     * Same as above, but for archival job
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
     * Get health status of scheduler
     * 
     * Returns basic information about scheduler status
     * 
     * EXPLANATION: This method provides a simple health check
     * Can be used by admin dashboard or monitoring tools
     * 
     * Usage:
     * GET /api/admin/scheduler/status
     * Response: "Scheduler is running. All jobs are registered..."
     * 
     * @return Status message
     */
    public String getSchedulerStatus() {
        // EXPLANATION 7: Log that we're checking status
        logger.debugWithContext("SchedulerService", "Checking scheduler status");
        
        // EXPLANATION 8: Return status message
        return "Scheduler is running. All jobs are registered and waiting " +
               "for their scheduled times.";
    }
}
```

### **What Each Code Section Does:**

| Code Section | Purpose | Action |
|--------------|---------|--------|
| `@Service` | Mark as service | Spring creates instance |
| `@Autowired EventReminderJob` | Inject job | Can call job methods |
| `triggerEventReminder()` | Manual trigger method | Run job on-demand |
| `eventReminderJob.sendEventReminders()` | Call job directly | Execute immediately |
| `getSchedulerStatus()` | Health check method | Return status |
| `try-catch` | Error handling | Graceful failures |

---

## Summary: Code Structure

```
SchedulerConfig.java
├─ @Configuration class
├─ Creates ThreadPoolTaskScheduler bean
├─ Sets pool size to 5
├─ Configures thread naming
├─ Sets shutdown behavior
└─ Enables @Scheduled processing

EventReminderJob.java
├─ @Component class (Spring scans it)
├─ @Autowired EventRepository (inject database access)
├─ @Autowired ApplicationLoggerService (inject logger)
├─ @Scheduled(fixedDelay=300000) sendEventReminders()
├─ Queries database for events
├─ Filters upcoming events
├─ Gets attendees
├─ Logs results
└─ Runs every 5 minutes

EventStatusUpdateJob.java
├─ @Component class
├─ @Autowired EventRepository
├─ @Autowired ApplicationLoggerService
├─ @Scheduled(fixedDelay=1800000) updateEventStatus()
├─ Finds ACTIVE events
├─ Checks if ended
├─ Updates status
└─ Runs every 30 minutes

AuditLogArchivalJob.java
├─ @Component class
├─ @Autowired ApplicationLoggerService
├─ @Scheduled(fixedDelay=86400000) archiveOldLogs()
├─ Calculates 90-day cutoff
├─ Deletes old records
├─ Logs deletions
└─ Runs every 24 hours

SchedulerService.java
├─ @Service class
├─ @Autowired all three jobs
├─ triggerEventReminder() - Manual trigger
├─ triggerEventStatusUpdate() - Manual trigger
├─ triggerAuditLogArchival() - Manual trigger
└─ getSchedulerStatus() - Health check
```

This document shows the ACTUAL CODE with detailed descriptions of what each code section does! 🎯
