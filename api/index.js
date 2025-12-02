const express = require('express');

// ---------------------- CONTROLLERS ----------------------
const {
    agregarNotificacion,
    getAllUsers,
    register,
    login,
    getUser,
    editarPerfil,
    checkEmail,
    checkUsername,
    buscarUsuario,
    crearLista,
    agregarLibroAListaEnLista,
    listarSeguidores,
    listarSeguidos,
    cancelarSeguido,
    seguirUsuario,
    dejarDeSeguir
    ,marcarNotificacionesLeidas, getPublicUserById
} = require('./controller/peticionesUsuario');

const { banearUsuario, eliminarComentario } = require('./controller/peticionesAdmin');

const {
    buscar,
    getTendencias,
    getLibrosPorDecada,
    getMasDeAutor,
    getLibroById,
    getDecadasPersonalizadas,
    getGeneroPreferido,
    getRecomendacionesPorLibro
} = require('./controller/busqueda');

const {
    getAllBooks,
    agregarLibroALista,
    guardarPuntuacion,
    obtenerResenas,
    likeResena,
    unlikeResena
} = require('./controller/peticionesLibros');

const { getAllBanners, getAllIconos } = require('./controller/banners');
const { getAllAutores } = require('./controller/autorController');

const { enviarEnlaceRecuperacion, resetearPassword } = require('./controller/recoveryController');

const {
    changePassword,
    changeEmailRequest,
    confirmEmailChange,
    deleteAccountRequest,
    deleteAccountConfirm
} = require('./controller/configuracion');

// ---------------------- MIDDLEWARES ----------------------
const isAuth = require('./middlewares/isAuth');
const isAdmin = require('./middlewares/isAdmin');

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
server.use(express.json());

// CORS
server.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// ---------------------- RUTAS USUARIO ----------------------
server.get('/nextread/user', isAuth, getUser);
server.get('/nextread/allUsers', getAllUsers);
server.get('/nextread/banners', getAllBanners);
server.get('/nextread/iconos', getAllIconos);
server.get('/nextread/autores', getAllAutores);
server.get('/nextread/check-email', checkEmail);
server.get('/nextread/check-username', checkUsername);

// Buscar usuario por término
server.get('/nextread/buscar-usuario', buscarUsuario);

// CRUD Seguimientos (solo seguir / dejar de seguir)
server.get('/nextread/user/:id/seguidores', listarSeguidores);
server.get('/nextread/user/:id/seguidos', listarSeguidos);
server.delete('/nextread/unfollow/:targetId', isAuth, cancelarSeguido);

// NUEVOS: Seguir / Dejar de seguir directo (sin solicitud)
server.post('/nextread/seguir/:targetId', isAuth, seguirUsuario);
server.post('/nextread/dejar-seguir/:targetId', isAuth, dejarDeSeguir);
// Notificaciones: marcar leídas
server.post('/nextread/notificaciones/marcar-leidas', isAuth, marcarNotificacionesLeidas);
// Obtener usuario público por id (avatar, nombre)
server.get('/nextread/user/public/:id', getPublicUserById);

// ---------------------- ADMIN ----------------------
server.patch('/nextread/admin/ban/:id', isAuth, isAdmin, banearUsuario);
server.delete('/nextread/admin/resena/:id', isAuth, isAdmin, eliminarComentario);

// Like a reseña
server.post('/nextread/resena/:id/like', isAuth, likeResena);
server.delete('/nextread/resena/:id/like', isAuth, unlikeResena);

// ---------------------- AUTH ----------------------
server.post('/nextread/register', register);
server.post('/nextread/login', login);
server.patch('/nextread/user/editar', isAuth, editarPerfil);

// ---------------------- NOTIFICACIONES ----------------------
server.post('/nextread/notificacion/:idUsuario', async (req, res) => {
    try {
        const { idUsuario } = req.params;
        const { mensaje } = req.body;

        if (!mensaje) {
            return res.status(400).json({ error: "Falta el mensaje de la notificación" });
        }

        await agregarNotificacion(idUsuario, mensaje);
        return res.status(200).json({ msg: "Notificación enviada correctamente" });

    } catch (error) {
        console.error("Error enviando notificación:", error);
        return res.status(500).json({ error: "Error en el servidor" });
    }
});

// ---------------------- BÚSQUEDAS ----------------------
server.get('/nextread/buscar', buscar);
server.get('/nextread/tendencias', getTendencias);
server.get('/nextread/libros/por-decada', getLibrosPorDecada);

server.post('/nextread/autorMasLeido', getMasDeAutor);
server.post('/nextread/decadas-personalizadas', getDecadasPersonalizadas);

server.get("/nextread/libros/genero-usuario/:idUsuario", getGeneroPreferido);
server.get('/nextread/libro/:id', getLibroById);
server.get('/nextread/libros', getAllBooks);
server.get('/nextread/libros/recomendaciones/:idUsuario/:idLibro', getRecomendacionesPorLibro);

// ---------------------- LIBROS ----------------------
server.post('/nextread/usuario/:tipo/:idLibro', isAuth, agregarLibroALista);
server.post('/nextread/resena/:idLibro', isAuth, guardarPuntuacion);
server.get('/nextread/resenas/:idLibro', obtenerResenas);

// Listas personalizadas
server.post('/nextread/listas', isAuth, crearLista);
server.post('/nextread/listas/:nombre/libro/:idLibro', isAuth, agregarLibroAListaEnLista);

// ---------------------- RECOVERY ----------------------
server.post('/api/forgot-password', enviarEnlaceRecuperacion);
server.post('/api/reset-password', resetearPassword);

// ---------------------- CONFIGURACIÓN ----------------------
server.post("/nextread/user/change-email-request", isAuth, changeEmailRequest);
server.get("/api/confirm-email-change", confirmEmailChange);
server.patch('/nextread/user/change-password', isAuth, changePassword);
server.post("/nextread/user/delete-account-request", isAuth, deleteAccountRequest);
server.post("/nextread/user/delete-account-confirm", deleteAccountConfirm);

// ---------------------- INIT SERVER ----------------------
server.listen(3000, '0.0.0.0', async () => {
    try {
        await sequelize.sync({ force: false, alter: false });
        console.log("Tablas sincronizadas correctamente (alter:true)");
        console.log("Servidor corriendo en puerto 3000");
    } catch (error) {
        console.error("Error al sincronizar tablas:", error);
    }
});
