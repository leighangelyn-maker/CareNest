# CareNest – Team Responsibilities & API Ownership
**Version:** 1.0  |  **Date:** June 2026  |  **Project:** CodeQuest 2026 – Group 19

---

## Team Members

| # | Name | Student ID | Role |
|---|---|---|---|
| 1 | Essel Firdaus Ofosuwaa Ahmed | 6157524 | — |
| 2 | Leigh Angelyn | 6167124 | — |
| 3 | Nana Aba Nyameyie Ansah | 6141024 | — |
| 4 | Phillips Adjei Nuamah | 6128424 | — |
| 5 | Domfeh Gyamfuaah Elizabeth | 6155224 | — |

> Assign team members to the roles below based on your internal agreement.

---

## Role Definitions

### Backend Developer 1 — Security, Admin & Infrastructure
> The foundation everything else runs on.

**Core Principle:** You own everything that needs to exist and be secure *before* any feature can work. If BE1 isn't done, nothing else can be tested end-to-end.

**Responsibilities:**

**Authentication & Session Management**
- User registration (family + agency_admin)
- Login with JWT access token + refresh token issuance
- Token refresh and logout (refresh token revocation)
- Account lockout after repeated failed logins
- Email and phone verification flow
- Password reset (forgot password + token validation)

**Security Infrastructure**
- JWT signing, validation, and role-based access control (RBAC) enforcement
- CORS configuration (whitelist only mobile app origins)
- Rate limiting on auth and sensitive endpoints
- Paystack webhook HMAC-SHA512 signature validation
- Ensuring no secrets or PII appear in application logs
- TLS enforcement at the reverse proxy / PaaS level

**Admin Panel Endpoints**
- User management (list, view, suspend, reactivate)
- Agency approval and verification workflows
- Worker document review and approval
- Platform report management (open, investigate, resolve)
- Platform-wide booking and payment views (for reconciliation)
- Admin audit log — every admin action is written to `admin_audit_logs`

**Push Notification Infrastructure**
- Firebase FCM integration (service account, SDK setup)
- Device push token registration and storage (`push_tokens` table)
- Notification record creation and read/unread management

**Deployment & Infrastructure**
- Dockerfile creation and maintenance
- Render / Railway service configuration
- Environment variable management (.env, secrets)
- GitHub Actions CI/CD pipeline
- Database provisioning and Flyway migration setup
- Health check endpoint (`/actuator/health`)
- Monitoring and alerting setup

**Database Tables Owned:**
`users`, `refresh_tokens`, `admin_audit_logs`, `reports`, `push_tokens`, `paystack_webhook_events`, `notifications`

**API Endpoints Owned:**
```
POST   /auth/register
POST   /auth/register-agency
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
POST   /auth/verify-email
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /payments/webhook/paystack       ← security-critical
POST   /payments/{id}/refund
GET    /notifications
PATCH  /notifications/{id}/read
PATCH  /notifications/read-all
POST   /notifications/push-token
GET    /admin/users
GET    /admin/users/{id}
PATCH  /admin/users/{id}/status
GET    /admin/agencies
GET    /admin/agencies/{id}
PATCH  /admin/agencies/{id}/verify
PATCH  /admin/agencies/{id}/status
GET    /admin/workers/{id}/documents
PATCH  /admin/workers/{id}/documents/{docId}
GET    /admin/reports
PATCH  /admin/reports/{id}
GET    /admin/bookings
GET    /admin/payments
```

**Dependencies on other developers:**
- Needs BE2's booking and payment table structures to implement admin list views
- Needs FE1 to integrate JWT tokens into the app correctly

---

### Backend Developer 2 — Feature APIs, Business Logic & Transactions
> The engine that powers everything users actually do.

**Core Principle:** You own the core product experience — browsing agencies, making bookings, processing payments, and enabling communication. Your work depends on BE1's auth and security foundation.

**Responsibilities:**

**Family Profiles**
- Get and update family profile
- Manage family home addresses

**Agency Discovery**
- Agency search with filters: service category, city, GPS proximity, minimum rating
- Full agency profile retrieval
- List workers under an agency (name, photo, services, availability — **no contact info**)
- Agency reviews listing

**Agency & Worker Management (Agency-Side)**
- Agency profile creation and updates
- Worker creation, editing, and deactivation
- Worker service and availability management
- Worker document upload (passed to BE1 for approval)
- Agency payout detail setup (Paystack recipient creation)

**Booking Lifecycle**
- Booking creation (family → agency)
- Worker assignment by agency
- Payment initiation (generate Paystack checkout URL)
- Booking status transitions (confirmed → in_progress → completed)
- Booking cancellation with reason
- Booking history retrieval

**Payment Integration**
- Paystack payment initialisation (call Paystack API, store reference)
- Post-payment processing triggered by BE1's webhook handler:
  - Confirm booking on `charge.success`
  - Trigger agency payout transfer on `charge.success`

**Saved Agencies (Favourites)**
- Save and unsave agencies
- List saved agencies

**Reviews**
- Submit review for agency after completed booking
- Recalculate agency `average_rating` and `total_reviews` after each submission

**Messaging (REST Layer)**
- Conversation creation (family ↔ agency only)
- Message sending and retrieval
- Mark conversation as read
- (Real-time WebSocket layer is owned by **Frontend Dev 3 / Backend Dev 3**)

**Business Rules to Enforce:**
- A booking must be `assigned` before payment can be initiated
- A booking must be `confirmed` (payment captured) before it can move to `in_progress`
- Only one review per completed booking
- Platform fee = `commission_rate_pct` of subtotal, snapshotted at booking creation time
- Agency payout = subtotal − platform fee
- Workers cannot be booked directly — only through their agency

**Database Tables Owned:**
`family_profiles`, `family_addresses`, `agencies`, `agency_addresses`, `agency_documents`, `agency_payout_details`, `workers`, `worker_documents`, `worker_services`, `worker_availability`, `service_categories`, `saved_agencies`, `bookings`, `booking_status_history`, `reviews`, `payments`, `agency_payouts`, `conversations`, `messages`

**API Endpoints Owned:**
```
GET    /family/me
PATCH  /family/me
GET    /family/me/addresses
POST   /family/me/addresses
DELETE /family/me/addresses/{id}
GET    /agencies
GET    /agencies/{id}
GET    /agencies/{id}/workers
GET    /agencies/{id}/reviews
POST   /family/saved-agencies/{id}
DELETE /family/saved-agencies/{id}
GET    /family/saved-agencies
POST   /bookings
PATCH  /bookings/{id}/assign-worker
POST   /bookings/{id}/payment
GET    /bookings/{id}
GET    /bookings
PATCH  /bookings/{id}/cancel
PATCH  /bookings/{id}/complete
GET    /payments/{id}
POST   /reviews
GET    /messages/conversations
GET    /messages/conversations/{id}
POST   /messages/conversations/{id}/send
PATCH  /messages/conversations/{id}/read
```

**Dependencies on other developers:**
- Depends on BE1 for JWT validation middleware to be in place
- Depends on BE1 to process Paystack webhooks and call the post-payment logic
- Depends on FE2 for GPS coordinates sent in agency search requests
- Depends on FE3 for real-time messaging and booking status updates

---

## Frontend Developer 1 — Core Shell, Auth & User Profiles

**Responsibilities:**
- Splash screen, onboarding, and role selection (family vs. agency)
- Registration and login screens
- Email/phone verification flow UI
- Forgot password / reset password screens
- Family profile screen (view + edit)
- Family address management screen
- Settings screen (notifications, account, logout)
- JWT storage (secure device storage), token refresh logic

**API Endpoints Consumed:**
All `/auth/*` and `/family/me` and `/family/me/addresses` endpoints

---

## Frontend Developer 2 — Discovery, Maps & Main Family Path

**Responsibilities:**
- Agency search screen with filters (category, location, rating)
- Map view of nearby agencies (Google Maps API integration)
- Agency profile screen (details, workers list, reviews)
- Worker card component (shown within agency profile — no contact info)
- Saved agencies list screen
- Agency search results list with sort/filter UI

**API Endpoints Consumed:**
`/agencies`, `/agencies/{id}`, `/agencies/{id}/workers`, `/agencies/{id}/reviews`, `/family/saved-agencies/*`

---

## Frontend Developer 3 — Bookings, Payments & Real-Time Features

**Responsibilities:**
- Booking request creation form
- Booking detail screen (status, worker, payment breakdown)
- Booking history screen
- Payment screen (Paystack WebView/deep link integration)
- Review submission screen (after booking completed)
- In-app messaging UI (real-time WebSocket integration)
- Push notification handling (foreground + background)
- Real-time booking status updates (WebSocket or polling)

**API Endpoints Consumed:**
`/bookings/*`, `/payments/*`, `/reviews`, `/messages/*`, `/notifications/*`

---

## Cross-Team Contracts

These are the integration points where teams must agree on the interface before building:

| # | Contract | Between | Due Before |
|---|---|---|---|
| 1 | JWT token format and claims structure | BE1 → All | Sprint 1 |
| 2 | Agency search request/response schema | BE2 ↔ FE2 | Sprint 1 |
| 3 | Booking creation request body | BE2 ↔ FE3 | Sprint 2 |
| 4 | Paystack payment flow (URL → callback → status update) | BE1 + BE2 ↔ FE3 | Sprint 2 |
| 5 | WebSocket message event format | BE2 ↔ FE3 | Sprint 3 |
| 6 | Push notification payload shape | BE1 ↔ FE3 | Sprint 2 |
| 7 | Worker card data shape (what FE2 renders) | BE2 ↔ FE2 | Sprint 1 |

---

## Shared Guidelines

- **Branch naming:** `feature/<your-initials>/<feature-name>` (e.g. `feature/pa/booking-api`)
- **PRs:** Require at least 1 reviewer before merging to `main`
- **Environment:** Always test against the staging database, never production
- **Money:** Backend always sends amounts as integers (pesewas). Frontend converts for display only.
- **Dates:** All dates/times sent and received as ISO 8601 UTC strings. Frontend converts to local time for display.
- **Error handling:** Frontend must handle `401` (redirect to login) and `403` (show permission error) globally.
- **No direct worker contact:** No worker phone numbers or personal emails are ever returned to the family. All communication goes through the in-app messaging channel (family ↔ agency).

---

*CareNest Team Responsibilities — CodeQuest 2026 — Group 19*
