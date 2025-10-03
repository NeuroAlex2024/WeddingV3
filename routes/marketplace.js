const express = require('express');

const { getPrismaClient } = require('../src/db/client');
const config = require('../src/server/config');
const { buildPublicContractorCard } = require('../src/server/contractor-card');

const router = express.Router();

const prisma = config.databaseUrl ? getPrismaClient() : null;

function ensurePrismaAvailable(res) {
  if (!prisma) {
    res.status(503).json({ error: 'База данных временно недоступна.' });
    return false;
  }
  return true;
}

router.get('/contractors', async (req, res) => {
  if (!ensurePrismaAvailable(res)) {
    return;
  }

  try {
    const profiles = await prisma.contractorProfile.findMany({
      where: { isPublished: true }
    });
    const contractors = profiles
      .map((profile) => buildPublicContractorCard(profile))
      .filter(Boolean)
      .map((card) => ({
        ...card,
        services: Array.isArray(card.services) ? card.services : []
      }));
    res.json({ contractors });
  } catch (error) {
    console.error('Не удалось получить каталог подрядчиков', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Не удалось получить каталог подрядчиков.' });
  }
});

module.exports = router;
