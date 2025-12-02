const Autor = require('../models/Autor');

const getAllAutores = async (_req, res) => {
  try {
    const autores = await Autor.findAll({
      attributes: ['id', 'nombre', 'url_cara'],
      raw: true
    });
    res.json(autores);
  } catch (error) {
    console.error("ERROR en getAllAutores:", error);
    return res.status(500).json({
      error: "Error al obtener autores",
      mensaje: error.message,
    });
  }
};

module.exports = {
  getAllAutores
};
