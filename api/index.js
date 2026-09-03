const express = require('express');
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

// ---------------------- CONTROLLERS ----------------------
const {
    agregarNotificacion, getAllUsers, register, login,getUser,editarPerfil,checkEmail,checkUsername,buscarUsuario,
    crearLista,agregarLibroAListaEnLista,listarSeguidores,listarSeguidos,cancelarSeguido,
    seguirUsuario,dejarDeSeguir,marcarNotificacionesLeidas, getPublicUserById
} = require('./controller/peticionesUsuario');

const { banearUsuario, eliminarComentario } = require('./controller/peticionesAdmin');

const {
    buscar,getTendencias,getLibrosPorDecada,getMasDeAutor,getLibroById,getDecadasPersonalizadas,getGeneroPreferido,getRecomendacionesPorLibro
} = require('./controller/busqueda');

const {
    getAllBooks,agregarLibroALista,guardarPuntuacion,obtenerResenas,likeResena,unlikeResena
} = require('./controller/peticionesLibros');

const { getAllBanners, getAllIconos } = require('./controller/banners');
const { getAllAutores } = require('./controller/autorController');

const { enviarEnlaceRecuperacion, resetearPassword } = require('./controller/recoveryController');

const {
    changePassword,changeEmailRequest,confirmEmailChange,deleteAccountRequest,deleteAccountConfirm
} = require('./controller/configuracion');
const { getAuthMe } = require('./controller/authController');

// ---------------------- MIDDLEWARES ----------------------

const isAuth = require('./middlewares/isAuth');
const { optionalAuth } = require('./middlewares/isAuth');
const isAdmin = require('./middlewares/isAdmin');
const { validateBody, validateParams, validateQuery } = require('./middlewares/validate');
const {
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
} = require('./middlewares/rateLimiters');

// Schemas
const { registerSchema, loginSchema } = require('./schemas/authSchemas');
const { editarPerfilSchema, changePasswordSchema, changeEmailRequestSchema, deleteAccountConfirmSchema, crearListaSchema } = require('./schemas/userSchemas');
const { guardarPuntuacionSchema } = require('./schemas/bookSchemas');
const { forgotPasswordSchema, resetPasswordSchema } = require('./schemas/recoverySchemas');
const {
    emailSchema,notificationSchema,targetIdParamSchema,listActionParamsSchema,customListBookParamsSchema,
    recommendationParamsSchema,searchQuerySchema,userSearchQuerySchema,checkEmailQuerySchema,checkUsernameQuerySchema,
    decadeQuerySchema,followListQuerySchema,confirmEmailQuerySchema,paginationQuerySchema,idUsuarioParamSchema,
    idLibroParamSchema,idParamSchema
} = require('./schemas/busquedaSchemas');
const { banSchema } = require('./schemas/adminSchemas');

// ---------------------- DB ----------------------

const sequelize = require('./config/db');

// ---------------------- MODELS ----------------------

require('./models/Usuario');
require('./models/Libro');
require('./models/Autor');
require('./models/Logro');
require('./models/Resena');
require('./models/ResenaLike');
require('./models/Usuario_Logro');
require('./models/Seguidos_seguidores');
require('./models/indexModel');
require('./models/Icono');
require('./models/Banner');

// ======================== ENVIRONMENT VALIDATION ========================
// Valida que todas las variables críticas existan y sean no-vacías
const requiredEnvVars = ['SECRET', 'TEMPORAL_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName] || !String(process.env[varName]).trim());

if (missingEnvVars.length > 0) {
    console.error(`❌ Variables de entorno críticas faltantes: ${missingEnvVars.join(', ')}`);
    console.error('El servidor no puede iniciar sin estas variables.');
    process.exit(1);
}

// ---------------------------------------------------------
const server = express();
const port = Number(process.env.PORT || 3000);
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// CORS: allowlist explícita
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean);

// Trust proxy: solo si está explícitamente habilitado (para Railway, Render, etc.)
// En producción, esto es necesario para obtener la IP real detrás del proxy
// pero debe estar explícitamente configurado
if (process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true') {
    server.set('trust proxy', 1);
    if (isProduction) {
        console.log('⚠️  Trust proxy habilitado: la IP será tomada del header X-Forwarded-For');
    }
}

// ======================== SECURITY HEADERS ========================
// Helmet: protecciones de headers HTTP
server.disable("x-powered-by");  // No revelar que es Express
server.use(helmet({
    contentSecurityPolicy: false,  // Deshabilitado por ahora para no romper Vite/React
    crossOriginResourcePolicy: false,  // Permite compartir recursos
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },  // No enviar referrer innecesario
    hsts: {
        maxAge: 31536000,  // 1 año en segundos
        includeSubDomains: true,
        preload: false  // Solo en producción si está en el preload list
    },
    frameguard: {
        action: 'deny'  // No permitir en iframe
    },
    noSniff: true,  // No sniffear MIME types
    xssFilter: true,  // Protección XSS (legacy, pero no daña)
}));

// ======================== HTTP LOGGING ========================
// Morgan: registro de requests HTTP
// En desarrollo: usa "dev" para máxima información
// En producción: usa "combined" pero sin sensibles headers (ver configuración)
// Nota: Morgan no registra Authorization por defecto, pero se puede filtrar si es necesario
if (!isProduction) {
    server.use(morgan("dev"));
} else {
    // En producción: usar formato "combined" (equivalente a Apache) pero más conciso
    server.use(morgan("combined", {
        skip: (req, res) => {
            // Opcionalmente: saltar ciertos tipos de requests (ej: health checks)
            return false;
        }
    }));
}

// ======================== CORS ========================
// CORS: Cross-Origin Resource Sharing con allowlist explícita
// Nunca usar "*" con credentials: true
// FRONTEND_URL debe estar definido en .env para producción
if (isProduction && !process.env.FRONTEND_URL) {
    console.warn('⚠️  ADVERTENCIA: FRONTEND_URL no está definido en producción. CORS solo permitirá localhost.');
}

server.use(cors({
    origin: (origin, callback) => {
        // Sin origin header: puede ser same-site request o herramienta sin origen
        if (!origin) {
            callback(null, true);
            return;
        }
        
        // Verificar contra allowlist
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        
        // Origen no autorizado
        const err = new Error(`CORS: Origen no autorizado: ${origin}`);
        callback(err);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,  // Permitir cookies/credentials
    optionsSuccessStatus: 200,
    maxAge: 86400,  // Pre-flight cache: 1 día
}));

server.use(express.json({ limit: '100kb' }));
server.use(express.urlencoded({ extended: true, limit: '100kb' }));
server.use(generalLimiter);

// ---------------------- RUTAS USUARIO ----------------------
server.get('/nextread/user', isAuth, getUser);
server.get('/nextread/banners', getAllBanners);
server.get('/nextread/iconos', getAllIconos);
server.get('/nextread/autores', getAllAutores);
server.get('/nextread/check-email', checkLimiter, validateQuery(checkEmailQuerySchema), checkEmail);
server.get('/nextread/check-username', checkLimiter, validateQuery(checkUsernameQuerySchema), checkUsername);

// Buscar usuario por término
server.get('/nextread/buscar-usuario', searchLimiter, validateQuery(userSearchQuerySchema), buscarUsuario);

// CRUD Seguimientos (solo seguir / dejar de seguir)
server.get('/nextread/user/:id/seguidores', validateParams(idParamSchema), validateQuery(followListQuerySchema), listarSeguidores);
server.get('/nextread/user/:id/seguidos', validateParams(idParamSchema), validateQuery(followListQuerySchema), listarSeguidos);
server.delete('/nextread/unfollow/:targetId', isAuth, interactionLimiter, validateParams(targetIdParamSchema), cancelarSeguido);

// NUEVOS: Seguir / Dejar de seguir directo (sin solicitud)
server.post('/nextread/seguir/:targetId', isAuth, interactionLimiter, validateParams(targetIdParamSchema), seguirUsuario);
server.post('/nextread/dejar-seguir/:targetId', isAuth, interactionLimiter, validateParams(targetIdParamSchema), dejarDeSeguir);
// Notificaciones: marcar leídas
server.post('/nextread/notificaciones/marcar-leidas', isAuth, interactionLimiter, marcarNotificacionesLeidas);
// Obtener usuario público por id (avatar, nombre)
server.get('/nextread/user/public/:id', validateParams(idParamSchema), getPublicUserById);

// Like a reseña
server.post('/nextread/resena/:id/like', isAuth, interactionLimiter, validateParams(idParamSchema), likeResena);
server.delete('/nextread/resena/:id/like', isAuth, interactionLimiter, validateParams(idParamSchema), unlikeResena);

// ---------------------- ADMIN ----------------------
server.patch('/nextread/admin/ban/:id', isAuth, isAdmin, validateParams(idParamSchema), validateBody(banSchema), banearUsuario);
server.get('/nextread/allUsers', isAuth, isAdmin, validateQuery(paginationQuerySchema), getAllUsers);
server.delete('/nextread/admin/resena/:id', isAuth, isAdmin, validateParams(idParamSchema), validateBody(banSchema), eliminarComentario);

// ---------------------- AUTH ----------------------
server.post('/nextread/register', registerLimiter, validateBody(registerSchema), register);
server.post('/nextread/login', loginLimiter, validateBody(loginSchema), login);
server.get('/nextread/auth/me', isAuth, getAuthMe);
server.patch('/nextread/user/editar', isAuth, validateBody(editarPerfilSchema), editarPerfil);

// ---------------------- NOTIFICACIONES ----------------------
server.post('/nextread/notificacion/:idUsuario', isAuth, isAdmin, validateParams(idUsuarioParamSchema), validateBody(notificationSchema), async (req, res) => {
    try {
        const targetId = Number(req.params.idUsuario);
        const { mensaje } = req.body;

        await agregarNotificacion(targetId, mensaje, 'Sistema');
        return res.status(200).json({ msg: 'Notificación enviada correctamente' });

    } catch (error) {
        console.error('Error enviando notificación:', error);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ---------------------- BÚSQUEDAS ----------------------
server.get('/nextread/buscar', searchLimiter, validateQuery(searchQuerySchema), buscar);
server.get('/nextread/tendencias', searchLimiter, getTendencias);
server.get('/nextread/libros/por-decada', searchLimiter, validateQuery(decadeQuerySchema), getLibrosPorDecada);

server.post('/nextread/autorMasLeido', isAuth, sensitiveLimiter, validateBody(emailSchema), getMasDeAutor);
server.post('/nextread/decadas-personalizadas', isAuth, sensitiveLimiter, validateBody(emailSchema), getDecadasPersonalizadas);

server.get("/nextread/libros/genero-usuario/:idUsuario", isAuth, expensiveLimiter, validateParams(idUsuarioParamSchema), getGeneroPreferido);
server.get('/nextread/libro/:id', validateParams(idParamSchema), getLibroById);
server.get('/nextread/libros', getAllBooks);
server.get('/nextread/libros/recomendaciones/:idUsuario/:idLibro', isAuth, expensiveLimiter, validateParams(recommendationParamsSchema), getRecomendacionesPorLibro);

// ---------------------- LIBROS ----------------------
server.post('/nextread/usuario/:tipo/:idLibro', isAuth, interactionLimiter, validateParams(listActionParamsSchema), agregarLibroALista);
server.post('/nextread/resena/:idLibro', isAuth, interactionLimiter, validateParams(idLibroParamSchema), validateBody(guardarPuntuacionSchema), guardarPuntuacion);
server.get('/nextread/resenas/:idLibro', validateParams(idLibroParamSchema), obtenerResenas);

// Listas personalizadas
server.post('/nextread/listas', isAuth, interactionLimiter, validateBody(crearListaSchema), crearLista);
server.post('/nextread/listas/:nombre/libro/:idLibro', isAuth, interactionLimiter, validateParams(customListBookParamsSchema), agregarLibroAListaEnLista);

// ---------------------- RECOVERY ----------------------
server.post('/api/forgot-password', sensitiveLimiter, validateBody(forgotPasswordSchema), enviarEnlaceRecuperacion);
server.post('/api/reset-password', sensitiveLimiter, validateBody(resetPasswordSchema), resetearPassword);

// ---------------------- CONFIGURACIÓN ----------------------
server.post("/nextread/user/change-email-request", isAuth, sensitiveLimiter, validateBody(changeEmailRequestSchema), changeEmailRequest);
server.get("/api/confirm-email-change", optionalAuth, sensitiveLimiter, validateQuery(confirmEmailQuerySchema), confirmEmailChange);
server.patch('/nextread/user/change-password', isAuth, sensitiveLimiter, validateBody(changePasswordSchema), changePassword);
server.post("/nextread/user/delete-account-request", isAuth, sensitiveLimiter, deleteAccountRequest);
server.post("/nextread/user/delete-account-confirm", isAuth, sensitiveLimiter, validateBody(deleteAccountConfirmSchema), deleteAccountConfirm);

// ======================== GLOBAL ERROR HANDLER ========================
// Middleware de error: captura TODOS los errores no capturados
// Debe estar al final de todas las rutas
// Nota: (err, req, res, next) - 4 parámetros es obligatorio para que Express lo reconozca como error handler

server.use((err, req, res, next) => {
    // Error de JSON payload inválido (syntax error)
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Formato de solicitud inválido' });
    }

    // Error de CORS
    if (err.message && err.message.includes('CORS')) {
        return res.status(403).json({ error: 'Acceso denegado (CORS)' });
    }

    // Sequelize errors: no exponer detalles SQL
    if (err.name && (err.name === 'SequelizeError' || err.name.includes('Sequelize'))) {
        console.error('[DB ERROR]', err.name, err.message);
        return res.status(500).json({ error: 'Error al procesar la solicitud' });
    }

    // Validación de Zod u otros errores de validación
    if (err.name === 'ZodError' || err.errors) {
        console.error('[VALIDATION ERROR]', err.message);
        return res.status(400).json({ error: 'Datos inválidos en la solicitud' });
    }

    // Errores genéricos: no revelar stack trace
    const statusCode = err.statusCode || err.status || 500;
    const isDev = !isProduction;

    if (isDev) {
        // En desarrollo: mostrar más información (pero no secretos)
        console.error('[ERROR]', {
            message: err.message,
            method: req.method,
            path: req.path,
            // NO incluir: stack, body, headers, query completos
        });
    } else {
        // En producción: solo lo mínimo
        console.error('[ERROR]', err.message);
    }

    // Respuesta al cliente: siempre segura
    return res.status(statusCode).json({
        error: isDev ? err.message : 'Error interno del servidor'
    });
});

// ---------------------- INIT SERVER ----------------------
server.listen(port, '0.0.0.0', async () => {
    try {
        await sequelize.sync({ force: false, alter: false });
        console.log('Tablas sincronizadas correctamente (alter:true)');
        console.log(`Servidor corriendo en puerto ${port}`);
    } catch (error) {
        console.error('Error al sincronizar tablas:', error);
    }
});
