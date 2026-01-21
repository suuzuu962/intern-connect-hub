-- Add 'offer_accepted' to the application_status enum
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'offer_accepted';