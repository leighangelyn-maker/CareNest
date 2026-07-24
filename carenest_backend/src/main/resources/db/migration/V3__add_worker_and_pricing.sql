-- ============================================================================
-- CareNest - Add Worker entity, Agency location, Booking pricing/assignment
-- This is V3__add_worker_and_pricing.sql in your actual migration folder.
-- ============================================================================

-- Agency location fields, used by the Worker Search API for filtering.
ALTER TABLE agencies ADD COLUMN city VARCHAR(255);
ALTER TABLE agencies ADD COLUMN region VARCHAR(255);

-- Worker table: agency-owned staff, one service-category specialty each.
-- Table is "service_category" (singular) - matches the actual table created
-- in V1__init_schema.sql, NOT the (incorrect) plural name that was in the
-- Java @Table annotation before this round of fixes.
CREATE TABLE workers (
    id UUID PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id),
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    service_category_id UUID NOT NULL REFERENCES service_category(id),
    default_hourly_rate_minor_units INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Booking gets a nullable link to the assigned worker, plus a flag marking
-- whether the price was manually overridden (so worker assignment/
-- reassignment knows not to clobber a manual price).
ALTER TABLE bookings ADD COLUMN worker_id UUID REFERENCES workers(id);
ALTER TABLE bookings ADD COLUMN price_overridden BOOLEAN DEFAULT FALSE;