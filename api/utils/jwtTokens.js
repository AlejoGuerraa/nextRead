require('dotenv').config();
const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.SECRET;
const TEMPORAL_SECRET = process.env.TEMPORAL_SECRET;

if (!ACCESS_SECRET || !String(ACCESS_SECRET).trim()) {
  throw new Error('Falta la variable de entorno SECRET requerida para JWT.');
}
if (!TEMPORAL_SECRET || !String(TEMPORAL_SECRET).trim()) {
  throw new Error('Falta la variable de entorno TEMPORAL_SECRET requerida para tokens temporales.');
}
if (String(ACCESS_SECRET) === String(TEMPORAL_SECRET)) {
  throw new Error('SECRET y TEMPORAL_SECRET deben ser valores distintos.');
}

const ISSUER = 'nextread-api';
const AUDIENCE = 'nextread-client';
const ALGORITHM = 'HS256';

const TOKEN_TYPES = {
  ACCESS: 'access',
  RECOVERY: 'recovery',
  EMAIL_CHANGE: 'email-change',
  ACCOUNT_DELETE: 'account-delete',
};

const accessTokenTtl = process.env.JWT_ACCESS_TOKEN_TTL || '8h';
const recoveryTokenTtl = process.env.JWT_RECOVERY_TOKEN_TTL || '1h';
const emailTokenTtl = process.env.JWT_EMAIL_TOKEN_TTL || '15m';
const deleteTokenTtl = process.env.JWT_DELETE_TOKEN_TTL || '15m';

const verifyOptions = {
  algorithms: [ALGORITHM],
  issuer: ISSUER,
  audience: AUDIENCE,
};

function sign_access_token(userId) {
  return jwt.sign(
    { id: userId, type: TOKEN_TYPES.ACCESS },
    ACCESS_SECRET,
    {
      expiresIn: accessTokenTtl,
      algorithm: ALGORITHM,
      issuer: ISSUER,
      audience: AUDIENCE,
    }
  );
}

function verify_access_token(token) {
  const decoded = jwt.verify(token, ACCESS_SECRET, verifyOptions);
  if (decoded.type !== TOKEN_TYPES.ACCESS || !decoded.id) {
    const error = new Error('Token destinado a otro propósito');
    error.name = 'JsonWebTokenError';
    throw error;
  }
  return decoded;
}

function sign_temporal_token(payload, type, expiresIn) {
  return jwt.sign(
    { ...payload, type },
    TEMPORAL_SECRET,
    {
      expiresIn,
      algorithm: ALGORITHM,
      issuer: ISSUER,
      audience: AUDIENCE,
    }
  );
}

function verify_temporal_token(token, expectedType) {
  const decoded = jwt.verify(token, TEMPORAL_SECRET, verifyOptions);
  if (decoded.type !== expectedType || !decoded.id) {
    const error = new Error('Token destinado a otro propósito');
    error.name = 'JsonWebTokenError';
    throw error;
  }
  return decoded;
}

module.exports = {
  TOKEN_TYPES,
  ALGORITHM,
  ISSUER,
  AUDIENCE,
  accessTokenTtl,
  recoveryTokenTtl,
  emailTokenTtl,
  deleteTokenTtl,
  sign_access_token,
  verify_access_token,
  sign_temporal_token,
  verify_temporal_token,
};
