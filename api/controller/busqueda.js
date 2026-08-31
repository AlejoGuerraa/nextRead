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
    try {
        const usuario = await Usuario.findByPk(req.user.id, {
            attributes: ['id', 'libros_leidos']
        });

        if (!usuario) {
            return res.status(404).json({
                message: 'Usuario no encontrado.'
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
        const libro = { ...raw };

        const year = Number(libro.anio);
        if (!Number.isFinite(year) || year <= 0) return;

        libro.anio = Math.floor(year);

        // Normalizar generos
        if (typeof libro.generos === 'string') {
            try {
                libro.generos = JSON.parse(libro.generos);
            } catch {
                libro.generos = [];
            }
        }

        // 🔹 Normalizar ranking a número
        libro.ranking = libro.ranking !== undefined && libro.ranking !== null
            ? Number(libro.ranking)
            : 0;

        const decadaBase = Math.floor(libro.anio / 10) * 10;
        const etiqueta = `${decadaBase}s`;

        if (!grupos[etiqueta]) grupos[etiqueta] = [];
        grupos[etiqueta].push(libro);
    });


    const gruposArray = Object.keys(grupos).map((label) => {
        const start = Number(label.replace('s', ''));
        const end = start + 9;

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

    gruposArray.sort((a, b) => b.start - a.start);

    return gruposArray;
}

const getLibrosPorDecada = async (req, res) => {
    try {
        const { decade } = req.query;

        // -------------------------
        // 📌 ATRIBUTOS QUE MANDAMOS
        // -------------------------
        const baseAttributes = [
            "id",
            "titulo",
            "anio",
            "url_portada",
            "generos",
            "fecha_publicacion",
            "ranking"   // 👈 RANKING SIEMPRE INCLUIDO
        ];

        if (decade) {
            const decadaMatch = decade.match(/^(\d{4})s?$/);
            if (!decadaMatch) {
                return res.status(400).json({
                    error: "Formato de década inválido. Use '1960s' o '1960'"
                });
            }

            const decadaBase = parseInt(decadaMatch[1]);

            const libros = await Libro.findAll({
                where: {
                    anio: {
                        [Op.gte]: decadaBase,
                        [Op.lte]: decadaBase + 9,
                    },
                },
                attributes: baseAttributes,
                order: [['fecha_publicacion', 'DESC']],
                include: [
                    {
                        model: Autor,
                        as: 'Autor',
                        attributes: ['id', 'nombre', 'url_cara'],
                        required: false,
                    },
                ],
            });

            return res.json({
                decade: `${decadaBase}s`,
                start: decadaBase,
                end: decadaBase + 9,
                count: libros.length,
                libros,
            });
        }

        // -------------------------
        // 📌 TODAS LAS DÉCADAS
        // -------------------------
        const libros = await Libro.findAll({
            attributes: baseAttributes,
            include: [
                {
                    model: Autor,
                    as: 'Autor',
                    attributes: ['id', 'nombre', 'url_cara'],
                    required: false,
                },
            ],
        });

        const grupos = await porDecada(
            libros.map(l => {
                const lib = l.toJSON();
                // 🔹 Normalizar ranking
                lib.ranking = lib.ranking !== undefined && lib.ranking !== null
                    ? Math.floor(Number(lib.ranking))
                    : 0;
                return lib;
            })
        );

        res.json({ decades: grupos });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error obteniendo libros por década" });
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
// 📚 OBTENER DÉCADAS PERSONALIZADAS (basadas en gustos del usuario)
// =======================================================
const getDecadasPersonalizadas = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.user.id, {
            attributes: ['id', 'libros_favoritos', 'libros_en_lectura', 'libros_leidos']
        });

        if (!usuario) {
            return res.status(404).json({
                message: 'Usuario no encontrado.'
            });
        }

        // Parsear arrays de libros del usuario
        const parseArray = (value) => {
            if (!value) return [];
            if (Array.isArray(value)) return value;
            try {
                return JSON.parse(value);
            } catch {
                return [];
            }
        };

        const librosFavoritos = parseArray(usuario.libros_favoritos);
        const librosEnLectura = parseArray(usuario.libros_en_lectura);
        const librosLeidos = parseArray(usuario.libros_leidos);

        // Combinar todos los IDs y eliminar duplicados
        const todosLosIds = [...new Set([...librosFavoritos, ...librosEnLectura, ...librosLeidos].map(id => Number(id)).filter(Number.isInteger))];

        if (todosLosIds.length === 0) {
            // Si no tiene libros guardados, devolver todas las décadas disponibles (comportamiento por defecto)
            const libros = await Libro.findAll({
                attributes: ["id", "titulo", "anio", "url_portada", "generos", "fecha_publicacion", "ranking"],
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
            return res.json({
                message: 'Sin preferencias de usuario. Mostrando todas las décadas.',
                decades: grupos.slice(0, 5) // Limitar a 5 décadas
            });
        }

        // Obtener información de los libros del usuario
        const librosDelUsuario = await Libro.findAll({
            where: { id: todosLosIds },
            attributes: ['id', 'anio'],
        });

        // Contar las décadas más frecuentes
        const decadaCounts = {};

        librosDelUsuario.forEach((libro) => {
            const year = Number(libro.anio);
            if (!Number.isFinite(year) || year <= 0) return;

            const decadaBase = Math.floor(year / 10) * 10;
            const etiqueta = `${decadaBase}s`;

            decadaCounts[etiqueta] = (decadaCounts[etiqueta] || 0) + 1;
        });

        // Ordenar décadas por frecuencia (descendente)
        const decadasOrdenadas = Object.entries(decadaCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5) // Tomar solo las 5 más frecuentes
            .map(([decade]) => decade);

        if (decadasOrdenadas.length === 0) {
            return res.json({
                message: 'No se pudo determinar las décadas preferidas del usuario.',
                decades: []
            });
        }

        // Obtener libros de las décadas personalizadas
        const decadaRegex = decadasOrdenadas.map(d => {
            const base = Number(d.replace('s', ''));
            return { start: base, end: base + 9, decade: d };
        });

        // Construir query para obtener libros de las décadas personalizadas
        const conditions = decadaRegex.map(d => ({
            anio: { [Op.between]: [d.start, d.end] }
        }));

        const librosDecadas = await Libro.findAll({
            where: { [Op.or]: conditions },
            attributes: ["id", "titulo", "anio", "url_portada", "generos", "fecha_publicacion", "ranking"],
            order: [['fecha_publicacion', 'DESC']],
            include: [
                {
                    model: Autor,
                    as: 'Autor',
                    attributes: ['id', 'nombre', 'url_cara'],
                    required: false,
                },
            ],
        });

        // Agrupar por década
        const gruposFinales = {};

        decadaRegex.forEach(d => {
            gruposFinales[d.decade] = {
                decade: d.decade,
                start: d.start,
                end: d.end,
                count: 0,
                libros: []
            };
        });

        librosDecadas.forEach((libro) => {
            const year = Number(libro.anio);
            if (!Number.isFinite(year)) return;

            const decadaBase = Math.floor(year / 10) * 10;
            const etiqueta = `${decadaBase}s`;

            if (gruposFinales[etiqueta]) {
                gruposFinales[etiqueta].libros.push(libro);
                gruposFinales[etiqueta].count += 1;
            }
        });

        // Convertir a array manteniendo el orden de preferencia
        const decadaArray = decadasOrdenadas.map(d => gruposFinales[d]);

        res.json({
            message: 'Décadas personalizadas según los gustos del usuario',
            decades: decadaArray
        });

    } catch (error) {
        console.error('Error al obtener décadas personalizadas:', error);
        res.status(500).json({ message: 'Error interno al procesar la solicitud de décadas personalizadas.' });
    }
};


const getGeneroPreferido = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.user.id);
        if (!usuario) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const idsLeidos = Array.isArray(usuario.libros_leidos)
            ? usuario.libros_leidos.map(id => Number(id)).filter(Number.isInteger)
            : [];
        if (idsLeidos.length === 0) {
            return res.json({ generoPreferido: null, libros: [] });
        }

        // Traer los libros leídos
        const librosLeidos = await Libro.findAll({
            where: { id: idsLeidos }
        });

        const conteo = {};

        for (const libro of librosLeidos) {
            let generos = libro.generos;

            // -----------------------------
            //  PARSEAR GENEROS CORRECTAMENTE
            // -----------------------------
            if (!generos) generos = [];

            // si viene como JSON string
            else if (typeof generos === "string") {
                try {
                    generos = JSON.parse(generos);
                } catch {
                    // fallback si está mal formado
                    generos = generos.split(",").map(s => s.trim());
                }
            }

            if (!Array.isArray(generos)) generos = [];

            // contar
            generos.forEach(g => {
                conteo[g] = (conteo[g] || 0) + 1;
            });
        }

        const generoPreferido = Object.keys(conteo).sort(
            (a, b) => conteo[b] - conteo[a]
        )[0];

        if (!generoPreferido) {
            return res.json({ generoPreferido: null, libros: [] });
        }

        // JSON_CONTAINS requiere '"valor"'
        const candidate = JSON.stringify(String(generoPreferido).slice(0, 120));

        const libros = await Libro.findAll({
            where: Sequelize.where(
                Sequelize.fn("JSON_CONTAINS", Sequelize.col("generos"), candidate),
                1
            ),
            include: [
                { model: Autor, as: "Autor", attributes: ["id", "nombre", "url_cara"] }
            ],
            order: [
                ["ranking", "DESC"],
                ["fecha_publicacion", "DESC"]
            ],
            limit: 20
        });

        return res.json({
            generoPreferido,
            libros
        });

    } catch (error) {
        console.error("Error obteniendo género preferido:", error);
        res.status(500).json({ message: "Error obteniendo género preferido" });
    }
};


function fixGeneros(input) {
    if (!input) return [];

    if (Array.isArray(input)) return input;

    if (typeof input === "string") {
        try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) return parsed;
        } catch { }

        return input
            .replace(/[\[\]"]+/g, "")
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);
    }

    return [];
}

const getRecomendacionesPorLibro = async (req, res) => {
    try {
        const idUsuario = Number(req.user.id);
        const idLibro = Number(req.params.idLibro);

        if (!Number.isInteger(idUsuario) || !Number.isInteger(idLibro)) {
            return res.status(400).json({ message: "ID inválidos." });
        }

        const usuario = await Usuario.findByPk(idUsuario);
        if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

        const libroBase = await Libro.findByPk(idLibro);
        if (!libroBase) return res.status(404).json({ message: "Libro no encontrado" });

        // Normalizar generos
        const generos = fixGeneros(libroBase.generos);

        // Normalizar libros leídos
        let librosLeidos = usuario.libros_leidos || [];
        if (typeof librosLeidos === "string") {
            try { librosLeidos = JSON.parse(librosLeidos); } catch { librosLeidos = []; }
        }
        if (!Array.isArray(librosLeidos)) librosLeidos = [];
        librosLeidos = librosLeidos.map(id => Number(id)).filter(Number.isInteger);

        // Autor base
        const autorId = libroBase.id_autor || null;

        // Condiciones por género usando JSON_CONTAINS
        const generoConditions = generos
            .filter((g) => typeof g === 'string' && g.trim().length > 0 && g.length <= 120)
            .map(g =>
            Sequelize.where(
                Sequelize.fn("JSON_CONTAINS", Sequelize.col("generos"), JSON.stringify(g)),
                1
            )
        );

        // Exclusiones
        const baseExcludes = {
            id: {
                [Op.and]: [
                    { [Op.ne]: idLibro },
                    ...(librosLeidos.length ? [{ [Op.notIn]: librosLeidos }] : [])
                ]
            }
        };

        // OR (autor + géneros)
        const orConditions = [];
        if (autorId) orConditions.push({ id_autor: autorId });
        if (generoConditions.length > 0) orConditions.push(...generoConditions);

        let recomendaciones;

        if (orConditions.length > 0) {
            recomendaciones = await Libro.findAll({
                where: {
                    ...baseExcludes,
                    [Op.or]: orConditions
                },
                include: [{ model: Autor, as: "Autor", attributes: ["id", "nombre", "url_cara"] }],
                order: [["ranking", "DESC"], ["fecha_publicacion", "DESC"]],
                limit: 20
            });
        }

        // Fallback si quedó vacío
        if (!recomendaciones || recomendaciones.length === 0) {
            recomendaciones = await Libro.findAll({
                where: baseExcludes,
                include: [{ model: Autor, as: "Autor", attributes: ["id", "nombre", "url_cara"] }],
                order: [["ranking", "DESC"], ["fecha_publicacion", "DESC"]],
                limit: 20
            });
        }

        return res.json({
            base: {
                id: libroBase.id,
                titulo: libroBase.titulo,
                generos,
                id_autor: autorId
            },
            libros: recomendaciones
        });

    } catch (error) {
        console.error("Error cargando recomendaciones:", error);
        return res.status(500).json({ message: "Error cargando recomendaciones" });
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
    getLibroById,
    getDecadasPersonalizadas,
    getGeneroPreferido,
    getRecomendacionesPorLibro
};