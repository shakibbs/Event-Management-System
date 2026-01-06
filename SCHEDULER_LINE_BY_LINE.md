# SCHEDULER MODULE - COMPLETE LINE-BY-LINE BREAKDOWN

## Table of Contents
1. [SchedulerConfig.java - Every Line Explained](#schedulerconfigjava---every-line-explained)
2. [EventReminderJob.java - Every Line Explained](#eventreminderjobjava---every-line-explained)
3. [EventStatusUpdateJob.java - Every Line Explained](#eventstatusupdatejobjava---every-line-explained)
4. [AuditLogArchivalJob.java - Every Line Explained](#auditlogarchivaljobjava---every-line-explained)
5. [SchedulerService.java - Every Line Explained](#schedulerservicejava---every-line-explained)
6. [Class Connections Diagram](#class-connections-diagram)
7. [Data Flow Through Classes](#data-flow-through-classes)

---

## SCHEDULERCONFIG.JAVA - EVERY LINE EXPLAINED

### **File Location**
```
src/main/java/com/event_management_system/scheduler/config/SchedulerConfig.java
```

### **Complete Code with Line-by-Line Breakdown**

```java
LINE 1:  package com.event_management_system.scheduler.config;
         ↑
         ├─ This tells Java: "This class belongs to this package"
         ├─ Package name: com.event_management_system.scheduler.config
         ├─ Packages organize code into folders
         └─ Folder path: src/main/java/com/event_management_system/scheduler/config/

LINE 2:  (blank line for readability)

LINE 3:  import org.springframework.context.annotation.Bean;
         ↑
         ├─ Imports the @Bean annotation from Spring Framework
         ├─ @Bean is used to mark methods that create Spring beans
         ├─ Without this import, @Bean wouldn't work
         └─ Bean = Object managed by Spring

LINE 4:  import org.springframework.context.annotation.Configuration;
         ↑
         ├─ Imports the @Configuration annotation from Spring Framework
         ├─ @Configuration marks this class as a Spring configuration class
         ├─ Configuration classes run when Spring Boot starts
         └─ Used to define beans and configurations

LINE 5:  import org.springframework.scheduling.annotation.EnableScheduling;
         ↑
         ├─ Imports the @EnableScheduling annotation
         ├─ @EnableScheduling activates @Scheduled annotation processing
         ├─ Without this, no @Scheduled methods will work
         └─ This is CRITICAL for the entire scheduler to function

LINE 6:  import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
         ↑
         ├─ Imports ThreadPoolTaskScheduler from Spring
         ├─ ThreadPoolTaskScheduler = Multi-threaded job executor
         ├─ Manages a pool of threads (we'll use 5)
         └─ Allows multiple jobs to run at the same time

LINE 7:  (blank line)

LINE 8:  /**
LINE 9:   * Scheduler Configuration
         ...
LINE 21:  */
         ↑
         ├─ JavaDoc comments explaining the class purpose
         ├─ These comments appear in IDE hints
         └─ Help developers understand what this class does

LINE 22: @Configuration
         ↑
         ├─ Annotation that marks this class as a Spring Configuration
         ├─ When Spring Boot starts, it loads this class
         ├─ All @Bean methods in this class are registered
         └─ Without this, Spring ignores the class

LINE 23: @EnableScheduling
         ↑
         ├─ Annotation that ACTIVATES all @Scheduled annotations
         ├─ Tells Spring: "Look for @Scheduled methods and run them on schedule"
         ├─ Without this, jobs won't run automatically
         └─ This is the MASTER SWITCH for scheduling

LINE 24: public class SchedulerConfig {
         ↑
         ├─ Class declaration
         ├─ public = Accessible from anywhere
         ├─ class = Java class keyword
         └─ SchedulerConfig = Class name

LINE 25: (blank line)

LINE 26:     /**
             ...
LINE 36:      */
         ↑
         ├─ JavaDoc comment for the method below
         ├─ Explains what the method does
         └─ Shows up in IDE hints when developers hover over method

LINE 37:     @Bean
         ↑
         ├─ Annotation marking this method as a Spring Bean factory
         ├─ When this method is called, Spring creates and manages the returned object
         ├─ Other classes can @Autowired this bean
         ├─ Called once per application lifecycle (singleton)
         └─ Only ONE instance of ThreadPoolTaskScheduler exists in the app

LINE 38:     public ThreadPoolTaskScheduler taskScheduler() {
         ↑
         ├─ Method declaration
         ├─ public = Accessible from anywhere
         ├─ ThreadPoolTaskScheduler = Return type (what this method gives back)
         ├─ taskScheduler() = Method name
         ├─ () = Takes no parameters
         └─ RETURNS: ThreadPoolTaskScheduler object

LINE 39:         ThreadPoolTaskScheduler scheduler = 
LINE 40:             new ThreadPoolTaskScheduler();
         ↑
         ├─ Creates a NEW ThreadPoolTaskScheduler object
         ├─ new = Java keyword to create a new instance
         ├─ ThreadPoolTaskScheduler() = Constructor (initializes the object)
         ├─ scheduler = Variable name (stores the object)
         ├─ = (assignment operator) assigns the object to the variable
         └─ NOW: scheduler variable holds an empty ThreadPoolTaskScheduler

LINE 41:         (blank line)

LINE 42:         // Maximum number of threads...
LINE 43:         scheduler.setPoolSize(5);
         ↑
         ├─ Calls the setPoolSize() method on scheduler object
         ├─ Parameter: 5 = Maximum threads
         ├─ This tells the scheduler: "Create a pool with max 5 threads"
         ├─ With 5 threads:
         │  ├─ Job 1 can run on Thread 1
         │  ├─ Job 2 can run on Thread 2 (same time as Job 1)
         │  ├─ Job 3 can run on Thread 3 (same time)
         │  └─ etc... up to 5 jobs simultaneously
         ├─ Without this, jobs run one after another (slow)
         └─ scheduler.poolSize is now 5

LINE 44:         (blank line)

LINE 45:         // Prefix for thread names...
LINE 46:         scheduler.setThreadNamePrefix("scheduler-");
         ↑
         ├─ Calls the setThreadNamePrefix() method
         ├─ Parameter: "scheduler-" = String prefix
         ├─ Thread names will be: scheduler-1, scheduler-2, scheduler-3, etc.
         ├─ When you see logs like [scheduler-1], [scheduler-2]:
         │  └─ This shows which thread is running the job
         ├─ Helps you debug by seeing which job ran on which thread
         └─ scheduler.threadNamePrefix is now "scheduler-"

LINE 47:         (blank line)

LINE 48:         // How long to wait before force-stopping...
LINE 49:         scheduler.setAwaitTerminationSeconds(60);
         ↑
         ├─ Calls the setAwaitTerminationSeconds() method
         ├─ Parameter: 60 = Seconds to wait
         ├─ When app shuts down, wait max 60 seconds for jobs to finish
         ├─ Example:
         │  ├─ Job is still running at shutdown time
         │  ├─ Scheduler waits up to 60 seconds
         │  ├─ If job finishes in 30 seconds: graceful shutdown ✅
         │  └─ If job takes 90 seconds: force-stop after 60 seconds ⚠️
         └─ scheduler.awaitTerminationSeconds is now 60

LINE 50:         (blank line)

LINE 51:         // Don't interrupt running jobs...
LINE 52:         scheduler.setWaitForTasksToCompleteOnShutdown(true);
         ↑
         ├─ Calls the setWaitForTasksToCompleteOnShutdown() method
         ├─ Parameter: true = Boolean value (yes/no)
         ├─ Tells scheduler: "Don't kill jobs when app stops, let them finish"
         ├─ true = Wait for jobs to complete
         ├─ false = Kill jobs immediately
         ├─ Graceful shutdown:
         │  ├─ App stops
         │  ├─ Running jobs continue to completion
         │  ├─ Once all jobs done, scheduler stops
         │  └─ Clean shutdown, no data loss
         └─ scheduler.waitForTasksOnShutdown is now true

LINE 53:         (blank line)

LINE 54:         // Initialize the scheduler
LINE 55:         scheduler.initialize();
         ↑
         ├─ Calls the initialize() method
         ├─ This method activates the ThreadPoolTaskScheduler
         ├─ Without this, the scheduler is created but not ready
         ├─ After initialize():
         │  ├─ Thread pool is created
         │  ├─ Threads are started
         │  └─ Scheduler is ready to execute jobs
         └─ CRITICAL: Must be called before returning the scheduler

LINE 56:         (blank line)

LINE 57:         return scheduler;
         ↑
         ├─ Returns the configured ThreadPoolTaskScheduler object
         ├─ This bean is now available for:
         │  ├─ @Autowired in other classes
         │  ├─ Processing @Scheduled annotations
         │  └─ Running scheduled jobs
         ├─ Spring registers this bean in the ApplicationContext
         └─ Same instance used throughout the entire application

LINE 58:     }
         ↑
         ├─ End of taskScheduler() method
         └─ Method is complete

LINE 59: }
         ↑
         ├─ End of SchedulerConfig class
         └─ Configuration is complete
```

### **What This Class Does - Summary**

```
SchedulerConfig is like a SETUP SCRIPT that:

1. Tells Spring: "This is a configuration" (@Configuration)
2. Tells Spring: "Activate scheduling features" (@EnableScheduling)
3. Creates a ThreadPoolTaskScheduler bean (@Bean)
4. Sets the pool size to 5 threads (setPoolSize)
5. Names threads "scheduler-1", "scheduler-2", etc (setThreadNamePrefix)
6. Sets shutdown timeout to 60 seconds (setAwaitTerminationSeconds)
7. Makes sure jobs finish before shutdown (setWaitForTasksToCompleteOnShutdown)
8. Initializes everything (initialize)
9. Returns the configured scheduler to Spring

Result: Spring can now run @Scheduled methods!
```

---

## EVENTREMINDERJOBJAVA - EVERY LINE EXPLAINED

### **File Location**
```
src/main/java/com/event_management_system/scheduler/job/EventReminderJob.java
```

### **Complete Code with Line-by-Line Breakdown**

```java
LINE 1:  package com.event_management_system.scheduler.job;
         ↑
         └─ Package name: com.event_management_system.scheduler.job

LINE 2:  (blank)

LINE 3:  import java.time.LocalDateTime;
         ↑
         ├─ Imports LocalDateTime from Java
         ├─ LocalDateTime = Date and time combined (e.g., 2025-12-26 16:50:45)
         ├─ Used to:
         │  ├─ Get current date/time (LocalDateTime.now())
         │  ├─ Calculate future dates (now.plusHours(24))
         │  └─ Compare times (event.getStartTime().isAfter(now))
         └─ Essential for scheduling jobs

LINE 4:  import java.util.List;
         ↑
         ├─ Imports List interface from Java
         ├─ List = Ordered collection of items
         ├─ Used for: List<Event> upcomingEvents
         └─ Stores multiple events from database query

LINE 5:  (blank)

LINE 6:  import org.springframework.beans.factory.annotation.Autowired;
         ↑
         ├─ Imports @Autowired annotation
         ├─ @Autowired = Spring injects a bean automatically
         ├─ Example:
         │  ├─ You declare: @Autowired EventRepository repo
         │  └─ Spring: "Creates EventRepository and gives it to you"
         └─ Used to get access to EventRepository and ApplicationLoggerService

LINE 7:  import org.springframework.scheduling.annotation.Scheduled;
         ↑
         ├─ Imports @Scheduled annotation
         ├─ @Scheduled = Mark method to run on a schedule
         ├─ Example:
         │  ├─ @Scheduled(fixedDelay = 300000)
         │  └─ Method runs every 5 minutes automatically
         └─ Most important for this job class

LINE 8:  import org.springframework.stereotype.Component;
         ↑
         ├─ Imports @Component annotation
         ├─ @Component = Mark class as a Spring component
         ├─ Spring automatically:
         │  ├─ Creates an instance of this class
         │  ├─ Scans for @Scheduled methods
         │  └─ Registers them to run on schedule
         └─ Without this, Spring ignores the class

LINE 9:  import org.springframework.transaction.annotation.Transactional;
         ↑
         ├─ Imports @Transactional annotation
         ├─ @Transactional = Database transactions
         ├─ @Transactional(readOnly = true):
         │  ├─ Opens a database session
         │  ├─ Allows SELECT queries
         │  ├─ Prevents INSERT/UPDATE/DELETE
         │  └─ Closes the session when method ends
         └─ Ensures safe database access

LINE 10: (blank)

LINE 11: import com.event_management_system.entity.Event;
         ↑
         ├─ Imports Event entity class
         ├─ Event = Database entity representing an event
         ├─ Has properties:
         │  ├─ id, title, description
         │  ├─ startTime, endTime
         │  ├─ attendees (list of users)
         │  └─ status (ACTIVE, INACTIVE, OFF)
         └─ Used as List<Event>

LINE 12: import com.event_management_system.repository.EventRepository;
         ↑
         ├─ Imports EventRepository interface
         ├─ EventRepository = Database access for events
         ├─ Methods available:
         │  ├─ findAll() - Get all events
         │  ├─ findById(id) - Get event by ID
         │  ├─ save(event) - Save to database
         │  └─ delete(event) - Delete from database
         └─ Used to query events: eventRepository.findAll()

LINE 13: import com.event_management_system.service.ApplicationLoggerService;
         ↑
         ├─ Imports ApplicationLoggerService class
         ├─ ApplicationLoggerService = Custom logging service
         ├─ Methods available:
         │  ├─ traceWithContext()
         │  ├─ debugWithContext()
         │  ├─ infoWithContext()
         │  ├─ warnWithContext()
         │  └─ errorWithContext()
         └─ Used to log job activity

LINE 14: (blank)

LINE 15: import lombok.extern.slf4j.Slf4j;
         ↑
         ├─ Imports Slf4j annotation from Lombok
         ├─ Lombok = Code generation library
         ├─ @Slf4j annotation auto-generates a logger field
         ├─ Creates: private static final Logger log = ...
         └─ Not used in this class, but available if needed

LINE 16: (blank)

LINE 17: /**
         ...
LINE 28:  */
         ↑
         └─ JavaDoc comment explaining the class

LINE 29: @Component
         ↑
         ├─ Marks this class as a Spring component
         ├─ Spring action:
         │  ├─ Scans for @Component during startup
         │  ├─ Creates instance: new EventReminderJob()
         │  ├─ Registers it in the Spring context
         │  ├─ Looks for @Scheduled methods
         │  └─ Registers them to run automatically
         └─ WITHOUT @Component: Spring ignores this class completely

LINE 30: @Slf4j
         ↑
         ├─ Lombok annotation (optional, not used here)
         ├─ Would auto-generate: private static final Logger log = ...
         └─ Allows: log.info(), log.error(), etc

LINE 31: public class EventReminderJob {
         ↑
         └─ Class declaration

LINE 32: (blank)

LINE 33:     // DEPENDENCY INJECTION
LINE 34:     @Autowired
         ↑
         ├─ Tells Spring: "Inject EventRepository here"
         ├─ Spring action:
         │  ├─ Finds EventRepository bean
         │  ├─ Creates or finds existing instance
         │  └─ Assigns it to eventRepository field
         ├─ Without @Autowired:
         │  ├─ eventRepository would be null
         │  └─ NullPointerException when accessing it
         └─ This is called DEPENDENCY INJECTION

LINE 35:     private EventRepository eventRepository;
         ↑
         ├─ Declares a field variable
         ├─ private = Only accessible inside this class
         ├─ EventRepository = Type (interface from JPA)
         ├─ eventRepository = Field name
         ├─ After @Autowired, Spring sets this value
         └─ Now you can use: eventRepository.findAll()

LINE 36: (blank)

LINE 37:     @Autowired
         ↑
         └─ Tells Spring: "Inject ApplicationLoggerService here"

LINE 38:     private ApplicationLoggerService logger;
         ↑
         ├─ Declares a field variable
         ├─ ApplicationLoggerService = Custom logging class
         ├─ logger = Field name
         └─ Now you can use: logger.infoWithContext(...)

LINE 39: (blank)

LINE 40:     /**
             ...
LINE 59:      */
         ↑
         └─ JavaDoc comment explaining the method

LINE 60:     @Scheduled(fixedDelay = 300000, initialDelay = 10000)
         ↑
         ├─ Tells Spring: "Run this method on a schedule"
         ├─ fixedDelay = 300000 milliseconds = 5 minutes
         │  ├─ Meaning: After method finishes, wait 5 minutes before running again
         │  ├─ Timeline:
         │  │  ├─ Job starts: 00:00:00
         │  │  ├─ Job ends: 00:00:02 (took 2 seconds)
         │  │  ├─ Wait: 5 minutes
         │  │  └─ Job starts: 00:05:02
         │  └─ Safe from overlapping (job can't run twice at once)
         ├─ initialDelay = 10000 milliseconds = 10 seconds
         │  ├─ Meaning: Wait 10 seconds after app starts before first run
         │  ├─ Timeline:
         │  │  ├─ App starts: 00:00:00
         │  │  ├─ Wait: 10 seconds
         │  │  └─ Job starts: 00:00:10
         │  └─ Allows app to fully initialize before jobs start
         └─ Spring's TaskScheduler (from SchedulerConfig) executes this

LINE 61:     @Transactional(readOnly = true)
         ↑
         ├─ Marks method as transactional
         ├─ readOnly = true:
         │  ├─ Spring opens a database session
         │  ├─ Allows SELECT queries
         │  ├─ Prevents INSERT/UPDATE/DELETE
         │  └─ Spring closes the session when method ends
         ├─ Benefits:
         │  ├─ Safe database access
         │  ├─ Consistent data (no changes mid-method)
         │  └─ Auto cleanup (session closes automatically)
         └─ Essential for database operations

LINE 62:     public void sendEventReminders() {
         ↑
         ├─ Method declaration
         ├─ public = Accessible from anywhere (especially SchedulerService)
         ├─ void = Returns nothing
         ├─ sendEventReminders() = Method name
         ├─ () = Takes no parameters
         └─ Executed automatically by Spring scheduler every 5 minutes

LINE 63:         try {
         ↑
         ├─ Starts a try-catch block
         ├─ try = "Try to execute this code"
         ├─ If exception occurs:
         │  ├─ Jump to catch block
         │  ├─ Handle the error
         │  └─ Don't crash the app
         └─ Ensures scheduler continues even if job fails

LINE 64:             // Log start of job execution
LINE 65:             logger.infoWithContext("EventReminderJob",
LINE 66:                 "Scheduler job started - Checking for upcoming events");
         ↑
         ├─ Calls logger.infoWithContext() method
         ├─ Parameters:
         │  ├─ "EventReminderJob" = Component/class name
         │  └─ "Scheduler job started..." = Message to log
         ├─ Output in app logs:
         │  └─ [EventReminderJob] INFO - Scheduler job started - Checking for upcoming events
         ├─ Purpose: Track when job starts
         └─ Visible in application logs for debugging

LINE 67:             (blank)

LINE 68:             // Calculate the time range...
LINE 69:             LocalDateTime now = LocalDateTime.now();
         ↑
         ├─ Calls LocalDateTime.now() static method
         ├─ Returns: Current date and time
         ├─ Example: 2025-12-26T16:50:45.557436200
         ├─ Stored in: now variable
         ├─ Used to: Compare with event times
         └─ Essential for finding "upcoming" events

LINE 70:             LocalDateTime next24Hours = now.plusHours(24);
         ↑
         ├─ Calls plusHours(24) method on now
         ├─ Returns: Date/time 24 hours from now
         ├─ Example:
         │  ├─ now = 2025-12-26T16:50:45
         │  └─ next24Hours = 2025-12-27T16:50:45
         ├─ Stored in: next24Hours variable
         └─ Used to: Define the time range for upcoming events

LINE 71:             (blank)

LINE 72:             logger.debugWithContext("EventReminderJob",
LINE 73:                 "Searching for events between {} and {}", now, next24Hours);
         ↑
         ├─ Calls logger.debugWithContext() method
         ├─ Parameters:
         │  ├─ "EventReminderJob" = Component name
         │  ├─ "Searching for events..." = Message with {} placeholders
         │  ├─ now = Replaces first {}
         │  └─ next24Hours = Replaces second {}
         ├─ Output example:
         │  └─ [EventReminderJob] DEBUG - Searching for events between 2025-12-26T16:50:45 and 2025-12-27T16:50:45
         └─ Purpose: Show the date range being searched

LINE 74:             (blank)

LINE 75:             // Find all ACTIVE events...
LINE 76:             List<Event> upcomingEvents = eventRepository.findAll()
         ↑
         ├─ Calls eventRepository.findAll() method
         ├─ This method:
         │  ├─ Queries database table: app_events
         │  ├─ Runs SQL: SELECT * FROM app_events
         │  ├─ Returns: ALL events (deleted and active)
         │  └─ Type: List<Event>
         ├─ Assigned to: upcomingEvents variable
         ├─ Note: Returns ALL events, then we filter them below
         └─ Step 1 of filtering process

LINE 77:                     .stream()
         ↑
         ├─ Converts the List<Event> to a Stream
         ├─ Stream = Java feature for processing collections
         ├─ Allows: chaining operations like filter(), map(), etc.
         ├─ Example:
         │  ├─ List: [Event1, Event2, Event3, Event4, Event5]
         │  └─ Stream: 1 → 2 → 3 → 4 → 5 (pipeline)
         └─ Step 2: Prepare for filtering

LINE 78:                     .filter(event -> !event.isDeleted())
         ↑
         ├─ Filters the stream
         ├─ Condition: !event.isDeleted()
         │  ├─ event.isDeleted() = Is this event soft-deleted?
         │  ├─ ! = NOT operator (inverts the boolean)
         │  └─ !event.isDeleted() = "Not deleted" (keep only active events)
         ├─ Example:
         │  ├─ Event1: deleted=false → KEEP ✅
         │  ├─ Event2: deleted=true → REMOVE ❌
         │  ├─ Event3: deleted=false → KEEP ✅
         │  └─ Event4: deleted=true → REMOVE ❌
         ├─ After filter: [Event1, Event3]
         └─ Step 3: Remove soft-deleted events

LINE 79:                     .filter(event -> event.getStatus().toString().equals("ACTIVE"))
         ↑
         ├─ Filters the stream again
         ├─ Condition: status equals "ACTIVE"
         ├─ event.getStatus() = Get status (enum: ACTIVE, INACTIVE, OFF)
         ├─ .toString() = Convert enum to string
         ├─ .equals("ACTIVE") = Compare with "ACTIVE"
         ├─ Example:
         │  ├─ Event1: status=ACTIVE → KEEP ✅
         │  ├─ Event3: status=INACTIVE → REMOVE ❌
         │  └─ Event5: status=OFF → REMOVE ❌
         ├─ After filter: [Event1]
         └─ Step 4: Keep only ACTIVE events

LINE 80:                     .filter(event -> event.getStartTime().isAfter(now))
         ↑
         ├─ Filters the stream again
         ├─ Condition: Start time is AFTER current time
         ├─ event.getStartTime() = Get event start date/time
         ├─ .isAfter(now) = Is it after current time?
         ├─ Example:
         │  ├─ Event1: startTime=2025-12-26T17:00:00 (future)
         │  │  └─ now=2025-12-26T16:50:45 (current)
         │  │  └─ isAfter(now) = true → KEEP ✅
         │  │
         │  └─ Event2: startTime=2025-12-26T16:00:00 (past)
         │     └─ now=2025-12-26T16:50:45 (current)
         │     └─ isAfter(now) = false → REMOVE ❌
         ├─ Purpose: Remove events that already started
         └─ Step 5: Keep only future events

LINE 81:                     .filter(event -> event.getStartTime().isBefore(next24Hours))
         ↑
         ├─ Filters the stream again
         ├─ Condition: Start time is BEFORE (now + 24 hours)
         ├─ event.getStartTime() = Get event start date/time
         ├─ .isBefore(next24Hours) = Is it before 24 hours from now?
         ├─ Example:
         │  ├─ Event1: startTime=2025-12-26T17:00:00
         │  │  └─ next24Hours=2025-12-27T16:50:45
         │  │  └─ isBefore(next24Hours) = true → KEEP ✅
         │  │
         │  └─ Event2: startTime=2025-12-28T12:00:00 (too far)
         │     └─ next24Hours=2025-12-27T16:50:45
         │     └─ isBefore(next24Hours) = false → REMOVE ❌
         ├─ Purpose: Keep only events within next 24 hours
         └─ Step 6: Filter by 24-hour window

LINE 82:                     .toList();
         ↑
         ├─ Converts the filtered stream back to a List
         ├─ Collects all filtered events into a List<Event>
         ├─ Example:
         │  ├─ After all filters: [Event1, Event3, Event7]
         │  └─ .toList() = List containing these 3 events
         ├─ Assigned to: upcomingEvents
         └─ Step 7: Final result is a filtered list

LINE 83:             (blank)

LINE 84:             logger.infoWithContext("EventReminderJob",
LINE 85:                 "Found {} upcoming events to remind attendees", upcomingEvents.size());
         ↑
         ├─ Calls logger.infoWithContext() method
         ├─ Parameters:
         │  ├─ "EventReminderJob" = Component name
         │  ├─ "Found {} upcoming events..." = Message with {} placeholder
         │  └─ upcomingEvents.size() = Number of events found
         ├─ Output example:
         │  └─ [EventReminderJob] INFO - Found 3 upcoming events to remind attendees
         └─ Purpose: Report how many events need reminders

LINE 86:             (blank)

LINE 87:             // For each upcoming event...
LINE 88:             for (Event event : upcomingEvents) {
         ↑
         ├─ Starts a for-each loop
         ├─ Loop through each event in upcomingEvents list
         ├─ event = Current event being processed
         ├─ Iteration example:
         │  ├─ Iteration 1: event = Event1
         │  ├─ Iteration 2: event = Event3
         │  ├─ Iteration 3: event = Event7
         │  └─ Loop ends
         └─ Process each event one by one

LINE 89:                 try {
         ↑
         ├─ Inner try-catch block
         ├─ If error processing one event, catch it
         ├─ Continue to next event (don't stop entire job)
         └─ Ensures all events are processed even if some fail

LINE 90:                     logger.debugWithContext("EventReminderJob",
LINE 91:                         "Processing event: {} (ID: {}), Starting at: {}",
LINE 92:                         event.getTitle(), event.getId(), event.getStartTime());
         ↑
         ├─ Logs which event is being processed
         ├─ Parameters:
         │  ├─ event.getTitle() = Event title (e.g., "Team Meeting")
         │  ├─ event.getId() = Event ID (e.g., 1)
         │  └─ event.getStartTime() = Start time (e.g., 2025-12-26T17:00:00)
         ├─ Output example:
         │  └─ [EventReminderJob] DEBUG - Processing event: Team Meeting (ID: 1), Starting at: 2025-12-26T17:00:00
         └─ Purpose: Track which event is being processed

LINE 93:                     (blank)

LINE 94:                     // Get attendees for this event
LINE 95:                     int attendeeCount = event.getAttendees() != null
LINE 96:                         ? event.getAttendees().size()
LINE 97:                         : 0;
         ↑
         ├─ Ternary operator (conditional expression)
         ├─ Syntax: condition ? trueValue : falseValue
         ├─ Condition: event.getAttendees() != null
         │  ├─ Is the attendees list NOT null?
         ├─ If true: event.getAttendees().size()
         │  ├─ Get the count of attendees
         ├─ If false: 0
         │  ├─ No attendees (null list)
         ├─ Example:
         │  ├─ Event1 attendees: [User1, User2, User3] → count = 3
         │  └─ Event2 attendees: null → count = 0
         ├─ Assigned to: attendeeCount
         └─ Purpose: Safely get attendee count without error

LINE 98:                     (blank)

LINE 99:                     // TODO: In future...
LINE 100:                    logger.infoWithContext("EventReminderJob",
LINE 101:                        "Would send reminders to {} attendees for event: {}",
LINE 102:                        attendeeCount, event.getTitle());
         ↑
         ├─ Logs that we would send reminders
         ├─ Parameters:
         │  ├─ attendeeCount = Number of attendees
         │  └─ event.getTitle() = Event title
         ├─ Output example:
         │  └─ [EventReminderJob] INFO - Would send reminders to 3 attendees for event: Team Meeting
         ├─ Purpose: Log what action would be taken
         └─ TODO comment: Future improvement (send actual emails)

LINE 103:                    (blank)

LINE 104:                    // TODO: In future...
         ├─ TODO comment indicating future enhancement
         └─ Integration point for email/notification service

LINE 105:                    (blank)

LINE 106:                    logger.debugWithContext("EventReminderJob",
LINE 107:                        "Successfully processed reminders for event: {}",
LINE 108:                        event.getId());
         ↑
         ├─ Logs successful processing of this event
         ├─ Output example:
         │  └─ [EventReminderJob] DEBUG - Successfully processed reminders for event: 1
         └─ Purpose: Confirm event was processed

LINE 109:                    (blank)

LINE 110:                } catch (Exception e) {
         ↑
         ├─ Catches any exception that occurred in try block
         ├─ e = The exception object
         └─ Handles error for current event

LINE 111:                    logger.errorWithContext("EventReminderJob",
LINE 112:                        "Error processing reminders for event: " + event.getId(), e);
         ↑
         ├─ Logs the error
         ├─ Parameters:
         │  ├─ Component name
         │  ├─ Error message with event ID
         │  └─ e = Exception object (contains stack trace)
         ├─ Output example:
         │  └─ [EventReminderJob] ERROR - Error processing reminders for event: 1
         └─ Purpose: Record error for debugging

LINE 113:                }
         ↑
         └─ End of inner try-catch

LINE 114:            }
         ↑
         └─ End of for-each loop

LINE 115:            (blank)

LINE 116:            logger.infoWithContext("EventReminderJob",
LINE 117:                "Event reminder job completed successfully. Processed {} events", upcomingEvents.size());
         ↑
         ├─ Logs job completion
         ├─ Shows total events processed
         ├─ Output example:
         │  └─ [EventReminderJob] INFO - Event reminder job completed successfully. Processed 3 events
         └─ Purpose: Confirm job finished successfully

LINE 118:            (blank)

LINE 119:        } catch (Exception e) {
         ↑
         ├─ Catches outer exception (job-level error)
         └─ If anything unexpected happens in the entire job

LINE 120:            logger.errorWithContext("EventReminderJob",
LINE 121:                "Unexpected error in sendEventReminders()", e);
         ↑
         ├─ Logs unexpected error
         ├─ Output example:
         │  └─ [EventReminderJob] ERROR - Unexpected error in sendEventReminders()
         └─ Purpose: Record unexpected failures

LINE 122:            // Don't throw - let the scheduler continue
         ├─ Comment explaining why we don't throw the exception
         └─ Scheduler should keep running even if job fails

LINE 123:        }
         ↑
         └─ End of outer try-catch

LINE 124:    }
         ↑
         └─ End of sendEventReminders() method

LINE 125: }
         ↑
         └─ End of EventReminderJob class
```

---

## CLASS CONNECTIONS DIAGRAM

### **How All Classes Connect**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Spring Boot Application                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  APP STARTUP:                                                        │
│  1. Spring detects @Configuration on SchedulerConfig                │
│  2. SchedulerConfig loads, creates ThreadPoolTaskScheduler          │
│  3. @EnableScheduling activates @Scheduled processing               │
│  4. Spring scans for @Component classes                              │
│  5. Finds EventReminderJob, EventStatusUpdateJob, AuditLogArchivalJob
│  6. Creates instances (dependency injection)                        │
│  7. Registers @Scheduled methods                                     │
│  8. Jobs scheduled to run at specified times                         │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ SchedulerConfig                                              │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ @Configuration                                              │   │
│  │ @EnableScheduling ← ACTIVATES SCHEDULING                   │   │
│  │                                                              │   │
│  │ @Bean                                                        │   │
│  │ ThreadPoolTaskScheduler taskScheduler()                     │   │
│  │   ├─ poolSize = 5 (5 parallel threads)                      │   │
│  │   ├─ threadNamePrefix = "scheduler-"                        │   │
│  │   ├─ awaitTermination = 60 seconds                          │   │
│  │   └─ initialize()                                           │   │
│  │                                                              │   │
│  └────────────────────────┬────────────────────────────────────┘   │
│                           │ Creates                                 │
│                           ↓                                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ThreadPoolTaskScheduler (from Spring)                       │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ - Maintains pool of 5 threads                                │  │
│  │ - Names them: scheduler-1, scheduler-2, ..., scheduler-5    │  │
│  │ - Receives @Scheduled methods                               │  │
│  │ - Executes them on schedule using threads                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│           │                    │                    │               │
│      executes on          executes on           executes on         │
│      thread-1             thread-2               thread-3           │
│           │                    │                    │               │
│           ↓                    ↓                    ↓               │
│  ┌────────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│  │ EventReminderJob   │ │EventStatusUpdate │ │AuditLogArchival  │ │
│  ├────────────────────┤ │    Job           │ │      Job         │ │
│  │ @Component         │ ├──────────────────┤ ├──────────────────┤ │
│  │                    │ │ @Component       │ │ @Component       │ │
│  │ @Scheduled         │ │                  │ │                  │ │
│  │ (fixedDelay=300000 │ │ @Scheduled       │ │ @Scheduled       │ │
│  │  initialDelay=10s) │ │ (fixedDelay=180  │ │ (fixedDelay=864  │ │
│  │                    │ │  initialDelay=20s│ │  initialDelay=60s│ │
│  │ @Autowired         │ │                  │ │                  │ │
│  │ EventRepository    │ │ @Autowired       │ │ @Autowired       │ │
│  │                    │ │ EventRepository  │ │ (none)           │ │
│  │ @Autowired         │ │                  │ │                  │ │
│  │ ApplicationLogger   │ │ @Autowired       │ │ @Autowired       │ │
│  │ Service            │ │ ApplicationLogger │ │ ApplicationLogger │ │
│  │                    │ │ Service          │ │ Service          │ │
│  │ sendEventReminders │ │                  │ │                  │ │
│  │ (runs every 5 min) │ │ updateEventStatus│ │ archiveOldLogs   │ │
│  │                    │ │ (runs every 30m) │ │ (runs daily)     │ │
│  └────────────────────┘ └──────────────────┘ └──────────────────┘ │
│           │                    │                    │               │
│      queries via          queries via          (future)             │
│           │                    │                    │               │
│           ├────────────────────┴────────────────────┤               │
│           │                                        │                │
│           ↓                                        ↓                │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ EventRepository (Spring Data JPA)                          │   │
│  ├────────────────────────────────────────────────────────────┤   │
│  │ - Provides database access for Event entity               │   │
│  │ - Methods:                                                 │   │
│  │   ├─ findAll() → SELECT * FROM app_events                │   │
│  │   ├─ findById(id) → SELECT * FROM app_events WHERE id=?  │   │
│  │   ├─ save(event) → INSERT/UPDATE app_events              │   │
│  │   └─ delete(event) → DELETE FROM app_events              │   │
│  └────────────────────────────────────────────────────────────┘   │
│           │                                                        │
│      accesses                                                       │
│           │                                                        │
│           ↓                                                        │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ MySQL Database (app_events table)                          │   │
│  ├────────────────────────────────────────────────────────────┤   │
│  │ CREATE TABLE app_events (                                 │   │
│  │   id BIGINT,                                              │   │
│  │   title VARCHAR,                                          │   │
│  │   start_time DATETIME,                                    │   │
│  │   end_time DATETIME,                                      │   │
│  │   status ENUM('ACTIVE','INACTIVE','OFF'),                 │   │
│  │   deleted BOOLEAN,                                        │   │
│  │   ... other fields                                        │   │
│  │ );                                                        │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  All job classes also use:                                          │
│           │                                                        │
│           ↓                                                        │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ ApplicationLoggerService (Custom Service)                 │   │
│  ├────────────────────────────────────────────────────────────┤   │
│  │ - infoWithContext(component, message, args)              │   │
│  │ - debugWithContext(component, message, args)             │   │
│  │ - errorWithContext(component, message, exception)        │   │
│  │ - warnWithContext(...)                                   │   │
│  │ - traceWithContext(...)                                  │   │
│  │                                                            │   │
│  │ Logs to:                                                  │   │
│  │ - application.log                                         │   │
│  │ - service.log                                             │   │
│  │ - error.log                                               │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## DATA FLOW THROUGH CLASSES

### **Complete Data Flow Example: EventReminderJob Execution**

```
STEP 1: TIME CHECK
────────────────
App startup at 00:00:00
SchedulerConfig created
ThreadPoolTaskScheduler created with 5 threads
EventReminderJob class scanned
@Scheduled annotation found: fixedDelay=300000, initialDelay=10000
Scheduled to run at 00:00:10

STEP 2: WAIT FOR SCHEDULE
─────────────────────────
Time passes...
00:00:01 - Waiting...
00:00:05 - Waiting...
00:00:10 - TIME TO RUN!

STEP 3: JOB EXECUTION STARTS
─────────────────────────────
ThreadPoolTaskScheduler picks up EventReminderJob
Assigns to Thread 1 (scheduler-1)
Calls: sendEventReminders() method

STEP 4: DEPENDENCY INJECTION
──────────────────────────────
Method starts executing
@Autowired fields are already injected:
├─ eventRepository → Ready to query database
└─ logger → Ready to log

STEP 5: DATABASE QUERY
──────────────────────
Line: List<Event> upcomingEvents = eventRepository.findAll()
SQL Query:
  SELECT * FROM app_events
  
Database returns ALL events from app_events table:
  ├─ Event1: id=1, title="Meeting", startTime=2025-12-26T17:00:00, status=ACTIVE, deleted=false
  ├─ Event2: id=2, title="Conference", startTime=2025-12-26T15:00:00, status=ACTIVE, deleted=false
  ├─ Event3: id=3, title="Workshop", startTime=2025-12-27T10:00:00, status=INACTIVE, deleted=false
  ├─ Event4: id=4, title="Seminar", startTime=2025-12-25T14:00:00, status=ACTIVE, deleted=true
  └─ Event5: id=5, title="Training", startTime=2025-12-29T18:00:00, status=ACTIVE, deleted=false

STEP 6: FILTERING PIPELINE
────────────────────────────
.stream() 
  → Stream: [Event1, Event2, Event3, Event4, Event5]

.filter(event -> !event.isDeleted())
  → Event1 (deleted=false) ✅
  → Event2 (deleted=false) ✅
  → Event3 (deleted=false) ✅
  → Event4 (deleted=true) ❌ REMOVED
  → Event5 (deleted=false) ✅
  → Stream: [Event1, Event2, Event3, Event5]

.filter(event -> event.getStatus().toString().equals("ACTIVE"))
  → Event1 (status=ACTIVE) ✅
  → Event2 (status=ACTIVE) ✅
  → Event3 (status=INACTIVE) ❌ REMOVED
  → Event5 (status=ACTIVE) ✅
  → Stream: [Event1, Event2, Event5]

.filter(event -> event.getStartTime().isAfter(now))
  Current time (now): 2025-12-26T16:50:45
  → Event1 (startTime=2025-12-26T17:00:00) isAfter? YES ✅
  → Event2 (startTime=2025-12-26T15:00:00) isAfter? NO ❌ REMOVED
  → Event5 (startTime=2025-12-29T18:00:00) isAfter? YES ✅
  → Stream: [Event1, Event5]

.filter(event -> event.getStartTime().isBefore(next24Hours))
  Current time + 24 hours (next24Hours): 2025-12-27T16:50:45
  → Event1 (startTime=2025-12-26T17:00:00) isBefore? YES ✅
  → Event5 (startTime=2025-12-29T18:00:00) isBefore? NO ❌ REMOVED
  → Stream: [Event1]

.toList()
  → List: [Event1]

upcomingEvents = [Event1]

STEP 7: LOG RESULTS
────────────────────
logger.infoWithContext("EventReminderJob", "Found 1 upcoming events to remind attendees")
  → Log file: [EventReminderJob] INFO - Found 1 upcoming events to remind attendees

STEP 8: PROCESS EACH EVENT
────────────────────────────
for (Event event : upcomingEvents) {
  Current iteration: event = Event1
  
  event.getTitle() = "Meeting"
  event.getId() = 1
  event.getStartTime() = 2025-12-26T17:00:00
  
  Log: [EventReminderJob] DEBUG - Processing event: Meeting (ID: 1), Starting at: 2025-12-26T17:00:00
  
  Get attendees:
  event.getAttendees() = Set containing User1, User2, User3 (3 attendees)
  attendeeCount = 3
  
  Log: [EventReminderJob] INFO - Would send reminders to 3 attendees for event: Meeting
  
  Log: [EventReminderJob] DEBUG - Successfully processed reminders for event: 1
}

STEP 9: JOB COMPLETION
───────────────────────
logger.infoWithContext("EventReminderJob", "Event reminder job completed successfully. Processed 1 events")
  → Log file: [EventReminderJob] INFO - Event reminder job completed successfully. Processed 1 events

STEP 10: WAIT FOR NEXT EXECUTION
──────────────────────────────────
Job completed at: 00:00:13 (took 3 seconds)
fixedDelay = 300000 milliseconds = 5 minutes
Schedule next execution at: 00:05:13

Time passes...
00:01:00 - Waiting...
00:03:00 - Waiting...
00:05:13 - TIME TO RUN AGAIN!

REPEAT: Go back to STEP 3

STEP 11: REPEAT FOREVER
────────────────────────
00:00:10 - Run 1
00:05:13 - Run 2
00:10:14 - Run 3
00:15:15 - Run 4
... (continues until app stops)
```

---

## INTEGRATION POINTS WITH OTHER CLASSES

### **EventReminderJob Connections**

```
EventReminderJob
├─ USES: EventRepository
│  ├─ Method: findAll()
│  ├─ Returns: List<Event>
│  ├─ Action: Queries all events from database
│  └─ Connection: Injected via @Autowired
│
├─ USES: ApplicationLoggerService
│  ├─ Methods: infoWithContext(), debugWithContext(), errorWithContext()
│  ├─ Returns: void
│  ├─ Action: Logs job execution details
│  └─ Connection: Injected via @Autowired
│
├─ USES: Event Entity
│  ├─ From: eventRepository.findAll()
│  ├─ Methods: 
│  │  ├─ getTitle() - Event name
│  │  ├─ getId() - Event ID
│  │  ├─ getStartTime() - Event start time
│  │  ├─ getEndTime() - Event end time
│  │  ├─ getStatus() - Event status (ACTIVE/INACTIVE/OFF)
│  │  ├─ isDeleted() - Is soft-deleted?
│  │  └─ getAttendees() - List of users attending
│  └─ Connection: Retrieved from database
│
├─ USES: LocalDateTime
│  ├─ Method: LocalDateTime.now() - Current time
│  ├─ Method: now.plusHours(24) - Time 24 hours from now
│  └─ Connection: Java standard library
│
└─ SCHEDULED BY: SchedulerConfig
   ├─ Via: @Scheduled annotation
   ├─ Executor: ThreadPoolTaskScheduler
   └─ Frequency: Every 5 minutes (fixedDelay=300000)
```

### **Complete Class Dependency Graph**

```
SchedulerConfig
├─ Creates: ThreadPoolTaskScheduler
└─ Activates: @EnableScheduling

ThreadPoolTaskScheduler
├─ Executes: EventReminderJob.sendEventReminders() on schedule
├─ Executes: EventStatusUpdateJob.updateEventStatus() on schedule
└─ Executes: AuditLogArchivalJob.archiveOldLogs() on schedule

EventReminderJob
├─ Depends: EventRepository (via @Autowired)
├─ Depends: ApplicationLoggerService (via @Autowired)
├─ Queries: Event entity
├─ Uses: LocalDateTime for time calculations
└─ Calls: logger methods for logging

EventRepository
├─ Extends: JpaRepository<Event, Long>
├─ Provides: CRUD operations on Event table
├─ Uses: Hibernate for ORM
└─ Connects: MySQL database (app_events table)

ApplicationLoggerService
├─ Provides: Unified logging interface
├─ Methods: trace, debug, info, warn, error
├─ Logs to: Application logs (files and console)
└─ Used by: All job classes

Event Entity
├─ Mapped to: app_events database table
├─ Properties: id, title, startTime, endTime, status, deleted, attendees
├─ Relations: 
│  ├─ Many-to-one: organizer (User)
│  └─ Many-to-many: attendees (Set<User>)
└─ Queried by: EventRepository

User Entity
├─ Mapped to: app_users database table
├─ Relations: 
│  ├─ One-to-many: organized events (Set<Event>)
│  └─ Many-to-many: attending events (Set<Event>)
└─ Accessed through: Event.getAttendees()
```

---

## SUMMARY: HOW IT ALL WORKS TOGETHER

```
1. APP STARTS
   ↓
2. SchedulerConfig LOADS (@Configuration)
   ├─ Creates ThreadPoolTaskScheduler bean
   ├─ Sets pool size to 5 threads
   ├─ Activates @Scheduled processing (@EnableScheduling)
   └─ Registers the bean in Spring context
   
3. SPRING SCANS FOR @COMPONENT CLASSES
   ├─ Finds: EventReminderJob
   ├─ Finds: EventStatusUpdateJob
   ├─ Finds: AuditLogArchivalJob
   └─ Creates instances of each
   
4. SPRING PROCESSES @SCHEDULED ANNOTATIONS
   ├─ Finds: @Scheduled on EventReminderJob.sendEventReminders()
   ├─ Finds: @Scheduled on EventStatusUpdateJob.updateEventStatus()
   ├─ Finds: @Scheduled on AuditLogArchivalJob.archiveOldLogs()
   └─ Registers them with ThreadPoolTaskScheduler
   
5. DEPENDENCIES INJECTED (@Autowired)
   ├─ EventReminderJob gets:
   │  ├─ EventRepository (for database queries)
   │  └─ ApplicationLoggerService (for logging)
   ├─ EventStatusUpdateJob gets:
   │  ├─ EventRepository
   │  └─ ApplicationLoggerService
   └─ AuditLogArchivalJob gets:
      └─ ApplicationLoggerService
      
6. JOBS WAIT FOR THEIR SCHEDULE
   ├─ 10 seconds → EventReminderJob starts on thread-1
   ├─ 20 seconds → EventStatusUpdateJob starts on thread-2
   └─ 60 seconds → AuditLogArchivalJob starts on thread-3
   
7. JOBS EXECUTE
   ├─ Query EventRepository for data
   ├─ Log status with ApplicationLoggerService
   ├─ Process data
   └─ Return results
   
8. JOBS WAIT BEFORE NEXT EXECUTION
   ├─ EventReminderJob waits 5 minutes (fixedDelay)
   ├─ EventStatusUpdateJob waits 30 minutes
   └─ AuditLogArchivalJob waits 24 hours
   
9. REPEAT FOREVER
   └─ Jobs execute on their schedules until app stops
   
10. APP STOPS
    ├─ Running jobs continue to completion (graceful shutdown)
    ├─ ThreadPoolTaskScheduler shuts down
    └─ Database connections close
```

This document explains EVERY LINE of code and how everything connects! 🎯
