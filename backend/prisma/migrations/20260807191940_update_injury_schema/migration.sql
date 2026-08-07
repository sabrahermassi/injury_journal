/*
  Warnings:

  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Injury" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MedicalVisit" ALTER COLUMN "doctor" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Symptom" ALTER COLUMN "location" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User"
ALTER COLUMN "updatedAt" SET NOT NULL;
