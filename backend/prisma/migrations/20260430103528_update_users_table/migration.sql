-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('VEHICLE', 'DRIVER', 'CAREU');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USERS', 'CAREGIVER', 'DRIVE', 'CAREU', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "MobilityStatus" AS ENUM ('WALKING', 'WHEELCHAIR', 'BEDRIDDEN');

-- CreateEnum
CREATE TYPE "SeverityLevel" AS ENUM ('GREEN', 'YELLOW', 'RED');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('PENDING_MUNICIPAL', 'APPROVED', 'CONFIRMED', 'REJECTED', 'CANCELLED_BY_USER', 'CANCELLED_BY_MUNICIPAL');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'ASSIGNED', 'ACCEPTED', 'REJECTED', 'PICKING_UP', 'COMPLETED', 'CANCELLED', 'IN_TRANSIT', 'RETURN_HOME', 'RETURN_OFFICE');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('BENZENE', 'GASOHOL_91', 'GASOHOL_95', 'GASOHOL_E20', 'GASOHOL_E85', 'DIESEL', 'ELECTRIC');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('READY', 'MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('FAMILY', 'RELATIVE', 'CLOSE_PERSON');

-- CreateEnum
CREATE TYPE "CaregiverStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EditRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('AUTH', 'QUEUE', 'JOB', 'CAREGIVER', 'USER', 'VEHICLE', 'REWARD', 'SETTING');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "phone" TEXT,
    "logo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "picture_url" TEXT,
    "role" "Role",
    "phone" TEXT,
    "mobility_status" "MobilityStatus",
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "special_needs" TEXT,
    "points_balance" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "address_detail" TEXT,
    "birth_date" TIMESTAMP(3),
    "country" TEXT DEFAULT 'ประเทศไทย',
    "custom_diseases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deleted_at" TIMESTAMP(3),
    "district" TEXT,
    "email" TEXT,
    "first_name" TEXT,
    "gender" TEXT,
    "iam_user_id" TEXT NOT NULL,
    "id_card" TEXT,
    "last_name" TEXT,
    "organization_id" TEXT,
    "privacyAcceptedAt" TIMESTAMP(3),
    "privacyVersion" TEXT,
    "province" TEXT,
    "refresh_token" TEXT,
    "refresh_token_expiry" TIMESTAMP(3),
    "relative_name" TEXT,
    "relative_phone" TEXT,
    "sub_district" TEXT,
    "village" TEXT,
    "house_number" TEXT,
    "neighbourhood" TEXT,
    "place_name" TEXT,
    "postcode" TEXT,
    "road" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caregiver_patients" (
    "id" SERIAL NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "relationship" "RelationshipType" NOT NULL DEFAULT 'RELATIVE',
    "additional_details" TEXT,
    "document_url" TEXT,
    "status" "CaregiverStatus" NOT NULL DEFAULT 'PENDING',
    "reject_reason" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caregiver_patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_diseases" (
    "userId" TEXT NOT NULL,
    "diseaseId" INTEGER NOT NULL,

    CONSTRAINT "user_diseases_pkey" PRIMARY KEY ("userId","diseaseId")
);

-- CreateTable
CREATE TABLE "queues" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "department" TEXT,
    "request_date" TIMESTAMP(3) NOT NULL,
    "has_appointment" BOOLEAN NOT NULL DEFAULT false,
    "appointment_image" TEXT,
    "severity_level" "SeverityLevel" NOT NULL DEFAULT 'GREEN',
    "required_volunteers" INTEGER NOT NULL DEFAULT 0,
    "status" "QueueStatus" NOT NULL DEFAULT 'PENDING_MUNICIPAL',
    "admin_note" TEXT,
    "reject_reason" TEXT,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "confirmed_by_user" BOOLEAN NOT NULL DEFAULT false,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "booking_time" TEXT,
    "created_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "hospital_id" INTEGER,
    "notification_read_at" TIMESTAMP(3),
    "required_equipment" TEXT,
    "want_care_u" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "queues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" SERIAL NOT NULL,
    "queue_id" INTEGER NOT NULL,
    "vlt_id" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'OPEN',
    "distance_km" DOUBLE PRECISION,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "rating_score" INTEGER,
    "earned_points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "patient_dropped_off_at" TIMESTAMP(3),
    "rating_comment" TEXT,
    "start_lat" DOUBLE PRECISION,
    "start_lng" DOUBLE PRECISION,
    "vehicle_id" INTEGER,
    "careu_id" TEXT,
    "careu_rating_comment" TEXT,
    "careu_rating_score" INTEGER,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_edit_requests" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "requested_changes" JSONB NOT NULL,
    "new_picture_url" TEXT,
    "status" "EditRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "reject_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_edit_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rewards" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "points_cost" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT -1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redemptions" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "reward_id" INTEGER NOT NULL,
    "points_used" INTEGER NOT NULL,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "reject_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_stock_history" (
    "id" SERIAL NOT NULL,
    "reward_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "quantity_before" INTEGER NOT NULL,
    "quantity_after" INTEGER NOT NULL,
    "quantity_change" INTEGER NOT NULL,
    "note" TEXT,
    "staff_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_stock_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospitals" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lng" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diseases" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diseases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "category" "ActivityCategory" NOT NULL DEFAULT 'AUTH',
    "entity_id" TEXT,
    "entity_type" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device" TEXT,
    "before" JSONB,
    "after" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_time_slots" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_time_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_time_slots" (
    "id" SERIAL NOT NULL,
    "resource_type" "ResourceType" NOT NULL,
    "resource_id" TEXT NOT NULL,
    "booking_date" TIMESTAMP(3) NOT NULL,
    "booking_time" TEXT NOT NULL,
    "job_id" INTEGER NOT NULL,
    "queue_id" INTEGER NOT NULL,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_time_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" SERIAL NOT NULL,
    "license_plate" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fuel_type" "FuelType",
    "brand" TEXT,
    "model" TEXT,
    "color" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "total_mileage_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "status" "VehicleStatus" NOT NULL DEFAULT 'READY',
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_mileage_logs" (
    "id" SERIAL NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "job_id" INTEGER NOT NULL,
    "mileage_before" DOUBLE PRECISION NOT NULL,
    "mileage_after" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_mileage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipal_ratings" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "punctuality" INTEGER NOT NULL,
    "booking_ease" INTEGER NOT NULL,
    "vehicle_clean" INTEGER NOT NULL,
    "safety" INTEGER NOT NULL,
    "staff_attitude" INTEGER NOT NULL,
    "overall_score" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "municipal_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_iam_user_id_key" ON "users"("iam_user_id");

-- CreateIndex
CREATE INDEX "users_role_organization_id_idx" ON "users"("role", "organization_id");

-- CreateIndex
CREATE INDEX "users_iam_user_id_idx" ON "users"("iam_user_id");

-- CreateIndex
CREATE INDEX "caregiver_patients_caregiver_id_idx" ON "caregiver_patients"("caregiver_id");

-- CreateIndex
CREATE INDEX "caregiver_patients_patient_id_idx" ON "caregiver_patients"("patient_id");

-- CreateIndex
CREATE INDEX "caregiver_patients_status_idx" ON "caregiver_patients"("status");

-- CreateIndex
CREATE UNIQUE INDEX "caregiver_patients_caregiver_id_patient_id_key" ON "caregiver_patients"("caregiver_id", "patient_id");

-- CreateIndex
CREATE INDEX "queues_user_id_idx" ON "queues"("user_id");

-- CreateIndex
CREATE INDEX "queues_status_request_date_idx" ON "queues"("status", "request_date");

-- CreateIndex
CREATE INDEX "queues_hospital_id_idx" ON "queues"("hospital_id");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_queue_id_key" ON "jobs"("queue_id");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "jobs_vlt_id_idx" ON "jobs"("vlt_id");

-- CreateIndex
CREATE INDEX "jobs_careu_id_idx" ON "jobs"("careu_id");

-- CreateIndex
CREATE INDEX "jobs_completed_at_idx" ON "jobs"("completed_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "profile_edit_requests_user_id_status_idx" ON "profile_edit_requests"("user_id", "status");

-- CreateIndex
CREATE INDEX "redemptions_user_id_status_idx" ON "redemptions"("user_id", "status");

-- CreateIndex
CREATE INDEX "reward_stock_history_reward_id_idx" ON "reward_stock_history"("reward_id");

-- CreateIndex
CREATE UNIQUE INDEX "hospitals_name_key" ON "hospitals"("name");

-- CreateIndex
CREATE INDEX "hospitals_name_idx" ON "hospitals"("name");

-- CreateIndex
CREATE UNIQUE INDEX "diseases_name_key" ON "diseases"("name");

-- CreateIndex
CREATE INDEX "diseases_name_idx" ON "diseases"("name");

-- CreateIndex
CREATE INDEX "equipment_organization_id_idx" ON "equipment"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_name_organization_id_key" ON "equipment"("name", "organization_id");

-- CreateIndex
CREATE INDEX "activity_logs_category_idx" ON "activity_logs"("category");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_success_idx" ON "activity_logs"("success");

-- CreateIndex
CREATE INDEX "booking_time_slots_organization_id_is_active_idx" ON "booking_time_slots"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "booking_time_slots_label_organization_id_key" ON "booking_time_slots"("label", "organization_id");

-- CreateIndex
CREATE INDEX "resource_time_slots_resource_type_resource_id_booking_date__idx" ON "resource_time_slots"("resource_type", "resource_id", "booking_date", "booking_time");

-- CreateIndex
CREATE INDEX "resource_time_slots_organization_id_booking_date_booking_ti_idx" ON "resource_time_slots"("organization_id", "booking_date", "booking_time");

-- CreateIndex
CREATE INDEX "resource_time_slots_job_id_idx" ON "resource_time_slots"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_license_plate_key" ON "vehicles"("license_plate");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_mileage_logs_job_id_key" ON "vehicle_mileage_logs"("job_id");

-- CreateIndex
CREATE INDEX "vehicle_mileage_logs_vehicle_id_idx" ON "vehicle_mileage_logs"("vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "municipal_ratings_job_id_key" ON "municipal_ratings"("job_id");

-- CreateIndex
CREATE INDEX "municipal_ratings_organization_id_idx" ON "municipal_ratings"("organization_id");

-- CreateIndex
CREATE INDEX "municipal_ratings_user_id_idx" ON "municipal_ratings"("user_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caregiver_patients" ADD CONSTRAINT "caregiver_patients_caregiver_id_fkey" FOREIGN KEY ("caregiver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caregiver_patients" ADD CONSTRAINT "caregiver_patients_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caregiver_patients" ADD CONSTRAINT "caregiver_patients_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_diseases" ADD CONSTRAINT "user_diseases_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "diseases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_diseases" ADD CONSTRAINT "user_diseases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queues" ADD CONSTRAINT "queues_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queues" ADD CONSTRAINT "queues_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queues" ADD CONSTRAINT "queues_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queues" ADD CONSTRAINT "queues_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_careu_id_fkey" FOREIGN KEY ("careu_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "queues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_vlt_id_fkey" FOREIGN KEY ("vlt_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_edit_requests" ADD CONSTRAINT "profile_edit_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_edit_requests" ADD CONSTRAINT "profile_edit_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_stock_history" ADD CONSTRAINT "reward_stock_history_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_stock_history" ADD CONSTRAINT "reward_stock_history_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_time_slots" ADD CONSTRAINT "booking_time_slots_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_time_slots" ADD CONSTRAINT "resource_time_slots_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_time_slots" ADD CONSTRAINT "resource_time_slots_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "queues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_mileage_logs" ADD CONSTRAINT "vehicle_mileage_logs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_mileage_logs" ADD CONSTRAINT "vehicle_mileage_logs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "municipal_ratings" ADD CONSTRAINT "municipal_ratings_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "municipal_ratings" ADD CONSTRAINT "municipal_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "municipal_ratings" ADD CONSTRAINT "municipal_ratings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
