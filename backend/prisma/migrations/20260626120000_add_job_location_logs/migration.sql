-- CreateTable
CREATE TABLE "job_location_logs" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "driver_id" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_location_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_location_logs_job_id_recorded_at_idx" ON "job_location_logs"("job_id", "recorded_at");

-- AddForeignKey
ALTER TABLE "job_location_logs" ADD CONSTRAINT "job_location_logs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
