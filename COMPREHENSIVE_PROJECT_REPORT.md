# Event Management System - Comprehensive Project Analysis Report

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Data Models & Entities](#data-models--entities)
4. [API Controllers & Endpoints](#api-controllers--endpoints)
5. [Business Logic & Services](#business-logic--services)
6. [Security & Authentication Flow](#security--authentication-flow)
7. [Data Access Layer](#data-access-layer)
8. [DTOs & Mappers](#dtos--mappers)
9. [Complete System Flow](#complete-system-flow)
10. [Key Features & Functionality](#key-features--functionality)

---

## Project Overview

The Event Management System is a comprehensive Spring Boot-based REST API application designed for managing events with enterprise-grade security features, role-based access control, and JWT authentication. The system follows a layered architecture pattern with clear separation of concerns.

### Key Characteristics:
- **Framework**: Spring Boot 3.5.3 with Java 17
- **Database**: MySQL 8.0 with JPA/Hibernate ORM
- **Security**: JWT-based authentication with BCrypt password hashing
- **Architecture**: RESTful API with DTO pattern
- **Documentation**: Swagger/OpenAPI 3 integration
- **Build Tool**: Maven with comprehensive dependency management

---

## Architecture & Technology Stack

### Core Technologies
- **Java 17+** - Latest LTS version
- **Spring Boot 3.x** - Main application framework
- **Spring Security 6.x** - Authentication and authorization
- **Spring Data JPA** - Data persistence layer
- **MySQL 8.0** - Relational database
- **JWT (JJWT 0.12.3)** - Token-based authentication
- **MapStruct 1.5.5** - Object mapping
- **Lombok** - Code generation boilerplate reduction

### Security Components
- **BCryptPasswordEncoder** - Password hashing (strength 12)
- **JWT Authentication Filter** - Request interception and validation
- **Token Cache Service** - Server-side logout support
- **Role-Based Access Control (RBAC)** - Fine-grained permissions

### Project Structure
```
src/main/java/com/event_management_system/
├── config/                 # Security and Swagger configuration
├── controller/             # REST API endpoints
├── dto/                    # Data Transfer Objects
├── entity/                 # JPA entities
├── exception/              # Global exception handling
├── mapper/                 # Object mapping utilities
├── repository/             # Data access interfaces
├── security/               # Security components
├── service/                # Business logic
└── util/                   # Utility classes
```

---

## Data Models & Entities

### Core Entity Hierarchy

#### BaseEntity (Abstract)
- **Purpose**: Common audit fields for all entities
- **Fields**: id, createdAt, updatedAt, createdBy, updatedBy, status, deleted
- **Features**: Soft delete support, status management, audit trail
- **Methods**: recordCreation(), recordUpdate(), markDeleted(), activate()

#### User Entity
- **Table**: `app_users`
- **Fields**: fullName, email, password, role
- **Relationships**: Many-to-one with Role
- **Security**: Password hashed with BCrypt
- **Validation**: Email uniqueness, password complexity

#### Role Entity
- **Table**: `app_roles`
- **Fields**: name
- **Relationships**: One-to-many with RolePermission, Many-to-one with Users
- **Features**: Dynamic permission assignment through junction table

#### Permission Entity
- **Table**: `app_permissions`
- **Fields**: name, description
- **Purpose**: Granular permission definitions
- **Examples**: "event.manage.all", "user.view.own"

#### RolePermission (Junction Entity)
- **Table**: `role_permissions`
- **Purpose**: Many-to-many relationship between Roles and Permissions
- **Key**: Composite key (roleId + permissionId)
- **Features**: Audit fields, soft delete support

#### Event Entity
- **Table**: `app_events`
- **Fields**: title, description, startTime, endTime, location, visibility
- **Relationships**: Many-to-one with User (organizer), Many-to-many with Users (attendees)
- **Visibility Levels**: PUBLIC, PRIVATE, INVITE_ONLY
- **Validation**: Date range validation, future date requirements

### Audit & History Entities

#### UserActivityHistory
- **Purpose**: Complete audit trail of all user activities
- **Activity Types**: LOGIN, LOGOUT, EVENT_CREATED, PASSWORD_CHANGED, etc.
- **Fields**: user, activityTypeCode, activityTypeName, description, deviceId, ip, sessionId
- **Features**: Device tracking, IP logging, session grouping

#### UserLoginLogoutHistory
- **Purpose**: Security-focused login/logout tracking
- **Fields**: user, userToken, userType, requestIp, deviceInfo, loginTime, logoutTime, loginStatus
- **Security Features**: Failed login tracking, active session management

#### UserPasswordHistory
- **Purpose**: Password change audit trail
- **Fields**: user, passwordChangedBy, changeDate, oldPassword, newPassword
- **Security**: Hash storage only, no plain text passwords

---

## API Controllers & Endpoints

### AuthController (`/api/auth`)
**Purpose**: Authentication and token management

#### Key Endpoints:
1. **POST /login**
   - **Input**: LoginRequestDTO (email, password)
   - **Process**: Validate credentials, generate JWT tokens, cache UUIDs
   - **Output**: AuthResponseDTO (accessToken, refreshToken, user info)
   - **Security**: BCrypt password comparison, generic error messages

2. **POST /refresh**
   - **Input**: RefreshTokenRequestDTO (refreshToken)
   - **Process**: Validate refresh token, generate new access token
   - **Output**: AuthResponseDTO (new accessToken, same refreshToken)
   - **Security**: Token signature validation, cache verification

3. **POST /logout**
   - **Input**: Authorization header with Bearer token
   - **Process**: Extract UUID, remove from cache, record logout
   - **Output**: Success message
   - **Security**: Server-side token invalidation

4. **POST /change-password**
   - **Input**: ChangePasswordRequestDTO (oldPassword, newPassword, confirmPassword)
   - **Process**: Verify old password, update with new hash, record history
   - **Output**: Success/error message
   - **Security**: Old password verification, password strength validation

### EventController (`/api/events`)
**Purpose**: Event CRUD operations

#### Key Endpoints:
1. **POST /** - Create event
   - **Input**: EventRequestDTO
   - **Validation**: Date range, future dates, permissions
   - **Output**: EventResponseDTO
   - **Security**: Role-based access control

2. **GET /** - Get all events (paginated)
   - **Input**: Page parameters (page, size)
   - **Output**: Page<EventResponseDTO>
   - **Features**: Pagination, filtering by visibility

3. **GET /{id}** - Get event by ID
   - **Input**: Event ID
   - **Output**: EventResponseDTO
   - **Security**: Visibility-based access control

4. **PUT /{id}** - Update event
   - **Input**: Event ID, EventRequestDTO
   - **Validation**: Ownership, permissions, date validity
   - **Output**: Updated EventResponseDTO

5. **DELETE /{id}** - Delete event (soft delete)
   - **Input**: Event ID
   - **Process**: Mark as deleted, record activity
   - **Security**: Admin/organizer permissions only

### UserController (`/api/users`)
**Purpose**: User management operations

#### Key Endpoints:
1. **POST /** - Create user
   - **Input**: UserRequestDTO
   - **Process**: Hash password, assign role, record creation
   - **Output**: UserResponseDTO

2. **GET /** - Get all users
   - **Security**: Admin only
   - **Output**: List<UserResponseDTO>

3. **GET /{id}** - Get user by ID
   - **Output**: UserResponseDTO
   - **Security**: Self or admin access

4. **PUT /{id}** - Update user
   - **Security**: Permission-based access control
   - **Features**: Role assignment, profile updates

5. **DELETE /{id}** - Delete user (soft delete)
   - **Security**: Admin only, cascade handling

### RoleController (`/api/roles`)
**Purpose**: Role management

#### Key Features:
- CRUD operations for roles
- Permission assignment/removal
- Role-based access control

### PermissionController (`/api/permissions`)
**Purpose**: Permission management

#### Key Features:
- CRUD operations for permissions
- Granular permission definitions
- System-wide permission tracking

### HistoryController (`/api/history`)
**Purpose**: Comprehensive audit and activity tracking

#### Key Endpoint Categories:
1. **Login/Logout History**
   - GET /login - Complete login/logout history
   - GET /login/active - Active sessions
   - GET /login/range - Date-range filtering
   - GET /login/failed - Failed login attempts

2. **Password History**
   - GET /password - Password change history
   - GET /password/recent - Recent changes

3. **Activity History**
   - GET /activity - All user activities
   - GET /activity/recent - Recent activities
   - GET /activity/type/{type} - Filtered by activity type
   - GET /activity/range - Date-range filtering
   - GET /activity/session/{sessionId} - Session-based activities

#### Security Features:
- **Permission-based access**: SuperAdmin can view all, others only own
- **Data privacy**: Passwords never exposed
- **Comprehensive logging**: All actions tracked with context

---

## Business Logic & Services

### AuthService
**Purpose**: Core authentication logic

#### Key Methods:
1. **authenticate()**
   - **Process**: Email/password validation → JWT generation → Token caching → History recording
   - **Security**: BCrypt comparison, UUID generation, audit trail
   - **Output**: Complete AuthResponseDTO

2. **refreshAccessToken()**
   - **Process**: Refresh token validation → New access token generation
   - **Security**: Signature verification, cache consistency check
   - **Features**: Seamless token renewal without re-login

3. **logout()**
   - **Process**: Token UUID extraction → Cache removal → History recording
   - **Security**: Server-side invalidation
   - **Features**: Immediate session termination

4. **changePassword()**
   - **Process**: Old password verification → New password hashing → History recording
   - **Security**: Password strength, change tracking
   - **Features**: Audit trail, activity logging

### JwtService
**Purpose**: JWT token lifecycle management

#### Key Functions:
1. **Token Generation**
   - **Components**: Header (algorithm), Payload (claims), Signature (HMAC-SHA256)
   - **Claims**: userId (sub), tokenUuid (custom), iat, exp
   - **Security**: Cryptographic signing, secret key protection

2. **Token Validation**
   - **Process**: Signature verification → Expiration check → Format validation
   - **Security**: Tamper detection, time-based expiration
   - **Error Handling**: Specific exceptions for different failure types

3. **Claim Extraction**
   - **Methods**: getUserIdFromToken(), getTokenUuidFromToken()
   - **Security**: Post-validation parsing
   - **Usage**: User identification, cache lookup

### TokenCacheService
**Purpose**: Server-side token management for logout support

#### Implementation:
- **Current**: ConcurrentHashMap (in-memory)
- **Future**: Redis (distributed cache)
- **Structure**: tokenUuid → {userId, expirationTime}

#### Key Operations:
1. **cacheAccessToken()** - Store with 45-minute expiration
2. **cacheRefreshToken()** - Store with 7-day expiration
3. **getUserIdFromCache()** - Retrieve with expiration check
4. **removeTokenFromCache()** - Logout functionality

#### Features:
- **Automatic expiration**: Time-based cleanup
- **Thread safety**: ConcurrentHashMap usage
- **Performance**: O(1) average access time

### EventService
**Purpose**: Event management business logic

#### Key Features:
1. **Event Creation**
   - **Validation**: Date range, future dates, permissions
   - **Security**: Role-based access control
   - **Audit**: Activity recording, organizer assignment

2. **Event Access Control**
   - **Visibility Levels**: PUBLIC, PRIVATE, INVITE_ONLY
   - **Permission Checks**: event.view.all, event.view.public, event.view.invited
   - **Ownership**: Organizer-based access

3. **Event Management**
   - **Updates**: Permission validation, audit trail
   - **Deletion**: Soft delete, activity recording
   - **Attendance**: User invitation system

### UserService
**Purpose**: User management and permissions

#### Key Features:
1. **User Lifecycle**
   - **Creation**: Password hashing, role assignment, history recording
   - **Updates**: Permission-based modifications
   - **Deletion**: Soft delete, relationship handling

2. **Permission System**
   - **hasPermission()**: Check user permissions through role
   - **canManageUser()**: Hierarchical access control
   - **Role Assignment**: Single role per user model

3. **Bootstrap System**
   - **Default User**: SuperAdmin creation on startup
   - **Initial Setup**: Role-based system initialization

---

## Security & Authentication Flow

### Complete Authentication Flow

#### 1. Login Process
```
Client → AuthController → AuthService → JwtService → TokenCache → Response
```

**Detailed Steps**:
1. **Client Request**: POST /api/auth/login with email/password
2. **Input Validation**: @Valid annotation, field requirements
3. **User Lookup**: UserRepository.findByEmail()
4. **Password Verification**: BCrypt.matches(incoming, stored)
5. **Token Generation**: 
   - Access token (45 min) with UUID
   - Refresh token (7 days) with UUID
6. **Token Caching**: UUID → userId mapping with expiration
7. **History Recording**: Login activity, device info, IP tracking
8. **Response**: AuthResponseDTO with tokens and user info

#### 2. Request Authentication Flow
```
Client Request → JwtAuthenticationFilter → JwtService → TokenCache → SecurityContext
```

**Filter Chain Process**:
1. **Token Extraction**: Authorization header parsing
2. **Token Validation**: Signature and expiration verification
3. **UUID Extraction**: getTokenUuidFromToken()
4. **Cache Lookup**: TokenCacheService.getUserIdFromCache()
5. **User Loading**: CustomUserDetailsService.loadUserDetailsById()
6. **Security Context**: Authentication object creation and storage
7. **Authorization**: Role and permission-based access control

#### 3. Token Refresh Flow
```
Client → AuthController → AuthService → JwtService → TokenCache → New Token
```

**Process**:
1. **Refresh Request**: POST /api/auth/refresh with refreshToken
2. **Token Validation**: Signature and expiration check
3. **Cache Verification**: UUID lookup and user ID matching
4. **New Token Generation**: Fresh access token with new UUID
5. **Cache Update**: New UUID mapping
6. **Response**: Updated AuthResponseDTO

#### 4. Logout Flow
```
Client → AuthController → AuthService → TokenCache → History Recording
```

**Server-side Logout**:
1. **Logout Request**: POST /api/auth/logout with access token
2. **Token Extraction**: UUID from valid JWT
3. **Cache Removal**: TokenCacheService.removeTokenFromCache()
4. **History Update**: Logout time recording
5. **Activity Logging**: User logout activity
6. **Response**: Success confirmation

### Security Features

#### Password Security
- **BCrypt Hashing**: Strength 12, automatic salting
- **One-way Hash**: No decryption possible
- **Change Tracking**: Complete password history
- **Validation**: Complexity requirements

#### Token Security
- **JWT Structure**: Header.Payload.Signature
- **HMAC-SHA256**: Cryptographic signing
- **UUID Tracking**: Server-side logout capability
- **Expiration**: Time-based token invalidation

#### Access Control
- **Role-Based**: ADMIN, ORGANIZER, ATTENDEE
- **Permission-Based**: Granular permissions (event.manage.all, user.view.own)
- **Hierarchical**: SuperAdmin > Admin > User
- **Resource-Based**: Owner-based access control

#### Audit & Monitoring
- **Complete Activity Trail**: Every action logged
- **Device Tracking**: IP, User-Agent, device ID
- **Session Management**: Active session tracking
- **Security Events**: Failed logins, suspicious activities

---

## Data Access Layer

### Repository Pattern
**Implementation**: Spring Data JPA repositories

#### Key Repositories:
1. **UserRepository**
   - **Methods**: findByEmail(), existsById()
   - **Features**: Custom query methods
   - **Security**: Email uniqueness enforcement

2. **EventRepository**
   - **Methods**: findAllByDeletedFalse(), custom queries
   - **Features**: Soft delete support
   - **Performance**: Indexed queries

3. **RoleRepository**
   - **Methods**: findByName(), custom role queries
   - **Features**: Role lookup by name

4. **PermissionRepository**
   - **Methods**: Standard CRUD operations
   - **Features**: Permission management

5. **History Repositories**
   - **UserActivityHistoryRepository**: Activity tracking
   - **UserLoginLogoutHistoryRepository**: Session management
   - **UserPasswordHistoryRepository**: Password audit

#### JPA Features:
- **Automatic Queries**: Method name-based query generation
- **Pagination**: Pageable support
- **Soft Delete**: Custom queries for active records
- **Relationships**: Lazy/Eager loading configuration

---

## DTOs & Mappers

### Data Transfer Objects (DTOs)
**Purpose**: API contract definition and data separation

#### Key DTOs:
1. **AuthResponseDTO**
   - **Fields**: accessToken, refreshToken, tokenType, expiresIn, user
   - **Purpose**: Login response structure
   - **Security**: No sensitive data exposure

2. **UserRequestDTO/UserResponseDTO**
   - **Request**: fullName, email, password, roleId
   - **Response**: id, fullName, email, role, audit fields
   - **Security**: Password excluded from response

3. **EventRequestDTO/EventResponseDTO**
   - **Request**: title, description, dates, location, visibility
   - **Response**: All event data plus audit fields
   - **Validation**: Date range validation, future date checks

4. **History DTOs**
   - **UserActivityHistoryResponseDTO**: Activity tracking
   - **UserLoginLogoutHistoryResponseDTO**: Session management
   - **UserPasswordHistoryResponseDTO**: Password audit
   - **Security**: Sensitive data excluded

### Mapper Pattern
**Implementation**: MapStruct with custom logic

#### Key Mappers:
1. **UserMapper**
   - **toEntity()**: DTO to Entity with password hashing
   - **toDto()**: Entity to DTO with role conversion
   - **updateEntity()**: Partial updates with validation
   - **Features**: Password handling, role assignment

2. **EventMapper**
   - **toEntity()**: Event creation from DTO
   - **toDto()**: Event response preparation
   - **updateEntity()**: Event updates
   - **Features**: Date validation, visibility handling

#### Mapping Features:
- **Automatic Generation**: MapStruct interface implementation
- **Custom Logic**: Password hashing, relationship handling
- **Performance**: Efficient object conversion
- **Type Safety**: Compile-time validation

---

## Complete System Flow

### 1. System Initialization
```
Application Start → SecurityConfig → Database Connection → Default User Creation → Ready State
```

**Startup Process**:
1. **Spring Boot Initialization**: Context loading, bean creation
2. **Security Configuration**: Filter chain setup, endpoint security
3. **Database Connection**: JPA entity scanning, schema validation
4. **Default User Creation**: SuperAdmin bootstrap if empty database
5. **Cache Initialization**: Token cache setup
6. **Service Ready**: API endpoints available

### 2. User Authentication Flow
```
Login Request → Credential Validation → Token Generation → Cache Storage → History Recording → Response
```

**Complete Flow**:
1. **Client**: POST /api/auth/login with credentials
2. **Controller**: Request validation, AuthService call
3. **Service**: User lookup, password verification
4. **JWT Service**: Access/refresh token creation with UUIDs
5. **Cache Service**: Token UUID storage with expiration
6. **History Services**: Login recording, activity tracking
7. **Response**: AuthResponseDTO with tokens and user info
8. **Client**: Token storage, subsequent authenticated requests

### 3. Protected Request Flow
```
Client Request → JWT Filter → Token Validation → Cache Verification → User Loading → Authorization → Controller
```

**Request Processing**:
1. **Client Request**: Authorization header with Bearer token
2. **JWT Filter**: Token extraction and validation
3. **Token Service**: Signature verification, claim extraction
4. **Cache Service**: UUID lookup for active session
5. **User Details**: Database user loading with authorities
6. **Security Context**: Authentication object storage
7. **Authorization**: @PreAuthorize permission checks
8. **Controller**: Business logic execution
9. **Response**: Data return with appropriate status

### 4. Event Management Flow
```
Event Creation → Permission Check → Validation → Database Save → Activity Recording → Response
```

**Event Lifecycle**:
1. **Creation Request**: POST /api/events with event data
2. **Permission Check**: Role-based authorization
3. **Validation**: Date range, future dates, required fields
4. **Database Save**: Event entity persistence
5. **Activity Recording**: EVENT_CREATED activity log
6. **Response**: EventResponseDTO with generated ID
7. **Updates**: Similar flow with permission validation
8. **Deletion**: Soft delete with activity recording

### 5. User Management Flow
```
User Operation → Permission Check → Data Validation → Database Operation → History Recording → Response
```

**User Lifecycle**:
1. **CRUD Operations**: Create, Read, Update, Delete
2. **Permission Validation**: Hierarchical access control
3. **Role Management**: Role assignment and permission handling
4. **Password Management**: Secure hashing, change tracking
5. **Audit Trail**: Complete activity recording
6. **Security Enforcement**: Access control at all levels

### 6. History and Audit Flow
```
User Action → Activity Recording → History Storage → Query Interface → Reporting
```

**Audit System**:
1. **Activity Capture**: Every user action logged
2. **Context Collection**: IP, device, session, timestamp
3. **Storage**: Specialized history tables
4. **Query Interface**: RESTful history endpoints
5. **Reporting**: Filtered and paginated results
6. **Security**: Permission-based access to history

---

## Key Features & Functionality

### Security Features
1. **JWT Authentication**
   - Stateless token-based authentication
   - Access/refresh token pattern
   - Server-side logout capability

2. **Role-Based Access Control**
   - Hierarchical permission system
   - Granular permission definitions
   - Resource-based authorization

3. **Password Security**
   - BCrypt hashing with salt
   - Password change tracking
   - Secure password reset flow

4. **Audit & Monitoring**
   - Complete activity logging
   - Device and IP tracking
   - Session management

### Business Features
1. **Event Management**
   - CRUD operations with validation
   - Visibility levels (Public, Private, Invite-only)
   - Attendee management system

2. **User Management**
   - User lifecycle management
   - Role and permission assignment
   - Profile management

3. **History Tracking**
   - Login/logout history
   - Password change history
   - Complete activity audit trail

### Technical Features
1. **RESTful API Design**
   - Standard HTTP methods
   - Proper status codes
   - Consistent error handling

2. **Data Validation**
   - Input validation at multiple levels
   - Business rule enforcement
   - Data integrity protection

3. **Performance & Scalability**
   - Pagination support
   - Efficient database queries
   - Caching mechanisms

4. **Documentation**
   - Swagger/OpenAPI integration
   - Comprehensive code documentation
   - Clear API contracts

### Integration Features
1. **Database Integration**
   - JPA/Hibernate ORM
   - MySQL database
   - Migration support

2. **Security Integration**
   - Spring Security framework
   - Custom authentication filters
   - Method-level security

3. **Monitoring Integration**
   - Comprehensive logging
   - Activity tracking
   - Security event monitoring

---

## Conclusion

The Event Management System represents a well-architected, enterprise-grade application with comprehensive security features, robust business logic, and extensive audit capabilities. The system demonstrates:

1. **Security-First Design**: JWT authentication, RBAC, comprehensive audit trails
2. **Clean Architecture**: Layered design with clear separation of concerns
3. **Enterprise Features**: Scalable design, comprehensive logging, monitoring
4. **Best Practices**: RESTful design, proper validation, error handling
5. **Maintainability**: Clean code, comprehensive documentation, testable structure

The system is production-ready with features essential for enterprise event management, including user management, role-based access control, comprehensive audit trails, and robust security mechanisms.