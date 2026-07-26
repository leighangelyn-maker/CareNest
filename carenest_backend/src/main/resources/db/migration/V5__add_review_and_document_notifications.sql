-- ============================================================================
-- CareNest - Reviews notification types, saved_agencies uniqueness
-- Name this with the next available version number after V4.
-- No new tables needed - Review and VerificationDocument tables already
-- existed in V1; SavedAgency's table did too, it just had no entity/API
-- built on top of it yet.
-- ============================================================================

-- V4's notifications table was created with an unnamed CHECK constraint,
-- which Postgres auto-names as "notifications_type_check" by default.
-- If this DROP fails with "constraint does not exist", run:
--   \d notifications
-- in psql to find the actual constraint name and substitute it below.
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('NEW_BOOKING_REQUEST','WORKER_ASSIGNED',
                     'BOOKING_CONFIRMED','BOOKING_CANCELLED',
                     'BOOKING_COMPLETED','PAYMENT_RECEIVED',
                     'PAYMENT_FAILED','NEW_REVIEW',
                     'DOCUMENT_VERIFIED','DOCUMENT_REJECTED'));

-- Prevent a family from saving the same agency twice.
ALTER TABLE saved_agencies ADD CONSTRAINT uq_saved_agencies_family_agency
    UNIQUE (family_id, agency_id);