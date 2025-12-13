# DIMS API Reference
## Complete API Endpoint Documentation

**Base URL:** `https://agri-twins.emergent.host/api`  
**Version:** 1.0  
**Date:** December 2025

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Cooperatives](#cooperatives)
4. [Production Logs](#production-logs)
5. [Nonconformities](#nonconformities)
6. [Admin Operations](#admin-operations)
7. [Error Codes](#error-codes)
8. [Rate Limiting](#rate-limiting)

---

## Authentication

All endpoints except `/auth/login` and `/auth/register` require a valid JWT token.

### Include Token in Requests

```http
Authorization: Bearer <your_jwt_token>
```

### POST /auth/register

Register a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "string (required, valid email)",
  "password": "string (required, min 6 characters)",
  "name": "string (required)",
  "role": "officer|manager|farmer (required)",
  "cooperative_id": "string (required for manager/farmer, null for officer)"
}
```

**Response:** `201 Created`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid-string",
    "email": "user@dims9.com",
    "name": "User Name",
    "role": "farmer",
    "cooperative_id": "uuid-string",
    "created_at": "2025-12-13T10:00:00Z"
  }
}
```

**Errors:**
- `400` - Email already registered
- `422` - Invalid input data

---

### POST /auth/login

Authenticate user and receive access token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@dims9.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid-string",
    "email": "user@dims9.com",
    "name": "User Name",
    "role": "manager",
    "cooperative_id": "uuid-string",
    "created_at": "2025-12-13T10:00:00Z"
  }
}
```

**Errors:**
- `401` - Invalid credentials

**Example (curl):**
```bash
curl -X POST https://agri-twins.emergent.host/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"officer@dims9.com","password":"officer123"}'
```

---

## Users

### GET /users

Get list of all users (officers only).

**Endpoint:** `GET /api/users`

**Authentication:** Required (officer role)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid-string",
    "email": "user@dims9.com",
    "name": "User Name",
    "role": "manager",
    "cooperative_id": "uuid-string",
    "created_at": "2025-12-13T10:00:00Z"
  }
]
```

**Errors:**
- `401` - Unauthorized (no token)
- `403` - Forbidden (non-officer user)

---

### PUT /users/{user_id}

Update user information (officers only).

**Endpoint:** `PUT /api/users/{user_id}`

**Authentication:** Required (officer role)

**Path Parameters:**
- `user_id` (string): UUID of user to update

**Request Body:**
```json
{
  "name": "Updated Name (optional)",
  "email": "newemail@dims9.com (optional)",
  "role": "manager (optional)",
  "cooperative_id": "uuid-string (optional)",
  "password": "newpassword123 (optional)"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid-string",
  "email": "newemail@dims9.com",
  "name": "Updated Name",
  "role": "manager",
  "cooperative_id": "uuid-string",
  "created_at": "2025-12-13T10:00:00Z"
}
```

**Errors:**
- `400` - Email already in use
- `403` - Forbidden
- `404` - User not found

---

### DELETE /users/{user_id}

Delete user account (officers only).

**Endpoint:** `DELETE /api/users/{user_id}`

**Authentication:** Required (officer role)

**Path Parameters:**
- `user_id` (string): UUID of user to delete

**Response:** `200 OK`
```json
{
  "message": "User deleted successfully"
}
```

**Errors:**
- `400` - Cannot delete your own account
- `403` - Forbidden
- `404` - User not found

---

## Cooperatives

### GET /cooperatives

Get list of all cooperatives.

**Endpoint:** `GET /api/cooperatives`

**Authentication:** Required

**Response:** `200 OK`
```json
[
  {
    "id": "uuid-string",
    "name": "Green Valley Coffee Cooperative",
    "country": "Ethiopia",
    "product": "Coffee",
    "status": "active",
    "created_at": "2025-12-05T14:35:19Z"
  }
]
```

**Example (curl):**
```bash
curl -X GET https://agri-twins.emergent.host/api/cooperatives \
  -H "Authorization: Bearer $TOKEN"
```

---

### GET /cooperatives/{cooperative_id}

Get single cooperative details.

**Endpoint:** `GET /api/cooperatives/{cooperative_id}`

**Authentication:** Required

**Path Parameters:**
- `cooperative_id` (string): UUID of cooperative

**Response:** `200 OK`
```json
{
  "id": "uuid-string",
  "name": "Green Valley Coffee Cooperative",
  "country": "Ethiopia",
  "product": "Coffee",
  "status": "active",
  "created_at": "2025-12-05T14:35:19Z"
}
```

**Errors:**
- `404` - Cooperative not found

---

### GET /cooperatives/{cooperative_id}/stats

Get aggregate statistics for a cooperative.

**Endpoint:** `GET /api/cooperatives/{cooperative_id}/stats`

**Authentication:** Required

**Path Parameters:**
- `cooperative_id` (string): UUID of cooperative

**Response:** `200 OK`
```json
{
  "total_production": 12500.5,
  "avg_quality_a": 88.5,
  "avg_loss": 3.2,
  "open_issues": 5,
  "total_logs": 45
}
```

---

## Production Logs

### GET /production-logs

Get all production logs.

**Endpoint:** `GET /api/production-logs`

**Authentication:** Required

**Query Parameters:**
- `cooperative_id` (optional): Filter by cooperative UUID

**Response:** `200 OK`
```json
[
  {
    "id": "uuid-string",
    "cooperative_id": "uuid-string",
    "date": "2025-12-10T00:00:00Z",
    "total_production": 500.5,
    "grade_a_percent": 85.0,
    "grade_b_percent": 12.0,
    "post_harvest_loss_percent": 3.5,
    "post_harvest_loss_kg": 17.5,
    "energy_use": "Low",
    "has_nonconformity": false,
    "nonconformity_description": null,
    "corrective_action": null,
    "created_at": "2025-12-10T08:30:00Z"
  }
]
```

**Example (curl):**
```bash
# Get all logs
curl -X GET https://agri-twins.emergent.host/api/production-logs \
  -H "Authorization: Bearer $TOKEN"

# Filter by cooperative
curl -X GET "https://agri-twins.emergent.host/api/production-logs?cooperative_id=uuid" \
  -H "Authorization: Bearer $TOKEN"
```

---

### POST /production-logs

Create new production log entry.

**Endpoint:** `POST /api/production-logs`

**Authentication:** Required (manager or farmer)

**Request Body:**
```json
{
  "cooperative_id": "uuid-string (required)",
  "date": "2025-12-13T00:00:00Z (required)",
  "total_production": 450.0,
  "grade_a_percent": 82.0,
  "grade_b_percent": 15.0,
  "post_harvest_loss_percent": 3.0,
  "post_harvest_loss_kg": 13.5,
  "energy_use": "Low|Medium|High (required)",
  "has_nonconformity": false,
  "nonconformity_description": "Optional description",
  "corrective_action": "Optional action"
}
```

**Validation Rules:**
- `total_production`: Must be positive
- `grade_a_percent`, `grade_b_percent`: 0-100 range
- `grade_a_percent + grade_b_percent` ≤ 100
- `energy_use`: Must be "Low", "Medium", or "High"

**Response:** `201 Created`
```json
{
  "id": "uuid-string",
  "cooperative_id": "uuid-string",
  "date": "2025-12-13T00:00:00Z",
  "total_production": 450.0,
  "grade_a_percent": 82.0,
  "grade_b_percent": 15.0,
  "post_harvest_loss_percent": 3.0,
  "post_harvest_loss_kg": 13.5,
  "energy_use": "Medium",
  "has_nonconformity": false,
  "created_at": "2025-12-13T10:30:00Z"
}
```

**Errors:**
- `400` - Invalid data
- `403` - Forbidden (wrong cooperative)
- `422` - Validation error

---

### PUT /production-logs/{log_id}

Update existing production log.

**Endpoint:** `PUT /api/production-logs/{log_id}`

**Authentication:** Required (manager or farmer, own cooperative only)

**Path Parameters:**
- `log_id` (string): UUID of production log

**Request Body:**
```json
{
  "total_production": 455.0,
  "grade_a_percent": 83.0,
  "grade_b_percent": 14.0,
  "post_harvest_loss_percent": 3.0,
  "post_harvest_loss_kg": 13.65,
  "energy_use": "Medium",
  "has_nonconformity": false,
  "nonconformity_description": null,
  "corrective_action": null
}
```

**Response:** `200 OK` (Returns updated log)

**Errors:**
- `403` - Forbidden (not your cooperative)
- `404` - Log not found
- `422` - Validation error

---

### DELETE /production-logs/{log_id}

Delete production log entry.

**Endpoint:** `DELETE /api/production-logs/{log_id}`

**Authentication:** Required (manager or farmer, own cooperative only)

**Path Parameters:**
- `log_id` (string): UUID of production log

**Response:** `200 OK`
```json
{
  "message": "Production log deleted successfully"
}
```

**Errors:**
- `403` - Forbidden
- `404` - Log not found

---

## Nonconformities

### GET /nonconformities

Get all nonconformities (issues).

**Endpoint:** `GET /api/nonconformities`

**Authentication:** Required

**Query Parameters:**
- `cooperative_id` (optional): Filter by cooperative UUID
- `status` (optional): Filter by status (open, in_progress, closed)
- `category` (optional): Filter by category (quality, environmental, safety)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid-string",
    "cooperative_id": "uuid-string",
    "date": "2025-12-08T00:00:00Z",
    "category": "quality",
    "severity": "high",
    "description": "ISO 9001.8.5 - Production quality issue detailed description",
    "corrective_action": "Immediate corrective steps and long-term solution",
    "status": "in_progress",
    "assigned_to": "manager@dims9.com",
    "closed_date": null,
    "created_at": "2025-12-08T10:00:00Z"
  }
]
```

**Example (curl):**
```bash
# Get all open quality issues
curl -X GET "https://agri-twins.emergent.host/api/nonconformities?status=open&category=quality" \
  -H "Authorization: Bearer $TOKEN"
```

---

### POST /nonconformities

Create new nonconformity (issue).

**Endpoint:** `POST /api/nonconformities`

**Authentication:** Required

**Request Body:**
```json
{
  "cooperative_id": "uuid-string (required)",
  "date": "2025-12-13T00:00:00Z (required)",
  "category": "quality|environmental|safety (required)",
  "severity": "low|medium|high|critical (required)",
  "description": "Detailed description with ISO clause reference (required)",
  "corrective_action": "Planned corrective action (required)",
  "status": "open|in_progress|closed (default: open)",
  "assigned_to": "manager@dims9.com (optional)"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid-string",
  "cooperative_id": "uuid-string",
  "date": "2025-12-13T00:00:00Z",
  "category": "quality",
  "severity": "medium",
  "description": "ISO 9001.8.5 - Quality issue description",
  "corrective_action": "Corrective action plan",
  "status": "open",
  "assigned_to": "manager@dims9.com",
  "closed_date": null,
  "created_at": "2025-12-13T11:00:00Z"
}
```

**Errors:**
- `400` - Invalid data
- `422` - Validation error

---

### PUT /nonconformities/{nc_id}

Fully update nonconformity.

**Endpoint:** `PUT /api/nonconformities/{nc_id}`

**Authentication:** Required

**Path Parameters:**
- `nc_id` (string): UUID of nonconformity

**Request Body:**
```json
{
  "category": "quality (optional)",
  "severity": "high (optional)",
  "description": "Updated description (optional)",
  "corrective_action": "Updated action (optional)",
  "status": "in_progress (optional)",
  "assigned_to": "manager@dims9.com (optional)"
}
```

**Response:** `200 OK` (Returns updated nonconformity)

**Errors:**
- `404` - Nonconformity not found
- `422` - Validation error

---

### PATCH /nonconformities/{nc_id}

Partially update nonconformity (typically for status changes).

**Endpoint:** `PATCH /api/nonconformities/{nc_id}`

**Authentication:** Required

**Path Parameters:**
- `nc_id` (string): UUID of nonconformity

**Query Parameters:**
- `status` (optional): New status (open, in_progress, closed)
- `assigned_to` (optional): Email of assigned user

**Response:** `200 OK`
```json
{
  "message": "Updated successfully"
}
```

**Example (curl):**
```bash
# Close an issue
curl -X PATCH "https://agri-twins.emergent.host/api/nonconformities/{id}?status=closed" \
  -H "Authorization: Bearer $TOKEN"

# Reopen an issue
curl -X PATCH "https://agri-twins.emergent.host/api/nonconformities/{id}?status=open" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Admin Operations

### POST /reinit-data

Reinitialize database with sample data (officers only).

**Endpoint:** `POST /api/reinit-data`

**Authentication:** Required (officer role)

**Request Body:** None

**Response:** `200 OK`
```json
{
  "message": "Database reinitialized successfully",
  "cooperatives_created": 4,
  "production_logs_created": 40,
  "nonconformities_created": 33,
  "users_referenced": 4,
  "manager_updated": true
}
```

**Warning:** This will delete all existing data and create fresh sample data.

**Errors:**
- `403` - Forbidden (non-officer user)

---

### POST /fix-manager-cooperative

Fix manager cooperative assignment (officers only).

**Endpoint:** `POST /api/fix-manager-cooperative`

**Authentication:** Required (officer role)

**Request Body:** None

**Response:** `200 OK`
```json
{
  "message": "Manager cooperative_id fixed",
  "cooperative_id": "uuid-string",
  "cooperative_name": "Green Valley Coffee Cooperative",
  "updated": true
}
```

**Description:** Updates manager account to be assigned to the first cooperative in the database.

---

### POST /update-manager-cooperative

Update manager to specific cooperative (officers only).

**Endpoint:** `POST /api/update-manager-cooperative`

**Authentication:** Required (officer role)

**Query Parameters:**
- `cooperative_id` (required): Target cooperative UUID

**Response:** `200 OK`
```json
{
  "message": "Manager cooperative updated successfully",
  "cooperative_id": "uuid-string",
  "cooperative_name": "Mediterranean Olive Oil Cooperative"
}
```

**Errors:**
- `403` - Forbidden
- `404` - Cooperative or manager not found

**Example (curl):**
```bash
curl -X POST "https://agri-twins.emergent.host/api/update-manager-cooperative?cooperative_id={uuid}" \
  -H "Authorization: Bearer $TOKEN"
```

---

### POST /update-email-domains

Bulk update email domains (officers only).

**Endpoint:** `POST /api/update-email-domains`

**Authentication:** Required (officer role)

**Query Parameters:**
- `old_domain` (required): Current email domain (e.g., "dims.com")
- `new_domain` (required): New email domain (e.g., "dims9.com")

**Response:** `200 OK`
```json
{
  "message": "Updated 5 user email domains",
  "old_domain": "dims.com",
  "new_domain": "dims9.com",
  "updated_count": 5
}
```

**Example (curl):**
```bash
curl -X POST "https://agri-twins.emergent.host/api/update-email-domains?old_domain=dims.com&new_domain=dims9.com" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Validation error |
| 500 | Internal Server Error | Server error (contact support) |

### Error Response Format

```json
{
  "detail": "Error message describing the problem"
}
```

**Example:**
```json
{
  "detail": "Invalid credentials"
}
```

---

## Rate Limiting

**Current Limits:**
- No explicit rate limits implemented
- Fair use expected
- Monitor for abuse patterns

**Future Implementation:**
- 100 requests per minute per user
- 1000 requests per hour per user
- Rate limit headers in responses

---

## API Versioning

**Current Version:** v1 (implicit in base URL)

**Future Versioning:**
- Breaking changes will use new version prefix (e.g., `/api/v2/`)
- Current API will be maintained for backward compatibility
- Deprecation notices provided 6 months in advance

---

## SDK & Tools

### Python Example

```python
import requests

BASE_URL = "https://agri-twins.emergent.host/api"

# Login
response = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": "officer@dims9.com", "password": "officer123"}
)
token = response.json()["access_token"]

# Make authenticated request
headers = {"Authorization": f"Bearer {token}"}
cooperatives = requests.get(f"{BASE_URL}/cooperatives", headers=headers)
print(cooperatives.json())
```

### JavaScript Example

```javascript
const BASE_URL = 'https://agri-twins.emergent.host/api';

// Login
const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'officer@dims9.com',
    password: 'officer123'
  })
});
const { access_token } = await loginResponse.json();

// Make authenticated request
const cooperativesResponse = await fetch(`${BASE_URL}/cooperatives`, {
  headers: { 'Authorization': `Bearer ${access_token}` }
});
const cooperatives = await cooperativesResponse.json();
console.log(cooperatives);
```

---

## Interactive API Documentation

**Swagger UI:** `https://agri-twins.emergent.host/docs`

Interactive API documentation where you can:
- View all endpoints
- Test requests directly
- See request/response schemas
- Generate code samples

---

## Support

For API questions or issues:
- **Email:** api-support@dims.com
- **Documentation:** https://docs.dims.com
- **Status Page:** https://status.dims.com

---

**API Reference Version:** 1.0  
**Last Updated:** December 2025  
**Maintained By:** DIMS Development Team
