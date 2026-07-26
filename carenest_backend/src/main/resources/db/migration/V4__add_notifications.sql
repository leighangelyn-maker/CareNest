-- ============================================================================
-- CareNest - Notifications table
-- This is a new migration file - name it with the next available version
-- number in your db/migration folder (after whatever V3 currently is).
-- ============================================================================

CREATE TABLE notifications (
    id                 UUID          PRIMARY KEY,
    recipient_user_id  UUID          NOT NULL REFERENCES users(id),
    type               VARCHAR(50)   NOT NULL
                         CHECK (type IN ('NEW_BOOKING_REQUEST','WORKER_ASSIGNED',
                                          'BOOKING_CONFIRMED','BOOKING_CANCELLED',
                                          'BOOKING_COMPLETED','PAYMENT_RECEIVED',
                                          'PAYMENT_FAILED')),
    title              VARCHAR(255)  NOT NULL,
    message            TEXT          NOT NULL,
    booking_id         UUID          REFERENCES bookings(id),
    is_read            BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Speeds up the two most common queries: fetching a user's notification
-- feed, and counting their unread notifications.
CREATE INDEX idx_notifications_recipient_created ON notifications(recipient_user_id, created_at DESC);
CREATE INDEX idx_notifications_recipient_unread ON notifications(recipient_user_id, is_read) WHERE is_read = FALSE;