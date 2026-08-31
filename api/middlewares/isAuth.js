const Usuario = require('../models/Usuario');
const { verify_access_token } = require('../utils/jwtTokens');

function parse_bearer_token(authHeader) {
  if (!authHeader) return { error: 'Token no proporcionado', status: 401 };
  const parts = String(authHeader).split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    return { error: 'Formato de token inválido', status: 401 };
  }
  return { token: parts[1] };
}

async function load_authenticated_user(decoded) {
  const user = await Usuario.findByPk(decoded.id, {
    attributes: ['id', 'correo', 'rol', 'activo'],
  });
  if (!user) {
    return { error: 'Token inválido', status: 401 };
  }
  if (Number(user.activo) === 0) {
    return { error: 'La cuenta se encuentra desactivada', status: 403 };
  }
  return {
    user: {
      id: user.id,
      correo: user.correo,
      rol: user.rol,
    },
  };
}

/**
 * Requires a valid access JWT, an existing user and activo !== 0.
 * Rejects recovery / email-change / delete tokens.
 */
const isAuth = async (req, res, next) => {
  const parsed = parse_bearer_token(req.headers.authorization);
  if (parsed.error) {
    return res.status(parsed.status).json({ message: parsed.error });
  }

  try {
    const decoded = verify_access_token(parsed.token);
    const loaded = await load_authenticated_user(decoded);
    if (loaded.error) {
      return res.status(loaded.status).json({ message: loaded.error });
    }
    req.user = loaded.user;
    return next();
  } catch (_err) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

/**
 * If Authorization is present, applies the same rules as isAuth.
 * If it is absent, continues as a public request.
 */
const optionalAuth = async (req, res, next) => {
  if (!req.headers.authorization) {
    return next();
  }
  return isAuth(req, res, next);
};

module.exports = isAuth;
module.exports.optionalAuth = optionalAuth;
module.exports.parse_bearer_token = parse_bearer_token;
