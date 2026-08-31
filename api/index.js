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
    emailSchema,
    notificationSchema,
    targetIdParamSchema,
    listActionParamsSchema,
    customListBookParamsSchema,
    recommendationParamsSchema,
    searchQuerySchema,
    userSearchQuerySchema,
    checkEmailQuerySchema,
    checkUsernameQuerySchema,
    decadeQuerySchema,
    followListQuerySchema,
    confirmEmailQuerySchema,
    paginationQuerySchema,
    idUsuarioParamSchema,
    idLibroParamSchema,
    idParamSchema
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

// ---------------------------------------------------------
const server = express();
const port = Number(process.env.PORT || 3000);
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean);

if (process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true') {
    server.set('trust proxy', 1);
}

if (!process.env.SECRET || !String(process.env.SECRET).trim()) {
    throw new Error('Falta la variable de entorno SECRET requerida para JWT.');
}
if (!process.env.TEMPORAL_SECRET || !String(process.env.TEMPORAL_SECRET).trim()) {
    throw new Error('Falta la variable de entorno TEMPORAL_SECRET requerida para tokens temporales.');
}

// Seguridad
server.disable("x-powered-by");
server.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Logs HTTP (solo desarrollo)
server.use(morgan("dev"));

// CORS con allowlist controlada
server.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error('Origen no autorizado por CORS'));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200,
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

server.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Payload inválido' });
    }
    console.error('Unhandled server error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
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
