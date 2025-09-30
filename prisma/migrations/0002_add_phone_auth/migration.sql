-- AlterTable
ALTER TABLE "User"
  ALTER COLUMN "email" DROP NOT NULL;

ALTER TABLE "User"
  ADD COLUMN     "phone" TEXT,
  ADD COLUMN     "phoneConfirmed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'guest',
  ADD COLUMN     "refreshTokenHash" TEXT;

UPDATE "User"
SET "phone" = CONCAT('migration_', "id")
WHERE "phone" IS NULL;

ALTER TABLE "User"
  ALTER COLUMN "phone" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");
