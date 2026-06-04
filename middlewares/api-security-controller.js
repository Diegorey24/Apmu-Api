let _allowUrls = [];

const _allowUrl = function (url, method) {
  const vProfileUrl = url.split('/');
  if (vProfileUrl.length >= 2) {
    const profileUrl = vProfileUrl[1];
    if (profileUrl === 'public') return true;
  }

  for (let i = 0; i < _allowUrls.length; i++) {
    if (url.match(_allowUrls[i].url) && method.toUpperCase() === _allowUrls[i].method.toUpperCase())
      return true;
  }
  return false;
};

const authorizationBearer = function (config) {
  _allowUrls = config.allowUrls || [];
  return _authorizationBearer;
};

const _authorizationBearer = function (req, res, next) {
  const method = req.method;
  const url = req.url;
  const authorization = req.headers['authorization'];

  if (url === '/authenticate' && method.toUpperCase() === 'POST') {
    if (authorization)
      res.status(500).send({ error: true, message: 'Authentication header is not allowed' });
    else next();
  } else if (_allowUrl(url, method)) {
    next();
  } else {
    if (!authorization) {
      return res.status(401).send({ error: true, message: 'Not authorized' });
    }

    const parseAuth = authorization.split(' ');
    if (parseAuth.length !== 2) {
      return res.status(400).send({ error: true, message: 'Bad Request' });
    }
    if (parseAuth[0] !== 'Bearer') {
      return res.status(500).send({ error: true, message: 'Type of authorization not allowed' });
    }

    const access_token = parseAuth[1];
    const parseToken = access_token.split('_');

    if (parseToken.length < 2) {
      return res.status(500).send({ error: true, message: 'The access_token has an invalid format' });
    }

    const username = parseToken[0];
    let token = parseToken.slice(1).join('_');

    const pkey = require('../helpers/private_key');
    pkey
      .value(username)
      .then(function (private_key) {
        if (!private_key) {
          return res.status(500).send({ error: true, message: 'User not found' });
        }

        const AuthToken = require('../plugins/auth-token');
        const jwt = require('jsonwebtoken');
        const auth = new AuthToken(jwt);

        auth.getValidToken(token, private_key).then(function (verif) {
          if (verif.err) {
            return res.status(500).send({ error: true, message: 'The access_token is incorrect' });
          }

          const data = verif.decoded;
          const role = data.role || 'VEN';

          if (!data.username) {
            return res.status(500).send({ error: true, message: 'The access_token did not come with the user' });
          }

          if (data.username !== username) {
            return res.status(500).send({ error: true, message: 'Invalid user' });
          }

          const vProfileUrl = url.split('/');
          const profileUrl = vProfileUrl.length >= 2 ? vProfileUrl[1] : '';

          if (role === 'VEN') {
            if (profileUrl !== 'cliente') next();
            else res.status(500).send({ error: true, message: 'forbidden url' });
          } else {
            if (profileUrl === 'cliente') next();
            else res.status(500).send({ error: true, message: 'forbidden url' });
          }
        });
      })
      .catch(function (err) {
        console.log('authorizationBearer ERROR');
        res.status(500).send({ error: true, message: err.message });
      });
  }
};

module.exports = { authorizationBearer };
