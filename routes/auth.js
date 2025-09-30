const express = require('express');

const { getPrismaClient } = require('../src/db/client');
const config = require('../src/server/config');
const { requireAuth } = require('../src/middleware/auth');
const {
  hashPassword,
  verifyPassword,
  issueTokens,
  rotateRefreshToken
} = require('../src/services/auth');

const prisma = getPrismaClient();
const router = express.Router();

const ALLOWED_REGISTRATION_ROLES = new Set(['wedding', 'contractor']);

function normalizeRole(role) {
  if (!role || typeof role !== 'string') {
    return null;
  }
  const normalized = role.trim().toLowerCase();
  return normalized && ALLOWED_REGISTRATION_ROLES.has(normalized) ? normalized : null;
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const {
    passwordHash,
    refreshTokenHash,
    ...safeUser
  } = user;

  return safeUser;
}

function setRefreshCookie(res, token) {
  const baseOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.env === 'production',
    path: '/'
  };

  if (token && config.jwtRefreshTtlMs) {
    baseOptions.maxAge = config.jwtRefreshTtlMs;
  }

  if (!token) {
    res.cookie('refreshToken', '', { ...baseOptions, maxAge: 0 });
    return;
  }

  res.cookie('refreshToken', token, baseOptions);
}

router.post('/register', async (req, res) => {
  const { phone, password, email, role } = req.body || {};

  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({ error: 'Необходимо указать номер телефона.' });
  }
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Необходимо указать одноразовый пароль.' });
  }

  const normalizedRoleCandidate = normalizeRole(role);
  if (role !== undefined && role !== null && normalizedRoleCandidate === null) {
    return res.status(400).json({ error: 'Недопустимая роль пользователя.' });
  }
  const normalizedRole = normalizedRoleCandidate || 'wedding';

  try {
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return res.status(409).json({ error: 'Пользователь с таким телефоном уже зарегистрирован.' });
    }

    const passwordHash = await hashPassword(password);
    const createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone,
          email: email ? email : null,
          passwordHash,
          phoneConfirmed: true,
          role: normalizedRole
        }
      });

      if (normalizedRole === 'contractor') {
        await tx.contractorProfile.create({
          data: {
            userId: user.id
          }
        });
      } else {
        await tx.weddingProfile.create({
          data: {
            userId: user.id
          }
        });
      }

      return user;
    });

    const refreshToken = await rotateRefreshToken(prisma, createdUser.id);
    const tokens = issueTokens(createdUser, { refreshToken });
    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      user: sanitizeUser(createdUser),
      accessToken: tokens.accessToken,
      accessTokenExpiresInMs: tokens.accessTokenExpiresInMs,
      refreshTokenExpiresInMs: tokens.refreshTokenExpiresInMs
    });
  } catch (error) {
    console.error('Не удалось зарегистрировать пользователя', {
      error: error.message,
      stack: error.stack,
      phone,
      role: normalizedRole,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({ error: 'Не удалось создать пользователя. Попробуйте позже.' });
  }
});

router.post('/login', async (req, res) => {
  const { phone, password } = req.body || {};

  if (!phone || typeof phone !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Необходимо указать телефон и пароль.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(401).json({ error: 'Неверный телефон или пароль.' });
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный телефон или пароль.' });
    }

    const refreshToken = await rotateRefreshToken(prisma, user.id);
    const tokens = issueTokens(user, { refreshToken });
    setRefreshCookie(res, refreshToken);

    return res.json({
      user: sanitizeUser(user),
      accessToken: tokens.accessToken,
      accessTokenExpiresInMs: tokens.accessTokenExpiresInMs,
      refreshTokenExpiresInMs: tokens.refreshTokenExpiresInMs
    });
  } catch (error) {
    console.error('Не удалось выполнить вход', error);
    return res.status(500).json({ error: 'Не удалось выполнить вход. Попробуйте позже.' });
  }
});

router.post('/logout', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { refreshTokenHash: null }
      });
    }
  } catch (error) {
    console.error('Не удалось завершить сессию', error);
  }

  setRefreshCookie(res, null);
  return res.status(204).send();
});

module.exports = router;
