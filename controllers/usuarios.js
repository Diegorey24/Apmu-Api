const model = require('../models/users');

// PUT /usuarios/cambiar-password — el usuario sale de req.user (JWT del sistema interno),
// nunca del body, para que nadie pueda cambiar la contraseña de otro usuario.
const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    if (!passwordActual || !passwordNueva) {
      return res.status(400).send({ error: true, message: 'Faltan datos' });
    }
    if (passwordNueva.length < 6) {
      return res.status(400).send({ error: true, message: 'La contraseña nueva debe tener al menos 6 caracteres' });
    }
    if (passwordActual === passwordNueva) {
      return res.status(400).send({ error: true, message: 'La nueva contraseña debe ser diferente a la actual' });
    }

    await model.cambiarPassword(req.user.id, passwordActual, passwordNueva);
    res.status(200).send({ error: false, message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    res.status(400).send({ error: true, message: err.message });
  }
};

module.exports = { cambiarPassword };
