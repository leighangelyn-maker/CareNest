-- ============================================================================
-- CareNest - Allow FamilyProfile to be created at registration time without
-- emergency contact info (RegisterRequest doesn't collect it - it should be
-- filled in later via a proper profile-completion / update-profile flow).
-- Name this with the next available version number.
-- ============================================================================

ALTER TABLE family_profiles ALTER COLUMN emergency_contact_name DROP NOT NULL;
ALTER TABLE family_profiles ALTER COLUMN emergency_contact_phone DROP NOT NULL;