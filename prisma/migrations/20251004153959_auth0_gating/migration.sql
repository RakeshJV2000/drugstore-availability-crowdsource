/*
  Warnings:

  - A unique constraint covering the columns `[authSub]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[handle]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('AUTH0');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authProvider" "AuthProvider",
ADD COLUMN     "authSub" TEXT,
ADD COLUMN     "handle" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_authSub_key" ON "User"("authSub");

-- CreateIndex
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");
