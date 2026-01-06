# RBAC and API Integration Test Suite

## Overview
Comprehensive test suite for the Event Management System that validates:
- **Authentication & Authorization (RBAC)**
- **All API Endpoints** (6 controllers, 40+ endpoints)
- **Validation & Error Handling**
- **Security Constraints**

## Test Coverage

### 1. Authentication Endpoints (4 tests)
- ✅ Login with valid credentials
- ✅ Login with invalid credentials
- ✅ Refresh access token
- ✅ User logout

### 2. Permission Management (5 tests)
- ✅ Create permission
- ✅ Get all permissions
- ✅ Get permission by ID
- ✅ Update permission
- ✅ Delete permission

### 3. Role Management (7 tests)
- ✅ Create role
- ✅ Get all roles
- ✅ Get role by ID (with permissions)
- ✅ Update role
- ✅ Assign permission to role
- ✅ Remove permission from role

### 4. User Management (7 tests)
- ✅ Create user
- ✅ Get user by ID
- ✅ Get all users
- ✅ Get user by email
- ✅ Update user
- ✅ Delete user
- ✅ Change password

### 5. Event Management (6 tests)
- ✅ Create event
- ✅ Get all events (with pagination)
- ✅ Get event by ID
- ✅ Update event
- ✅ Delete event
- ✅ Search events by title

### 6. History/Audit (5 tests)
- ✅ Get login/logout history
- ✅ Get login history for specific user (Admin only)
- ✅ Get password change history
- ✅ Get activity history
- ✅ Get activity history with date range filter

### 7. RBAC Authorization (7 tests)
- ✅ Unauthorized user cannot access admin endpoints (403 Forbidden)
- ✅ Missing token returns 401 Unauthorized
- ✅ Invalid token returns 401 Unauthorized
- ✅ Public endpoints accessible without token
- ✅ User cannot delete other user's events
- ✅ User can view own history only
- ✅ Admin can view any user's history

### 8. Validation & Error Handling (4 tests)
- ✅ Missing required fields in user creation
- ✅ Invalid email format
- ✅ Event with invalid time range
- ✅ Duplicate role name

## Total Test Cases: 45+

## Running the Tests

### Prerequisites
```bash
# Ensure MySQL is running
# Update application-test.properties with test database credentials
# Default: test database on localhost:3306
```

### Run All Tests
```bash
# Using Maven
mvn test

# Using Maven with specific test class
mvn test -Dtest=RbacAndApiIntegrationTest

# Using Gradle
gradle test
```

### Run Specific Test Category
```bash
# Run only RBAC tests
mvn test -Dtest=RbacAndApiIntegrationTest#testUnauthorizedUserCannotAccessAdminEndpoints

# Run only authentication tests
mvn test -Dtest=RbacAndApiIntegrationTest#testLogin*
```

### Run Tests with Coverage Report
```bash
# Generate coverage report
mvn test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

## Test Data Setup

The test suite uses a `@BeforeEach` setup method to initialize test data:

```
Admin User:
- Email: admin@test.com
- Password: admin123
- Role: Admin
- Permissions: All

Regular User:
- Email: user@test.com
- Password: user123
- Role: User
- Permissions: Limited

SuperAdmin User:
- Email: superadmin@test.com
- Password: superadmin123
- Role: SuperAdmin
- Permissions: All including audit access
```

## RBAC Rules Tested

### Public Endpoints (No Authentication Required)
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- POST /api/users/register
- Swagger/API Docs

### User-Level Access
- GET /api/events (own events + public events)
- POST /api/events (create)
- PUT /api/events/{id} (own events only)
- DELETE /api/events/{id} (own events only)
- GET /api/history/login (own history)
- GET /api/history/password (own history)
- GET /api/history/activity (own activity)

### Admin-Level Access
- All User endpoints
- POST /api/permissions
- GET /api/permissions
- PUT /api/permissions/{id}
- DELETE /api/permissions/{id}
- POST /api/roles
- GET /api/roles
- PUT /api/roles/{id}
- DELETE /api/roles/{id}
- POST /api/roles/{id}/permissions
- DELETE /api/roles/{id}/permissions/{permissionId}
- POST /api/users (create)
- GET /api/users
- PUT /api/users/{id}
- DELETE /api/users/{id}

### SuperAdmin-Level Access
- View any user's history
- View all audit logs
- All admin permissions

## Expected Test Results

### Success Cases (200-201 Status)
- ✅ Valid API calls return appropriate status codes
- ✅ Tokens are properly generated and validated
- ✅ Data is correctly mapped through DTOs
- ✅ Permissions are correctly enforced
- ✅ History is properly recorded

### Error Cases
- ✅ 400 Bad Request: Invalid input data
- ✅ 401 Unauthorized: Missing/invalid token
- ✅ 403 Forbidden: Insufficient permissions
- ✅ 404 Not Found: Resource doesn't exist
- ✅ 409 Conflict: Duplicate resource

## Test Assertions

Each test includes assertions for:
1. **Status Code**: Validates correct HTTP status
2. **Response Body**: Validates response structure
3. **Security**: Validates token and permission checks
4. **Data Integrity**: Validates data consistency
5. **Error Messages**: Validates error response format

## Example Test Execution

```bash
$ mvn test -Dtest=RbacAndApiIntegrationTest

[INFO] Running com.event_management_system.RbacAndApiIntegrationTest
[INFO] Tests run: 45, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 12.345s
[INFO] BUILD SUCCESS
```

## Integration with CI/CD

Add to your pipeline:

```yaml
# GitHub Actions example
- name: Run RBAC and API Tests
  run: mvn test -Dtest=RbacAndApiIntegrationTest
  
- name: Generate Coverage Report
  run: mvn jacoco:report
  
- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## Troubleshooting

### Test Database Connection Failed
```
Error: Cannot connect to MySQL
Solution: Ensure MySQL is running and application-test.properties has correct credentials
```

### Token Extraction Fails
```
Error: Token not found in response
Solution: Verify login endpoint returns accessToken and refreshToken fields
```

### RBAC Tests Failing
```
Error: User has unexpected permissions
Solution: Verify test data setup creates correct roles and permissions
```

## Future Enhancements

- [ ] Add performance benchmarking tests
- [ ] Add concurrent user scenario tests
- [ ] Add load testing with JMeter
- [ ] Add API contract testing
- [ ] Add end-to-end UI tests with Selenium
- [ ] Add security scanning with OWASP ZAP
- [ ] Add mutation testing for code quality

## Best Practices Implemented

✅ **@DisplayName**: Clear, readable test names  
✅ **Organized by Controller**: Tests grouped by functionality  
✅ **Comprehensive Coverage**: All endpoints and RBAC rules  
✅ **Error Cases**: Tests both success and failure scenarios  
✅ **Helper Methods**: Reusable utility functions  
✅ **Token Management**: Proper authentication flow testing  
✅ **Data Isolation**: Each test uses independent data  
✅ **Status Code Validation**: Proper HTTP semantics  
✅ **Security Testing**: Authorization and authentication  

## Contact & Support

For issues or questions about the test suite:
1. Check logs in `logs/` directory
2. Enable DEBUG logging: `logging.level.root=DEBUG`
3. Review test output for specific failures
4. Run tests with `-X` flag for debug output: `mvn -X test`
