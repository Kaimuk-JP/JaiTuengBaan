ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'EXECUTIVE';

ALTER TYPE "QueueStatus" ADD VALUE IF NOT EXISTS 'PENDING_EXECUTIVE';

ALTER TABLE "queues"
ADD COLUMN "executive_approved_by" TEXT,
ADD COLUMN "executive_approved_at" TIMESTAMP(3),
ADD COLUMN "executive_rejected_by" TEXT,
ADD COLUMN "executive_rejected_at" TIMESTAMP(3);
