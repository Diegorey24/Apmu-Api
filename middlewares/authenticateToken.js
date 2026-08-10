const jwt = require('jsonwebtoken');

let _allowUrls = [];

// Igual criterio que el middleware viejo: cualquier ruta bajo /public queda libre.
const _isPublicPrefix = function (url) {
  const parts = url.split('/');
  return parts.length >= 2 && parts[1] === 'public';
};

const _isAllowed = function (url, method) {
  if (_isPublicPrefix(url)) return true;

  for (let i = 0; i < _allowUrls.length; i++) {
    if (url.match(_allowUrls[i].url) && method.toUpperCase() === _allowUrls[i].method.toUpperCase()) {
      return true;
    }
  }
  return false;
};

/**
 * Middleware de autenticación. Configurar una vez con la lista de rutas
 * públicas y usar la función devuelta como middleware global de Express.
 */
const authenticateToken = function (config) {
  _allowUrls = (config && config.allowUrls) || [];
  return _authenticateToken;
};

const _authenticateToken = function (req, res, next) {
  const method = req.method;
  const url = req.url;

  if (_isAllowed(url, method)) return next();

  const authorization = req.headers['authorization'];
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'Not authorized' });
  }

  const parts = authorization.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).send({ error: true, message: 'Bad Authorization header' });
  }

  const token = parts[1];

  jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
    if (err) {
      return res.status(401).send({ error: true, message: 'Token inválido o expirado' });
    }

    req.user = { id: decoded.id, username: decoded.username, rol: decoded.rol };
    next();
  });
};

module.exports = { authenticateToken };
