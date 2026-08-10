const usersModel = require('../models/users');
const jwt = require('jsonwebtoken');

const login = async function (req, res) {
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';

  if (!username || !password) {
    return res.status(400).send({ error: true, message: 'Usuario y contraseña requeridos' });
  }

  try {
    const result = await usersModel.authenticate(username, password);

    if (!result.data) {
      return res.status(401).send({ error: true, message: 'Usuario o contraseña incorrectos' });
    }

    const user = result.data;
    const token = jwt.sign(
      { id: user.id, username: user.username, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).send({
      error: false,
      message: '',
      data: {
        token,
        id: user.id,
        username: user.username,
        rol: user.rol,
      },
    });
  } catch (err) {
    res.status(401).send({ error: true, message: err.message });
  }
};

module.exports = { login };
