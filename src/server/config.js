const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(process.cwd(), '.env');
const envFileExists = fs.existsSync(envPath);
const envResult = dotenv.config({ path: envPath });

if (envResult.error && envResult.error.code !== 'ENOENT') {
  throw envResult.error;
}

function readEnv(name, { required = false, defaultValue, transform } = {}) {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === '') {
    if (required && defaultValue === undefined) {
      throw new Error(`Environment variable ${name} is required.`);
    }
    return defaultValue;
  }

  const value = String(rawValue).trim();
  return transform ? transform(value) : value;
}

const lifecycleEvent = process.env.npm_lifecycle_event || '';
const isPrismaLifecycle = lifecycleEvent.startsWith('prisma:') || process.argv.some((arg) => arg.includes('prisma'));
const allowIncompleteSecrets = Boolean(process.env.ALLOW_INCOMPLETE_SECRETS);
const secretsRequired = !isPrismaLifecycle && !allowIncompleteSecrets;

const host = readEnv('HOST', { defaultValue: '0.0.0.0' });
const port = readEnv('PORT', {
  defaultValue: 3000,
  transform: (value) => {
    const numeric = Number(value);
    if (!Number.isInteger(numeric) || numeric <= 0 || numeric > 65535) {
      throw new Error(`Environment variable PORT must be a valid integer between 1 and 65535. Received: ${value}`);
    }
    return numeric;
  }
});

const databaseUrl = readEnv('DATABASE_URL', {
  required: secretsRequired,
  defaultValue: null
});

const jwtSecret = readEnv('JWT_SECRET', {
  required: secretsRequired,
  defaultValue: null
});

const locale = readEnv('APP_LOCALE', { defaultValue: 'ru-RU' });
const logLevel = readEnv('LOG_LEVEL', { defaultValue: 'info' });
const httpLogFormat = readEnv('HTTP_LOG_FORMAT', { defaultValue: 'dev' });
const prismaLogLevelsRaw = readEnv('PRISMA_LOG_LEVELS', { defaultValue: 'warn,error' });
const allowedPrismaLevels = new Set(['query', 'info', 'warn', 'error']);
const prismaLogLevels = prismaLogLevelsRaw
  .split(',')
  .map((level) => level.trim())
  .filter((level) => level && allowedPrismaLevels.has(level));

const config = {
  env: process.env.NODE_ENV || 'development',
  envFileExists,
  host,
  port,
  locale,
  logging: {
    level: logLevel,
    httpFormat: httpLogFormat,
    prisma: prismaLogLevels
  },
  databaseUrl,
  jwtSecret,
  secretsRequired
};

module.exports = config;
