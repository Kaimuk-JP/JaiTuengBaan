/*
  Warnings:

  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `refresh_token_expiry` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "return_evidence_url" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "email",
DROP COLUMN "refresh_token_expiry",
ADD COLUMN     "district_id" INTEGER,
ADD COLUMN     "province_id" INTEGER,
ADD COLUMN     "residence_id" TEXT,
ADD COLUMN     "subdistrict_id" INTEGER;
