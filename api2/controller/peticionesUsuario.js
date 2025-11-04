const User = require("../models/Usuario");
const Autor = require("../models/Autor")
const Libro = require("../models/Libro");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const claveSecreta = 'AdminLibros';

// ----------------- GET USERS -----------------
const getAllUsers = async (_req, res) => {
  try {
    const usuarios = await User.findAll({ attributes: { exclude: ['contrasena'] } });
    res.json(usuarios);
  } catch (error) {
    return res.status(404).json({ error: "No se encontró ningún usuario registrado" });
  }
};

// ----------------- REGISTER -----------------
const register = async (req, res) => {
  console.log(req.body);

  const { nombre, apellido, correo, usuario, contrasena, fecha_nacimiento,
    icono, banner, descripcion, libros_rec, autores_rec, generos_rec } = req.body;

  if (!nombre || !apellido || !correo || !contrasena || !fecha_nacimiento) {
    return res.status(401).json({ error: "Ingrese toda la información necesaria para continuar" });
  }

  const tieneMayuscula = [...contrasena].some(letra => letra >= 'A' && letra <= 'Z');
  const tieneLongitud = contrasena.length >= 8;

  if (!tieneMayuscula || !tieneLongitud) {
    return res.status(400).json({
      error: "La contraseña debe tener al menos 8 caracteres y contener al menos una letra mayúscula"
    });
  }

  const hashedPassw = await bcrypt.hash(contrasena, 10);

  const usuarioasd = await User.findOne({ where: { usuario } });
  if (usuarioasd) return res.status(400).json({ error: "El nombre de usuario ya está registrado" });

  const correoadsd = await User.findOne({ where: { correo } });
  if (correoadsd) return res.status(400).json({ error: "El correo ya está registrado" });

  const librosRecIds = await Promise.all(
    libros_rec.map(async titulo => {
      let libro = await Libro.findOne({ where: { titulo } });
      return libro ? libro.id : null;
    })
  );

  const autoresRecIds = await Promise.all(
    autores_rec.map(async nombre => {
      const autor = await Autor.findOne({ where: { nombre } });
      return autor ? autor.id : null;
    })
  );


  const newUser = await User.create({
    nombre,
    apellido,
    correo,
    usuario,
    contrasena: hashedPassw,
    fecha_nacimiento,
    icono,
    banner,
    descripcion,
    libros_rec: librosRecIds.filter(Boolean),
    autores_rec: autoresRecIds.filter(Boolean),
    generos_rec
  });

  console.log(newUser)

  res.status(200).json({ message: "Nuevo usuario creado", data: newUser });
};

// ----------------- LOGIN -----------------
const login = async (req, res) => {
  const { correo, contrasena } = req.body;

  const user = await User.findOne({ where: { correo } });

  if (!user) return res.status(400).json({ message: "Usuario no encontrado" });

  const comparacion = await bcrypt.compare(contrasena, user.contrasena);
  if (!comparacion) {
    return res.status(400).json({ error: "Su email o contraseña incorrectos" });
  }

  const token = jwt.sign({ id: user.id, correo: user.correo }, claveSecreta, { expiresIn: '8h' });

  const userData = user.get({ plain: true });
  delete userData.contrasena;

  res.json({ token, ...userData });
};


const getAllBooks = async (_req, res) => {
  try {
    const libros = await Libro.findAll();
    res.json(libros);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener libros" });
  }
};

const getAuthors = async (_req, res) => {
    try {
        const autores = await Autor.findAll();
        res.json(autores)
    }
    catch (error) {
        res.status(500).json({ error: "Error al obtener los autores" })
    }
}

const getBookById = async (req, res) => {
  try {
    const libro = await Libro.findByPk(req.params.id);
    if (!libro) return res.status(404).json({ error: "Libro no encontrado" });

    res.json(libro);
  } catch (error) {
    res.status(500).json({ error: "Error al buscar libro" });
  }
};

const getTrendingBooks = async (req, res) => {
  try {
    const libros = await Libro.findAll({
      order: [['ranking', 'DESC']], // Ordenar por rating descendente
      limit: 6                     // Limitar a 6 resultados
    });

    res.json(libros);

  } catch (error) {
    console.error('Error al obtener libros trending:', error);
    res.status(500).json({ error: 'Error al obtener libros' });
  }
}

const editarPerfil = async (req, res) => {
  try {
    const userId = req.user.id; // viene del token
    const {
      nombre,
      apellido,
      descripcion,
      banner,
      icono,
      genero_preferido,
      autor_preferido,
      titulo_preferido
    } = req.body;

    const usuario = await User.findByPk(userId);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    // Solo actualizamos los campos que vienen
    if (nombre !== undefined) usuario.nombre = nombre;
    if (apellido !== undefined) usuario.apellido = apellido;
    if (descripcion !== undefined) usuario.descripcion = descripcion;
    if (banner !== undefined) usuario.banner = banner;
    if (icono !== undefined) usuario.icono = icono;
    if (genero_preferido !== undefined) usuario.genero_preferido = genero_preferido;
    if (autor_preferido !== undefined) usuario.autor_preferido = autor_preferido;
    if (titulo_preferido !== undefined) usuario.titulo_preferido = titulo_preferido;

    await usuario.save();

    res.status(200).json({ msg: "Perfil actualizado correctamente", usuario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar perfil" });
  }
};

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


// Endpoint de prueba - Libros
async function crearAutores(req, res) {
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
        nombre: 'J. K. Rowling',
        url_cara: 'https://m.media-amazon.com/images/S/amzn-author-media-prod/8cigckin175jtpsk3gs361r4ss._SY450_CR0%2C0%2C450%2C450_.jpg'
      },
      {
        nombre: "Stephen King",
        url_cara: "/autores/stephenking.jpg"
      },
      {
        nombre: "Jane Austen",
        url_cara: "/autores/janeausten.jpg"
      },
      {
        nombre: "Tolkien",
        url_cara: "https://content-historia.nationalgeographic.com.es/medio/2024/01/02/tolkien-nacio_00000000_c2a98cb5_240102140103_550x775.jpg"
      },
      {
        nombre: "M. de Cervantes",
        url_cara: "https://upload.wikimedia.org/wikipedia/commons/9/99/Cervantes_J%C3%A1uregui.jpg"
      },
      {
        nombre: "Agatha Christie",
        url_cara: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8c-6UTGok7ykJQiCHl2g5rrIu_KfLvtaoPw&s"
      },
      {
        nombre: "Paulo Coelho",
        url_cara: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhnjd_xeK2uyHo64yBDwvwbZt0vd-TxhrQ_qcO9LhrAtFcidgyOnZlPQH49abOi78mw4Kq8g&s"
      },
      {
        nombre: "A. de Saint-Exupéry",
        url_cara: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQi0Y2DlX_QknYcXuph5jXzbTLlJl_8iK39o60ua1dSkhQYF3dY9lM-dA2WiWeqttG0sGOD&s"
      },
      {
        nombre: "Suzanne Collins",
        url_cara: "/autores/suzanne.jpg"
      }
    ];

    // 🚀 Realizar el bulkCreate (inserción masiva)
    const nuevosAutores = await Autor.bulkCreate(autores);

    console.log(`Se insertaron ${nuevosAutores.length} autores exitosamente.`);
    // console.log(nuevosAutores); // Puedes descomentar para ver los objetos insertados
    res.json({ message: "Se insertaron los autores correctamente" })

  } catch (error) {
    console.error('Error al insertar autores con bulkCreate:', error);
    res.status(400).json({ error: "Error al insertar autores con bulkCreate" })
  }
}

const cargarLibrosAutores = async (req, res) => {
  try {
    const trendingBooks = [
      { titulo: "El Alquimista", tipo: "Novela", author: "Paulo Coelho", rating: 4.3, url_portada: "https://books.google.com.py/books/content?id=lZZCzTM_9PUC&printsec=frontcover&img=1&zoom=1&edge=curl&imgtk=AFLRE710lDuI6NZyV1f74PK7SFz2nWmnv13eAoyq5ank94jmbMLkxwjkFr0xW0SyY8p5olDw0wUPQp_CD0WkL2IhsWMoFIcgGaeakR8nSljl1Hvk5EsGGSFAWMKKvS28kOAOLEM81TtB" },
      { titulo: "Cien Años de Soledad", tipo: "Cuento", author: "Gabriel García Márquez", rating: 3.7, url_portada: "https://http2.mlstatic.com/D_NQ_NP_888637-MLU73120375963_112023-O.webp" },
      { titulo: "1984", tipo: "Poesía", author: "George Orwell", rating: 4.9, url_portada: "https://images.cdn1.buscalibre.com/fit-in/360x360/ab/54/ab54a82815e061d7fc8f22bcd22f2605.jpg" },
      { titulo: "Harry Potter", tipo: "Novela", author: "J. K. Rowling", rating: 4.5, url_portada: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRqLUi4eCYg61tU-7Mkr9J8vjXahrSEP5ErXg&s" },
      { titulo: "Orgullo y Prejuicio", tipo: "Ensayo", author: "Jane Austen", rating: 3.9, url_portada: "https://www.planetadelibros.com.ar/usuaris/libros/fotos/383/original/portada_orgullo-y-prejuicio_jane-austen_202308011307.jpg" },
      { titulo: "Don Quijote", tipo: "Biografía", author: "M. de Cervantes", rating: 4.6, url_portada: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQcMRZdGl9oMFn7_O4oyErwUXK9yrN3OcSe0w&s" },
      { titulo: "El señor de los anillos", tipo: "Novela", author: "Tolkien", rating: 4.7, url_portada: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPeu_qWkfPIIfd0do0EDXM-V9f8ALGvgYJjw&s" },
      { titulo: "El Principito", tipo: "Fábula", author: "A. de Saint-Exupéry", rating: 4.8, url_portada: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmnORW24gI4XJ5J6O18sqjG1eNA475irEE1w&s" },
      { titulo: "It", tipo: "Novela", author: "Stephen King", rating: 4.2, url_portada: "https://http2.mlstatic.com/D_852946-MLA79524197144_102024-C.jpg" },
      { titulo: "Los Juegos del Hambre", tipo: "Novela", author: "Suzanne Collins", rating: 4.3, url_portada: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQK0s2-lkDLtQTyBCsZ54a5ZCT75R3B-20xyw&s" }
    ];

    // 1️⃣ Crear o buscar autores
    const autoresMap = {};
    for (const libro of trendingBooks) {
      const [autor] = await Autor.findOrCreate({
        where: { nombre: libro.author },
        defaults: { url_cara: null }
      });
      autoresMap[libro.author] = autor.id;
    }

    // 2️⃣ Crear los libros según tu modelo
    const librosParaCrear = trendingBooks.map((libro) => ({
      titulo: libro.titulo,
      fecha_publicacion: new Date(),
      anio: new Date().getFullYear(),
      tipo: libro.tipo,
      descripcion: `Obra destacada del autor ${libro.author}.`,
      tema: "Literatura universal",
      ranking: libro.rating,
      generos: JSON.stringify(["Literatura"]),
      tags: JSON.stringify(["trending"]),
      url_portada: libro.url_portada,
      id_autor: autoresMap[libro.author]
    }));


    // 3️⃣ Insertar todos los libros
    await Libro.bulkCreate(librosParaCrear);

    res.json({ message: "✅ Libros y autores trending agregados correctamente" });
  } catch (error) {
    console.error("❌ Error al agregar libros trending:", error);
    res.status(500).json({
      message: "Error al agregar libros trending",
      error: error.message
    });
  }
};

const getPrimerosLibros = async (req, res) => {
  try {
    const libros = await Libro.findAll({
      limit: 10,
      order: [['id', 'ASC']],
      include: [{
        model: Autor,
        attributes: ['nombre'] // lo que querés traer
      }]
    });

    res.json(libros);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports = {
  getAllUsers,
  register,
  login,
  getAllBooks,
  getAuthors,
  getBookById,
  getTrendingBooks,
  editarPerfil,
  buscar,
  cargarLibrosAutores,
  crearAutores,
  getPrimerosLibros
};