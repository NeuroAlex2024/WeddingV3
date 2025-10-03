const express = require('express');

const { getPrismaClient } = require('../src/db/client');
const config = require('../src/server/config');
const {
  DEFAULT_CHECKLIST_ITEMS,
  DEFAULT_CHECKLIST_FOLDERS,
  DEFAULT_BUDGET_ENTRIES,
  DEFAULT_WEDDING_TIMELINE,
  DEFAULT_CONTRACTOR_TIMELINE
} = require('../src/server/profile-defaults');

const router = express.Router();

const prisma = config.databaseUrl ? getPrismaClient() : null;

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const clone = (value) => JSON.parse(JSON.stringify(value));

const coerceArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  return [];
};

const sanitizeTimelineInput = (value, role, { fallbackOnEmpty = false } = {}) => {
  const rawArray = coerceArray(value);
  const sourceDefaults = role === 'contractor' ? DEFAULT_CONTRACTOR_TIMELINE : DEFAULT_WEDDING_TIMELINE;
  if (!rawArray.length) {
    return fallbackOnEmpty ? clone(sourceDefaults) : [];
  }
  let changed = false;
  const sanitized = rawArray
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => {
      const id = typeof item.id === 'string' && item.id.trim().length ? item.id.trim() : `timeline-${Date.now()}-${index}`;
      const title = typeof item.title === 'string' && item.title.trim().length ? item.title.trim() : `Этап ${index + 1}`;
      const description = typeof item.description === 'string' ? item.description.trim() : '';
      const dueLabel = typeof item.dueLabel === 'string' ? item.dueLabel.trim() : '';
      const status = typeof item.status === 'string' && item.status.trim().length ? item.status.trim() : 'upcoming';
      const done = Boolean(item.done);
      const orderValue = Number(item.order);
      const order = Number.isFinite(orderValue) ? orderValue : index + 1;
      if (
        id !== item.id ||
        title !== (item.title || '') ||
        description !== (item.description || '') ||
        dueLabel !== (item.dueLabel || '') ||
        status !== (item.status || 'upcoming') ||
        done !== Boolean(item.done) ||
        order !== (item.order ?? index + 1)
      ) {
        changed = true;
      }
      return { id, title, description, dueLabel, status, done, order };
    });
  if (!sanitized.length && fallbackOnEmpty) {
    return clone(sourceDefaults);
  }
  if (changed) {
    sanitized.sort((a, b) => a.order - b.order);
  }
  return sanitized;
};

const sanitizeChecklistItems = (value) => {
  const rawArray = coerceArray(value);
  let changed = false;
  const sanitized = rawArray
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => {
      const id = typeof item.id === 'string' && item.id.trim().length ? item.id.trim() : `task-${Date.now()}-${index}`;
      const title = typeof item.title === 'string' && item.title.trim().length ? item.title.trim() : `Задача ${index + 1}`;
      const done = Boolean(item.done);
      const orderValue = Number(item.order);
      const order = Number.isFinite(orderValue) ? orderValue : index + 1;
      const folderId = typeof item.folderId === 'string' && item.folderId.trim().length ? item.folderId.trim() : null;
      const type = typeof item.type === 'string' && item.type.trim().length ? item.type.trim() : 'task';
      if (
        id !== item.id ||
        title !== (item.title || '') ||
        done !== Boolean(item.done) ||
        order !== (item.order ?? index + 1) ||
        folderId !== (item.folderId ?? null) ||
        type !== (item.type || 'task')
      ) {
        changed = true;
      }
      return { id, title, done, order, folderId, type };
    });
  return { items: sanitized, updated: changed };
};

const sanitizeChecklistFolders = (value) => {
  const rawArray = coerceArray(value);
  let changed = false;
  const sanitized = rawArray
    .filter((folder) => folder && typeof folder === 'object')
    .map((folder, index) => {
      const id = typeof folder.id === 'string' && folder.id.trim().length ? folder.id.trim() : `folder-${Date.now()}-${index}`;
      const title = typeof folder.title === 'string' && folder.title.trim().length ? folder.title.trim() : `Папка ${index + 1}`;
      const color = typeof folder.color === 'string' && folder.color.trim().length ? folder.color.trim() : '#F5D0D4';
      const createdAtValue = Number(folder.createdAt);
      const createdAt = Number.isFinite(createdAtValue) ? createdAtValue : Date.now() + index;
      const orderValue = Number(folder.order);
      const order = Number.isFinite(orderValue) ? orderValue : createdAt;
      if (
        id !== folder.id ||
        title !== (folder.title || '') ||
        color !== (folder.color || '#F5D0D4') ||
        createdAt !== (folder.createdAt ?? createdAt) ||
        order !== (folder.order ?? createdAt)
      ) {
        changed = true;
      }
      return { id, title, color, createdAt, order };
    });
  sanitized.sort((a, b) => a.order - b.order);
  return { folders: sanitized, updated: changed };
};

const sanitizeBudgetEntries = (value) => {
  const rawArray = coerceArray(value);
  let changed = false;
  const sanitized = rawArray
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry, index) => {
      const id = typeof entry.id === 'string' && entry.id.trim().length ? entry.id.trim() : `budget-${Date.now()}-${index}`;
      const title = typeof entry.title === 'string' && entry.title.trim().length ? entry.title.trim() : `Статья ${index + 1}`;
      const amountValue = Number(entry.amount);
      const amount = Number.isFinite(amountValue) ? Math.max(0, Math.round(amountValue)) : 0;
      if (id !== entry.id || title !== (entry.title || '') || amount !== Number(entry.amount ?? 0)) {
        changed = true;
      }
      return { id, title, amount };
    });
  return { entries: sanitized, updated: changed };
};

const cloneModuleArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => (item && typeof item === 'object' ? { ...item } : item));
};

const serializeModules = (modulesData) => {
  const result = {};
  if (modulesData.timeline !== undefined) {
    result.timeline = cloneModuleArray(modulesData.timeline);
  }
  if (modulesData.checklist !== undefined) {
    result.checklist = cloneModuleArray(modulesData.checklist);
  }
  if (modulesData.checklistFolders !== undefined) {
    result.checklistFolders = cloneModuleArray(modulesData.checklistFolders);
  }
  if (modulesData.budgetEntries !== undefined) {
    result.budgetEntries = cloneModuleArray(modulesData.budgetEntries);
  }
  return result;
};

const deserializeProfileModules = (profile, role) => {
  if (!profile) {
    return null;
  }
  const safeRole = role === 'contractor' ? 'contractor' : 'wedding';
  const timeline = sanitizeTimelineInput(profile.timeline, safeRole, { fallbackOnEmpty: true });
  const checklistSanitized = sanitizeChecklistItems(profile.checklist);
  const foldersSanitized = sanitizeChecklistFolders(profile.checklistFolders);
  const budgetSanitized = sanitizeBudgetEntries(profile.budgetEntries);
  return {
    ...profile,
    timeline,
    checklist: checklistSanitized.items.length ? checklistSanitized.items : clone(DEFAULT_CHECKLIST_ITEMS),
    checklistFolders: foldersSanitized.folders,
    budgetEntries: budgetSanitized.entries.length ? budgetSanitized.entries : clone(DEFAULT_BUDGET_ENTRIES)
  };
};

const collectModulesFromBody = (body, role) => {
  const modules = {};
  const provided = {};
  if (Object.prototype.hasOwnProperty.call(body, 'timeline')) {
    modules.timeline = sanitizeTimelineInput(body.timeline, role);
    provided.timeline = true;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'checklist')) {
    const sanitizedChecklist = sanitizeChecklistItems(body.checklist);
    modules.checklist = sanitizedChecklist.items;
    provided.checklist = true;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'checklistFolders')) {
    const sanitizedFolders = sanitizeChecklistFolders(body.checklistFolders);
    modules.checklistFolders = sanitizedFolders.folders;
    provided.checklistFolders = true;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'budgetEntries')) {
    const sanitizedBudget = sanitizeBudgetEntries(body.budgetEntries);
    modules.budgetEntries = sanitizedBudget.entries;
    provided.budgetEntries = true;
  }
  return { data: modules, provided };
};

const applyDefaultsForCreate = (modulesData, provided, role) => {
  const defaultsTimeline = role === 'contractor' ? DEFAULT_CONTRACTOR_TIMELINE : DEFAULT_WEDDING_TIMELINE;
  return {
    timeline: provided.timeline ? cloneModuleArray(modulesData.timeline) : clone(defaultsTimeline),
    checklist: provided.checklist ? cloneModuleArray(modulesData.checklist) : clone(DEFAULT_CHECKLIST_ITEMS),
    checklistFolders: provided.checklistFolders
      ? cloneModuleArray(modulesData.checklistFolders)
      : clone(DEFAULT_CHECKLIST_FOLDERS),
    budgetEntries: provided.budgetEntries
      ? cloneModuleArray(modulesData.budgetEntries)
      : clone(DEFAULT_BUDGET_ENTRIES)
  };
};

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
  const contractorProfile = deserializeProfileModules(user.contractorProfile ?? null, 'contractor');
  const weddingProfile = deserializeProfileModules(user.weddingProfile ?? null, 'wedding');
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

    const role = user.role === 'contractor' ? 'contractor' : 'wedding';
    const { data: modulesData, provided: modulesProvided } = collectModulesFromBody(body, role);

    if (role === 'contractor') {
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

      const serializedModules = serializeModules(modulesData);
      await prisma.contractorProfile.upsert({
        where: { userId },
        update: { ...updateData, ...serializedModules },
        create: {
          userId,
          companyName: updateData.companyName ?? '',
          description: updateData.description ?? null,
          ...serializeModules(applyDefaultsForCreate(modulesData, modulesProvided, role))
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

      const serializedModules = serializeModules(modulesData);
      await prisma.weddingProfile.upsert({
        where: { userId },
        update: { ...updateData, ...serializedModules },
        create: {
          userId,
          coupleNames: updateData.coupleNames ?? '',
          location: updateData.location ?? null,
          eventDate: updateData.eventDate ?? null,
          ...serializeModules(applyDefaultsForCreate(modulesData, modulesProvided, role))
        }
      });
    }

    const refreshedUser = await loadUserWithProfiles(userId);
    if (!refreshedUser) {
      return res.status(404).json({ error: 'Пользователь не найден.' });
    }

    return res.json(buildProfileResponse(refreshedUser));
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
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
