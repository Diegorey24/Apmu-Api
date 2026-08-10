/**
 * Restringe una ruta a uno o varios roles. Debe usarse después de
 * authenticateToken, que es quien completa req.user.
 * Uso: router.post('/afiliado', requireRole('Administrador'), controller.create)
 */
const requireRole = function (...roles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).send({ error: true, message: 'Not authorized' });
    }
    if (!roles.includes(req.user.rol)) {
      return res.status(403).send({ error: true, message: 'No tenés permisos para realizar esta acción' });
    }
    next();
  };
};

module.exports = requireRole;
