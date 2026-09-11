-- AlterTable
ALTER TABLE "users" ADD COLUMN     "reset_password_otp" TEXT,
ADD COLUMN     "reset_password_otp_expiry" TIMESTAMP(3);
