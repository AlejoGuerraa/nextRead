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
    // El ID del usuario administrador que realiza la acción se adjunta en el middleware
    const adminId = req.user.id; 

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

        // 2. ENVIAR NOTIFICACIÓN AL AUTOR (si la función está disponible)
        try { 
            if (typeof agregarNotificacion === 'function') {
                const mensaje = `Tu reseña/comentario: "${contenidoComentario}" ha sido eliminado por un administrador (ID Admin: ${adminId}).`;
                // NOTA: Asegúrate de que agregarNotificacion se importe correctamente
                await agregarNotificacion(autorId, mensaje, 'Moderación'); 
            } else {
                // Esto es solo una advertencia de desarrollo, no bloquea la eliminación
                console.warn("Advertencia: La función 'agregarNotificacion' no está definida o accesible.");
            }
        } catch (notifError) {
             // Si falla el envío de notificación, se registra, pero la eliminación continúa
            console.error('Error al enviar notificación de moderación:', notifError); 
        }

        return res.json({ message: '✅ Reseña/comentario eliminado correctamente' });
    } catch (err) {
        console.error('Error eliminando comentario:', err);
        return res.status(500).json({ error: 'Error en el servidor al intentar eliminar el comentario' });
    }
};

module.exports = { banearUsuario, eliminarComentario };