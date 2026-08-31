/**
 * logger.js - Utilidad de logging segura
 * 
 * Propósito:
 * - Loguear información útil sin exponer secretos
 * - Reducir verbosidad en producción
 * - Nunca loguear: JWT, passwords, tokens, secretos, Authorization headers
 * 
 * Uso:
 * const logger = require('./utils/logger');
 * logger.info('Información general');
 * logger.error('Error detectado', err);
 * logger.debug('Debug info (solo en dev)');
 */

const NODE_ENV = process.env.NODE_ENV || 'development';
const isDev = NODE_ENV === 'development';

// Objetos peligrosos que nunca deben aparecer en logs
const SENSITIVE_KEYWORDS = ['password', 'contrasena', 'jwt', 'token', 'secret', 'authorization', 'bearer'];

/**
 * Sanitiza un objeto para remover datos sensibles antes de loguear
 */
function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        
        // Remover campos sensibles completamente
        if (SENSITIVE_KEYWORDS.some(keyword => lowerKey.includes(keyword))) {
            sanitized[key] = '[REDACTED]';
            continue;
        }

        // Recursivamente sanitizar objetos anidados
        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
            sanitized[key] = sanitizeObject(value);
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item => 
                typeof item === 'object' ? sanitizeObject(item) : item
            );
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

/**
 * Extrae mensajes útiles de errores sin revelar stack traces
 */
function getErrorInfo(err) {
    if (!err) return 'Unknown error';
    
    if (typeof err === 'string') return err;
    
    if (err.message) {
        // Si es un error de Sequelize, no revelar SQL
        if (err.name && err.name.includes('Sequelize')) {
            return `[${err.name}] Database error`;
        }
        return err.message;
    }
    
    return String(err);
}

/**
 * Logger.info - Información general (siempre se loguea)
 */
function info(message, data) {
    const timestamp = new Date().toISOString();
    const payload = data ? sanitizeObject(data) : '';
    console.log(`[${timestamp}] INFO: ${message}`, payload);
}

/**
 * Logger.error - Errores (siempre se loguea)
 */
function error(message, err) {
    const timestamp = new Date().toISOString();
    const errInfo = getErrorInfo(err);
    
    // En desarrollo: más información
    if (isDev && err && typeof err === 'object' && err.stack) {
        console.error(`[${timestamp}] ERROR: ${message}\n`, errInfo, '\nStack:', err.stack);
    } else {
        console.error(`[${timestamp}] ERROR: ${message}`, errInfo);
    }
}

/**
 * Logger.debug - Debug (solo en desarrollo)
 */
function debug(message, data) {
    if (!isDev) return;
    
    const timestamp = new Date().toISOString();
    const payload = data ? sanitizeObject(data) : '';
    console.log(`[${timestamp}] DEBUG: ${message}`, payload);
}

/**
 * Logger.warn - Advertencias (siempre se loguea)
 */
function warn(message, data) {
    const timestamp = new Date().toISOString();
    const payload = data ? sanitizeObject(data) : '';
    console.warn(`[${timestamp}] WARN: ${message}`, payload);
}

module.exports = {
    info,
    error,
    debug,
    warn
};
