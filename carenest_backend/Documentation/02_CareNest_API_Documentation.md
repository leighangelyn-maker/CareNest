# CareNest – API Documentation
**Version:** 1.0  |  **Date:** June 2026  |  **Project:** CodeQuest 2026 – Group 19

---

## Overview

CareNest uses a **RESTful JSON API** built with Spring Boot. All endpoints are served under:

```
https://api.carenest.app/v1
```

### Booking Model
Families never contact workers directly. The flow is:
```
Family  →  Agency  →  Worker (assigned internally by agency)
```

### Base Rules
| Rule | Detail |
|---|---|
| **Protocol** | HTTPS only |
| **Format** | `Content-Type: application/json` on all requests with a body |
| **Auth** | JWT Bearer token via `Authorization: Bearer <token>` |
| **Timestamps** | ISO 8601 UTC — `2026-06-18T10:30:00Z` |
| **Money** | Integer in smallest unit (pesewas). `GHS 5.00 = 500` |
| **Pagination** | `?page=0&size=20` on all list endpoints; response wraps data in `page` object |
| **Errors** | Standard `{ "error": { "code": "...", "message": "..." } }` envelope |

---

## Authentication

### JWT Strategy
- **Access token:** 15 minutes TTL, signed HS256, scoped to user role.
- **Refresh token:** 7 days TTL, stored hashed in `refresh_tokens` table.
- All protected endpoints require a valid access token.

### Role Claims in JWT
```json
{
  "sub": "<user_uuid>",
  "role": "family | agency_admin | admin",
  "agencyId": "<uuid>",
  "iat": 1750000000,
  "exp": 1750000900
}
```
`agencyId` is only present when `role = agency_admin`.

---

## Endpoints

### 1. Authentication API
**Prefix:** `/auth`  |  **Owner:** Backend Dev 1

---

#### POST `/auth/register`
Register a new **Family** account.

**Request Body:**
```json
{
  "email": "ama@example.com",
  "phone": "+233241234567",
  "password": "Str0ng!Pass",
  "firstName": "Ama",
  "lastName": "Mensah"
}
```

**Response `201 Created`:**
```json
{
  "user": {
    "id": "uuid",
    "email": "ama@example.com",
    "role": "family",
    "status": "pending_verification"
  },
  "message": "Verification email sent."
}
```

**Errors:** `400` validation failed · `409` email already registered

---

#### POST `/auth/register-agency`
Register a new **Agency** account (agency_admin user + agency record created together).

**Request Body:**
```json
{
  "email": "ops@brightstars.gh",
  "phone": "+233201234567",
  "password": "Str0ng!Pass",
  "agencyName": "Bright Stars Domestic Services",
  "agencyPhone": "+233201234567",
  "agencyEmail": "info@brightstars.gh",
  "agencyDescription": "Trusted nanny and housekeeping agency since 2015."
}
```

**Response `201 Created`:** Returns `user` + `agency` objects with `status: pending`.

---

#### POST `/auth/login`
**Request Body:**
```json
{
  "email": "ama@example.com",
  "password": "Str0ng!Pass"
}
```

**Response `200 OK`:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "ama@example.com",
    "role": "family",
    "status": "active"
  }
}
```

**Errors:** `401` invalid credentials · `403` account suspended/locked

---

#### POST `/auth/refresh`
Exchange a refresh token for a new access token.

**Request Body:**
```json
{ "refreshToken": "eyJ..." }
```

**Response `200 OK`:**
```json
{ "accessToken": "eyJ..." }
```

---

#### POST `/auth/logout`
**Auth required.** Revokes the current refresh token.

**Request Body:**
```json
{ "refreshToken": "eyJ..." }
```

**Response `204 No Content`**

---

#### POST `/auth/verify-email`
**Request Body:**
```json
{ "token": "<email-verification-token>" }
```

**Response `200 OK`:** `{ "message": "Email verified." }`

---

#### POST `/auth/forgot-password`
Sends a password reset email.

**Request Body:** `{ "email": "ama@example.com" }`

---

#### POST `/auth/reset-password`
**Request Body:**
```json
{ "token": "<reset-token>", "newPassword": "NewStr0ng!Pass" }
```

---

### 2. Family Profile API
**Prefix:** `/family`  |  **Auth:** `role = family`  |  **Owner:** Backend Dev 2

---

#### GET `/family/me`
Returns the authenticated family's full profile.

**Response `200 OK`:**
```json
{
  "id": "uuid",
  "firstName": "Ama",
  "lastName": "Mensah",
  "avatarUrl": "https://...",
  "householdNotes": "We have a 2-year-old and a dog.",
  "emergencyContactName": "Kwame Mensah",
  "emergencyContactPhone": "+233244000001"
}
```

---

#### PATCH `/family/me`
Update profile fields. All fields optional (partial update).

**Request Body:**
```json
{
  "householdNotes": "Updated notes.",
  "emergencyContactName": "Abena Boateng"
}
```

---

#### GET `/family/me/addresses`
List all saved family addresses.

#### POST `/family/me/addresses`
Add a new address.

**Request Body:**
```json
{
  "label": "Home",
  "line1": "12 Airport Hills",
  "city": "Accra",
  "region": "Greater Accra",
  "latitude": 5.6037,
  "longitude": -0.1870,
  "isDefault": true
}
```

#### DELETE `/family/me/addresses/{addressId}`

---

### 3. Agency Discovery API
**Prefix:** `/agencies`  |  **Auth:** `role = family`  |  **Owner:** Backend Dev 2

Family users browse **agencies**, not individual workers.

---

#### GET `/agencies`
Search and filter agencies.

**Query Parameters:**
| Param | Type | Description |
|---|---|---|
| `categoryId` | int | Filter by service category (e.g. 1 = Nanny) |
| `city` | string | Filter by agency city |
| `lat` / `lng` | float | User's coordinates for distance sorting |
| `radius` | int | Radius in km (default: 20) |
| `minRating` | float | Minimum average rating |
| `page` / `size` | int | Pagination |

**Response `200 OK`:**
```json
{
  "page": {
    "total": 42,
    "page": 0,
    "size": 20,
    "data": [
      {
        "id": "uuid",
        "name": "Bright Stars Domestic Services",
        "slug": "bright-stars",
        "logoUrl": "https://...",
        "description": "Trusted nanny and housekeeping agency since 2015.",
        "averageRating": 4.8,
        "totalReviews": 134,
        "city": "Accra",
        "distanceKm": 2.3,
        "isAcceptingBookings": true,
        "categories": ["Nanny", "Cleaner"]
      }
    ]
  }
}
```

---

#### GET `/agencies/{agencyId}`
Full agency profile including worker count, reviews preview, and service categories.

---

#### GET `/agencies/{agencyId}/workers`
List workers registered under this agency (names, photo, service, availability only — **no personal contact info**).

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "firstName": "Efua",
      "lastName": "A.",
      "photoUrl": "https://...",
      "yearsExperience": 5,
      "averageRating": 4.9,
      "services": ["Nanny", "Caregiver"],
      "availableDays": ["Monday", "Tuesday", "Thursday"]
    }
  ]
}
```

---

#### GET `/agencies/{agencyId}/reviews`
Paginated reviews for an agency.

---

#### POST `/family/saved-agencies/{agencyId}`
**Auth:** `role = family`. Save an agency to favourites.

**Response `201 Created`**

#### DELETE `/family/saved-agencies/{agencyId}`

#### GET `/family/saved-agencies`
List all saved agencies for the authenticated family.

---

### 4. Booking API
**Prefix:** `/bookings`  |  **Owner:** Backend Dev 2

---

#### POST `/bookings`
**Auth:** `role = family`. Create a new booking request with an agency.

**Request Body:**
```json
{
  "agencyId": "uuid",
  "categoryId": 1,
  "addressId": "uuid",
  "startTime": "2026-07-01T08:00:00Z",
  "endTime": "2026-07-01T17:00:00Z",
  "isRecurring": false,
  "familyNotes": "Please bring your own apron.",
  "preferredWorkerId": "uuid"
}
```

> `preferredWorkerId` is a **preference hint** only. The agency decides final assignment.

**Response `201 Created`:**
```json
{
  "id": "uuid",
  "status": "pending_assignment",
  "agency": { "id": "uuid", "name": "Bright Stars" },
  "category": "Nanny",
  "startTime": "2026-07-01T08:00:00Z",
  "endTime": "2026-07-01T17:00:00Z",
  "totalHours": 9.0,
  "subtotalMinorUnits": 27000,
  "platformFeeMinorUnits": 2700,
  "agencyPayoutMinorUnits": 24300,
  "currency": "GHS"
}
```

---

#### PATCH `/bookings/{bookingId}/assign-worker`
**Auth:** `role = agency_admin`. Agency assigns a worker to the booking.

**Request Body:**
```json
{ "workerId": "uuid" }
```

**Response `200 OK`:** Booking status transitions to `assigned`. Family receives push notification.

---

#### POST `/bookings/{bookingId}/payment`
**Auth:** `role = family`. Initiate payment for an `assigned` booking. Returns a Paystack checkout URL.

**Response `200 OK`:**
```json
{
  "paystackReference": "CN-20260701-ABCD1234",
  "authorizationUrl": "https://checkout.paystack.com/...",
  "amount": 27000,
  "currency": "GHS"
}
```

---

#### GET `/bookings/{bookingId}`
**Auth:** family (own booking) or agency_admin (own agency's booking) or admin.

---

#### GET `/bookings`
**Auth:** family (own bookings) or agency_admin (own agency's bookings).

**Query Params:** `status`, `page`, `size`

---

#### PATCH `/bookings/{bookingId}/cancel`
**Auth:** family (can cancel `pending_assignment` or `assigned`) or agency_admin.

**Request Body:**
```json
{ "reason": "Change of plans." }
```

---

#### PATCH `/bookings/{bookingId}/complete`
**Auth:** `role = agency_admin`. Mark a booking as completed.

---

### 5. Payment API
**Prefix:** `/payments`  |  **Owner:** Backend Dev 1 (webhook security) + Backend Dev 2 (initiation)

---

#### GET `/payments/{paymentId}`
**Auth:** family (own) or admin.

**Response `200 OK`:**
```json
{
  "id": "uuid",
  "bookingId": "uuid",
  "amountMinorUnits": 27000,
  "currency": "GHS",
  "status": "paid",
  "paystackReference": "CN-20260701-ABCD1234",
  "paidAt": "2026-07-01T07:45:00Z"
}
```

---

#### POST `/payments/webhook/paystack`
**Auth:** Paystack HMAC-SHA512 signature validation (no JWT).  
**Owner: Backend Dev 1** — this is a security-critical endpoint.

Processes Paystack webhook events:
- `charge.success` → marks payment as `paid`; triggers agency payout job
- `transfer.success` → marks agency payout as `paid`
- `transfer.failed` → marks agency payout as `failed`; alerts admin

**Response `200 OK`:** Always respond 200 to acknowledge receipt.

---

#### POST `/payments/{paymentId}/refund`
**Auth:** `role = admin`.

**Request Body:**
```json
{ "amountMinorUnits": 27000, "reason": "Service not delivered." }
```

---

### 6. Review API
**Prefix:** `/reviews`  |  **Owner:** Backend Dev 2

---

#### POST `/reviews`
**Auth:** `role = family`. Submit a review for an agency after a `completed` booking.

**Request Body:**
```json
{
  "bookingId": "uuid",
  "rating": 5,
  "comment": "Efua was wonderful with our children. Highly recommend Bright Stars!"
}
```

**Business Rules:**
- Only one review per booking.
- Booking must be in `completed` status.
- After submission, agency's `average_rating` is recalculated.

---

#### GET `/agencies/{agencyId}/reviews`
Paginated, most recent first.

---

### 7. Messaging API
**Prefix:** `/messages`  |  **Owner:** Backend Dev 2 (REST) + Backend Dev 3 (WebSocket real-time)

---

#### GET `/messages/conversations`
**Auth:** family or agency_admin. Lists all conversations for the authenticated user.

---

#### GET `/messages/conversations/{conversationId}`
Returns conversation metadata + last 50 messages.

---

#### POST `/messages/conversations/{conversationId}/send`
Send a new message.

**Request Body:**
```json
{
  "content": "Hi, will the nanny need a uniform?",
  "attachmentUrl": null
}
```

---

#### PATCH `/messages/conversations/{conversationId}/read`
Mark all unread messages in conversation as read.

---

### 8. Notification API
**Prefix:** `/notifications`  |  **Owner:** Backend Dev 1

---

#### GET `/notifications`
**Auth:** any role. List notifications for authenticated user.

**Query Params:** `unreadOnly=true`, `page`, `size`

---

#### PATCH `/notifications/{notificationId}/read`
Mark single notification as read.

#### PATCH `/notifications/read-all`
Mark all notifications as read.

---

#### POST `/notifications/push-token`
Register a device push token.

**Request Body:**
```json
{ "token": "ExponentPushToken[...]", "platform": "android" }
```

---

### 9. Admin API
**Prefix:** `/admin`  |  **Auth:** `role = admin`  |  **Owner:** Backend Dev 1

---

#### GET `/admin/users`
List all users with filters: `role`, `status`, `page`, `size`.

#### GET `/admin/users/{userId}`

#### PATCH `/admin/users/{userId}/status`
Suspend or reactivate a user.

**Request Body:** `{ "status": "suspended", "reason": "..." }`

---

#### GET `/admin/agencies`
List all agencies with filters: `status`, `verificationStatus`.

#### GET `/admin/agencies/{agencyId}`

#### PATCH `/admin/agencies/{agencyId}/verify`
**Request Body:** `{ "verificationStatus": "verified" | "rejected", "reason": "..." }`

#### PATCH `/admin/agencies/{agencyId}/status`

---

#### GET `/admin/workers/{workerId}/documents`
Review worker verification documents.

#### PATCH `/admin/workers/{workerId}/documents/{documentId}`
Approve or reject a document.

**Request Body:** `{ "status": "verified" | "rejected", "rejectionReason": "..." }`

---

#### GET `/admin/reports`
List platform reports. Filters: `status`.

#### PATCH `/admin/reports/{reportId}`
Update report status and resolution notes.

---

#### GET `/admin/bookings`
Platform-wide booking list. Filters: `status`, `agencyId`, `page`.

---

#### GET `/admin/payments`
Platform-wide payment list. Useful for reconciliation.

---

## Error Codes

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request body failed validation |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 403 | `FORBIDDEN` | Authenticated but not permitted |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | e.g. email already registered |
| 422 | `BUSINESS_RULE_VIOLATION` | e.g. booking already reviewed |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

**Error Response Shape:**
```json
{
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "A review already exists for this booking.",
    "field": null
  }
}
```

---

## Security Notes (Backend Dev 1 responsibilities)

| Concern | Implementation |
|---|---|
| **Webhook validation** | Validate `X-Paystack-Signature` header using HMAC-SHA512 before processing any webhook payload |
| **Rate limiting** | `/auth/login` → 5 attempts / 15 min per IP; all endpoints → 100 req/min per user |
| **Account lockout** | Lock account for 15 min after 5 consecutive failed logins |
| **JWT secret rotation** | Use RS256 in production; support key rotation without downtime |
| **CORS** | Whitelist mobile app origins only; reject all others |
| **SQL injection** | Use Spring Data JPA/parameterised queries only; no raw string interpolation |
| **Data in transit** | TLS 1.2+ enforced at reverse proxy level |
| **PII in logs** | Never log passwords, tokens, or full card numbers |

---

*CareNest API Documentation — CodeQuest 2026 — Group 19*
