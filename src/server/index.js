const express = require('express');
const morgan = require('morgan');

const config = require('./config');
const authRouter = require('../../routes/auth');
const profileRouter = require('../../routes/profile');
const {
  ROOT_DIR,
  ensureInvitesDirectory
} = require('../../lib/invitations');
const invitationsRouter = require('../../routes/invitations');
const dbClient = require('../db/client');
const {
  shutdownPrisma,
  checkDatabaseConnection
} = dbClient;
const { verifyAccessToken } = require('../services/auth');

function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || req.get('authorization');
  if (!authorization) {
    return res.status(401).json({ error: 'Требуется авторизация.' });
  }

  const [scheme = '', token = ''] = authorization.split(' ');
  if (!token || scheme.toLowerCase() !== 'bearer') {
    return res.status(401).json({ error: 'Недействительные данные авторизации.' });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (error) {
    console.warn('Failed to verify access token', error);
    return res.status(401).json({ error: 'Недействительный или истёкший токен.' });
  }
}

function createApp() {
  const app = express();

  if (config.logging?.httpFormat) {
    app.use(morgan(config.logging.httpFormat));
  }

  app.use(express.json({ limit: '1mb' }));
  app.use('/api/auth', authRouter);
  app.use('/api/profile', requireAuth, profileRouter);
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

  return app;
}

async function start(options = {}) {
  const host = options.host ?? config.host;
  const port = options.port ?? config.port;

  await ensureInvitesDirectory();

  const dbStatus = await checkDatabaseConnection();
  if (dbStatus.ok) {
    console.log('Successfully connected to the database.');
  } else if (dbStatus.reason === 'missing_database_url') {
    console.warn('DATABASE_URL is not configured. Prisma client will remain disabled until the variable is provided.');
  } else if (dbStatus.error) {
    console.error('Failed to connect to the database', dbStatus.error);
  }

  const app = createApp();

  const server = await new Promise((resolve) => {
    const instance = app.listen(port, host, () => {
      console.log(`Wedding server is running on http://${host}:${port}`);
      resolve(instance);
    });
  });

  const stop = async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          return reject(error);
        }
        return resolve();
      });
    });
    await shutdownPrisma();
  };

  return { app, server, stop };
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Не удалось инициализировать сервер', error);
    process.exit(1);
  });
}

module.exports = {
  createApp,
  start,
  shutdownPrisma,
  checkDatabaseConnection,
  initializePrisma: dbClient.initializePrisma,
  requireAuth
};
