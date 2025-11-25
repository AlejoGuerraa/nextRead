const Resena = require('../models/Resena')
const Libro = require('../models/Libro');
const Usuario = require('../models/Usuario');
const Icono = require('../models/Icono');
const sequelize = require('../config/db');

const getAllBooks = async (_req, res) => {
  try {
    const libros = await Libro.findAll();
    console.log("Libros encontrados:", libros.length);
    res.json(libros);
  } catch (error) {
    console.error("ERROR en getAllBooks:", error);
    return res.status(500).json({
      error: "Error al obtener libros",
      mensaje: error.message,
    });
  }
};

const agregarLibroALista = async (req, res) => {
  try {
    const { tipo, idLibro } = req.params;
    const userId = req.user.id;
    const idNum = Number(idLibro);

    if (!tipo) return res.status(400).json({ error: "Falta el parámetro 'tipo' en la URL" });
    if (Number.isNaN(idNum)) return res.status(400).json({ error: "ID de libro inválido" });

    const usuario = await Usuario.findByPk(userId);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    // Helper: normalizar cualquier campo (string JSON, array, objetos, strings)
    const normalizarLista = (lista) => {
      if (typeof lista === "string") {
        try { lista = JSON.parse(lista); } catch { lista = []; }
      }
      if (!Array.isArray(lista)) lista = [];

      return lista
        .map(item => {
          if (typeof item === "number") return item;
          if (typeof item === "object" && item !== null) {
            if ("idLibro" in item) return Number(item.idLibro);
            if ("id" in item) return Number(item.id);
          }
          const n = Number(item);
          return Number.isNaN(n) ? null : n;
        })
        .filter(x => typeof x === "number");
    };

    // Normalizamos todos los campos del usuario EXCEPTO las listas nombradas
    let leidos = normalizarLista(usuario.libros_leidos);
    let favoritos = normalizarLista(usuario.libros_favoritos);
    let enLectura = normalizarLista(usuario.libros_en_lectura);
    let paraLeer = normalizarLista(usuario.libros_para_leer);

    // Map para elegir el campo objetivo según tipo
    const mapaTipos = {
      favoritos: { campo: "libros_favoritos", arr: favoritos },
      enLectura: { campo: "libros_en_lectura", arr: enLectura },
      paraLeer: { campo: "libros_para_leer", arr: paraLeer },
      leido: { campo: "libros_leidos", arr: leidos }
    };

    const entry = mapaTipos[tipo];
    if (!entry) return res.status(400).json({ error: "Tipo de lista inválido. Para listas nombradas use el endpoint /listas/:nombre/libro/:idLibro" });

    // Si ya está en la lista objetivo -> 400 (evita duplicados)
    if (entry.arr.includes(idNum)) {
      return res.status(400).json({ message: `El libro ya está en ${tipo}` });
    }

    // Lógica específica: si añadimos a enLectura/paraLeer -> quitar de leidos
    if (["enLectura", "paraLeer"].includes(tipo)) {
      leidos = leidos.filter(x => x !== idNum);
    }

    // Si añadimos como 'leido' -> quitar de enLectura/paraLeer
    if (tipo === "leido") {
      enLectura = enLectura.filter(x => x !== idNum);
      paraLeer = paraLeer.filter(x => x !== idNum);
    }

    // Finalmente, añadir al array objetivo
    entry.arr.push(idNum);

    // Asignar arrays actualizados al usuario antes de guardar
    usuario.libros_leidos = [...new Set(leidos)];
    usuario.libros_favoritos = [...new Set(favoritos)];
    usuario.libros_en_lectura = [...new Set(enLectura)];
    usuario.libros_para_leer = [...new Set(paraLeer)];

    usuario[entry.campo] = [...new Set(entry.arr)];

    await usuario.save();

    return res.json({
      message: `✅ Libro agregado a ${tipo}`,
      [entry.campo]: usuario[entry.campo]
    });

  } catch (error) {
    console.error("Error en agregarLibroALista:", error);
    return res.status(500).json({ error: "Error al agregar el libro a la lista" });
  }
};


const guardarPuntuacion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { idLibro } = req.params;
    const { puntuacion, comentario } = req.body;

    if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
      return res.status(400).json({ error: "La puntuación debe ser entre 1 y 5 estrellas." });
    }

    const libro = await Libro.findByPk(idLibro);
    if (!libro) return res.status(404).json({ error: "Libro no encontrado." });

    let resena = await Resena.findOne({
      where: { usuario_id: userId, libro_id: idLibro }
    });

    if (resena) {
      resena.puntuacion = puntuacion;
      if (comentario) resena.comentario = comentario;
      await resena.save();
    } else {
      resena = await Resena.create({
        usuario_id: userId,
        libro_id: idLibro,
        puntuacion,
        comentario: comentario || ""
      });
    }

    // Añadir el libro a la lista de 'leidos' del usuario si no está ya
    try {
      const usuario = await Usuario.findByPk(userId);
      if (usuario) {
        let leidos = usuario.libros_leidos;
        if (typeof leidos === 'string') {
          try { leidos = JSON.parse(leidos); } catch { leidos = []; }
        }
        if (!Array.isArray(leidos)) leidos = [];
        const idNum = Number(idLibro);
        if (!leidos.includes(idNum)) {
          leidos.push(idNum);
          // dedupe and save
          usuario.libros_leidos = Array.from(new Set(leidos));
          await usuario.save();
        }
      }
    } catch (err) {
      console.error('Error actualizando libros_leidos del usuario:', err);
    }

    res.json({
      message: "⭐ Puntuación guardada correctamente",
      resena
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al guardar la puntuación." });
  }
};

const obtenerResenas = async (req, res) => {
  try {
    const { idLibro } = req.params;

    const libro = await Libro.findByPk(idLibro);
    if (!libro) return res.status(404).json({ error: "Libro no encontrado." });

    const resenas = await Resena.findAll({
      where: { libro_id: idLibro },
      include: [
        {
          model: Usuario,
          as: 'Usuario',
          attributes: ["id", "nombre", "apellido", "idIcono"],
          include: [
            {
              model: Icono,
              as: "iconoData",
              attributes: ["simbolo"]
            }
          ]
        }
      ],
      order: [
        [sequelize.literal("CASE WHEN comentario != '' THEN 0 ELSE 1 END"), "ASC"],
        ["fecha", "DESC"]
      ]
    });

    res.json(resenas);
  } catch (error) {
    console.error("Error al obtener reseñas:", error);
    res.status(500).json({ error: "Error al obtener las reseñas." });
  }
};

module.exports = {
  getAllBooks,
  agregarLibroALista,
  guardarPuntuacion,
  obtenerResenas
}
