const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const TOO_MANY = { error: 'Demasiadas peticiones, intenta nuevamente más tarde.' };

function client_ip_key(req) {
  return ipKeyGenerator(req.ip || req.socket?.remoteAddress || '0.0.0.0');
}

function create_limiter(options) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: TOO_MANY,
    statusCode: 429,
    keyGenerator: options.keyGenerator || ((req) => client_ip_key(req)),
    skipSuccessfulRequests: options.skipSuccessfulRequests === true,
    skipFailedRequests: options.skipFailedRequests === true,
  });
}

/** Baseline for the whole API. High enough for homepage + search typing. */
const generalLimiter = create_limiter({
  windowMs: 15 * 60 * 1000,
  max: 1200,
});

/** Failed logins by IP + email. Successful logins do not consume the budget. */
const loginAccountLimiter = create_limiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const correo = String(req.body?.correo || '').trim().toLowerCase() || 'unknown';
    return `${client_ip_key(req)}:login:${correo}`;
  },
});

/** Caps credential stuffing across many emails from one IP. */
const loginIpLimiter = create_limiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  skipSuccessfulRequests: true,
});

const registerLimiter = create_limiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
});

const forgotPasswordLimiter = create_limiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    const email = String(req.body?.email || '').trim().toLowerCase() || 'unknown';
    return `${client_ip_key(req)}:forgot:${email}`;
  },
});

const resetPasswordLimiter = create_limiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

const checkLimiter = create_limiter({
  windowMs: 60 * 1000,
  max: 60,
});

const accountLimiter = create_limiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
});

const interactionLimiter = create_limiter({
  windowMs: 15 * 60 * 1000,
  max: 80,
});

const searchLimiter = create_limiter({
  windowMs: 60 * 1000,
  max: 90,
});

const expensiveLimiter = create_limiter({
  windowMs: 15 * 60 * 1000,
  max: 80,
});

const notificationLimiter = create_limiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

/** For sensitive operations: email changes, password changes, account deletion, etc. */
const sensitiveLimiter = create_limiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: false,
});

/** Combine loginAccountLimiter + loginIpLimiter for comprehensive login protection */
const loginLimiter = create_limiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => {
    const correo = String(req.body?.correo || '').trim().toLowerCase() || 'unknown';
    return `${client_ip_key(req)}:login:${correo}`;
  },
  skipSuccessfulRequests: true,
});

module.exports = {
  generalLimiter,
  loginAccountLimiter,
  loginIpLimiter,
  registerLimiter,
  loginLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  checkLimiter,
  accountLimiter,
  interactionLimiter,
  searchLimiter,
  expensiveLimiter,
  notificationLimiter,
  sensitiveLimiter,
};
