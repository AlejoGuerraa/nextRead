const User = require('../models/Usuario');
const isAuth = require('./isAuth');

/**
 * Allows only currently active administrators.
 * Relies on isAuth when req.user is not already set.
 */
async function assert_admin(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'correo', 'rol', 'activo'],
    });

    if (!user) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    if (Number(user.activo) === 0) {
      return res.status(403).json({ message: 'La cuenta se encuentra desactivada' });
    }

    if (user.rol !== 'Admin') {
      return res.status(403).json({ error: 'Acceso denegado: se requiere rol Admin' });
    }

    req.user = { id: user.id, correo: user.correo, rol: user.rol };
    return next();
  } catch (_err) {
    return res.status(500).json({ error: 'Error de autorización' });
  }
}

const isAdmin = (req, res, next) => {
  if (req.user && req.user.id) {
    return assert_admin(req, res, next);
  }
  return isAuth(req, res, () => assert_admin(req, res, next));
};

module.exports = isAdmin;
