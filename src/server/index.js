const express = require('express');
const morgan = require('morgan');

const config = require('./config');
const {
  ROOT_DIR,
  ensureInvitesDirectory
} = require('../../lib/invitations');
const invitationsRouter = require('../../routes/invitations');
const { prisma } = require('../db/client');

const app = express();

app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use('/', invitationsRouter);
app.use(express.static(ROOT_DIR, { extensions: ['html'] }));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Не удалось разобрать данные запроса.' });
  }
  return next(err);
});

app.use((err, req, res, next) => {
  console.error('Непредвиденная ошибка сервера', err);
  res.status(500).json({ error: 'Произошла непредвиденная ошибка.' });
});

async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('Successfully connected to the database.');
  } catch (error) {
    console.error('Failed to connect to the database', error);
  }
}

async function start(options = {}) {
  const host = options.host ?? config.host;
  const port = options.port ?? config.port;

  await ensureInvitesDirectory();
  await checkDatabaseConnection();

  return new Promise((resolve) => {
    const server = app.listen(port, host, () => {
      console.log(`Wedding server is running on http://${host}:${port}`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Не удалось инициализировать сервер', error);
    process.exit(1);
  });
}

module.exports = {
  app,
  start
};
