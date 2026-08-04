const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const claveSecreta = process.env.SECRET;

const isAuth = async (req, res, next) => {
  if (!claveSecreta) {
    return res.status(500).json({ message: 'Configuración de autenticación incompleta' });
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Token no proporcionado' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Formato de token inválido' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, claveSecreta);
    const user = await Usuario.findByPk(decoded.id);

    if (!user) {
      return res.status(403).json({ message: 'Token válido, usuario no encontrado' });
    }

    req.user = {
      id: user.id,
      correo: user.correo,
      rol: user.rol,
    };

    return next();
  } catch (err) {
    console.error('Auth token verification error:', err);
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
};

module.exports = isAuth;
