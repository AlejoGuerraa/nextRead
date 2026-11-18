const Autor = require('../models/Autor');
const Libro = require('../models/Libro');

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
    });
  }
};

const getAuthorDetails = async (req, res) => {
  try {
    const authorId = Number(req.params.id);
    const limit = Number(req.query.limit) || 20;
    const page = Number(req.query.page) || 1;
    const offset = req.query.page
      ? (page - 1) * limit
      : Number(req.query.offset) || 0;
    const author = await Autor.findByPk(authorId, {
      attributes: ['id', 'nombre', 'url_cara']
    });

    if (!author) {
      return res.status(404).json({ message: 'Autor no encontrado.' });
    }

    const rows = await Libro.findAll({
      where: { id_autor: authorId },
      attributes: ['id', 'titulo', 'url_portada', 'ranking'],
      order: [['titulo', 'ASC'], ['id', 'ASC']],
      limit: limit + 1,
      offset
    });
    const hasMore = rows.length > limit;
    const libros = rows.slice(0, limit);

    return res.json({
      autor: author,
      libros,
      hasMore,
      nextOffset: hasMore ? offset + limit : null,
      nextPage: hasMore ? page + 1 : null
    });
  } catch (error) {
    console.error('Error loading author details:', error);
    return res.status(500).json({
      message: 'Error al obtener los datos del autor.'
    });
  }
};

module.exports = {
  getAllAutores,
  getAuthorDetails
};
