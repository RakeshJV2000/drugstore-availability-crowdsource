-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PUBLIC', 'STAFF', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('IN_STOCK', 'LOW', 'OUT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ReportSource" AS ENUM ('PUBLIC', 'STAFF', 'IMPORT');

-- CreateEnum
CREATE TYPE "FlagEntityType" AS ENUM ('REPORT', 'PHARMACY', 'USER');

-- CreateEnum
CREATE TYPE "FlagState" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PUBLIC',
    "reputation" INTEGER NOT NULL DEFAULT 0,
    "pharmacyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pharmacy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "phone" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "claimedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pharmacy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drug" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ndc" TEXT,
    "form" TEXT,
    "strength" TEXT,

    CONSTRAINT "Drug_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugSynonym" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,

    CONSTRAINT "DrugSynonym_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityReport" (
    "id" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL,
    "source" "ReportSource" NOT NULL DEFAULT 'PUBLIC',
    "userId" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusAggregate" (
    "id" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flag" (
    "id" TEXT NOT NULL,
    "entityType" "FlagEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "state" "FlagState" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Flag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "delta" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "radiusKm" DOUBLE PRECISION NOT NULL DEFAULT 10,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Pharmacy_lat_lng_idx" ON "Pharmacy"("lat", "lng");

-- CreateIndex
CREATE UNIQUE INDEX "Drug_name_key" ON "Drug"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Drug_ndc_key" ON "Drug"("ndc");

-- CreateIndex
CREATE UNIQUE INDEX "DrugSynonym_drugId_name_key" ON "DrugSynonym"("drugId", "name");

-- CreateIndex
CREATE INDEX "AvailabilityReport_drugId_pharmacyId_createdAt_idx" ON "AvailabilityReport"("drugId", "pharmacyId", "createdAt");

-- CreateIndex
CREATE INDEX "StatusAggregate_drugId_status_idx" ON "StatusAggregate"("drugId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StatusAggregate_drugId_pharmacyId_key" ON "StatusAggregate"("drugId", "pharmacyId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pharmacy" ADD CONSTRAINT "Pharmacy_claimedByUserId_fkey" FOREIGN KEY ("claimedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugSynonym" ADD CONSTRAINT "DrugSynonym_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityReport" ADD CONSTRAINT "AvailabilityReport_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityReport" ADD CONSTRAINT "AvailabilityReport_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityReport" ADD CONSTRAINT "AvailabilityReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusAggregate" ADD CONSTRAINT "StatusAggregate_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusAggregate" ADD CONSTRAINT "StatusAggregate_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flag" ADD CONSTRAINT "Flag_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
