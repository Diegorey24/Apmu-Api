const jwt = require('jsonwebtoken');

// Debe coincidir con el secreto usado en controllers/portal.js para firmar
// el token del portal (login de socios). Es un JWT completamente separado
// del JWT interno (process.env.JWT_SECRET / middlewares/authenticateToken.js).
const SECRET_PORTAL = 'portal_apmu_secret_2026';

/**
 * Middleware de autenticación para rutas del portal de socios (/portal/*).
 * Verifica el Bearer token firmado con SECRET_PORTAL y deja el payload
 * decodificado ({ idAfiliado, documento, rol }) en req.user.
 */
const authenticatePortal = function (req, res, next) {
  const authorization = req.headers['authorization'];
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'Sin autorización' });
  }

  const parts = authorization.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).send({ error: true, message: 'Bad Authorization header' });
  }

  jwt.verify(parts[1], SECRET_PORTAL, function (err, decoded) {
    if (err) {
      return res.status(401).send({ error: true, message: 'Token inválido o expirado' });
    }
    req.user = decoded;
    next();
  });
};

module.exports = { authenticatePortal, SECRET_PORTAL };
