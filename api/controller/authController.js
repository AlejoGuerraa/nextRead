const Usuario = require('../models/Usuario');

const getAuthMe = async (req, res) => {
  try {
    const user = await Usuario.findByPk(req.user.id, {
      attributes: ['id', 'usuario', 'correo', 'rol'],
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error('Error en auth/me:', err);
    return res.status(500).json({ error: 'Error al validar sesión' });
  }
};

module.exports = {
  getAuthMe,
};
