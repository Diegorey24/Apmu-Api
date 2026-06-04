const fs = require('fs');

const getDiaSemana = function (fecha) {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  return dias[fecha.getDay()];
};

const saveBufferToFile = function (filename, buffer) {
  try {
    fs.writeFileSync(filename, buffer);
    return true;
  } catch (error) {
    console.error('saveBufferToFile: ', error);
    return false;
  }
};

module.exports = {
  getDiaSemana,
  saveBufferToFile,
};
