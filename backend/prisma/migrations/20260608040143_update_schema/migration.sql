-- CreateTable
CREATE TABLE "iam_user_residences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "membership_id" TEXT NOT NULL,
    "residence_id" TEXT NOT NULL,
    "residence_code" TEXT,
    "role" TEXT,
    "status" TEXT,
    "verified_at" TIMESTAMP(3),
    "formatted_address" TEXT,
    "house_no" TEXT,
    "moo" TEXT,
    "village_name" TEXT,
    "building_name" TEXT,
    "floor" TEXT,
    "room_no" TEXT,
    "soi" TEXT,
    "road" TEXT,
    "postal_code" TEXT,
    "province_name_th" TEXT,
    "district_name_th" TEXT,
    "subdistrict_name_th" TEXT,
    "municipality_name" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "iam_user_residences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "iam_user_residences_user_id_idx" ON "iam_user_residences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "iam_user_residences_user_id_membership_id_key" ON "iam_user_residences"("user_id", "membership_id");

-- AddForeignKey
ALTER TABLE "iam_user_residences" ADD CONSTRAINT "iam_user_residences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
