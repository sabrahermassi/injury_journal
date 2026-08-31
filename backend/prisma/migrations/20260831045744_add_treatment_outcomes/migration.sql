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

