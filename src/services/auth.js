const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const config = require('../server/config');

const SALT_ROUNDS = 12;

function ensureJwtSecret() {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is not configured.');
  }
}

async function hashPassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Password must be a non-empty string.');
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
  if (!hash) {
    return false;
  }
  if (typeof password !== 'string' || password.length === 0) {
    return false;
  }
  return bcrypt.compare(password, hash);
}

function issueTokens(user, { refreshToken = null } = {}) {
  ensureJwtSecret();

  const payload = {
    sub: user.id,
    role: user.role,
    phone: user.phone
  };

  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtAccessTtl || '15m'
  });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresInMs: config.jwtAccessTtlMs,
    refreshTokenExpiresInMs: config.jwtRefreshTtlMs
  };
}

function verifyAccessToken(token) {
  ensureJwtSecret();
  return jwt.verify(token, config.jwtSecret);
}

async function rotateRefreshToken(prisma, userId) {
  if (!prisma) {
    throw new Error('Prisma client instance is required to rotate refresh token.');
  }
  if (!userId) {
    throw new Error('User id is required to rotate refresh token.');
  }

  const refreshToken = crypto.randomBytes(48).toString('hex');
  const refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash }
  });

  return refreshToken;
}

module.exports = {
  hashPassword,
  verifyPassword,
  issueTokens,
  verifyAccessToken,
  rotateRefreshToken
};
