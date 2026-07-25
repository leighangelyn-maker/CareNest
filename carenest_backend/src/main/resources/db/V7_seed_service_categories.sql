-- ============================================================================
-- CareNest - Seed initial service categories
-- Name this with the next available version number after V6.
-- Matches the three category buttons already built in the frontend
-- (Nanny / Cleaning / Cooking). id uses the table's gen_random_uuid()
-- default from V1, so no need to specify it here.
-- ============================================================================

INSERT INTO service_category (slug, service_type, work_description) VALUES
    ('nanny', 'Nanny', 'Childcare services including feeding, supervision, and educational play'),
    ('cleaning', 'Cleaning', 'Household cleaning services including general tidying and deep cleaning'),
    ('cooking', 'Cooking', 'Meal preparation and cooking services for the household');