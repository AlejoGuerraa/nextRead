const User = require('../models/Usuario');
const Resena = require('../models/Resena');

// traer helper para notificaciones (está exportado en peticionesUsuario)
let agregarNotificacion = null;
try {
  // require lazily to avoid potential circular require issues at load time
  agregarNotificacion = require('./peticionesUsuario').agregarNotificacion;
} catch (e) {
  // ignore if not available
  agregarNotificacion = null;
}

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

    // Notificar al usuario (si existe el helper)
    try { if (agregarNotificacion) await agregarNotificacion(usuario.id, 'Has sido baneado por un administrador.', 'Sistema'); } catch (_) {}

    return res.json({ message: 'Usuario baneado correctamente', usuario });
  } catch (err) {
    console.error('Error en banearUsuario:', err);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Eliminar comentario/resena por id
const eliminarComentario = async (req, res) => {
  try {
    const { id } = req.params; // id de la resena

    if (!id || Number.isNaN(Number(id))) return res.status(400).json({ error: 'ID inválido' });

    const resena = await Resena.findByPk(id);
    if (!resena) return res.status(404).json({ error: 'Reseña/comentario no encontrado' });

    const autorId = resena.usuario_id;

    await resena.destroy();

    try { if (agregarNotificacion) await agregarNotificacion(autorId, 'Tu comentario ha sido eliminado por un administrador.', 'Moderación'); } catch (_) {}

    return res.json({ message: 'Reseña/comentario eliminado correctamente' });
  } catch (err) {
    console.error('Error eliminando comentario:', err);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
};

module.exports = { banearUsuario, eliminarComentario };