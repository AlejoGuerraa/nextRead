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
const emailService = require('../services/emailService');
const eliminarComentario = async (req, res) => {
  // El ID del usuario administrador que realiza la acción se adjunta en el middleware
  const adminId = req.user.id;
  const { descargo } = req.body || {};

  try {
    const { id } = req.params; // ID de la reseña/comentario (que corresponde a Resena.id)

    if (!id || Number.isNaN(Number(id))) {
      return res.status(400).json({ error: 'ID de reseña/comentario inválido' });
    }

    const resena = await Resena.findByPk(id);
    if (!resena) {
      return res.status(404).json({ error: 'Reseña/comentario no encontrado' });
    }

    const autorId = resena.usuario_id;
    // Capturamos el comentario para usarlo en la notificación
    const contenidoComentario = resena.comentario ? resena.comentario.substring(0, 50) + '...' : 'Comentario sin contenido.';

    // 1. ELIMINAR LA RESEÑA/COMENTARIO
    await resena.destroy();

    // 2. SUSPENDER LA CUENTA DEL AUTOR CONFIGURANDO activo = 0
    try {
      const usuario = await User.findByPk(autorId);
      if (usuario) {
        usuario.activo = 0;
        await usuario.save();

        // Enviar correo al usuario afectado informando la suspensión y el descargo
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

          // emailService expects { to, subject, html }
          await emailService({ to: usuario.correo, subject, html });
        } catch (emailErr) {
          console.error('Error al enviar email de suspensión:', emailErr);
        }

        // 3. ENVIAR NOTIFICACIÓN EN LA APP (si existe helper)
        try {
          if (typeof agregarNotificacion === 'function') {
            const mensaje = `Tu reseña/comentario: "${contenidoComentario}" fue eliminado por un administrador. Tu cuenta ha sido suspendida.`;
            await agregarNotificacion(autorId, mensaje, 'Moderación', { adminId, descargo });
          }
        } catch (notifError) {
          console.error('Error al agregar notificación de moderación:', notifError);
        }
      }
    } catch (suspendErr) {
      console.error('Error al suspender usuario después de eliminar reseña:', suspendErr);
    }

    return res.json({ message: '✅ Reseña/comentario eliminado y usuario suspendido correctamente' });
  } catch (err) {
    console.error('Error eliminando comentario:', err);
    return res.status(500).json({ error: 'Error en el servidor al intentar eliminar el comentario' });
  }
};

module.exports = { banearUsuario, eliminarComentario };