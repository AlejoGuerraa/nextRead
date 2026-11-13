const User = require('../models/Usuario');
const Libro = require('../models/Libro');
const UserBookState = require('../models/UserBookState');
const UserBookPreferenceSignal = require('../models/UserBookPreferenceSignal');
const Resena = require('../models/Resena');
const ResenaLike = require('../models/ResenaLike');
const RespuestaResena = require('../models/RespuestaResena');
const sequelize = require('../config/db');
const emailService = require('../services/emailService');
const { createTagPreferenceService } = require('../services/tagPreferenceService');
const { get_legacy_state, read_user_lists } = require('../services/bookInteractionService');
const tagPreferenceService = createTagPreferenceService({ UserBookPreferenceSignal });

// Importar helper para notificaciones
const { agregarNotificacion } = require('./usuariosController');

// Banear usuario: marca activo = 0
const banearUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || Number.isNaN(Number(id))) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const usuario = await User.findByPk(id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (usuario.rol === 'Admin') {
      return res.status(403).json({ error: 'No se puede banear a otro administrador' });
    }

    if (usuario.activo === 0) {
      return res.status(400).json({ message: 'Usuario ya se encuentra baneado' });
    }

    usuario.activo = 0;
    await usuario.save();

    const { descargo } = req.body || {};

    const usuarioSafe = usuario.toJSON();
    delete usuarioSafe.contrasena;
    delete usuarioSafe.dvh;

    // Notificar al usuario (si existe el helper)
    try { if (agregarNotificacion) await agregarNotificacion(usuario.id, 'Has sido baneado por un administrador.', 'Sistema'); } catch (_) {}

    // Enviar correo ASYNC (NO bloquea respuesta si falla)
    setImmediate(async () => {
      try {
        const subject = 'Cuenta suspendida - NextRead';
        const html = `
          <p>Hola ${usuario.nombre || ''},</p>
          <p>Tu cuenta ha sido suspendida por un administrador.</p>
          ${descargo ? `<p><strong>Motivo:</strong></p><div style="padding:10px;border-left:4px solid #d33;background:#fff">${descargo}</div>` : ''}
          <p>Si consideras que esto es un error, por favor responde a este correo.</p>
          <p>Equipo NextRead</p>
        `;

        if (usuario.correo) {
          await emailService({ to: usuario.correo, subject, html });
          console.log('[Ban] Email enviado a:', usuario.correo);
        } else {
          console.warn('[Ban] Usuario sin correo, id:', usuario.id);
        }
      } catch (emailErr) {
        console.error('[Ban] Error email (no bloquea):', emailErr.message);
      }
    });

    return res.json({ message: 'Usuario baneado correctamente', usuario: usuarioSafe });
  } catch (err) {
    console.error('Error en banearUsuario:', err);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Eliminar comentario/resena por id
const eliminarComentario = async (req, res) => {
  // El ID del usuario administrador que realiza la acción se adjunta en el middleware
  const adminId = req.user.id;
  const { descargo } = req.body || {};

  try {
    const { id } = req.params; // ID de la reseña/comentario (que corresponde a Resena.id)

    if (!id || Number.isNaN(Number(id))) {
      return res.status(400).json({ error: 'ID de reseña/comentario inválido' });
    }

    const existingReview = await Resena.findByPk(id);
    if (!existingReview) {
      return res.status(404).json({ error: 'Reseña/comentario no encontrado' });
    }

    const result = await sequelize.transaction(async (transaction) => {
      const usuario = await User.findByPk(existingReview.usuario_id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      const libro = await Libro.findByPk(existingReview.libro_id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      const state = usuario && await UserBookState.findOne({
        where: { user_id: existingReview.usuario_id, book_id: existingReview.libro_id },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      const bookState = usuario
        ? state
          ? { readingStatus: state.reading_status, isFavorite: Boolean(state.is_favorite) }
          : get_legacy_state(read_user_lists(usuario), existingReview.libro_id)
        : null;
      const previousRating = await Resena.findOne({
        where: { usuario_id: existingReview.usuario_id, libro_id: existingReview.libro_id, activo: 1 },
        order: [['id', 'DESC']],
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      const resena = await Resena.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!resena) return { status: 'not_found' };

      const autorId = resena.usuario_id;
      const contenidoComentario = resena.comentario
        ? `${resena.comentario.substring(0, 50)}...`
        : 'Comentario sin contenido.';

      await RespuestaResena.destroy({ where: { resena_id: id }, transaction });
      await ResenaLike.destroy({ where: { resena_id: id }, transaction });
      await resena.destroy({ transaction });

      if (usuario) {
        const nextRating = await Resena.findOne({
          where: { usuario_id: usuario.id, libro_id: existingReview.libro_id, activo: 1 },
          order: [['id', 'DESC']],
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        if (libro) {
          await tagPreferenceService.update_book_signals({
            user: usuario,
            bookId: libro.id,
            tags: libro.tags,
            oldSources: {
              ...bookState,
              rating: previousRating ? Number(previousRating.puntuacion) : null
            },
            newSources: {
              ...bookState,
              rating: nextRating ? Number(nextRating.puntuacion) : null
            },
            transaction
          });
        }
        usuario.activo = 0;
        await usuario.save({ transaction });
      }

      return { status: 'ok', usuario, autorId, contenidoComentario };
    });

    if (result.status === 'not_found') {
      return res.status(404).json({ error: 'Reseña/comentario no encontrado' });
    }

    if (result.usuario) {
      const { usuario, autorId, contenidoComentario } = result;
      try {
        const subject = 'Cuenta suspendida - NextRead';
        const html = `
          <p>Hola ${usuario.nombre || ''},</p>
          <p>Tu cuenta ha sido suspendida por un administrador debido a una reseña/comentario que infringe nuestras políticas.</p>
          <p><strong>Extracto del comentario:</strong> ${contenidoComentario}</p>
          <p><strong>Descargo del administrador:</strong></p>
          <div style="padding:10px;border-left:4px solid #d33;background:#fff">${descargo ? descargo : 'No se proporcionó descargo.'}</div>
          <p>Si crees que esto es un error, por favor responde a este correo solicitando revisión.</p>
          <p>Atentamente,<br/>Equipo NextRead</p>
        `;
        await emailService({ to: usuario.correo, subject, html });
      } catch (emailErr) {
        console.error('Error al enviar email de suspensión:', emailErr);
      }

      try {
        if (typeof agregarNotificacion === 'function') {
          const mensaje = `Tu reseña/comentario: "${contenidoComentario}" fue eliminado por un administrador. Tu cuenta ha sido suspendida.`;
          await agregarNotificacion(autorId, mensaje, 'Moderación', { adminId, descargo });
        }
      } catch (notifError) {
        console.error('Error al agregar notificación de moderación:', notifError);
      }
    }

    return res.json({ message: '✅ Reseña/comentario eliminado y usuario suspendido correctamente' });
  } catch (err) {
    console.error('Error eliminando comentario:', err);
    return res.status(500).json({ error: 'Error en el servidor al intentar eliminar el comentario' });
  }
};

module.exports = { banearUsuario, eliminarComentario };