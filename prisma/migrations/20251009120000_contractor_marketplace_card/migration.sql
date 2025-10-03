-- AlterTable
ALTER TABLE "ContractorProfile"
  ADD COLUMN     "services" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN     "portfolio" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN     "priceFrom" INTEGER,
  ADD COLUMN     "coverImageUrl" TEXT,
  ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false;
