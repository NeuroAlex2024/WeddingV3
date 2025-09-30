const { PrismaClient } = require('@prisma/client');

const config = require('../server/config');

let prisma;
let initialized = false;

function createPrismaClient() {
  const logLevels = (config.logging?.prisma ?? []).filter(Boolean);
  const prismaOptions = {};

  if (config.databaseUrl) {
    prismaOptions.datasources = {
      db: {
        url: config.databaseUrl
      }
    };
  }

  if (logLevels.length > 0) {
    prismaOptions.log = logLevels;
  }

  return new PrismaClient(prismaOptions);
}

function getPrismaClient() {
  if (!prisma) {
    prisma = createPrismaClient();
  }
  return prisma;
}

async function initializePrisma() {
  if (initialized) {
    return prisma;
  }

  if (!config.databaseUrl) {
    return null;
  }

  const client = getPrismaClient();
  await client.$connect();
  initialized = true;
  return client;
}

async function shutdownPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
    initialized = false;
  }
}

async function checkDatabaseConnection() {
  if (!config.databaseUrl) {
    return { ok: false, reason: 'missing_database_url' };
  }

  try {
    const client = await initializePrisma();
    if (!client) {
      return { ok: false, reason: 'missing_database_url' };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

module.exports = {
  getPrismaClient,
  initializePrisma,
  shutdownPrisma,
  checkDatabaseConnection
};
