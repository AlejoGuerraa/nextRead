const Resena = require('../models/Resena')
const ResenaLike = require('../models/ResenaLike');
const RespuestaResena = require('../models/RespuestaResena');
const Libro = require('../models/Libro');
const Usuario = require('../models/Usuario');
const UserBookState = require('../models/UserBookState');
const BookReadEvent = require('../models/BookReadEvent');
const Icono = require('../models/Icono');
const sequelize = require('../config/db');
const { Op } = require('sequelize');
const { agregarNotificacion } = require('./usuariosController');
const { createBookInteractionService } = require('../services/bookInteractionService');

const bookInteractionService = createBookInteractionService({
  sequelize,
  Usuario,
  Libro,
  UserBookState,
  BookReadEvent,
  Resena,
  ResenaLike,
  RespuestaResena
});

const getAllBooks = async (_req, res) => {
  try {
    const libros = await Libro.findAll({
      attributes: [
        'id', 'titulo', 'anio', 'tipo', 'descripcion', 'tema',
        'ranking', 'generos', 'tags', 'url_portada', 'id_autor'
      ],
    });
    console.log("Libros encontrados:", libros.length);
    res.json(libros);
  } catch (error) {
    console.error("ERROR en getAllBooks:", error);
    return res.status(500).json({
      error: "Error al obtener libros",
    });
  }
};

const agregarLibroALista = async (req, res) => {
  try {
    const { tipo, idLibro } = req.params;
    const userId = req.user.id;
    const idNum = Number(idLibro); // ID del libro como número

    if (!tipo) return res.status(400).json({ error: "Falta el parámetro 'tipo' en la URL" });
    if (Number.isNaN(idNum) || idNum <= 0) return res.status(400).json({ error: "ID de libro inválido" });

    const result = await bookInteractionService.change_list({
      userId,
      bookId: idNum,
      type: tipo,
      action: 'add'
    });
    if (result.status === 'user_not_found') return res.status(404).json({ error: "Usuario no encontrado" });
    if (result.status === 'book_not_found') return res.status(404).json({ error: 'Libro no encontrado' });
    if (result.status === 'already_exists') {
      return res.status(400).json({ message: `El libro ya está en ${tipo}` });
    }
    return res.json({
      message: `Libro agregado a ${tipo}`,
      [result.field]: result.lists[result.field]
    });
  } catch (error) {
    console.error("Error en agregarLibroALista:", error);
    return res.status(500).json({ error: "Error al agregar el libro a la lista" });
  }
};

const quitarLibroDeListaDeEstado = async (req, res) => {
  try {
    const { tipo, idLibro } = req.params;
    const result = await bookInteractionService.change_list({
      userId: req.user.id,
      bookId: Number(idLibro),
      type: tipo,
      action: 'remove'
    });

    if (result.status === 'user_not_found') return res.status(404).json({ error: "Usuario no encontrado" });
    if (result.status === 'book_not_found') return res.status(404).json({ error: 'Libro no encontrado' });

    return res.json({
      message: `Libro quitado de ${tipo}`,
      [result.field]: result.lists[result.field]
    });
  } catch (error) {
    console.error("Error en quitarLibroDeListaDeEstado:", error);
    return res.status(500).json({ error: "Error al quitar el libro de la lista" });
  }
};

const guardarPuntuacion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { idLibro } = req.params;
    const idLibroNum = Number(idLibro);
    if (!idLibro || Number.isNaN(idLibroNum)) return res.status(400).json({ error: 'ID de libro inválido' });
    const { puntuacion, comentario } = req.body;

    if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
      return res.status(400).json({ error: "La puntuación debe ser entre 1 y 5 estrellas." });
    }

    const result = await bookInteractionService.save_rating({
      userId,
      bookId: idLibroNum,
      puntuacion: Number(puntuacion),
      comentario
    });
    if (result.status === 'user_not_found') return res.status(404).json({ error: "Usuario no encontrado." });
    if (result.status === 'book_not_found') return res.status(404).json({ error: "Libro no encontrado." });

    res.json({
      message: "Puntuación guardada correctamente",
      resena: result.review
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al guardar la puntuación." });
  }
};

const obtenerResenas = async (req, res) => {
  try {
    const { idLibro } = req.params;
    const idLibroNum = Number(idLibro);
    if (!idLibro || Number.isNaN(idLibroNum)) return res.status(400).json({ error: 'ID de libro inválido' });

    const libro = await Libro.findByPk(idLibroNum);
    if (!libro) return res.status(404).json({ error: "Libro no encontrado." });

    const currentUserId = Number(req.user?.id) || null;
    const resenas = await Resena.findAll({
      where: { libro_id: idLibroNum, activo: 1 },
      include: [
        {
          model: Usuario,
          as: 'Usuario',
          attributes: ["id", "usuario", "nombre", "apellido", "idIcono"],
          include: [
            {
              model: Icono,
              as: "iconoData",
              attributes: ["simbolo"]
            }
          ]
        },
        {
          model: RespuestaResena,
          as: 'Respuestas',
          required: false,
          where: { activo: 1 },
          separate: true,
          order: [['fecha', 'ASC']],
          include: [
            {
              model: Usuario,
              as: 'Usuario',
              attributes: ['id', 'usuario', 'idIcono'],
              include: [{ model: Icono, as: 'iconoData', attributes: ['simbolo'] }]
            }
          ]
        }
      ],
      order: [['fecha', 'DESC']],
      limit: 200
    });

    const reviewIds = resenas.map((resena) => resena.id);
    const likeRows = reviewIds.length === 0
      ? []
      : await ResenaLike.findAll({
        where: { resena_id: { [Op.in]: reviewIds } },
        attributes: ['resena_id', 'usuario_id'],
        raw: true
      });
    const likesByReview = new Map();
    const likedByCurrentUser = new Set();

    likeRows.forEach((like) => {
      const reviewId = Number(like.resena_id);
      likesByReview.set(reviewId, (likesByReview.get(reviewId) || 0) + 1);
      if (currentUserId && Number(like.usuario_id) === currentUserId) {
        likedByCurrentUser.add(reviewId);
      }
    });

    const response = resenas.map((resena) => {
      const data = resena.toJSON();
      data.likes = likesByReview.get(resena.id) || 0;
      data.likedByCurrentUser = likedByCurrentUser.has(resena.id);
      return data;
    }).sort((first, second) => {
      const firstIsCurrent = currentUserId && Number(first.usuario_id) === currentUserId ? 1 : 0;
      const secondIsCurrent = currentUserId && Number(second.usuario_id) === currentUserId ? 1 : 0;
      if (firstIsCurrent !== secondIsCurrent) return secondIsCurrent - firstIsCurrent;
      if (second.likes !== first.likes) return second.likes - first.likes;
      return new Date(second.fecha).getTime() - new Date(first.fecha).getTime();
    });

    res.json(response);
  } catch (error) {
    console.error("Error al obtener reseñas:", error);
    res.status(500).json({ error: "Error al obtener las reseñas." });
  }
};

const eliminarResenaPropia = async (req, res) => {
  try {
    const resenaId = Number(req.params.id);
    const userId = Number(req.user.id);
    const result = await bookInteractionService.delete_review({ userId, reviewId: resenaId });
    if (result.status === 'user_not_found') return res.status(404).json({ error: 'Usuario no encontrado' });
    if (result.status === 'review_not_found') return res.status(404).json({ error: 'Reseña no encontrada' });
    if (result.status === 'forbidden') {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta reseña' });
    }

    return res.json({ message: 'Reseña eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando reseña propia:', error);
    return res.status(500).json({ error: 'Error al eliminar la reseña' });
  }
};

// Toggle de likes en una reseña
const syncLikeCount = async (resena) => {
  const likes = await ResenaLike.count({ where: { resena_id: resena.id } });
  if (resena.likes !== likes) {
    resena.likes = likes;
    await resena.save();
  }
  return likes;
};

const likeResena = async (req, res) => {
  try {
    // Normalizar ids a números para evitar problemas de tipo
    const userIdRaw = req.user?.id;
    const { id: resenaIdRaw } = req.params;
    const userId = Number(userIdRaw);
    const resenaId = Number(resenaIdRaw);

    console.log('[likeResena] called - userId:', userIdRaw, '->', userId, 'resenaId:', resenaIdRaw, '->', resenaId);

    if (!userId || Number.isNaN(userId)) return res.status(401).json({ error: 'No autorizado' });
    if (!resenaId || Number.isNaN(resenaId)) return res.status(400).json({ error: 'ID de reseña inválido' });

    const resena = await Resena.findByPk(resenaId);
    if (!resena) return res.status(404).json({ error: 'Reseña no encontrada' });

    console.log('[likeResena] resena found - resena.usuario_id:', resena.usuario_id);

    // Usar findOrCreate para evitar condiciones de carrera y manejar idempotencia
    const [likeRecord, created] = await ResenaLike.findOrCreate({
      where: { resena_id: resenaId, usuario_id: userId },
      defaults: { resena_id: resenaId, usuario_id: userId }
    });

    const likes = await syncLikeCount(resena);

    if (!created) {
      return res.json({ message: 'Ya has dado like a esta reseña', likes, liked: true });
    }

    // Notificar únicamente cuando se crea un like nuevo.
    try {

      // Solo enviar notificación si el que da like es diferente del que escribió la reseña
      if (userId !== resena.usuario_id) {
        const usuarioActual = await Usuario.findByPk(userId, { attributes: ['usuario'] });
        console.log('[likeResena] usuarioActual.usuario:', usuarioActual && usuarioActual.usuario);

        if (usuarioActual) {
          await agregarNotificacion(
            resena.usuario_id,
            `${usuarioActual.usuario} indicó que le gusta tu comentario.`,
            usuarioActual.usuario,
            {
              type: 'new_like',
              fromUser: userId,
              resenaId,
              bookId: resena.libro_id,
              commentPreview: resena.comentario || ''
            }
          );
        }
      }

      return res.json({ message: 'Like contabilizado', likes, liked: true });
    } catch (err) {
      console.error('Error procesando likeResena (post-create):', err);
      // si hubo error después de crear el registro, intentamos revertir el likeRecord
      try { await likeRecord.destroy(); } catch (e) { /* ignore */ }
      return res.status(500).json({ error: 'Error al procesar like' });
    }
  } catch (err) {
    console.error('Error en likeResena:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      const likes = await ResenaLike.count({ where: { resena_id: Number(req.params.id) } });
      return res.json({ message: 'Ya has dado like a esta reseña', likes, liked: true });
    }
    res.status(500).json({ error: 'Error al procesar like' });
  }
};

// Remover un like de una reseña
const unlikeResena = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    if (!id || Number.isNaN(Number(id))) return res.status(400).json({ error: 'ID de reseña inválido' });

    const resena = await Resena.findByPk(id);
    if (!resena) return res.status(404).json({ error: 'Reseña no encontrada' });

    // Buscar y eliminar el registro de like
    const like = await ResenaLike.findOne({ where: { resena_id: id, usuario_id: userId } });
    if (!like) return res.status(400).json({ error: 'No has dado like a esta reseña' });

    await like.destroy();
    const likes = await syncLikeCount(resena);

    // No enviamos notificación al quitar like (requerimiento: solo notificar on like)

    res.json({ message: 'Like removido', likes, liked: false });
  } catch (err) {
    console.error('Error en unlikeResena:', err);
    res.status(500).json({ error: 'Error al remover like' });
  }
};

const crearRespuestaResena = async (req, res) => {
  try {
    const resenaId = Number(req.params.idResena);
    const usuarioId = Number(req.user.id);
    const resena = await Resena.findOne({ where: { id: resenaId, activo: 1 } });

    if (!resena) return res.status(404).json({ error: 'Reseña no encontrada' });

    const respuesta = await RespuestaResena.create({
      comentario: req.body.comentario,
      usuario_id: usuarioId,
      resena_id: resenaId
    });

    return res.status(201).json({ message: 'Respuesta publicada correctamente', respuesta });
  } catch (error) {
    console.error('Error creando respuesta de reseña:', error);
    return res.status(500).json({ error: 'Error al publicar la respuesta' });
  }
};

module.exports = {
  getAllBooks,
  agregarLibroALista,
  quitarLibroDeListaDeEstado,
  guardarPuntuacion,
  obtenerResenas,
  likeResena,
  unlikeResena,
  crearRespuestaResena,
  eliminarResenaPropia
}