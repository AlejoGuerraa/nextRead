const Usuario = require("../models/Usuario")
const Libro = require("../models/Libro");
const Autor = require("../models/Autor");
const { Op, Sequelize } = require("sequelize");
const sequelize = require("../config/db");
const { create_recommendation_reader } = require("../services/recommendationService");
const { build_personalized_carousels } = require("../services/recommendationCarouselService");
const { create_user_carousel_service } = require("../services/userCarouselService");
const UserRecommendationJob = require("../models/UserRecommendationJob");
const { create_recommendation_job_service } = require("../services/recommendationJobService");
const { get_recommendation_worker_config } = require("../config/recommendationWorker");

const recommendationReader = create_recommendation_reader({ sequelize });
const userCarouselService = create_user_carousel_service({ sequelize });
const recommendationJobService = create_recommendation_job_service({
    sequelize,
    UserRecommendationJob,
    ...get_recommendation_worker_config()
});

const unavailablePersonalizedCarousels = [{
    id: 'pais',
    reason: 'country_of_origin_metadata_unavailable'
}];

const getRecomendacionesPersonalizadas = async (req, res) => {
    try {
        const recommendations = await recommendationReader.get_published_for_user(req.user.id);
        if (recommendations.status === 'pending') {
            await recommendationJobService.enqueue_initial(req.user.id);
            const job = await recommendationJobService.get_status(req.user.id);
            if (job?.status === 'failed') {
                return res.json({
                    status: 'failed',
                    generation_id: null,
                    libros: [],
                    message: 'No se pudieron generar las recomendaciones. Volvé a intentarlo después de actualizar tus preferencias.'
                });
            }
        }
        return res.json(recommendations);
    } catch (error) {
        console.error("Error cargando recomendaciones persistidas:", error);
        return res.status(500).json({
            message: "Error al obtener las recomendaciones."
        });
    }
};

const getPersonalizedCarousels = async (req, res) => {
    try {
        const recommendations = await recommendationReader
            .get_published_candidate_set_for_user(req.user.id);
        if (recommendations.status === 'pending') {
            await recommendationJobService.enqueue_initial(req.user.id);
            const job = await recommendationJobService.get_status(req.user.id);
            if (job?.status === 'failed') {
                return res.json({
                    status: 'failed',
                    generation_id: null,
                    carousels: [],
                    unavailable_carousels: unavailablePersonalizedCarousels,
                    message: 'No se pudieron generar las recomendaciones. Volvé a intentarlo después de actualizar tus preferencias.'
                });
            }
        }

        return res.json({
            status: recommendations.status,
            generation_id: recommendations.generation_id,
            carousels: recommendations.status === 'ready'
                ? build_personalized_carousels(recommendations.candidates)
                : [],
            unavailable_carousels: unavailablePersonalizedCarousels
        });
    } catch (error) {
        console.error('Error cargando carruseles personalizados:', error);
        return res.status(500).json({
            message: 'Error al obtener los carruseles personalizados.'
        });
    }
};

// =======================================================
// 🔥 TENDENCIAS (ranking + año)
// =======================================================
const getTendencias = async (req, res) => {
    try {
        const libros = await Libro.findAll({
            where: {},
            order: [
                ['ranking', 'DESC'],
                ['anio', 'DESC']
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


const getMasDeAutor = async (req, res) => {
    try {
        const carousel = await userCarouselService.get_more_from_authors(req.user.id);

        return res.json({
            message: carousel?.title || 'Todavía no hay autores con varias lecturas.',
            libros: carousel?.libros || []
        });
    } catch (error) {
        console.error('Error al obtener libros de autores leídos:', error);
        return res.status(500).json({
            message: 'Error al obtener libros de autores leídos.'
        });
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
                order: [['anio', 'DESC']],
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
                attributes: ["id", "titulo", "anio", "url_portada", "generos", "ranking"],
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
            attributes: ["id", "titulo", "anio", "url_portada", "generos", "ranking"],
            order: [['anio', 'DESC']],
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
                ["anio", "DESC"]
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


const getRecomendacionesPorLibro = async (req, res) => {
    try {
        const idUsuario = Number(req.user.id);
        const idLibro = Number(req.params.idLibro);

        if (!Number.isInteger(idUsuario) || !Number.isInteger(idLibro)) {
            return res.status(400).json({ message: "ID inválidos." });
        }

        const result = await userCarouselService
            .get_similar_books_for_read_source(idUsuario, idLibro);
        if (!result) {
            return res.status(404).json({
                message: 'El libro debe estar leído y tener una valoración de 4 o 5 estrellas.'
            });
        }
        return res.json({
            base: result.source,
            libros: result.libros
        });

    } catch (error) {
        console.error("Error cargando recomendaciones:", error);
        return res.status(500).json({ message: "Error cargando recomendaciones" });
    }
};

module.exports = {
    getTendencias,
    getLibrosPorDecada,
    getMasDeAutor,
    getDecadasPersonalizadas,
    getGeneroPreferido,
    getRecomendacionesPersonalizadas,
    getPersonalizedCarousels,
    getRecomendacionesPorLibro
};