const express = require('express');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');

const {
  ROOT_DIR,
  INVITES_DIR,
  ensureInvitesDirectory,
  ensureUniqueSlug,
  renderInvitationHtml,
  validatePayload,
  buildBaseSlug,
  sanitizeSlug,
  saveInvitation,
  isSafeSlug
} = require('./lib/invitations');

const app = express();

app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));

app.post('/api/invitations', async (req, res) => {
  const validation = validatePayload(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const { invitation, theme, requestedSlug } = validation.data;
  const baseSlug = buildBaseSlug(invitation);
  const preferredSlug = requestedSlug || baseSlug;
  const allowCurrent = requestedSlug || null;

  try {
    await ensureInvitesDirectory();
    const slug = await ensureUniqueSlug(preferredSlug, allowCurrent, baseSlug);
    const html = renderInvitationHtml({ invitation, theme });
    await saveInvitation(slug, html);
    const url = new URL(`/invite/${slug}`, `${req.protocol}://${req.get('host')}`).toString();
    return res.status(201).json({ slug, url });
  } catch (error) {
    console.error('Не удалось сохранить приглашение', error);
    return res.status(500).json({ error: 'Не удалось сохранить приглашение. Попробуйте позже.' });
  }
});

app.get('/invite/:slug', async (req, res) => {
  const rawSlug = req.params.slug || '';
  const slug = sanitizeSlug(rawSlug);
  if (!slug || !isSafeSlug(slug)) {
    return res.status(404).send('Приглашение не найдено.');
  }

  const filePath = path.join(INVITES_DIR, slug, 'index.html');
  try {
    await fsp.access(filePath, fs.constants.F_OK);
    return res.sendFile(filePath);
  } catch (error) {
    return res.status(404).send('Приглашение не найдено.');
  }
});

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
