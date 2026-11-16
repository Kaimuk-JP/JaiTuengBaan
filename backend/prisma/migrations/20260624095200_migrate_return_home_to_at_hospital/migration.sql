-- Migrate in-progress jobs: old RETURN_HOME (at hospital) → AT_HOSPITAL
UPDATE "jobs"
SET "status" = 'AT_HOSPITAL'
WHERE "status" = 'RETURN_HOME'
  AND "patient_dropped_off_at" IS NULL
  AND "return_pickup_requested_at" IS NULL;
