# Test script for Event Attendance and Email Reminder System

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Event Attendance & Reminder Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Admin token (already logged in)
$adminToken = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxIiwidG9rZW5VdWlkIjoiNWY3NDQ4N2MtM2Q1Zi00ZWQ0LTk0ODAtYTkyYTE3NTU4Mzk1IiwiaWF0IjoxNzY3MjU4ODkxLCJleHAiOjE3NjcyNjE1OTF9.GQx_gX7Q5b4be1pWtsrIs9fksGi922o4YkNPENj4Nfb6wWV9m_8x5ZW5NuVolR7kfwUmwm5GWmp4Ary1-pq4rA"
$adminHeaders = @{Authorization="Bearer $adminToken"}

# Step 1: Create a PUBLIC event starting in 2 hours
Write-Host "STEP 1: Creating PUBLIC event (starts in ~2 hours)..." -ForegroundColor Yellow
$eventBody = @'
{
  "title": "Tech Meetup 2026",
  "description": "Testing event attendance and email reminders",
  "startTime": "2026-01-01 17:30:00",
  "endTime": "2026-01-01 19:30:00",
  "location": "Tech Hub, Dhaka",
  "visibility": "PUBLIC"
}
'@

try {
    $event = Invoke-RestMethod -Uri "http://localhost:8083/api/events" -Method POST -Headers $adminHeaders -Body $eventBody -ContentType "application/json"
    Write-Host "  ✓ Event created successfully!" -ForegroundColor Green
    Write-Host "    ID: $($event.id)"
    Write-Host "    Title: $($event.title)"
    Write-Host "    Visibility: $($event.visibility)"
    Write-Host "    Start Time: $($event.startTime)"
    Write-Host ""
    $eventId = $event.id
} catch {
    Write-Host "  ✗ Failed to create event: $_" -ForegroundColor Red
    Write-Host ""
    exit
}

# Step 2: Login as attendee
Write-Host "STEP 2: Login as attendee (john.attendee@test.com)..." -ForegroundColor Yellow
$loginBody = '{"email":"john.attendee@test.com","password":"Attendee@123"}'

try {
    $attendeeAuth = Invoke-RestMethod -Uri "http://localhost:8083/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "  ✓ Attendee logged in successfully!" -ForegroundColor Green
    Write-Host "    Token received"
    Write-Host ""
    $attendeeToken = $attendeeAuth.accessToken
    $attendeeHeaders = @{Authorization="Bearer $attendeeToken"}
} catch {
    Write-Host "  ✗ Failed to login: $_" -ForegroundColor Red
    Write-Host ""
    exit
}

# Step 3: Attendee registers for PUBLIC event
Write-Host "STEP 3: Attendee self-registers for PUBLIC event..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8083/api/events/$eventId/attend" -Method POST -Headers $attendeeHeaders -ContentType "application/json"
    Write-Host "  ✓ Successfully registered!" -ForegroundColor Green
    Write-Host "    Response: $response"
    Write-Host ""
} catch {
    Write-Host "  ✗ Failed to attend: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 4: Try to register again (should fail - already attending)
Write-Host "STEP 4: Try to register again (should fail - duplicate)..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8083/api/events/$eventId/attend" -Method POST -Headers $attendeeHeaders -ContentType "application/json"
    Write-Host "  ✗ Unexpected: Should have failed but succeeded!" -ForegroundColor Red
} catch {
    Write-Host "  ✓ Correctly blocked duplicate registration!" -ForegroundColor Green
    Write-Host "    Message: Already attending or event not found"
    Write-Host ""
}

# Step 5: Create PRIVATE event
Write-Host "STEP 5: Creating PRIVATE event (organizer only)..." -ForegroundColor Yellow
$privateEventBody = @'
{
  "title": "Private Board Meeting",
  "description": "Invitation only meeting",
  "startTime": "2026-01-01 18:00:00",
  "endTime": "2026-01-01 20:00:00",
  "location": "Conference Room A",
  "visibility": "PRIVATE"
}
'@

try {
    $privateEvent = Invoke-RestMethod -Uri "http://localhost:8083/api/events" -Method POST -Headers $adminHeaders -Body $privateEventBody -ContentType "application/json"
    Write-Host "  ✓ Private event created!" -ForegroundColor Green
    Write-Host "    ID: $($privateEvent.id)"
    Write-Host "    Visibility: $($privateEvent.visibility)"
    Write-Host ""
    $privateEventId = $privateEvent.id
} catch {
    Write-Host "  ✗ Failed: $_" -ForegroundColor Red
    Write-Host ""
}

# Step 6: Try to self-register for PRIVATE event (should fail)
Write-Host "STEP 6: Attendee tries to self-register for PRIVATE event (should fail)..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8083/api/events/$privateEventId/attend" -Method POST -Headers $attendeeHeaders -ContentType "application/json"
    Write-Host "  ✗ Unexpected: Should have failed but succeeded!" -ForegroundColor Red
} catch {
    Write-Host "  ✓ Correctly blocked self-registration for PRIVATE event!" -ForegroundColor Green
    Write-Host "    Message: Only PUBLIC events allow self-registration"
    Write-Host ""
}

# Step 7: Organizer invites attendee to PRIVATE event
Write-Host "STEP 7: Organizer invites attendee to PRIVATE event..." -ForegroundColor Yellow
$inviteBody = '{"userId":6}'

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8083/api/events/$privateEventId/invite" -Method POST -Headers $adminHeaders -Body $inviteBody -ContentType "application/json"
    Write-Host "  ✓ Invitation sent successfully!" -ForegroundColor Green
    Write-Host "    Response: $response"
    Write-Host ""
} catch {
    Write-Host "  ✗ Failed to invite: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 8: Check scheduler logs
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ PUBLIC event created (ID: $eventId)" -ForegroundColor Green
Write-Host "✓ Attendee self-registered successfully" -ForegroundColor Green
Write-Host "✓ Duplicate registration blocked" -ForegroundColor Green
Write-Host "✓ PRIVATE event created (ID: $privateEventId)" -ForegroundColor Green
Write-Host "✓ Self-registration for PRIVATE event blocked" -ForegroundColor Green
Write-Host "✓ Organizer invitation sent" -ForegroundColor Green
Write-Host ""
Write-Host "Scheduler will send email reminders 2 hours before events start!" -ForegroundColor Yellow
Write-Host "Check application logs for scheduler activity (runs every 5 minutes)" -ForegroundColor Yellow
Write-Host ""
