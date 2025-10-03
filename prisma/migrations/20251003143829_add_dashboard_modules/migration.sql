-- AlterTable
ALTER TABLE "ContractorProfile"
  ADD COLUMN "timeline" TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN "checklist" TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN "checklistFolders" TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN "budgetEntries" TEXT NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "WeddingProfile"
  ADD COLUMN "timeline" TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN "checklist" TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN "checklistFolders" TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN "budgetEntries" TEXT NOT NULL DEFAULT '[]';
