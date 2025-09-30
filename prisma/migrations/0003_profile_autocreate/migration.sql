-- Alter user role to enum and ensure safe defaults for profiles

-- Create new enum type for user roles
CREATE TYPE "UserRole" AS ENUM ('guest', 'wedding', 'contractor');

-- Add temporary column with the new enum type
ALTER TABLE "User"
  ADD COLUMN "role_tmp" "UserRole" NOT NULL DEFAULT 'guest';

-- Normalize existing role values into the enum set
UPDATE "User"
SET "role_tmp" = CASE
  WHEN LOWER(COALESCE(NULLIF("role", ''), '')) = 'contractor' THEN 'contractor'::"UserRole"
  WHEN LOWER(COALESCE(NULLIF("role", ''), '')) = 'wedding' THEN 'wedding'::"UserRole"
  WHEN LOWER(COALESCE(NULLIF("role", ''), '')) = 'guest' THEN 'guest'::"UserRole"
  ELSE 'guest'::"UserRole"
END;

-- Drop old column and rename the new one
ALTER TABLE "User" DROP COLUMN "role";
ALTER TABLE "User" RENAME COLUMN "role_tmp" TO "role";

-- Ensure default is configured on the new column
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'guest';

-- Ensure profile text columns have safe defaults
ALTER TABLE "ContractorProfile" ALTER COLUMN "companyName" SET DEFAULT '';
ALTER TABLE "WeddingProfile" ALTER COLUMN "coupleNames" SET DEFAULT '';

-- Update existing data to respect the defaults
UPDATE "ContractorProfile"
SET "companyName" = COALESCE("companyName", '');

UPDATE "WeddingProfile"
SET "coupleNames" = COALESCE("coupleNames", '');

-- Insert missing contractor profiles
WITH normalized_users AS (
  SELECT
    "id",
    CASE
      WHEN "role" = 'contractor' THEN 'contractor'
      WHEN "role" = 'wedding' THEN 'wedding'
      ELSE 'guest'
    END AS normalized_role
  FROM "User"
)
INSERT INTO "ContractorProfile" ("id", "userId", "companyName", "description", "createdAt", "updatedAt")
SELECT gen_random_uuid(), u."id", '', NULL, NOW(), NOW()
FROM normalized_users u
LEFT JOIN "ContractorProfile" cp ON cp."userId" = u."id"
WHERE u.normalized_role = 'contractor'
  AND cp."id" IS NULL;

-- Insert missing wedding profiles (guest users receive a wedding profile by default)
WITH normalized_users AS (
  SELECT
    "id",
    CASE
      WHEN "role" = 'contractor' THEN 'contractor'
      WHEN "role" = 'wedding' THEN 'wedding'
      ELSE 'guest'
    END AS normalized_role
  FROM "User"
)
INSERT INTO "WeddingProfile" ("id", "userId", "coupleNames", "eventDate", "location", "createdAt", "updatedAt")
SELECT gen_random_uuid(), u."id", '', NULL, NULL, NOW(), NOW()
FROM normalized_users u
LEFT JOIN "WeddingProfile" wp ON wp."userId" = u."id"
WHERE u.normalized_role IN ('wedding', 'guest')
  AND wp."id" IS NULL;

-- Support guidance:
-- To backfill profiles manually for legacy accounts outside of migrations:
--   const users = await prisma.user.findMany();
--   await Promise.all(users.map(async (user) => {
--     if (user.role === 'contractor') {
--       await prisma.contractorProfile.upsert({
--         where: { userId: user.id },
--         update: {},
--         create: { userId: user.id }
--       });
--     } else {
--       await prisma.weddingProfile.upsert({
--         where: { userId: user.id },
--         update: {},
--         create: { userId: user.id }
--       });
--     }
--   }));
