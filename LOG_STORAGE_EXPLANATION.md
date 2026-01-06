# LOG STORAGE - DAILY BASIS EXPLANATION

This document explains how logs are stored on a daily basis in the Event Management System.

---

## Quick Answer

Logs are stored **daily** using **Logback's SizeAndTimeBasedRollingPolicy**. Every day at midnight (00:00:00), a new log file is created and old files are automatically moved to the `/logs/archive/` folder and compressed.

---

## How Daily Log Storage Works

### 1. **Current Log File (Writing Today)**

When the application is running TODAY:
- Logs are written to: `logs/application.log` (main file)
- This is the **active file** receiving real-time logs
- Size: Grows throughout the day as logs accumulate
- Location: `logs/` directory

```
logs/
├── application.log           ← Active file (TODAY's logs)
├── event-controller.log      ← Active file (controller logs)
├── service.log               ← Active file (service logs)
├── error.log                 ← Active file (error logs)
└── archive/                  ← Older logs folder
```

---

### 2. **Rolling at Midnight (Daily Rotation)**

When the clock strikes **00:00:00** (midnight):

#### Step 1: Old file is renamed with date
```
Before midnight:
  logs/application.log                    → 2025-12-26 logs

At midnight:
  logs/application.log                    → Renamed to:
  logs/archive/application-2025-12-26.1.log.gz
                              ↑ Date stamp added
```

#### Step 2: New file is created
```
After midnight:
  logs/application.log                    → NEW file (2025-12-27 logs)
```

#### Step 3: Old files are compressed
```
logs/archive/application-2025-12-26.1.log.gz    ← Compressed (gzip)
logs/archive/application-2025-12-25.1.log.gz    ← Previous day
logs/archive/application-2025-12-24.1.log.gz    ← Day before
```

---

## Timeline Example

### Day 1: December 26, 2025

**12:00 AM (Midnight):**
- Previous day's log archived: `application-2025-12-25.log.gz`
- New log file created: `application.log` (empty)

**During the day:**
```
12:30 AM - First log entry added
2:45 AM  - More logs added
9:15 AM  - Even more logs
3:30 PM  - Afternoon logs
11:59 PM - Final log of the day
```

**File state at end of day:**
```
logs/
├── application.log                           (~2-5 MB of today's logs)
├── event-controller.log                      (controller logs from today)
├── service.log                               (service logs from today)
├── error.log                                 (error logs from today)
└── archive/
    ├── application-2025-12-25.1.log.gz      (yesterday, compressed)
    ├── application-2025-12-24.1.log.gz      (day before, compressed)
    └── ...more older files...
```

### Day 2: December 27, 2025

**12:00 AM (Midnight transition):**

```
BEFORE Midnight (2025-12-26 23:59:59):
  logs/application.log                    (Dec 26's logs, ~2-5 MB)
  
AT Midnight (2025-12-27 00:00:00):
  logs/application.log → Renamed & Compressed
  logs/archive/application-2025-12-26.1.log.gz    ← NEW archived file
  
AFTER Midnight (2025-12-27 00:00:01):
  logs/application.log                    (NEW empty file, ready for Dec 27 logs)
```

**During Day 2:**
- New logs written to fresh `application.log`
- Previous day's file safely stored in `/archive/` as `.gz` file

---

## Detailed Configuration

### Configuration File: `logback-spring.xml`

#### Main Application Logs

```xml
<appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <!-- CURRENT FILE - being written to RIGHT NOW -->
    <file>${LOG_PATH}/application.log</file>
    
    <!-- ROLLING POLICY - controls when files rotate -->
    <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
        
        <!-- FILE NAMING PATTERN for archived files -->
        <!-- Example: application-2025-12-26.1.log.gz -->
        <fileNamePattern>${LOG_PATH}/archive/application-%d{yyyy-MM-dd}.%i.log.gz</fileNamePattern>
        <!--          ↑                    ↑ yyyy-MM-dd = DATE in archive name
                                          %i = increment counter if file size exceeded
        -->
        
        <!-- MAX FILE SIZE - if file reaches 10MB, create new one -->
        <!-- Even before midnight, creates backup if too large -->
        <maxFileSize>10MB</maxFileSize>
        
        <!-- KEEP LOGS FOR 30 DAYS -->
        <!-- Logs older than 30 days are automatically deleted -->
        <maxHistory>30</maxHistory>
        
        <!-- TOTAL SIZE CAP - prevents disk from filling -->
        <!-- If all logs exceed 1GB, oldest files are deleted -->
        <totalSizeCap>1GB</totalSizeCap>
    </rollingPolicy>
</appender>
```

---

## File Naming Convention

### Pattern: `application-2025-12-26.1.log.gz`

```
application          -   2025-12-26   .   1     .    log.gz
  ↑                       ↑            ↑    ↑         ↑
  Base name          Date of the    Separator Counter Format
                     logged day
```

### Examples:

```
application-2025-12-26.1.log.gz   ← December 26 logs, compressed, first rotation
application-2025-12-26.2.log.gz   ← December 26 logs, compressed, second rotation (if >10MB)
application-2025-12-26.3.log.gz   ← December 26 logs, compressed, third rotation
application-2025-12-25.1.log.gz   ← December 25 logs, compressed
application-2025-12-24.1.log.gz   ← December 24 logs, compressed
application-2025-12-23.1.log.gz   ← December 23 logs, compressed
```

---

## What Each Configuration Does

| Configuration | Value | Meaning |
|---|---|---|
| `<file>` | `${LOG_PATH}/application.log` | Current log file being written to |
| `<fileNamePattern>` | `application-%d{yyyy-MM-dd}.%i.log.gz` | Pattern for archived files |
| `%d{yyyy-MM-dd}` | `2025-12-26` | Date stamp (changes daily) |
| `%i` | `1, 2, 3...` | Counter if file size exceeded |
| `.gz` | gzip compressed | Compression format |
| `<maxFileSize>` | `10MB` | Size limit before rolling |
| `<maxHistory>` | `30` | Keep 30 days of logs |
| `<totalSizeCap>` | `1GB` | Max total size of all logs |

---

## Multiple Log Files (Appenders)

The system maintains **4 separate daily log files**:

### 1. **Main Application Log**
- **File:** `logs/application.log` → `logs/archive/application-YYYY-MM-DD.log.gz`
- **Content:** ALL logs from entire application
- **Size Limit:** 10MB per day
- **Retention:** 30 days
- **Max Total:** 1GB

### 2. **Event Controller Log**
- **File:** `logs/event-controller.log` → `logs/archive/event-controller-YYYY-MM-DD.log.gz`
- **Content:** Only EventController logs (user actions)
- **Size Limit:** 10MB per day
- **Retention:** 30 days
- **Max Total:** 500MB

### 3. **Service Layer Log**
- **File:** `logs/service.log` → `logs/archive/service-YYYY-MM-DD.log.gz`
- **Content:** Only service layer logs (business logic)
- **Size Limit:** 10MB per day
- **Retention:** 30 days
- **Max Total:** 500MB

### 4. **Error Log**
- **File:** `logs/error.log` → `logs/archive/error-YYYY-MM-DD.log.gz`
- **Content:** Only ERROR level logs
- **Size Limit:** 10MB per day
- **Retention:** 30 days
- **Max Total:** 500MB

---

## Directory Structure Example

### After Running for Multiple Days

```
logs/
│
├── application.log              (TODAY's logs - being written)
├── event-controller.log         (TODAY's controller logs)
├── service.log                  (TODAY's service logs)
├── error.log                    (TODAY's error logs)
│
└── archive/                     (Older logs - compressed)
    ├── application-2025-12-26.1.log.gz
    ├── application-2025-12-26.2.log.gz    (had 2 rotations that day)
    ├── application-2025-12-25.1.log.gz
    ├── application-2025-12-24.1.log.gz
    ├── application-2025-12-23.1.log.gz
    │
    ├── event-controller-2025-12-26.1.log.gz
    ├── event-controller-2025-12-25.1.log.gz
    │
    ├── service-2025-12-26.1.log.gz
    ├── service-2025-12-25.1.log.gz
    │
    ├── error-2025-12-26.1.log.gz
    └── error-2025-12-25.1.log.gz
```

---

## When Files Are Created/Rotated

### Scenario 1: Daily Rotation (Normal)

```
December 26, 2025 @ 11:59:59 PM
├── application.log              (~2-5 MB of Dec 26 logs)
└── archive/
    ├── application-2025-12-25.1.log.gz   (Dec 25 logs)
    └── application-2025-12-24.1.log.gz   (Dec 24 logs)

          MIDNIGHT OCCURS (00:00:00)

December 27, 2025 @ 00:00:01 AM
├── application.log              (NEW - empty, fresh start)
└── archive/
    ├── application-2025-12-26.1.log.gz   (Dec 26 logs - NEWLY ARCHIVED)
    ├── application-2025-12-25.1.log.gz   (Dec 25 logs)
    └── application-2025-12-24.1.log.gz   (Dec 24 logs)
```

### Scenario 2: Size Exceeded Before Midnight

If `application.log` reaches **10MB** BEFORE midnight:

```
December 26, 2025 @ 3:45 PM (file reaches 10MB)
├── application.log              (~10 MB - ROTATES)
└── archive/
    ├── application-2025-12-26.1.log.gz   (First 10MB)
    ├── application-2025-12-25.1.log.gz
    └── application-2025-12-24.1.log.gz

                    ROTATION OCCURS

December 26, 2025 @ 3:45 PM (after rotation)
├── application.log              (NEW - empty, ready for more logs)
└── archive/
    ├── application-2025-12-26.1.log.gz   (First 10MB)
    ├── application-2025-12-25.1.log.gz
    └── application-2025-12-24.1.log.gz

Then at MIDNIGHT (00:00:00):
├── application.log              (Another 5MB or so)
└── archive/
    ├── application-2025-12-26.2.log.gz   (Second 10MB from same day!)
    ├── application-2025-12-26.1.log.gz   (First 10MB from same day)
    ├── application-2025-12-25.1.log.gz
    └── application-2025-12-24.1.log.gz
```

---

## Log Retention Policy

### Automatic Cleanup

Logs are automatically deleted when:

1. **After 30 days** (`maxHistory=30`)
   - Logs older than 30 days are deleted automatically
   - Example: December 25 logs deleted on January 24

2. **When total size exceeds 1GB** (`totalSizeCap=1GB`)
   - Oldest files deleted first
   - Prevents disk space issues

3. **Only archived files are deleted**
   - Current `application.log` is kept
   - Only `.gz` files in `/archive/` are removed

### Example Timeline

```
Day 1 (Dec 1):   Create → application-2025-12-01.1.log.gz
Day 2 (Dec 2):   Create → application-2025-12-02.1.log.gz
...
Day 30 (Dec 30): Create → application-2025-12-30.1.log.gz
Day 31 (Dec 31): Create → application-2025-12-31.1.log.gz
                 DELETE → application-2025-12-01.1.log.gz (oldest, >30 days)

Day 32 (Jan 1):  Create → application-2026-01-01.1.log.gz
                 DELETE → application-2025-12-02.1.log.gz (oldest, >30 days)
```

---

## Storage Space Calculation

### Example: High-Traffic Day

**Scenario:** System logs 50 MB per day

```
Day 1:  logs/application.log = 50 MB
Day 2:  logs/application.log = 50 MB
        logs/archive/application-2025-12-26.log.gz = 5 MB (50 MB compressed)
Day 3:  logs/application.log = 50 MB
        logs/archive/
        ├── application-2025-12-26.log.gz = 5 MB
        └── application-2025-12-27.log.gz = 5 MB
...
After 30 days:
        logs/application.log = 50 MB (current)
        logs/archive/ = 30 files × 5 MB = 150 MB (previous 30 days)
        
        TOTAL: 50 + 150 = 200 MB
```

---

## How to Find Logs

### Find Today's Log
```bash
# Windows PowerShell
Get-Content logs/application.log -Tail 50    # Last 50 lines

# Linux/Mac
tail -50 logs/application.log                # Last 50 lines
```

### Find Yesterday's Log
```bash
# Windows PowerShell
Get-Content logs/archive/application-2025-12-26.1.log.gz | gunzip

# Linux/Mac
gunzip -c logs/archive/application-2025-12-26.1.log.gz | tail -50
```

### Find Specific Date's Log
```bash
# Windows PowerShell
Get-ChildItem logs/archive/ -Filter "*2025-12-20*"

# Linux/Mac
ls -la logs/archive/*2025-12-20*
```

---

## Scheduler Job Integration

The **AuditLogArchivalJob** in the scheduler:

```java
@Scheduled(fixedDelay = 86400000, initialDelay = 60000)
public void archiveOldLogs() {
    LocalDateTime ninetyDaysAgo = LocalDateTime.now().minusDays(90);
    
    // Delete database records older than 90 days
    // (UserActivityHistory, UserLoginLogoutHistory, UserPasswordHistory)
}
```

**Note:** This job manages DATABASE logs (audit trails), while Logback manages FILE logs.

### Both work together:
- **Logback (FILE):** Keeps application logs for 30 days, then deletes
- **AuditLogArchivalJob (DATABASE):** Keeps audit trail for 90 days, then deletes

---

## Summary: Daily Log Storage

| Aspect | Details |
|--------|---------|
| **Current File** | `logs/application.log` (written TODAY) |
| **Rolling Time** | Every day at midnight (00:00:00) |
| **File Naming** | `application-2025-12-26.1.log.gz` |
| **Compression** | gzip (.gz format) |
| **Size Limit** | 10 MB per file (per day) |
| **Retention** | 30 days (auto-delete after) |
| **Max Storage** | 1 GB total (all logs combined) |
| **Number of Appenders** | 4 separate logs (main, controller, service, error) |
| **Archive Location** | `logs/archive/` folder |
| **Backup on Rotation** | If file size exceeds limit before midnight |

---

## Key Takeaways

1. ✅ Logs are stored **daily** with automatic rotation at midnight
2. ✅ Old logs are **compressed** to save space (`.gz` format)
3. ✅ Logs are **kept for 30 days** before deletion
4. ✅ **4 separate log files** for different purposes
5. ✅ Files **rotate based on time AND size** (whichever comes first)
6. ✅ **Archive folder** contains older compressed logs
7. ✅ **Total size capped** at 1GB to prevent disk overflow
8. ✅ **Automatic cleanup** - no manual deletion needed

This setup ensures logs are organized, manageable, and automatically cleaned up! 📊
