-- First, we need to update the application_status enum to include new statuses
-- Drop the old enum and recreate with new values
ALTER TYPE application_status RENAME TO application_status_old;

CREATE TYPE application_status AS ENUM ('applied', 'under_review', 'shortlisted', 'offer_released', 'rejected', 'withdrawn');

-- Update the applications table to use the new enum
ALTER TABLE applications 
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE application_status USING (
    CASE status::text
      WHEN 'pending' THEN 'applied'::application_status
      WHEN 'approved' THEN 'offer_released'::application_status
      WHEN 'rejected' THEN 'rejected'::application_status
      WHEN 'withdrawn' THEN 'withdrawn'::application_status
      ELSE 'applied'::application_status
    END
  ),
  ALTER COLUMN status SET DEFAULT 'applied'::application_status;

-- Drop the old enum
DROP TYPE application_status_old;