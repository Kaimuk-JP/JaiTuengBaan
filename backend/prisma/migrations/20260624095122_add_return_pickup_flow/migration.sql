-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "JobStatus" ADD VALUE 'AT_HOSPITAL';
ALTER TYPE "JobStatus" ADD VALUE 'AT_PATIENT_HOME';

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "driver_delivered_at" TIMESTAMP(3),
ADD COLUMN     "return_pickup_requested_at" TIMESTAMP(3),
ADD COLUMN     "return_pickup_requested_by" TEXT;
