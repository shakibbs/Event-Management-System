# Test Event Attendance System
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Event Attendance System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Calculate event time: 2 hours 10 minutes from now (so scheduler finds it)
$eventStart = (Get-Date).AddHours(2).AddMinutes(10)
$eventEnd = $eventStart.AddHours(2)
$startTimeStr = $eventStart.ToString("yyyy-MM-dd HH:mm:ss")
$endTimeStr = $eventEnd.ToString("yyyy-MM-dd HH:mm:ss")
Write-Host "Event will start at: $startTimeStr" -ForegroundColor Cyan
Write-Host "Scheduler will send reminder between now and 30 minutes from now" -ForegroundColor Cyan

# Get fresh admin token
Write-Host "`nGetting fresh admin token..." -ForegroundColor Yellow
$loginBody = '{"email":"superadmin@ems.com","password":"SuperAdmin@123"}'
$auth = Invoke-RestMethod -Uri "http://localhost:8083/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$adminToken = $auth.accessToken
Write-Host "Token obtained" -ForegroundColor Green
$adminHeaders = @{Authorization="Bearer $adminToken"}

# Test 1: Create PUBLIC event
Write-Host "`nTEST 1: Create PUBLIC event..." -ForegroundColor Yellow
$eventBody = "{`"title`":`"Tech Meetup 2026`",`"description`":`"Test event`",`"startTime`":`"$startTimeStr`",`"endTime`":`"$endTimeStr`",`"location`":`"Dhaka`",`"visibility`":`"PUBLIC`"}"
$event = Invoke-RestMethod -Uri "http://localhost:8083/api/events" -Method POST -Headers $adminHeaders -Body $eventBody -ContentType "application/json"
Write-Host "Event created - ID: $($event.id)" -ForegroundColor Green
$eventId = $event.id

# Test 2: Login as attendee
Write-Host "`nTEST 2: Login as attendee (sarah.attendee@test.com with Attendee role)..." -ForegroundColor Yellow
$loginBody = '{"email":"sarah.attendee@test.com","password":"Attendee@123"}'
$attendeeAuth = Invoke-RestMethod -Uri "http://localhost:8083/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
Write-Host "Login successful" -ForegroundColor Green
$attendeeToken = $attendeeAuth.accessToken
$attendeeHeaders = @{Authorization="Bearer $attendeeToken"}

# Test 3: Attend PUBLIC event
Write-Host "`nTEST 3: Attendee registers for PUBLIC event..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8083/api/events/$eventId/attend" -Method POST -Headers $attendeeHeaders -ContentType "application/json"
    Write-Host "Success: $response" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# Test 4: Try duplicate registration
Write-Host "`nTEST 4: Try duplicate registration..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8083/api/events/$eventId/attend" -Method POST -Headers $attendeeHeaders -ContentType "application/json"
    Write-Host "Unexpected success" -ForegroundColor Red
} catch {
    Write-Host "Correctly blocked duplicate" -ForegroundColor Green
}

# Test 5: Create PRIVATE event
Write-Host "`nTEST 5: Create PRIVATE event..." -ForegroundColor Yellow
$privateEventBody = "{`"title`":`"Board Meeting`",`"description`":`"Private`",`"startTime`":`"$startTimeStr`",`"endTime`":`"$endTimeStr`",`"location`":`"Room A`",`"visibility`":`"PRIVATE`"}"
$privateEvent = Invoke-RestMethod -Uri "http://localhost:8083/api/events" -Method POST -Headers $adminHeaders -Body $privateEventBody -ContentType "application/json"
Write-Host "Private event created - ID: $($privateEvent.id)" -ForegroundColor Green
$privateEventId = $privateEvent.id

# Test 6: Try to attend PRIVATE event
Write-Host "`nTEST 6: Try self-registration for PRIVATE event..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8083/api/events/$privateEventId/attend" -Method POST -Headers $attendeeHeaders -ContentType "application/json"
    Write-Host "Unexpected success" -ForegroundColor Red
} catch {
    Write-Host "Correctly blocked (PRIVATE events need invitation)" -ForegroundColor Green
}

# Test 7: Invite to PRIVATE event
Write-Host "`nTEST 7: Organizer invites to PRIVATE event..." -ForegroundColor Yellow
$inviteBody = '{"userId":7}'
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8083/api/events/$privateEventId/invite" -Method POST -Headers $adminHeaders -Body $inviteBody -ContentType "application/json"
    Write-Host "Invitation sent: $response" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ALL TESTS COMPLETED!" -ForegroundColor Cyan
Write-Host "Scheduler runs every 5 minutes" -ForegroundColor Yellow
Write-Host "Check application logs in the next 30 minutes for email reminders" -ForegroundColor Yellow
Write-Host "Expected: Reminders will be sent for event starting at $startTimeStr" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
