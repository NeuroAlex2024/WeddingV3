const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

function readEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === null || String(value).trim() === '') {
    if (fallback === undefined) {
      throw new Error(`Environment variable ${name} is required.`);
    }
    return String(fallback).trim();
  }
  return String(value).trim();
}

const host = readEnv('HOST', '0.0.0.0');
const portValue = readEnv('PORT', '3000');
const port = Number(portValue);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error(`Environment variable PORT must be a valid integer between 1 and 65535. Received: ${portValue}`);
}

const databaseUrl = readEnv('DATABASE_URL');
const jwtSecret = readEnv('JWT_SECRET');

const config = {
  env: process.env.NODE_ENV || 'development',
  host,
  port,
  databaseUrl,
  jwtSecret
};

module.exports = config;
