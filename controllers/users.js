const usersModel = require('../models/users');
const AuthToken = require('../plugins/auth-token');
const jwt = require('jsonwebtoken');

const authenticate = async function (req, res) {
  const username = req.body.username.trim() || '';
  const password = req.body.password || '';
  if (!username || !password) {
    return res.status(400).send({ error: true, message: 'Usuario y contraseña requeridos' });
  }

  await usersModel
    .authenticate(username, password)
    .then(function (result) {
      if (!result.data) {
        return res.status(401).send({ error: true, message: 'Usuario o contraseña incorrectos' });
      }

      const user = result.data;
      const cleanUsername = user.Usuario.trim();
      console.log(cleanUsername)
      const auth = new AuthToken(jwt);
      const token = auth.getPermanentToken(
        { username: cleanUsername },
        user.private_key
      );

      res.status(200).send({
        error: false,
        message: '',
        data: {
          username: cleanUsername,
          access_token: cleanUsername + '_' + token,
        },
      });
    })
    .catch(function (err) {
      res.status(500).send({ error: true, message: err.message });
    });
};

module.exports = { authenticate };
