const Usuario = require("../models/Usuario")
const Libro = require("../models/Libro");
const Autor = require("../models/Autor");
const { Op, Sequelize } = require("sequelize");
const { escape_like } = require("../utils/querySafety");

// =======================================================
// 🔍 BUSCAR LIBROS + AUTOR RELEVANTE
// =======================================================
const buscar = async (req, res) => {
    try {
        const search = req.query.search || "";
        const like = `%${escape_like(search)}%`;

        const libros = await Libro.findAll({
            where: {
                titulo: { [Op.like]: like },
            },
            limit: 4,
            include: [
                {
                    model: Autor,
                    as: "Autor",
                    attributes: ["id", "nombre", "url_cara"],
                    required: false,
                },
            ],
        });

        let autorMasRelevante = null;

        if (search.length > 0) {
            const autorSugerido = await Autor.findOne({
                where: {
                    nombre: { [Op.like]: like },
                },
                attributes: ["id", "nombre", "url_cara"],
            });

            autorMasRelevante = autorSugerido;
        }

        if (libros.length > 0 || autorMasRelevante) {
            res.json({
                resultados: libros,
                autor: autorMasRelevante,
            });
        } else {
            res.json({
                resultados: [],
                autor: null,
                message: "No se encontraron resultados",
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al buscar libros" });
    }
};



// =======================================================
// 📘 LIBRO POR ID (con parseo de generos)
// =======================================================
const getLibroById = async (req, res) => {
    const { id } = req.params;
    const idNum = Number(id);
    if (!id || Number.isNaN(idNum)) return res.status(400).json({ message: 'ID de libro inválido.' });

    try {
        let libro = await Libro.findByPk(idNum, {
            include: [{
                model: Autor,
                as: 'Autor',
                attributes: ['id', 'nombre', 'url_cara']
            }],
            attributes: {
                exclude: ['id_autor'],
                include: [['url_portada', 'portada']]
            }
        });

        if (!libro) {
            return res.status(404).json({ message: `Libro con ID ${id} no encontrado.` });
        }

        libro = libro.get({ plain: true });

        if (typeof libro.generos === 'string') {
            try {
                libro.generos = JSON.parse(libro.generos);
            } catch {
                libro.generos = [];
            }
        }

        if (!Array.isArray(libro.generos)) libro.generos = [];

        res.json(libro);

    } catch (error) {
        console.error("Error al obtener el libro por ID:", error);
        res.status(500).json({ message: 'Error interno del servidor al consultar el libro.' });
    }
};



// =======================================================
// EXPORTAR ENDPOINTS
// =======================================================
module.exports = {
    buscar,
    getLibroById,
};