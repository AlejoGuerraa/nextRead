const Libro = require("../models/Libro");
const Autor = require("../models/Autor");
const { Op } = require("sequelize");

const buscar = async (req, res) => {
    try {
        const search = req.query.search || "";

        // =======================================================
        // 1. CONSULTA PRINCIPAL: Obtener los 4 libros por TÍTULO
        // =======================================================
        const libros = await Libro.findAll({
            where: {
                titulo: { [Op.like]: `%${search}%` }, // Solo busca en el título
            },
            limit: 4,
            // Incluimos el Autor para tener el objeto completo en el resultado de 'libros'
            include: [
                {
                    model: Autor,
                    as: "Autor",
                    attributes: ["id", "nombre", "url_cara"], // Selecciona solo los campos necesarios del Autor
                    required: false, // LEFT JOIN, para que el libro se muestre aunque no tenga autor
                },
            ],
        });

        // =======================================================
        // 2. CONSULTA ADICIONAL: Buscar al Autor con mayor coincidencia
        // =======================================================
        let autorMasRelevante = null;

        if (search.length > 0) {
            // Buscamos un autor que coincida con la palabra de búsqueda
            // Aquí no podemos usar 'LIKE' para buscar la "mayor coincidencia" (a menos que uses PostgreSQL con Fuzziness)
            // La forma más estándar es buscar la coincidencia exacta o la más aproximada.

            // Estrategia: Buscar al primer autor que contenga la palabra en su nombre
            const autorSugerido = await Autor.findOne({
                where: {
                    nombre: { [Op.like]: `%${search}%` },
                },
                attributes: ["id", "nombre", "url_cara"],
            });

            autorMasRelevante = autorSugerido;
        }

        // =======================================================
        // 3. RESPUESTA
        // =======================================================
        if (libros.length > 0 || autorMasRelevante) {
            res.json({
                resultados: libros, // Los 4 libros encontrados (con su autor incluido)
                autor: autorMasRelevante, // El autor más relevante encontrado con la palabra de búsqueda
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


const getTendencias = async (req, res) => {
    try {
        const { genero } = req.query; // Ej: "Terror", "Romance", "Clásicos"

        let whereClause = {}; // Objeto para construir la consulta dinámicamente

        // 1. Lógica de filtrado por Género
        // Si se proporciona un género y no es el valor por defecto "Género..."
        if (genero && genero !== 'Género...') {
            // Usamos Op.like para buscar dentro del campo JSON 'generos'.
            // Esto asume que tus géneros están guardados como un array de strings: ["Terror", "Misterio"]
            // La consulta buscará la cadena de texto, ej: %"Terror"%
            whereClause.generos = {
                [Op.like]: `%\"${genero}\"%`,
            };
        }
        // Si no se proporciona 'genero' o es "Género...", whereClause queda vacío
        // y traerá libros de todos los géneros.

        // 2. Consulta principal
        const libros = await Libro.findAll({
            where: whereClause,
            order: [
                ['ranking', 'DESC'] // Ordenamos por ranking para que sean "Tendencias"
            ],
            include: [
                {
                    model: Autor,
                    as: 'Autor', // El 'as' debe coincidir con tu definición de relación
                    attributes: ['id', 'nombre', 'url_cara'], // Solo los campos necesarios
                    required: false, // LEFT JOIN, para traer libros aunque no tengan autor
                },
            ],
        });

        res.json(libros);

    } catch (error) {
        console.error('Error al obtener tendencias:', error);
        res.status(500).json({ message: 'Error al obtener las tendencias' });
    }
};

// ===================================================================
// ✅ NUEVO ENDPOINT: Obtener detalle de Libro por ID (con Autor)
// ===================================================================
const getLibroById = async (req, res) => {
    const { id } = req.params;

    try {
        const libro = await Libro.findByPk(id, {
            // 💡 Incluimos el modelo Autor usando el alias 'Autor'
            include: [{
                model: Autor,
                as: 'Autor',
                attributes: ['id', 'nombre', 'url_cara']
            }],
            // Mapeamos 'url_portada' a 'portada' para que coincida con el frontend
            attributes: {
                exclude: ['id_autor'], // Excluimos el ID interno de la respuesta
                include: [['url_portada', 'portada']] // Añadimos 'portada' como alias de 'url_portada'
            }
        });

        if (!libro) {
            return res.status(404).json({ message: `Libro con ID ${id} no encontrado.` });
        }

        // El frontend recibirá: { id: 1, titulo: '...', Autor: { id: 1, nombre: '...' } }
        res.json(libro);

    } catch (error) {
        console.error("Error al obtener el libro por ID:", error);
        res.status(500).json({ message: 'Error interno del servidor al consultar el libro.' });
    }
};


// Endpoint de prueba - Autores
async function crearAutores() {
    try {
        const autores = [
            {
                nombre: 'Gabriel García Márquez',
                url_cara: 'https://www.revistaanfibia.com/wp-content/uploads/2015/01/Marquez.jpg'
            },
            {
                nombre: 'Isabel Allende',
                url_cara: 'https://www.usach.cl/sites/default/files/styles/noticias/public/isabel-allende.jpg?itok=TulNtsSJ'
            },
            {
                nombre: 'George Orwell',
                url_cara: 'https://upload.wikimedia.org/wikipedia/commons/8/82/George_Orwell%2C_c._1940_%2841928180381%29.jpg'
            },
            {
                nombre: 'J.K. Rowling',
                url_cara: 'https://m.media-amazon.com/images/S/amzn-author-media-prod/8cigckin175jtpsk3gs361r4ss._SY450_CR0%2C0%2C450%2C450_.jpg'
            },
            {
                nombre: 'Stephen King',
                url_cara: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Stephen_King%2C_Comicon.jpg'
            },
            {
                nombre: 'Jane Austen',
                url_cara: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Jane_Austen_coloured_version.jpg'
            },
            {
                nombre: 'J.R.R. Tolkien',
                url_cara: 'https://content-historia.nationalgeographic.com.es/medio/2024/01/02/tolkien-nacio_00000000_c2a98cb5_240102140103_550x775.jpg'
            },
            {
                nombre: 'Miguel de Cervantes',
                url_cara: 'https://upload.wikimedia.org/wikipedia/commons/9/99/Cervantes_J%C3%A1uregui.jpg'
            },
            {
                nombre: 'Agatha Christie',
                url_cara: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Agatha_Christie.png'
            },
            {
                nombre: 'Paulo Coelho',
                url_cara: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Paulo_Coelho.jpg'
            },
            {
                nombre: 'Antoine de Saint-Exupéry',
                url_cara: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Antoine_de_Saint-Exup%C3%A9ry_1933.jpg'
            },
            {
                nombre: 'Suzanne Collins',
                url_cara: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Suzanne_Collins.jpg'
            }
        ];

        const nuevosAutores = await Autor.bulkCreate(autores);

        console.log(`Se insertaron ${nuevosAutores.length} autores exitosamente.`);
    } catch (error) {
        console.error('Error al insertar autores con bulkCreate:', error);
    }
}

const cargarLibrosAutores = async (req, res) => {
    try {

        const trendingBooks = [
            { title: "El Alquimista", tipo: "Novela", author: "Paulo Coelho", rating: 4.3,
              url_portada: "https://books.google.com.py/books/content?id=lZZCzTM_9PUC&printsec=frontcover&img=1&zoom=1&edge=curl",
              id_autor: 10 },

            { title: "Cien Años de Soledad", tipo: "Novela", author: "Gabriel García Márquez", rating: 3.7,
              url_portada: "https://http2.mlstatic.com/D_NQ_NP_888637-MLU73120375963_112023-O.webp",
              id_autor: 1 },

            { title: "1984", tipo: "Novela", author: "George Orwell", rating: 4.9,
              url_portada: "https://images.cdn1.buscalibre.com/fit-in/360x360/ab/54/ab54a82815e061d7fc8f22bcd22f2605.jpg",
              id_autor: 3 },

            { title: "Harry Potter y la Piedra Filosofal", tipo: "Fantasia", author: "J.K. Rowling", rating: 4.1,
              url_portada: "https://www.planetadelibros.com/usuaris/libros/fotos/295/m_libros/portada_harry-potter-y-la-piedra-filosofal-harry-potter-1.png",
              id_autor: 4 },

            { title: "Orgullo y Prejuicio", tipo: "Romance", author: "Jane Austen", rating: 3.9,
              url_portada: "https://www.planetadelibros.com.ar/usuaris/libros/fotos/383/original/portada_orgullo-y-prejuicio_jane-austen_202308011307.jpg",
              id_autor: 6 },

            { title: "Don Quijote de la Mancha", tipo: "Novela", author: "Miguel de Cervantes", rating: 4.6,
              url_portada: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQcMRZdGl9oMFn7_O4oyErwUXK9yrN3OcSe0w&s",
              id_autor: 8 },

            { title: "El Señor de los Anillos", tipo: "Fantasia", author: "J.R.R. Tolkien", rating: 4.8,
              url_portada: "https://i.pinimg.com/736x/3a/29/8b/3a298b825d4c5e34fb4a8d5b1991810c.jpg",
              id_autor: 7 },

            { title: "It", tipo: "Terror", author: "Stephen King", rating: 4.2,
              url_portada: "https://upload.wikimedia.org/wikipedia/en/5/5a/It_cover.jpg",
              id_autor: 5 },

            { title: "El Principito", tipo: "Fábula", author: "Antoine de Saint-Exupéry", rating: 4.7,
              url_portada: "https://m.media-amazon.com/images/I/81AVr2vR8oL.jpg",
              id_autor: 11 },

            { title: "Los Juegos del Hambre", tipo: "Distopia", author: "Suzanne Collins", rating: 4.5,
              url_portada: "https://images.cdn2.buscalibre.com/fit-in/360x360/52/29/522996f132c7d6dd44f44b343029e9c6.jpg",
              id_autor: 12 },

            { title: "Diez Negritos", tipo: "Misterio", author: "Agatha Christie", rating: 4.3,
              url_portada: "https://images.cdn1.buscalibre.com/fit-in/360x360/27/0c/270c82fa06e675985d8dfe8e94cf2369.jpg",
              id_autor: 9 }
        ];

        const librosParaCrear = trendingBooks.map((libro) => ({
            titulo: libro.title,
            fecha_publicacion: new Date(),
            anio: new Date().getFullYear(),
            tipo: libro.tipo,
            descripcion: "Descripción no disponible",
            tema: "Varios",
            ranking: libro.rating,
            generos: JSON.stringify(["Varios"]),
            tags: JSON.stringify(["trending"]),
            url_portada: libro.url_portada,
            id_autor: libro.id_autor
        }));

        await Libro.bulkCreate(librosParaCrear);

        res.json({ message: "✅ Libros y autores insertados correctamente" });

    } catch (error) {
        console.error("❌ Error al agregar libros trending:", error);
        res.status(500).json({ message: "Error al agregar libros trending", error: error.message });
    }
};


module.exports = {
    buscar,
    getTendencias,
    getLibroById, // ✅ Exportamos el nuevo controlador
    cargarLibrosAutores,
    crearAutores
};
