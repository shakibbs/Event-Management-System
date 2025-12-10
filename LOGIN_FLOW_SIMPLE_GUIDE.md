# Login & Verification Flow - Simple Guide

## What Happens When User Enters Login Credentials

When a user enters email and password and clicks "Login", here's the **COMPLETE JOURNEY** of how verification happens:

---

## STEP-BY-STEP FLOW

### **STEP 1: User Submits Credentials**
```
Client sends:
POST /api/auth/login
{
    "email": "shakib@example.com",
    "password": "password123"
}
```
**WHO RECEIVES?** → `AuthController.java` (REST endpoint)

---

### **STEP 2: AuthController Receives Request**

**FILE:** `AuthController.java` (Line 126)
```
@PostMapping("/login")
public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequestDTO loginRequest)
```

**WHAT IT DOES:**
- Receives email & password in request body
- Validates format (@Valid annotation checks @Email, @NotBlank)
- If validation fails → Return HTTP 400 (Bad Request)
- If validation passes → Continue to next step

**NEXT CLASS:** → `AuthService.java`

---

### **STEP 3: AuthController Calls AuthService**

**CODE:**
```java
// AuthController.java (Line 131)
AuthResponseDTO authResponse = authService.authenticate(loginRequest);
```

**WHO PROCESSES?** → `AuthService.authenticate()` method

---

### **STEP 4: AuthService - Database Lookup (CRITICAL)**

**FILE:** `AuthService.java` (Line 148)
```java
public AuthResponseDTO authenticate(LoginRequestDTO loginRequest) {
    // STEP 1: Validate input
    if (loginRequest.getEmail() == null || loginRequest.getPassword() == null) {
        throw new RuntimeException("Email and password are required");
    }
    
    // STEP 2: Find user in database by email
    User user = userRepository.findByEmail(loginRequest.getEmail())
            .orElseThrow(() -> {
                log.warn("User not found with email: {}", loginRequest.getEmail());
                return new RuntimeException("Invalid credentials");  // ← Security: Don't reveal email exists or not
            });
```

**WHAT HAPPENS:**
1. Search database table `app_users` for matching email
2. If email NOT found → Throw error: "Invalid credentials" (generic message)
3. If email found → Continue to next step

**DATABASE QUERY:**
```sql
SELECT * FROM app_users WHERE email = 'shakib@example.com';
```

**RESULT:** User object loaded from database

---

### **STEP 5: AuthService - Password Verification (CRITICAL)**

**FILE:** `AuthService.java` (Line 160)
```java
// STEP 3: Compare password with BCrypt hash
if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
    log.warn("Invalid password for user: {}", user.getId());
    throw new RuntimeException("Invalid credentials");  // ← Security: Don't reveal password wrong
}
```

**WHAT HAPPENS:**
1. Take incoming password (plain text): `"password123"`
2. Get stored password from database (BCrypt hash): `"$2a$12$abcd...xyz"`
3. Use `PasswordEncoder.matches()` to compare:
   - **PasswordEncoder hashes the incoming password using the SAME salt** from the stored hash
   - Compares the two hashes (NOT comparing plain text)
   - Returns `true` if match, `false` if no match

**COMPARISON LOGIC:**
```
Incoming: password123  (plain text)
          ↓
     Hash with BCrypt + salt
          ↓
     $2a$12$new...hash
          ↓
     Compare with stored: $2a$12$abcd...xyz
          ↓
     If same → Password correct ✅
     If different → Password wrong ❌
```

**RESULT:**
- If password matches → Continue to token generation
- If password doesn't match → Throw error: "Invalid credentials"

---

### **STEP 6: AuthService - Generate Access Token**

**FILE:** `AuthService.java` (Line 168)
```java
// STEP 4: Generate access token with JWT
String accessToken = jwtService.generateAccessToken(user.getId());
```

**WHO CREATES TOKEN?** → `JwtService.java`

**WHAT IS GENERATED:**
```
JWT Token Structure:
HEADER.PAYLOAD.SIGNATURE

HEADER:
{
    "alg": "HS512",
    "typ": "JWT"
}

PAYLOAD (Claims):
{
    "sub": "1",              ← User ID
    "email": "shakib@example.com",
    "tokenUuid": "uuid-1234",  ← Unique ID for THIS token (for logout)
    "iat": 1702736400,       ← Issued at time
    "exp": 1702739100        ← Expiration (45 minutes later)
}

SIGNATURE:
HMACSHA512(
    base64UrlEncode(header) + "." +
    base64UrlEncode(payload),
    secret_key
)  ← Signed with secret key in application.properties
```

**ACTUAL TOKEN LOOKS LIKE:**
```
eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJzaGFraWJAZXhhbXBsZS5jb20iLCJ0b2tlblV1aWQiOiJ1dWlkLTEyMzQiLCJpYXQiOjE3MDI3MzY0MDAsImV4cCI6MTcwMjczOTEwMH0.3y9k...
```

**RESULT:** String token (very long)

---

### **STEP 7: AuthService - Generate Refresh Token**

**FILE:** `AuthService.java` (Line 171)
```java
String refreshToken = jwtService.generateRefreshToken(user.getId());
```

**SAME PROCESS AS STEP 6, BUT:**
- Expiration is 7 days instead of 45 minutes
- Used only to get a NEW access token (not for API calls)

---

### **STEP 8: AuthService - Cache Token UUIDs**

**FILE:** `AuthService.java` (Line 175-177)
```java
// STEP 7: Cache token UUIDs for server-side logout
Long accessTokenUuid = jwtService.extractTokenUuid(accessToken);
Long refreshTokenUuid = jwtService.extractTokenUuid(refreshToken);

tokenCacheService.cacheAccessToken(accessTokenUuid, user.getId(), 45);
tokenCacheService.cacheRefreshToken(refreshTokenUuid, user.getId(), 7);
```

**WHY CACHE?**
- Token itself cannot be "deleted" (it's cryptographically valid forever)
- But UUID can be removed from cache when user logs out
- When token used on next request, UUID lookup fails → "Invalid token"

**CACHE STORAGE:**
```
Redis Cache (or Spring Cache):

Access Token Cache:
uuid-1234 → {userId: 1, expiresAt: 2024-12-04 16:05:00}

Refresh Token Cache:
uuid-5678 → {userId: 1, expiresAt: 2024-12-11 16:00:00}
```

---

### **STEP 9: AuthService - Return Response**

**FILE:** `AuthService.java` (Line 180-190)
```java
// STEP 8 & 9: Build response
AuthResponseDTO response = new AuthResponseDTO();
response.setAccessToken(accessToken);
response.setRefreshToken(refreshToken);
response.setTokenType("Bearer");
response.setExpiresIn(2700);  // 45 minutes in seconds
response.setUser(userMapper.toResponseDTO(user));

return response;
```

**RESPONSE TO CLIENT:**
```json
HTTP 200 OK
{
    "accessToken": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 2700,
    "user": {
        "id": 1,
        "email": "shakib@example.com",
        "fullName": "Shakib Khan",
        "role": "ADMIN"
    }
}
```

**WHAT GETS RETURNED?** → Back to `AuthController.java`

---

### **STEP 10: AuthController Returns to Client**

**FILE:** `AuthController.java` (Line 133)
```java
return new ResponseEntity<>(authResponse, HttpStatus.OK);
```

**CLIENT RECEIVES:**
```
HTTP 200 OK with JSON response (tokens + user info)
```

---

## SUMMARY: CLASS JOURNEY DURING LOGIN

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                         │
│  User enters: email + password                              │
│  Clicks: LOGIN button                                       │
└────────────────────┬────────────────────────────────────────┘
                     │ POST /api/auth/login
                     ↓
┌─────────────────────────────────────────────────────────────┐
│            AuthController.java (Step 2)                     │
│  @PostMapping("/login")                                     │
│  • Receives email + password                                │
│  • Validates format (@Valid)                                │
│  • Calls authService.authenticate()                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│            AuthService.java (Step 3-9)                      │
│  authenticate(LoginRequestDTO loginRequest)                 │
│                                                             │
│  Step 4: userRepository.findByEmail()                       │
│          ↓ Queries database for user                        │
│          ↓ If not found → Throw error                       │
│                                                             │
│  Step 5: passwordEncoder.matches()                          │
│          ↓ Compares password with BCrypt hash               │
│          ↓ If wrong → Throw error                           │
│                                                             │
│  Step 6-7: jwtService.generate*Token()                      │
│            ↓ Creates Access Token (45 min)                  │
│            ↓ Creates Refresh Token (7 days)                 │
│                                                             │
│  Step 8: tokenCacheService.cache*Token()                    │
│          ↓ Stores token UUIDs in cache                      │
│          ↓ For logout functionality                         │
│                                                             │
│  Step 9: Build AuthResponseDTO                              │
│          ↓ Combines tokens + user info                      │
│          ↓ Returns to AuthController                        │
└────────────────────┬────────────────────────────────────────┘
                     │ AuthResponseDTO
                     ↓
┌─────────────────────────────────────────────────────────────┐
│            AuthController.java (Step 10)                    │
│  return new ResponseEntity<>(authResponse, OK)              │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP 200 + tokens + user info
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                         │
│  Receives: accessToken + refreshToken + user info           │
│  Stores in: localStorage                                    │
│  Ready to: Make API calls with accessToken                  │
└─────────────────────────────────────────────────────────────┘
```

---

## WHAT HAPPENS NEXT? (After Login)

### When User Makes API Request:

```
1. Client includes token in header:
   GET /api/events/1
   Authorization: Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...

2. JwtAuthenticationFilter (EVERY REQUEST):
   • Extracts token from Authorization header
   • Validates signature using secret key
   • Checks token expiration
   • Extracts tokenUuid from token
   • Looks up tokenUuid in cache (not logged out?)
   • If valid → Loads user → Stores in SecurityContext
   • If invalid → Returns HTTP 401 Unauthorized

3. Endpoint is called (EventController)
   • @PreAuthorize checks roles/permissions (if present)
   • Business logic executes
   • Response sent to client
```

---

## SECURITY FEATURES EXPLAINED

### 1. **Password Hashing (BCrypt)**
- User password: `password123` (plain text)
- Stored in DB: `$2a$12$8HxU...` (BCrypt hash)
- Comparison: Never compare plain text, use `PasswordEncoder.matches()`
- Benefit: Even if DB is hacked, passwords are protected

### 2. **JWT Tokens**
- Access Token: 45 minutes (used for every API request)
- Refresh Token: 7 days (used only to get new access token)
- Benefit: If access token compromised, damage limited to 45 minutes
- Each token has unique UUID for logout

### 3. **Server-Side Logout**
- Logout removes token UUID from cache
- Token remains cryptographically valid BUT useless
- On next request, cache lookup fails → "Invalid token"
- Works immediately across all servers

### 4. **Generic Error Messages**
- "Invalid credentials" (don't say "email not found" or "password wrong")
- Prevents user enumeration attacks
- Attacker can't guess valid emails

---

## FILES INVOLVED IN LOGIN

| File | Purpose |
|------|---------|
| `AuthController.java` | REST endpoint for login request |
| `AuthService.java` | Validates credentials, generates tokens, caches UUIDs |
| `UserRepository.java` | Queries database for user by email |
| `PasswordEncoder` (Spring) | Hashes and compares passwords with BCrypt |
| `JwtService.java` | Creates JWT tokens with claims |
| `TokenCacheService.java` | Stores token UUIDs for logout |
| `UserMapper.java` | Converts User entity to UserResponseDTO |
| `SecurityConfig.java` | Configures filter chain with @EnableMethodSecurity |
| `JwtAuthenticationFilter.java` | Intercepts EVERY request to validate token |

---

## KEY TAKEAWAYS

✅ **Email Check:** Database lookup by email (secure: generic error message)
✅ **Password Check:** BCrypt comparison (secure: never plain text)
✅ **Token Generation:** JWT with UUID (secure: unique token per login)
✅ **Token Caching:** UUID stored in cache (secure: enables logout)
✅ **Token Usage:** Validated on every request by JwtAuthenticationFilter
✅ **Logout:** Remove UUID from cache (secure: token becomes invalid)

---

This is the COMPLETE journey from login credentials → verification → authentication!
