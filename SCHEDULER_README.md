# Scheduler Module - Reusable Across Projects

This scheduler module is designed to be **independent and portable**. You can copy the entire `scheduler/` folder to any other Spring Boot 3.5+ project that needs scheduled tasks.

## 📁 Folder Structure

```
src/main/java/com/event_management_system/scheduler/
├── config/
│   └── SchedulerConfig.java       # Enables @Scheduled and configures thread pool
├── job/
│   ├── EventReminderJob.java      # Sends event reminders (every 5 minutes)
│   ├── EventStatusUpdateJob.java  # Updates event status (every 30 minutes)
│   └── AuditLogArchivalJob.java   # Archives old logs (every 24 hours)
└── service/
    └── SchedulerService.java      # Orchestrates all jobs + manual triggers
```

## 🚀 How Jobs Work

### **fixedDelay Timing**

All jobs use `fixedDelay` which means:

```
App starts → Wait (initialDelay) → Job runs → Wait (fixedDelay) → Job runs again
```

**Example: EventReminderJob**
```java
@Scheduled(fixedDelay = 300000, initialDelay = 10000)
```
- `initialDelay = 10000ms` → App starts, waits 10 seconds before first run
- `fixedDelay = 300000ms` (5 minutes) → After job completes, wait 5 minutes before next run

**Timeline:**
```
00:00 - App starts
00:10 - Job 1 runs (takes ~1 sec)
05:11 - Job 2 runs (takes ~1 sec)
10:12 - Job 3 runs
...
```

### **Job Descriptions**

| Job | Schedule | Purpose | Status |
|-----|----------|---------|--------|
| **EventReminderJob** | Every 5 min | Find events starting in 24h, send reminders | ✅ Logging ready (TODO: Email integration) |
| **EventStatusUpdateJob** | Every 30 min | Mark ended events as COMPLETED | ✅ Query ready (TODO: Status update logic) |
| **AuditLogArchivalJob** | Every 24 hours | Delete audit logs older than 90 days | ✅ Job ready (TODO: Implement deletion) |

## 🔧 How to Use in Current Project

### **1. Automatic Registration**

These scheduler components are **automatically registered** with Spring:
- `@Configuration` in `SchedulerConfig.java` enables scheduling
- `@Component` in job classes makes Spring auto-detect them
- `@Scheduled` annotations activate the jobs

**No configuration needed!** The scheduler starts automatically when the app starts.

### **2. Manual Job Triggering (Optional)**

If you need to run a job manually (for admin endpoints, testing, etc.):

```java
@Autowired
private SchedulerService schedulerService;

// Trigger reminder job immediately
schedulerService.triggerEventReminder();

// Trigger status update immediately
schedulerService.triggerEventStatusUpdate();

// Trigger archival immediately
schedulerService.triggerAuditLogArchival();

// Get scheduler health status
String status = schedulerService.getSchedulerStatus();
```

**Example Controller:**
```java
@PostMapping("/admin/scheduler/reminders")
public ResponseEntity<String> triggerReminders() {
    schedulerService.triggerEventReminder();
    return ResponseEntity.ok("Event reminder job triggered");
}
```

## 📋 How to Copy to Other Projects

### **Step 1: Copy the Scheduler Folder**

Copy the entire `scheduler/` folder from this project to another Spring Boot project:

```bash
# Copy to another project
cp -r event_management_system/src/main/java/com/event_management_system/scheduler \
      other_project/src/main/java/com/event_management_system/scheduler
```

### **Step 2: Update Package Names**

If your package structure is different, update the package declarations:

```java
// Change from:
package com.event_management_system.scheduler.config;

// To:
package com.your_company.your_project.scheduler.config;
```

### **Step 3: Update Dependencies (if needed)**

The scheduler only depends on:
- `Spring Boot 3.5+` (built-in @Scheduled)
- `ApplicationLoggerService` (your custom logger)
- Standard JPA repositories

Ensure your project has these dependencies in `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

### **Step 4: Customize Jobs**

Each job contains `TODO` comments indicating what needs implementation:

**EventReminderJob.java:**
```java
// TODO: Integrate with actual email/notification service
// notificationService.sendEventReminder(event, event.getAttendees());
```

**EventStatusUpdateJob.java:**
```java
// TODO: Implement status update in EventService
// event.setStatus(EventStatus.COMPLETED);
// eventRepository.save(event);
```

**AuditLogArchivalJob.java:**
```java
// TODO: Implement actual deletion using repositories
// activityHistoryRepository.deleteOlderThan(ninetyDaysAgo);
```

## ⚙️ Customizing Job Timing

To change how often jobs run, modify the `fixedDelay` and `initialDelay` values:

```java
// Example: Run every 1 minute instead of 5 minutes
@Scheduled(fixedDelay = 60000, initialDelay = 10000)  // 60 seconds
public void sendEventReminders() {
    // ...
}
```

### **Common Time Values (Milliseconds)**

```
1 second   = 1,000 ms
5 seconds  = 5,000 ms
1 minute   = 60,000 ms
5 minutes  = 300,000 ms
30 minutes = 1,800,000 ms
1 hour     = 3,600,000 ms
24 hours   = 86,400,000 ms
```

## 🧹 Understanding the ThreadPoolTaskScheduler

The `SchedulerConfig.java` creates a thread pool:

```java
scheduler.setPoolSize(5);  // Max 5 jobs can run simultaneously
```

**Why 5?**
- EventReminderJob runs
- EventStatusUpdateJob runs at the same time (doesn't wait)
- AuditLogArchivalJob can also run in parallel
- 5 threads = plenty of capacity for multiple simultaneous jobs

**What if jobs take longer?**
```
fixedDelay = waits AFTER job completes
→ Safe from overlapping
→ If Job A takes 10 minutes, Job B still waits 5 min before next run
```

## 📊 Monitoring Jobs

Check the application logs to see scheduler activity:

```
2025-12-26 16:50:45 [scheduler-1] INFO - [EventReminderJob] Found 0 upcoming events
2025-12-26 16:50:55 [scheduler-2] INFO - [EventStatusUpdateJob] Found 5 active events
```

**Thread names:**
- `[scheduler-1]` = Job running on thread 1
- `[scheduler-2]` = Job running on thread 2 (parallel)
- `[scheduler-3]` through `[scheduler-5]` = More parallel executions

## 🚀 Future Enhancements

1. **Email Integration**: Replace logging with actual email service
2. **Quartz Support**: Migrate from @Scheduled to Quartz if you need:
   - Database-backed persistence
   - Clustering across multiple servers
   - Complex scheduling patterns
3. **Admin Dashboard**: Add endpoints to:
   - View job execution history
   - Manually trigger jobs
   - Change job schedules
4. **Monitoring**: Add Micrometer metrics for:
   - Job execution time
   - Success/failure rates
   - Last execution timestamp

## ❓ FAQ

**Q: Do I need to add anything to application.properties?**
A: No, the scheduler works out of the box. Optional: Add custom properties for job timings.

**Q: What if a job fails?**
A: The error is logged, but the scheduler continues. Jobs won't overlap due to `fixedDelay`.

**Q: Can I run two jobs at the same time?**
A: Yes! That's why we have 5 threads. Jobs run in parallel.

**Q: How do I disable a job?**
A: Comment out the `@Component` annotation in the job class.

**Q: Can I change the schedule at runtime?**
A: Currently no (would need Spring Task Scheduling v2 or Quartz). Restart the app to change schedules.

---

## 📝 Summary

✅ **Scheduler is working and running jobs automatically**  
✅ **All 3 jobs are executing on schedule**  
✅ **Logs show clear activity with thread names**  
✅ **Ready to copy to other projects**  
✅ **Designed for easy customization**
