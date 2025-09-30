const express = require('express');

const { getPrismaClient } = require('../src/db/client');
const config = require('../src/server/config');

const router = express.Router();

const prisma = config.databaseUrl ? getPrismaClient() : null;

function ensurePrismaAvailable(res) {
  if (!prisma) {
    res.status(503).json({ error: 'База данных временно недоступна.' });
    return false;
  }
  return true;
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }
  const {
    passwordHash,
    refreshTokenHash,
    contractorProfile,
    weddingProfile,
    ...safeUser
  } = user;
  return safeUser;
}

function buildProfileResponse(user) {
  if (!user) {
    return null;
  }
  const contractorProfile = user.contractorProfile ?? null;
  const weddingProfile = user.weddingProfile ?? null;
  let activeProfile = null;
  if (user.role === 'contractor') {
    activeProfile = contractorProfile;
  } else if (user.role === 'wedding') {
    activeProfile = weddingProfile;
  } else {
    activeProfile = weddingProfile || contractorProfile || null;
  }

  return {
    user: sanitizeUser(user),
    profile: activeProfile,
    contractorProfile,
    weddingProfile
  };
}

async function loadUserWithProfiles(userId) {
  if (!prisma || !userId) {
    return null;
  }
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      contractorProfile: true,
      weddingProfile: true
    }
  });
}

router.get('/', async (req, res) => {
  if (!ensurePrismaAvailable(res)) {
    return;
  }

  const userId = req.user?.sub;
  if (!userId) {
    return res.status(401).json({ error: 'Требуется авторизация.' });
  }

  try {
    const user = await loadUserWithProfiles(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден.' });
    }

    return res.json(buildProfileResponse(user));
  } catch (error) {
    console.error('Не удалось получить профиль пользователя', {
      error: error.message,
      stack: error.stack,
      userId,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({ error: 'Не удалось получить профиль.' });
  }
});

router.put('/', async (req, res) => {
  if (!ensurePrismaAvailable(res)) {
    return;
  }

  const userId = req.user?.sub;
  if (!userId) {
    return res.status(401).json({ error: 'Требуется авторизация.' });
  }

  const body = req.body || {};

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден.' });
    }

    if (user.role === 'contractor') {
      const updateData = {};
      if (Object.prototype.hasOwnProperty.call(body, 'companyName')) {
        if (typeof body.companyName !== 'string') {
          return res.status(400).json({ error: 'Название компании должно быть строкой.' });
        }
        updateData.companyName = body.companyName.trim();
      }
      if (Object.prototype.hasOwnProperty.call(body, 'description')) {
        if (body.description !== null && typeof body.description !== 'string') {
          return res.status(400).json({ error: 'Описание должно быть строкой или null.' });
        }
        if (typeof body.description === 'string') {
          const trimmed = body.description.trim();
          updateData.description = trimmed.length > 0 ? trimmed : null;
        } else {
          updateData.description = null;
        }
      }

      await prisma.contractorProfile.upsert({
        where: { userId },
        update: updateData,
        create: {
          userId,
          companyName: updateData.companyName ?? '',
          description: updateData.description ?? null
        }
      });
    } else {
      const updateData = {};
      if (Object.prototype.hasOwnProperty.call(body, 'coupleNames')) {
        if (typeof body.coupleNames !== 'string') {
          return res.status(400).json({ error: 'Имена пары должны быть строкой.' });
        }
        updateData.coupleNames = body.coupleNames.trim();
      }
      if (Object.prototype.hasOwnProperty.call(body, 'location')) {
        if (body.location !== null && typeof body.location !== 'string') {
          return res.status(400).json({ error: 'Локация должна быть строкой или null.' });
        }
        if (typeof body.location === 'string') {
          updateData.location = body.location.trim();
        } else {
          updateData.location = null;
        }
      }
      if (Object.prototype.hasOwnProperty.call(body, 'eventDate')) {
        if (body.eventDate === null || body.eventDate === '') {
          updateData.eventDate = null;
        } else if (typeof body.eventDate === 'string' || body.eventDate instanceof Date) {
          const parsed = new Date(body.eventDate);
          if (Number.isNaN(parsed.getTime())) {
            return res.status(400).json({ error: 'Неверный формат даты события.' });
          }
          updateData.eventDate = parsed;
        } else {
          return res.status(400).json({ error: 'Дата события должна быть строкой или null.' });
        }
      }

      await prisma.weddingProfile.upsert({
        where: { userId },
        update: updateData,
        create: {
          userId,
          coupleNames: updateData.coupleNames ?? '',
          location: updateData.location ?? null,
          eventDate: updateData.eventDate ?? null
        }
      });
    }

    const refreshedUser = await loadUserWithProfiles(userId);
    if (!refreshedUser) {
      return res.status(404).json({ error: 'Пользователь не найден.' });
    }

    return res.json(buildProfileResponse(refreshedUser));
  } catch (error) {
    console.error('Не удалось обновить профиль пользователя', {
      error: error.message,
      stack: error.stack,
      userId,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({ error: 'Не удалось обновить профиль.' });
  }
});

module.exports = router;
