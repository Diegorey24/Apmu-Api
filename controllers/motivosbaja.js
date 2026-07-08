const model = require('../models/motivosbaja');
const getAll = async (req, res) => {
    try {
        const data = await model.getAll();
        res.status(200).send({ error: false, data });
    } catch (err) {
        res.status(500).send({ error: true, message: err.message });
    }
};
module.exports = { getAll };