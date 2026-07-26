-- ============================================================================
-- CareNest – PostgreSQL Schema (Flyway V1)
-- Generated directly from actual Java @Entity classes to guarantee
-- Hibernate ddl-auto=validate passes cleanly.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- enables gen_random_uuid()

-- ============================================================================
-- USERS  (auth.model.User)
-- ============================================================================
CREATE TABLE users (
  id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email                  VARCHAR(255) NOT NULL UNIQUE,
  phone                  VARCHAR(20)  NOT NULL UNIQUE,
  password_hash          VARCHAR(255) NOT NULL,
  first_name             VARCHAR(100) NOT NULL,
  last_name              VARCHAR(100) NOT NULL,
  avatar_url             VARCHAR(500),
  role                   VARCHAR(50)  NOT NULL
                           CHECK (role IN ('FAMILY','AGENCY_ADMIN','ADMIN','WORKER')),
  status                 VARCHAR(50)  NOT NULL
                           CHECK (status IN ('PENDING_VERIFICATION','ACTIVE','SUSPENDED','DEACTIVATED')),
  agency_id              UUID,
  last_login_at          TIMESTAMP,
  failed_login_attempts  INTEGER,
  locked_until           TIMESTAMP,
  created_at             TIMESTAMP,
  updated_at             TIMESTAMP
);

-- ============================================================================
-- REFRESH TOKENS  (auth.model.RefreshToken)
-- ============================================================================
CREATE TABLE refresh_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token       VARCHAR(255) NOT NULL UNIQUE,
  user_id     UUID        NOT NULL REFERENCES users(id),
  expires_at  TIMESTAMP   NOT NULL,
  created_at  TIMESTAMP
);

-- ============================================================================
-- AGENCIES  (agency.Agency)
-- ============================================================================
CREATE TABLE agencies (
  id                     UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID           NOT NULL UNIQUE REFERENCES users(id),
  name                   VARCHAR(255)   NOT NULL,
  slug                   VARCHAR(255)   NOT NULL UNIQUE,
  logo_url               VARCHAR(500),
  description            TEXT,
  phone                  VARCHAR(50)    NOT NULL,
  email                  VARCHAR(255),
  website                VARCHAR(255),
  status                 VARCHAR(50)
                           CHECK (status IN ('PENDING','ACTIVE','SUSPENDED','DEACTIVATED')),
  verification_status    VARCHAR(50)
                           CHECK (verification_status IN ('UNVERIFIED','PENDING','VERIFIED','REJECTED')),
  commission_rate_pct    NUMERIC(5,2)   DEFAULT 10.00,
  average_rating         NUMERIC(3,2)   DEFAULT 0,
  total_reviews          INTEGER,
  is_accepting_bookings  BOOLEAN        DEFAULT FALSE,
  created_at             TIMESTAMP,
  updated_at             TIMESTAMP,
  deleted_at             TIMESTAMP
);

-- ============================================================================
-- SERVICE CATEGORY  (common.ServiceCategory)
-- NOTE: table name is singular "service_category" and column names are
-- service_type / work_description, matching the @Column overrides in Java.
-- ============================================================================
CREATE TABLE service_category (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              VARCHAR(50)  NOT NULL,
  service_type      VARCHAR(100) NOT NULL,
  work_description  TEXT
);

-- ============================================================================
-- FAMILY PROFILES  (family.FamilyProfile)
-- ============================================================================
CREATE TABLE family_profiles (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID         NOT NULL REFERENCES users(id),
  first_name               VARCHAR(100) NOT NULL,
  last_name                VARCHAR(100) NOT NULL,
  avatar_url               VARCHAR(500),
  household_notes          TEXT,
  emergency_contact_name   VARCHAR(150) NOT NULL,
  emergency_contact_phone  VARCHAR(20)  NOT NULL,
  created_at               TIMESTAMP    NOT NULL,
  updated_at               TIMESTAMP    NOT NULL
);

-- ============================================================================
-- FAMILY ADDRESSES  (family.FamilyAddress)
-- NOTE: columns are line_1 / line_2 (underscored), not line1/line2.
-- ============================================================================
CREATE TABLE family_addresses (
  id          UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID              NOT NULL REFERENCES family_profiles(id),
  label       VARCHAR(50)       NOT NULL,
  line_1      VARCHAR(255)      NOT NULL,
  line_2      VARCHAR(255),
  city        VARCHAR(100)      NOT NULL,
  region      VARCHAR(100)      NOT NULL,
  country     VARCHAR(100)      DEFAULT 'Ghana',
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  is_default  BOOLEAN,
  created_at  TIMESTAMP         NOT NULL
);

-- ============================================================================
-- SAVED AGENCIES  (family.SavedAgency)
-- ============================================================================
CREATE TABLE saved_agencies (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID        NOT NULL REFERENCES family_profiles(id),
  agency_id   UUID        NOT NULL REFERENCES agencies(id),
  created_at  TIMESTAMP
);

-- ============================================================================
-- BOOKINGS  (booking.Booking)
-- ============================================================================
CREATE TABLE bookings (
  id                          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id                   UUID          NOT NULL REFERENCES family_profiles(id),
  agency_id                   UUID          NOT NULL REFERENCES agencies(id),
  category_id                 UUID          NOT NULL REFERENCES service_category(id),
  address_id                  UUID          NOT NULL REFERENCES family_addresses(id),
  status                      VARCHAR(50)   NOT NULL
                                CHECK (status IN ('PENDING_ASSIGNMENT','ASSIGNED','CONFIRMED',
                                                   'IN_PROGRESS','COMPLETED','CANCELLED','DISPUTED')),
  start_time                  TIMESTAMPTZ   NOT NULL,
  end_time                    TIMESTAMPTZ   NOT NULL,
  is_recurring                BOOLEAN,
  recurrence_rule             VARCHAR(100),
  hourly_rate_minor_units     INTEGER,
  total_hours                 NUMERIC(5,2)  NOT NULL,
  subtotal_minor_units        INTEGER,
  platform_fee_pct            NUMERIC(5,2),
  platform_fee_minor_units    INTEGER,
  agency_payout_minor_units   INTEGER,
  family_notes                TEXT,
  agency_notes                TEXT,
  cancelled_by                VARCHAR(255),
  cancellation_reason         TEXT,
  created_at                  TIMESTAMP,
  updated_at                  TIMESTAMP
);

-- ============================================================================
-- AGENCY PAYOUTS  (agency.AgencyPayout)
-- ============================================================================
CREATE TABLE agency_payouts (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id            UUID         NOT NULL REFERENCES agencies(id),
  booking_id           UUID         NOT NULL REFERENCES bookings(id),
  amount_minor_units   INTEGER      NOT NULL,
  status               VARCHAR(50)  NOT NULL
                         CHECK (status IN ('PENDING','PROCESSING','PAID','FAILED')),
  payout_reference     VARCHAR(255),
  paid_at              TIMESTAMP,
  created_at           TIMESTAMP,
  updated_at           TIMESTAMP
);

-- ============================================================================
-- VERIFICATION DOCUMENTS  (documents.model.VerificationDocument)
-- ============================================================================
CREATE TABLE verification_documents (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id         UUID          NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  document_type     VARCHAR(50)   NOT NULL
                      CHECK (document_type IN ('NATIONAL_ID','PASSPORT','DRIVERS_LICENSE',
                                                'CERTIFICATE','POLICE_CLEARANCE','REFERENCE_LETTER',
                                                'MEDICAL_REPORT','OTHER')),
  document_name     VARCHAR(255)  NOT NULL,
  file_url          TEXT          NOT NULL,
  file_size         BIGINT,
  file_type         VARCHAR(50),
  description       VARCHAR(500),
  status            VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                      CHECK (status IN ('PENDING','VERIFIED','REJECTED')),
  rejection_reason  VARCHAR(500),
  verified_at       TIMESTAMP,
  verified_by       UUID,
  created_at        TIMESTAMP     NOT NULL,
  updated_at        TIMESTAMP     NOT NULL
);

-- ============================================================================
-- PAYMENTS  (payment.Payment)
-- ============================================================================
CREATE TABLE payments (
  id                        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id                UUID          NOT NULL REFERENCES bookings(id),
  family_id                 UUID          NOT NULL REFERENCES family_profiles(id),
  amount_minor_units        INTEGER,
  currency                  VARCHAR(3)    DEFAULT 'GHS',
  status                    VARCHAR(50)   NOT NULL
                              CHECK (status IN ('PENDING','AUTHORIZED','PAID','FAILED',
                                                 'REFUNDED','PARTIALLY_REFUNDED')),
  paystack_reference        VARCHAR(255)  NOT NULL,
  paystack_transaction_id   VARCHAR(255)  NOT NULL,
  paid_at                   TIMESTAMPTZ,
  created_at                TIMESTAMP     NOT NULL,
  updated_at                TIMESTAMP     NOT NULL
);

-- ============================================================================
-- REVIEWS  (review.Review)
-- ============================================================================
CREATE TABLE reviews (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID         NOT NULL UNIQUE REFERENCES bookings(id),
  family_id   UUID         NOT NULL REFERENCES family_profiles(id),
  agency_id   UUID         NOT NULL REFERENCES agencies(id),
  rating      INTEGER      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     VARCHAR(1000),
  created_at  TIMESTAMP    NOT NULL
);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
