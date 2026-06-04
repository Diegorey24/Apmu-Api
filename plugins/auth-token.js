class AuthToken {
  constructor(jwt) {
    this._jwt = jwt;
  }

  getPermanentToken(data, private_key) {
    return this._jwt.sign(data, private_key);
  }

  getExpToken(data, private_key, expiresIn) {
    return this._jwt.sign(data, private_key, { expiresIn });
  }

  async getValidToken(token, private_key) {
    const p = new Promise((resolve) => {
      this._jwt.verify(token, private_key, null, function (err, decoded) {
        resolve({ err, decoded });
      });
    });
    let result = null;
    await p.then(function (response) {
      result = response;
    });
    return result;
  }
}

module.exports = AuthToken;
