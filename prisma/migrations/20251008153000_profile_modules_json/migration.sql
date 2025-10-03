-- AlterTable
ALTER TABLE "ContractorProfile"
  ALTER COLUMN "timeline" DROP DEFAULT,
  ALTER COLUMN "timeline" TYPE JSONB USING COALESCE(NULLIF("timeline", ''), '[]')::jsonb,
  ALTER COLUMN "timeline" SET DEFAULT '[]'::jsonb,
  ALTER COLUMN "checklist" DROP DEFAULT,
  ALTER COLUMN "checklist" TYPE JSONB USING COALESCE(NULLIF("checklist", ''), '[]')::jsonb,
  ALTER COLUMN "checklist" SET DEFAULT '[]'::jsonb,
  ALTER COLUMN "checklistFolders" DROP DEFAULT,
  ALTER COLUMN "checklistFolders" TYPE JSONB USING COALESCE(NULLIF("checklistFolders", ''), '[]')::jsonb,
  ALTER COLUMN "checklistFolders" SET DEFAULT '[]'::jsonb,
  ALTER COLUMN "budgetEntries" DROP DEFAULT,
  ALTER COLUMN "budgetEntries" TYPE JSONB USING COALESCE(NULLIF("budgetEntries", ''), '[]')::jsonb,
  ALTER COLUMN "budgetEntries" SET DEFAULT '[]'::jsonb;

ALTER TABLE "WeddingProfile"
  ALTER COLUMN "timeline" DROP DEFAULT,
  ALTER COLUMN "timeline" TYPE JSONB USING COALESCE(NULLIF("timeline", ''), '[]')::jsonb,
  ALTER COLUMN "timeline" SET DEFAULT '[]'::jsonb,
  ALTER COLUMN "checklist" DROP DEFAULT,
  ALTER COLUMN "checklist" TYPE JSONB USING COALESCE(NULLIF("checklist", ''), '[]')::jsonb,
  ALTER COLUMN "checklist" SET DEFAULT '[]'::jsonb,
  ALTER COLUMN "checklistFolders" DROP DEFAULT,
  ALTER COLUMN "checklistFolders" TYPE JSONB USING COALESCE(NULLIF("checklistFolders", ''), '[]')::jsonb,
  ALTER COLUMN "checklistFolders" SET DEFAULT '[]'::jsonb,
  ALTER COLUMN "budgetEntries" DROP DEFAULT,
  ALTER COLUMN "budgetEntries" TYPE JSONB USING COALESCE(NULLIF("budgetEntries", ''), '[]')::jsonb,
  ALTER COLUMN "budgetEntries" SET DEFAULT '[]'::jsonb;
