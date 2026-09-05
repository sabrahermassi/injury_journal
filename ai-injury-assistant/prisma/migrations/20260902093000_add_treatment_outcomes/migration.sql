/*
  Mirror of backend/prisma/migrations/20260831045744_add_treatment_outcomes.

  backend/prisma/ owns these tables in the shared database; this copy exists
  only so the standalone database built for integration tests and the
  evaluation harness has the same shape. It must never run against the shared
  database -- scripts/assert-local-db.mjs enforces that, and
  `npm run dev:migrate:local` is the guarded entry point.

  `TreatmentOutcome` records how a treatment actually worked out, logged after
  the fact. Until now this service did not declare it at all, so treatment
  check-ins (status, relief days, post-treatment pain) were invisible to
  retrieval and effectiveness could only be inferred from the older free-text
  Treatment.outcome column.
*/

-- AlterTable
ALTER TABLE "Treatment" ADD COLUMN     "courseId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "followUpDueAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "TreatmentOutcome" (
    "id" SERIAL NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "reliefDays" INTEGER,
    "painLevel" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "treatmentId" INTEGER NOT NULL,

    CONSTRAINT "TreatmentOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TreatmentOutcome_treatmentId_idx" ON "TreatmentOutcome"("treatmentId");

-- AddForeignKey
ALTER TABLE "TreatmentOutcome" ADD CONSTRAINT "TreatmentOutcome_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
