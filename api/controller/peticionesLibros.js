const Resena = require('../models/Resena')
const Libro = require('../models/Libro');
const Usuario = require('../models/Usuario');

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

// const agregarLibroALista = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { idLibro } = req.params;
//     const { tipo } = req.params; // puede ser 'favoritos', 'enLectura', 'paraLeer', etc.
//     const libroIdNum = Number(idLibro);

//     const usuario = await Usuario.findByPk(userId);
//     if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

//     // 🔹 Campos que pueden tener conflicto
//     const campos = ["libros_en_lectura", "libros_para_leer", "libros_leidos"];

//     for (const campo of campos) {
//       if (typeof usuario[campo] === "string") {
//         try {
//           usuario[campo] = JSON.parse(usuario[campo]);
//         } catch {
//           usuario[campo] = [];
//         }
//       }
//       if (!Array.isArray(usuario[campo])) usuario[campo] = [];
//     }

//     // 🔹 Quitar el libro de las listas que no corresponden
//     if (tipo === "enLectura") {
//       usuario.libros_para_leer = usuario.libros_para_leer.filter(
//         (item) => item.idLibro !== libroIdNum && item !== libroIdNum
//       );
//       usuario.libros_leidos = usuario.libros_leidos.filter(
//         (item) => item.idLibro !== libroIdNum && item !== libroIdNum
//       );
//     } else if (tipo === "paraLeer") {
//       usuario.libros_en_lectura = usuario.libros_en_lectura.filter(
//         (item) => item.idLibro !== libroIdNum && item !== libroIdNum
//       );
//       usuario.libros_leidos = usuario.libros_leidos.filter(
//         (item) => item.idLibro !== libroIdNum && item !== libroIdNum
//       );
//     }

//     // 🔹 Agregar a la lista correspondiente
//     const campoObjetivo =
//       tipo === "enLectura"
//         ? "libros_en_lectura"
//         : tipo === "paraLeer"
//         ? "libros_para_leer"
//         : "libros_favoritos";

//     const yaExiste = usuario[campoObjetivo].some(
//       (item) => item.idLibro === libroIdNum || item === libroIdNum
//     );

//     if (!yaExiste) usuario[campoObjetivo].push({ idLibro: libroIdNum });

//     await usuario.save();

//     res.json({ message: `📘 Libro agregado correctamente a ${tipo}` });
//   } catch (error) {
//     console.error("Error en agregarLibroALista:", error);
//     res.status(500).json({ error: "Error al agregar libro a la lista" });
//   }
// };

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

    // Normalizamos todos los campos del usuario
    let leidos = normalizarLista(usuario.libros_leidos);
    let favoritos = normalizarLista(usuario.libros_favoritos);
    let enLectura = normalizarLista(usuario.libros_en_lectura);
    let paraLeer = normalizarLista(usuario.libros_para_leer);
    let listas = normalizarLista(usuario.listas);

    // Map para elegir el campo objetivo según tipo
    const mapaTipos = {
      favoritos: { campo: "libros_favoritos", arr: favoritos },
      enLectura: { campo: "libros_en_lectura", arr: enLectura },
      paraLeer: { campo: "libros_para_leer", arr: paraLeer },
      lista: { campo: "listas", arr: listas },
      leido: { campo: "libros_leidos", arr: leidos }
    };

    const entry = mapaTipos[tipo];
    if (!entry) return res.status(400).json({ error: "Tipo de lista inválido" });

    // Si ya está en la lista objetivo -> 400 (evita duplicados)
    if (entry.arr.includes(idNum)) {
      return res.status(400).json({ message: `El libro ya está en ${tipo}` });
    }

    // Lógica específica: si añadimos a enLectura/paraLeer/lista -> quitar de leidos
    if (["enLectura", "paraLeer", "lista"].includes(tipo)) {
      leidos = leidos.filter(x => x !== idNum);
      // actualizar la variable correspondiente si 'leido' es el array del mapa
      if (tipo !== "leido") {
        // quito de la variable que representa los leidos y luego lo guardaré más abajo
      }
    }

    // Si añadimos como 'leido' -> quitar de enLectura/paraLeer/listas
    if (tipo === "leido") {
      enLectura = enLectura.filter(x => x !== idNum);
      paraLeer = paraLeer.filter(x => x !== idNum);
      listas = listas.filter(x => x !== idNum);
    }

    // Finalmente, añadir al array objetivo
    entry.arr.push(idNum);

    // Asignar arrays actualizados al usuario antes de guardar
    usuario.libros_leidos = [...new Set(leidos)];
    usuario.libros_favoritos = [...new Set(favoritos)];
    usuario.libros_en_lectura = [...new Set(enLectura)];
    usuario.libros_para_leer = [...new Set(paraLeer)];
    usuario.listas = [...new Set(listas)];

    // Pero también debemos asegurarnos de que el array modificado por 'entry' esté reflejado:
    // (por ejemplo, si entry.campo === 'libros_favoritos' y entry.arr fue modificado)
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
    const userId = req.user.id; // viene del token
    const { idLibro } = req.params;
    const { puntuacion, comentario } = req.body;

    if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
      return res.status(400).json({ error: "La puntuación debe ser entre 1 y 5 estrellas." });
    }

    // Verificar que el libro exista
    const libro = await Libro.findByPk(idLibro);
    if (!libro) return res.status(404).json({ error: "Libro no encontrado." });

    // Verificar si el usuario ya reseñó este libro (actualizar en lugar de duplicar)
    let resena = await Resena.findOne({
      where: { usuario_id: userId, libro_id: idLibro }
    });

    if (resena) {
      // Si ya existe, actualiza la puntuación y el comentario
      resena.puntuacion = puntuacion;
      if (comentario) resena.comentario = comentario;
      await resena.save();
    } else {
      // Si no existe, crea una nueva reseña
      resena = await Resena.create({
        usuario_id: userId,
        libro_id: idLibro,
        puntuacion,
        comentario: comentario || ""
      });
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


module.exports = {
  getAllBooks,
  agregarLibroALista,
  guardarPuntuacion
}