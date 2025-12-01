const jwt = require('jsonwebtoken');
const User = require('../models/Usuario');

// This middleware works similarly to `isAuth` but verifies the token
// itself and ensures the user has role 'Admin'. Use this when routes
// must be protected for admins only. It sets req.user with { id, correo, rol }.
const claveSecreta = 'AdminLibros';

const isAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: 'Token no proporcionado' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

    jwt.verify(token, claveSecreta, async (err, decoded) => {
      if (err) return res.status(401).json({ message: 'Token inválido' });

      const user = await User.findByPk(decoded.id);
      if (!user) return res.status(400).json({ message: 'Usuario no encontrado' });

      if (user.rol !== 'Admin') return res.status(403).json({ error: 'Acceso denegado: se requiere rol Admin' });

      // attach useful fields to req.user so downstream handlers can use them
      req.user = { id: user.id, correo: user.correo, rol: user.rol };
      next();
    });
  } catch (err) {
    console.error('Error en isAdmin middleware', err);
    return res.status(500).json({ error: 'Error interno al verificar rol' });
  }
};

module.exports = isAdmin;