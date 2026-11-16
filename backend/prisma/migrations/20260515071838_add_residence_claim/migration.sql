-- CreateEnum
CREATE TYPE "ResidenceClaimStatus" AS ENUM ('SUBMITTED', 'DUPLICATE_CANDIDATE', 'NEEDS_REVIEW', 'APPROVED', 'MERGED', 'REJECTED');

-- AlterEnum
ALTER TYPE "ActivityCategory" ADD VALUE 'RESIDENCE';

-- CreateTable
CREATE TABLE "residence_claims" (
    "id" SERIAL NOT NULL,
    "iam_claim_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "external_request_id" TEXT,
    "house_no" TEXT NOT NULL,
    "moo" TEXT,
    "village_name" TEXT,
    "province_id" INTEGER NOT NULL,
    "district_id" INTEGER NOT NULL,
    "subdistrict_id" INTEGER NOT NULL,
    "postal_code" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status_snapshot" "ResidenceClaimStatus" NOT NULL DEFAULT 'SUBMITTED',
    "selected_residence_id" TEXT,
    "review_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "residence_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "residence_claims_iam_claim_id_key" ON "residence_claims"("iam_claim_id");

-- CreateIndex
CREATE INDEX "residence_claims_user_id_idx" ON "residence_claims"("user_id");

-- CreateIndex
CREATE INDEX "residence_claims_status_snapshot_idx" ON "residence_claims"("status_snapshot");

-- AddForeignKey
ALTER TABLE "residence_claims" ADD CONSTRAINT "residence_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
