-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "StudentLevel" AS ENUM ('UNDERGRADUATE', 'MASTER', 'DOCTORAL');

-- CreateEnum
CREATE TYPE "LaboratoryType" AS ENUM ('NORMAL', 'ADVANCED', 'EQUIPMENT');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'DISABLED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING_TEACHER', 'PENDING_ADMIN', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'MISSED');

-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CheckInMethod" AS ENUM ('CODE', 'QR');

-- CreateEnum
CREATE TYPE "ViolationType" AS ENUM ('NO_SHOW', 'FREQUENT_CANCEL', 'UNAUTHORIZED_ACCESS');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "studentNumber" TEXT,
    "studentLevel" "StudentLevel",
    "teacherNumber" TEXT,
    "teacherId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laboratories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LaboratoryType" NOT NULL,
    "description" TEXT,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "maxPeople" INTEGER NOT NULL,
    "advanceDays" INTEGER NOT NULL DEFAULT 7,
    "requiresTeacherApproval" BOOLEAN NOT NULL DEFAULT false,
    "requiresAdminApproval" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laboratories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" SERIAL NOT NULL,
    "laboratoryId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "requirements" TEXT,
    "requiresTeacherApproval" BOOLEAN NOT NULL DEFAULT false,
    "minimumStudentLevel" "StudentLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "laboratoryId" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "peopleCount" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_equipment" (
    "reservationId" INTEGER NOT NULL,
    "equipmentId" INTEGER NOT NULL,

    CONSTRAINT "reservation_equipment_pkey" PRIMARY KEY ("reservationId","equipmentId")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" SERIAL NOT NULL,
    "reservationId" INTEGER NOT NULL,
    "approverId" INTEGER NOT NULL,
    "type" "ApprovalType" NOT NULL,
    "decision" "ApprovalDecision" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" SERIAL NOT NULL,
    "reservationId" INTEGER NOT NULL,
    "method" "CheckInMethod" NOT NULL,
    "verificationCode" TEXT,
    "qrToken" TEXT,
    "checkedInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "violations" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "reservationId" INTEGER,
    "type" "ViolationType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "violations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_studentNumber_key" ON "users"("studentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "users_teacherNumber_key" ON "users"("teacherNumber");

-- CreateIndex
CREATE INDEX "users_teacherId_idx" ON "users"("teacherId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "laboratories_name_key" ON "laboratories"("name");

-- CreateIndex
CREATE INDEX "laboratories_type_idx" ON "laboratories"("type");

-- CreateIndex
CREATE INDEX "laboratories_isActive_idx" ON "laboratories"("isActive");

-- CreateIndex
CREATE INDEX "equipment_laboratoryId_idx" ON "equipment"("laboratoryId");

-- CreateIndex
CREATE INDEX "equipment_status_idx" ON "equipment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_laboratoryId_name_key" ON "equipment"("laboratoryId", "name");

-- CreateIndex
CREATE INDEX "reservations_laboratoryId_startAt_endAt_idx" ON "reservations"("laboratoryId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "reservations_studentId_startAt_idx" ON "reservations"("studentId", "startAt");

-- CreateIndex
CREATE INDEX "reservations_status_idx" ON "reservations"("status");

-- CreateIndex
CREATE INDEX "reservation_equipment_equipmentId_idx" ON "reservation_equipment"("equipmentId");

-- CreateIndex
CREATE INDEX "approvals_approverId_idx" ON "approvals"("approverId");

-- CreateIndex
CREATE INDEX "approvals_decision_idx" ON "approvals"("decision");

-- CreateIndex
CREATE UNIQUE INDEX "approvals_reservationId_type_key" ON "approvals"("reservationId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "check_ins_reservationId_key" ON "check_ins"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "check_ins_qrToken_key" ON "check_ins"("qrToken");

-- CreateIndex
CREATE INDEX "violations_userId_idx" ON "violations"("userId");

-- CreateIndex
CREATE INDEX "violations_reservationId_idx" ON "violations"("reservationId");

-- CreateIndex
CREATE INDEX "violations_type_idx" ON "violations"("type");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "laboratories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "laboratories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_equipment" ADD CONSTRAINT "reservation_equipment_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_equipment" ADD CONSTRAINT "reservation_equipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
