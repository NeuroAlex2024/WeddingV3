const express = require('express');
const morgan = require('morgan');

const {
  ROOT_DIR,
  ensureInvitesDirectory
} = require('./lib/invitations');
const invitationsRouter = require('./routes/invitations');

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

async function start() {
  try {
    await ensureInvitesDirectory();
    const port = process.env.PORT || 8000;
    const host = process.env.HOST || '10.8.0.9';
    app.listen(port, host, () => {
      console.log(`Wedding server is running on http://${host}:${port}`);
    });
  } catch (error) {
    console.error('Не удалось инициализировать сервер', error);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = app;
