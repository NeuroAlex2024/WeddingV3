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

module.exports = {
  requireAuth
};
