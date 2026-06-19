-- ============================================================================
-- CareNest – PostgreSQL Database Schema  v2.0
-- Owner      : Backend Dev 1  (Security · Admin · Infrastructure)
-- Consumed by: Backend Dev 2  (Feature APIs · Business Logic · Transactions)
-- Date       : June 2026
--
-- BOOKING MODEL
--   Family  →  Agency  →  Worker
--   Families never contact workers directly.
--   A booking is always placed with an agency; the agency assigns a worker.
--
-- MONEY CONVENTION
--   All monetary amounts are stored as INTEGER in the smallest currency unit
--   (Ghana pesewas: GHS 1.00 = 100 pesewas) to avoid floating-point errors.
--
-- TIMESTAMP CONVENTION
--   All timestamps are TIMESTAMPTZ (stored in UTC).
--
-- SOFT DELETE
--   deleted_at is used only on tables where audit history matters (users, agencies).
--   All other deletes are hard (via ON DELETE CASCADE where safe).
--
-- UPDATED-AT TRIGGER
--   The set_updated_at() function is shared across all tables that need it.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- enables gen_random_uuid()

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE user_role           AS ENUM ('family', 'agency_admin', 'admin');
CREATE TYPE user_status         AS ENUM ('pending_verification', 'active', 'suspended', 'deactivated');
CREATE TYPE agency_status       AS ENUM ('pending', 'active', 'suspended', 'deactivated');
CREATE TYPE worker_status       AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
CREATE TYPE booking_status      AS ENUM (
  'pending_assignment',   -- family placed request; agency has not assigned worker yet
  'assigned',             -- agency assigned a worker; awaiting payment
  'confirmed',            -- payment captured; booking is live
  'in_progress',          -- service underway
  'completed',            -- service finished
  'cancelled',            -- cancelled by family or agency
  'disputed'
);
CREATE TYPE payment_status      AS ENUM ('pending', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE payout_status       AS ENUM ('pending', 'processing', 'paid', 'failed');
CREATE TYPE document_type       AS ENUM ('national_id', 'passport', 'drivers_license', 'background_check', 'certification', 'proof_of_address', 'business_registration');
CREATE TYPE notification_type   AS ENUM ('booking', 'payment', 'message', 'verification', 'system');
CREATE TYPE report_status       AS ENUM ('open', 'investigating', 'resolved', 'dismissed');

-- ============================================================================
-- SHARED TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 1 – IDENTITY & ACCOUNTS
-- Owner: Backend Dev 1  (Security / Admin / Infrastructure)
-- ============================================================================

-- ── 1.1  Users ──────────────────────────────────────────────────────────────
-- Roles:
--   'family'        → a client household
--   'agency_admin'  → an operator account that manages one agency
--   'admin'         → CareNest platform administrator
CREATE TABLE users (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 VARCHAR(255)  NOT NULL UNIQUE,
  phone                 VARCHAR(20)   UNIQUE,
  password_hash         VARCHAR(255)  NOT NULL,
  role                  user_role     NOT NULL,
  status                user_status   NOT NULL DEFAULT 'pending_verification',
  email_verified_at     TIMESTAMPTZ,
  phone_verified_at     TIMESTAMPTZ,
  failed_login_attempts SMALLINT      NOT NULL DEFAULT 0,
  locked_until          TIMESTAMPTZ,
  last_login_at         TIMESTAMPTZ,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at            TIMESTAMPTZ
);

CREATE INDEX idx_users_role   ON users(role);
CREATE INDEX idx_users_status ON users(status);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 1.2  Refresh Tokens ─────────────────────────────────────────────────────
CREATE TABLE refresh_tokens (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  device_info VARCHAR(255),
  ip_address  VARCHAR(45),
  expires_at  TIMESTAMPTZ  NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ── 1.3  Admin Audit Log ────────────────────────────────────────────────────
CREATE TABLE admin_audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID        NOT NULL REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id   UUID,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_admin ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_logs_target ON admin_audit_logs(target_type, target_id);

-- ── 1.4  Platform Reports ───────────────────────────────────────────────────
CREATE TABLE reports (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   UUID,         -- FK added after bookings table is created
  reporter_id  UUID          NOT NULL REFERENCES users(id),
  reported_id  UUID          NOT NULL REFERENCES users(id),
  reason       TEXT          NOT NULL,
  status       report_status NOT NULL DEFAULT 'open',
  resolved_by  UUID          REFERENCES users(id),
  resolved_at  TIMESTAMPTZ,
  notes        TEXT,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_status ON reports(status);

-- ── 1.5  Push Notification Tokens ───────────────────────────────────────────
CREATE TABLE push_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) NOT NULL,
  platform   VARCHAR(10)  NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

-- ============================================================================
-- SECTION 2 – FAMILY PROFILES
-- Owner: Backend Dev 1  (model) / Frontend Dev 1  (UI)
-- ============================================================================

CREATE TABLE family_profiles (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name               VARCHAR(100) NOT NULL,
  last_name                VARCHAR(100) NOT NULL,
  avatar_url               TEXT,
  household_notes          TEXT,
  emergency_contact_name   VARCHAR(150),
  emergency_contact_phone  VARCHAR(20),
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_family_profiles_updated_at
  BEFORE UPDATE ON family_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- SECTION 3 – AGENCIES
-- Owner: Backend Dev 1  (verification / status) / Backend Dev 2  (profile CRUD)
--
-- An agency is a registered domestic-staff services company.
-- Workers are employed by (or registered under) an agency.
-- Families always book through an agency — never directly with a worker.
-- ============================================================================

CREATE TABLE agencies (
  id                      UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID           NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, -- the agency_admin user
  name                    VARCHAR(200)   NOT NULL,
  slug                    VARCHAR(100)   NOT NULL UNIQUE,
  logo_url                TEXT,
  description             TEXT,
  phone                   VARCHAR(20),
  email                   VARCHAR(255),
  website                 VARCHAR(255),
  status                  agency_status  NOT NULL DEFAULT 'pending',
  verification_status     verification_status NOT NULL DEFAULT 'unverified',
  commission_rate_pct     NUMERIC(5,2)   NOT NULL DEFAULT 10.00,  -- platform takes this % per booking
  average_rating          NUMERIC(3,2)   DEFAULT 0,
  total_reviews           INTEGER        NOT NULL DEFAULT 0,
  is_accepting_bookings   BOOLEAN        NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ    NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE INDEX idx_agencies_status             ON agencies(status);
CREATE INDEX idx_agencies_verification       ON agencies(verification_status);
CREATE INDEX idx_agencies_accepting_bookings ON agencies(is_accepting_bookings);

CREATE TRIGGER trg_agencies_updated_at
  BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 3.1  Agency Addresses ───────────────────────────────────────────────────
CREATE TABLE agency_addresses (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id  UUID        NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  label      VARCHAR(50),          -- e.g. 'Head Office', 'Branch – Kumasi'
  line1      VARCHAR(255) NOT NULL,
  line2      VARCHAR(255),
  city       VARCHAR(100) NOT NULL,
  region     VARCHAR(100),
  country    VARCHAR(100) NOT NULL DEFAULT 'Ghana',
  latitude   NUMERIC(9,6),
  longitude  NUMERIC(9,6),
  is_primary BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_agency_addresses_agency ON agency_addresses(agency_id);
CREATE INDEX idx_agency_addresses_geo    ON agency_addresses(latitude, longitude);

-- ── 3.2  Agency Verification Documents ─────────────────────────────────────
CREATE TABLE agency_documents (
  id               UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id        UUID                NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  document_type    document_type       NOT NULL,
  file_url         TEXT                NOT NULL,
  status           verification_status NOT NULL DEFAULT 'pending',
  reviewed_by      UUID                REFERENCES users(id),
  reviewed_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ         NOT NULL DEFAULT now()
);

CREATE INDEX idx_agency_documents_agency ON agency_documents(agency_id);
CREATE INDEX idx_agency_documents_status ON agency_documents(status);

-- ── 3.3  Agency Payout Details (Paystack Recipient) ─────────────────────────
CREATE TABLE agency_payout_details (
  id                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id                  UUID        NOT NULL UNIQUE REFERENCES agencies(id) ON DELETE CASCADE,
  paystack_recipient_code    VARCHAR(100),   -- from Paystack Transfer Recipient API
  account_name               VARCHAR(200),
  account_number             VARCHAR(20),
  bank_code                  VARCHAR(10),
  mobile_money_number        VARCHAR(20),
  mobile_money_provider      VARCHAR(50),
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_agency_payout_details_updated_at
  BEFORE UPDATE ON agency_payout_details
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- SECTION 4 – WORKERS
-- Owner: Backend Dev 1  (verification) / Backend Dev 2  (CRUD & assignment)
--
-- Workers are people employed by agencies.
-- They are NOT platform users — they do not log in.
-- Families never see worker contact details; all communication goes via agency.
-- ============================================================================

CREATE TABLE service_categories (
  id          SERIAL       PRIMARY KEY,
  slug        VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  description TEXT
);

-- Seed data – matches proposal
INSERT INTO service_categories (slug, name) VALUES
  ('nanny',     'Nanny'),
  ('cook',      'Cook'),
  ('cleaner',   'Cleaner'),
  ('caregiver', 'Caregiver'),
  ('driver',    'Driver'),
  ('gardener',  'Gardener');

CREATE TABLE workers (
  id                      UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id               UUID           NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  first_name              VARCHAR(100)   NOT NULL,
  last_name               VARCHAR(100)   NOT NULL,
  photo_url               TEXT,
  date_of_birth           DATE,
  phone                   VARCHAR(20),
  bio                     TEXT,
  years_experience        SMALLINT       NOT NULL DEFAULT 0,
  status                  worker_status  NOT NULL DEFAULT 'active',
  verification_status     verification_status NOT NULL DEFAULT 'unverified',
  background_check_status verification_status NOT NULL DEFAULT 'unverified',
  average_rating          NUMERIC(3,2)   DEFAULT 0,
  total_reviews           INTEGER        NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_workers_agency            ON workers(agency_id);
CREATE INDEX idx_workers_status            ON workers(status);
CREATE INDEX idx_workers_verification      ON workers(verification_status);

CREATE TRIGGER trg_workers_updated_at
  BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 4.1  Worker Services ────────────────────────────────────────────────────
CREATE TABLE worker_services (
  worker_id   UUID    NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (worker_id, category_id)
);

-- ── 4.2  Worker Availability ────────────────────────────────────────────────
CREATE TABLE worker_availability (
  id          UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id   UUID     NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  start_time  TIME     NOT NULL,
  end_time    TIME     NOT NULL,
  CHECK (end_time > start_time)
);

CREATE INDEX idx_worker_availability_worker ON worker_availability(worker_id);

-- ── 4.3  Worker Verification Documents ─────────────────────────────────────
CREATE TABLE worker_documents (
  id               UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id        UUID                NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  document_type    document_type       NOT NULL,
  file_url         TEXT                NOT NULL,
  status           verification_status NOT NULL DEFAULT 'pending',
  reviewed_by      UUID                REFERENCES users(id),
  reviewed_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ         NOT NULL DEFAULT now()
);

CREATE INDEX idx_worker_documents_worker ON worker_documents(worker_id);
CREATE INDEX idx_worker_documents_status ON worker_documents(status);

-- ============================================================================
-- SECTION 5 – DISCOVERY
-- Owner: Backend Dev 2  (search/filter APIs)
-- ============================================================================

-- Families can save agencies they like for quick rebooking
CREATE TABLE saved_agencies (
  family_id  UUID        NOT NULL REFERENCES family_profiles(id) ON DELETE CASCADE,
  agency_id  UUID        NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (family_id, agency_id)
);

-- Family addresses for booking destination
CREATE TABLE family_addresses (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID        NOT NULL REFERENCES family_profiles(id) ON DELETE CASCADE,
  label      VARCHAR(50),
  line1      VARCHAR(255) NOT NULL,
  line2      VARCHAR(255),
  city       VARCHAR(100) NOT NULL,
  region     VARCHAR(100),
  country    VARCHAR(100) NOT NULL DEFAULT 'Ghana',
  latitude   NUMERIC(9,6),
  longitude  NUMERIC(9,6),
  is_default BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_family_addresses_family ON family_addresses(family_id);

-- ============================================================================
-- SECTION 6 – BOOKINGS
-- Owner: Backend Dev 2  (lifecycle APIs) / Backend Dev 1  (audit trail)
--
-- Booking flow:
--   1. Family submits booking request to agency  → status: pending_assignment
--   2. Agency assigns a worker                   → status: assigned
--   3. Family completes payment                  → status: confirmed
--   4. Service is delivered                      → status: in_progress → completed
-- ============================================================================

CREATE TABLE bookings (
  id                          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id                   UUID           NOT NULL REFERENCES family_profiles(id),
  agency_id                   UUID           NOT NULL REFERENCES agencies(id),
  worker_id                   UUID           REFERENCES workers(id),   -- NULL until agency assigns
  category_id                 INTEGER        NOT NULL REFERENCES service_categories(id),
  address_id                  UUID           NOT NULL REFERENCES family_addresses(id),
  status                      booking_status NOT NULL DEFAULT 'pending_assignment',

  -- Scheduling
  start_time                  TIMESTAMPTZ    NOT NULL,
  end_time                    TIMESTAMPTZ    NOT NULL,
  is_recurring                BOOLEAN        NOT NULL DEFAULT FALSE,
  recurrence_rule             VARCHAR(100),  -- iCal RRULE string e.g. FREQ=WEEKLY;BYDAY=MO,WE

  -- Financials (locked at booking creation time)
  hourly_rate_minor_units     INTEGER        NOT NULL,
  total_hours                 NUMERIC(5,2)   NOT NULL,
  subtotal_minor_units        INTEGER        NOT NULL,   -- hourly_rate × total_hours
  platform_fee_pct            NUMERIC(5,2)   NOT NULL,  -- snapshot of commission_rate_pct at time of booking
  platform_fee_minor_units    INTEGER        NOT NULL,
  agency_payout_minor_units   INTEGER        NOT NULL,  -- subtotal − platform_fee
  currency                    VARCHAR(3)     NOT NULL DEFAULT 'GHS',

  -- Notes & Cancellation
  family_notes                TEXT,
  agency_notes                TEXT,
  cancelled_by                UUID           REFERENCES users(id),
  cancellation_reason         TEXT,

  created_at                  TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ    NOT NULL DEFAULT now(),

  CHECK (end_time > start_time),
  CHECK (total_hours > 0)
);

CREATE INDEX idx_bookings_family   ON bookings(family_id);
CREATE INDEX idx_bookings_agency   ON bookings(agency_id);
CREATE INDEX idx_bookings_worker   ON bookings(worker_id);
CREATE INDEX idx_bookings_status   ON bookings(status);
CREATE INDEX idx_bookings_start    ON bookings(start_time);

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Add the booking FK back to reports now that the table exists
ALTER TABLE reports
  ADD CONSTRAINT fk_reports_booking
  FOREIGN KEY (booking_id) REFERENCES bookings(id);

-- ── 6.1  Booking Status History (immutable audit trail) ────────────────────
CREATE TABLE booking_status_history (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID           NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  from_status booking_status,
  to_status   booking_status NOT NULL,
  changed_by  UUID           REFERENCES users(id),
  reason      TEXT,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_status_history ON booking_status_history(booking_id);

-- ── 6.2  Reviews ────────────────────────────────────────────────────────────
-- Families review the AGENCY (not the worker directly).
-- Agencies may optionally leave a review of the family.
CREATE TABLE reviews (
  id           UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   UUID     NOT NULL UNIQUE REFERENCES bookings(id),
  reviewer_id  UUID     NOT NULL REFERENCES users(id),
  agency_id    UUID     NOT NULL REFERENCES agencies(id),
  rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_agency ON reviews(agency_id);

-- ============================================================================
-- SECTION 7 – PAYMENTS & PAYOUTS
-- Owner: Backend Dev 2  (payment APIs) / Backend Dev 1  (webhook security)
--
-- Payment flow:
--   1. Family pays full subtotal_minor_units to CareNest via Paystack
--   2. CareNest retains platform_fee_minor_units
--   3. CareNest transfers agency_payout_minor_units to the agency (Paystack Transfer)
-- ============================================================================

CREATE TABLE payments (
  id                            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id                    UUID           NOT NULL REFERENCES bookings(id),
  family_id                     UUID           NOT NULL REFERENCES family_profiles(id),
  amount_minor_units            INTEGER        NOT NULL,
  currency                      VARCHAR(3)     NOT NULL DEFAULT 'GHS',
  status                        payment_status NOT NULL DEFAULT 'pending',

  -- Paystack fields
  paystack_reference            VARCHAR(100)   UNIQUE,       -- our reference sent to Paystack
  paystack_transaction_id       VARCHAR(100),                -- Paystack's transaction ID (from webhook)
  paystack_authorization_code   VARCHAR(100),                -- for future charges (card reuse)

  paid_at                       TIMESTAMPTZ,
  refunded_at                   TIMESTAMPTZ,
  failure_reason                TEXT,
  created_at                    TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status  ON payments(status);

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 7.1  Paystack Webhook Events (raw log for idempotency & debugging) ──────
CREATE TABLE paystack_webhook_events (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       VARCHAR(100) NOT NULL UNIQUE,   -- Paystack's unique event ID
  event_type     VARCHAR(100) NOT NULL,
  payload        JSONB        NOT NULL,
  processed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_paystack_events_type ON paystack_webhook_events(event_type);

-- ── 7.2  Agency Payouts ─────────────────────────────────────────────────────
CREATE TABLE agency_payouts (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id                UUID         NOT NULL REFERENCES agencies(id),
  booking_id               UUID         NOT NULL REFERENCES bookings(id),
  amount_minor_units       INTEGER      NOT NULL,
  currency                 VARCHAR(3)   NOT NULL DEFAULT 'GHS',
  status                   payout_status NOT NULL DEFAULT 'pending',
  paystack_transfer_code   VARCHAR(100),
  paid_at                  TIMESTAMPTZ,
  failure_reason           TEXT,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_agency_payouts_agency  ON agency_payouts(agency_id);
CREATE INDEX idx_agency_payouts_booking ON agency_payouts(booking_id);

CREATE TRIGGER trg_agency_payouts_updated_at
  BEFORE UPDATE ON agency_payouts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- SECTION 8 – MESSAGING & NOTIFICATIONS
-- Owner: Backend Dev 2  (feature APIs) / Backend Dev 1  (WebSocket security)
--
-- Messages are between a Family and an Agency — not between Family and Worker.
-- ============================================================================

CREATE TABLE conversations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID        REFERENCES bookings(id),
  family_id  UUID        NOT NULL REFERENCES family_profiles(id),
  agency_id  UUID        NOT NULL REFERENCES agencies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (family_id, agency_id, booking_id)
);

CREATE TABLE messages (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id        UUID        NOT NULL REFERENCES users(id),
  content          TEXT,
  attachment_url   TEXT,
  sent_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at          TIMESTAMPTZ
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, sent_at);

CREATE TABLE notifications (
  id         UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  title      VARCHAR(150)      NOT NULL,
  body       TEXT,
  payload    JSONB,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ       NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read_at);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
