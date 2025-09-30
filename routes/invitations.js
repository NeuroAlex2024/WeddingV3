const express = require('express');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');

const {
  INVITES_DIR,
  ensureInvitesDirectory,
  ensureUniqueSlug,
  renderInvitationHtml,
  validatePayload,
  buildBaseSlug,
  sanitizeSlug,
  saveInvitation,
  isSafeSlug
} = require('../lib/invitations');

const router = express.Router();

router.post('/api/invitations', async (req, res) => {
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

router.get('/invite/:slug', async (req, res) => {
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

module.exports = router;
