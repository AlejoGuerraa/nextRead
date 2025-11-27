const Usuario = require("../models/Usuario")
const Libro = require("../models/Libro");
const Autor = require("../models/Autor");
const { Op } = require("sequelize");

// =======================================================
// 🔍 BUSCAR LIBROS + AUTOR RELEVANTE
// =======================================================
const buscar = async (req, res) => {
    try {
        const search = req.query.search || "";

        const libros = await Libro.findAll({
            where: {
                titulo: { [Op.like]: `%${search}%` },
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
                    nombre: { [Op.like]: `%${search}%` },
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
// 🔥 TENDENCIAS (ranking + fecha)
// =======================================================
const getTendencias = async (req, res) => {
    try {
        const libros = await Libro.findAll({
            where: {},
            order: [
                ['ranking', 'DESC'],
                ['fecha_publicacion', 'DESC']
            ],
            limit: 20,
            include: [
                {
                    model: Autor,
                    as: 'Autor',
                    attributes: ['id', 'nombre', 'url_cara'],
                    required: false,
                },
            ],
        });

        res.json(libros);

    } catch (error) {
        console.error('Error al obtener tendencias:', error);
        res.status(500).json({ message: 'Error al obtener las tendencias' });
    }
};


// =======================================================
// ⭐ CORREGIDO — OBTENER LIBROS DEL AUTOR MÁS LEÍDO
// =======================================================
const getMasDeAutor = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            message: 'Se requiere el correo electrónico (email) para identificar al usuario.'
        });
    }

    try {
        // Buscar usuario por correo
        const usuario = await Usuario.findOne({
            where: { correo: email },
            attributes: ['id', 'libros_leidos']
        });

        if (!usuario) {
            return res.status(404).json({
                message: 'Usuario no encontrado con ese correo electrónico.'
            });
        }

        // ⚠️ libros_leidos llega como JSON string → PARSEAR
        let librosLeidosIds = usuario.libros_leidos;

        if (typeof librosLeidosIds === "string") {
            try {
                librosLeidosIds = JSON.parse(librosLeidosIds);
            } catch (e) {
                librosLeidosIds = [];
            }
        }

        if (!Array.isArray(librosLeidosIds) || librosLeidosIds.length === 0) {
            return res.json({
                message: 'El usuario no tiene libros registrados como leídos.',
                libros: []
            });
        }

        // Obtener autor de cada libro leído
        const librosLeidos = await Libro.findAll({
            where: { id: librosLeidosIds },
            attributes: ['id_autor']
        });

        // Contar frecuencia
        const autorCounts = {};
        for (const libro of librosLeidos) {
            const idAutor = libro.id_autor;
            if (idAutor) {
                autorCounts[idAutor] = (autorCounts[idAutor] || 0) + 1;
            }
        }

        // Hallar el autor más leído
        let autorMasLeidoId = null;
        let maxLeidos = 0;

        for (const idAutor in autorCounts) {
            if (autorCounts[idAutor] > maxLeidos) {
                maxLeidos = autorCounts[idAutor];
                autorMasLeidoId = parseInt(idAutor);
            }
        }

        if (!autorMasLeidoId) {
            return res.json({
                message: 'No se pudo determinar un autor preferido entre los libros leídos.',
                libros: []
            });
        }

        // Obtener todos los libros del autor más leído
        const librosRecomendados = await Libro.findAll({
            where: {
                id_autor: autorMasLeidoId,
            },
            order: [['fecha_publicacion', 'DESC']],
            include: [
                {
                    model: Autor,
                    as: 'Autor',
                    attributes: ['id', 'nombre', 'url_cara'],
                    required: true,
                },
            ],
        });

        const autorNombre = librosRecomendados[0]?.Autor?.nombre || 'Autor Preferido';

        res.json({
            message: `Libros de tu autor más leído: ${autorNombre}`,
            libros: librosRecomendados
        });

    } catch (error) {
        console.error('Error al obtener libros del autor más leído:', error);
        res.status(500).json({ message: 'Error interno al procesar la solicitud de recomendaciones.' });
    }
};

// Agrupa libros por década y devuelve un arreglo ordenado de grupos.
// Cada grupo tendrá: { decade: '1960s', start: 1960, end: 1969, count, libros: [...] }
async function porDecada(libros) {
    if (!Array.isArray(libros)) return [];

    const grupos = {};

    libros.forEach((raw) => {
        // Normalizar el libro: convertir a número el año y parsear géneros
        const libro = { ...raw };

        // anio puede venir como string — intentar parsear
        const year = Number(libro.anio);
        if (!Number.isFinite(year) || year <= 0) return;

        libro.anio = Math.floor(year);

        // parsear generos si vienen como string
        if (typeof libro.generos === 'string') {
            try {
                libro.generos = JSON.parse(libro.generos);
            } catch {
                libro.generos = [];
            }
        }

        // Calcular la década (ej. 1960)
        const decadaBase = Math.floor(libro.anio / 10) * 10;
        const etiqueta = `${decadaBase}s`; // p. ej. '1960s' o '2000s'

        if (!grupos[etiqueta]) grupos[etiqueta] = [];
        grupos[etiqueta].push(libro);
    });

    // Convertir a arreglo con metadatos y ordenar
    const gruposArray = Object.keys(grupos).map((label) => {
        const start = Number(label.replace('s', ''));
        const end = start + 9;

        // Ordenar libros por año descendente y/o por id como fallback
        const librosOrdenados = grupos[label].sort((a, b) => {
            const ay = Number(a.anio) || 0;
            const by = Number(b.anio) || 0;
            if (by !== ay) return by - ay;
            return (b.id || 0) - (a.id || 0);
        });

        return {
            decade: label,
            start,
            end,
            count: librosOrdenados.length,
            libros: librosOrdenados,
        };
    });

    // Orden descendente por década (más recientes primero)
    gruposArray.sort((a, b) => b.start - a.start);

    return gruposArray;
}

const getLibrosPorDecada = async (req, res) => {
    try {
        // Incluir autor para que el frontend tenga acceso al nombre y url
        const libros = await Libro.findAll({
            attributes: ["id", "titulo", "anio", "url_portada", "generos", "fecha_publicacion"],
            include: [
                {
                    model: Autor,
                    as: 'Autor',
                    attributes: ['id', 'nombre', 'url_cara'],
                    required: false,
                },
            ],
        });

        const grupos = await porDecada(libros.map(l => l.toJSON()));

        // Retornamos la lista de décadas como arreglo — más fácil de iterar en el frontend
        res.json({ decades: grupos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error obteniendo libros por década" });
    }
}


// =======================================================
// 📘 LIBRO POR ID (con parseo de generos)
// =======================================================
const getLibroById = async (req, res) => {
    const { id } = req.params;

    try {
        let libro = await Libro.findByPk(id, {
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
    getTendencias,
    getLibrosPorDecada,
    getMasDeAutor,
    getLibroById
};