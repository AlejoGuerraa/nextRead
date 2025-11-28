const express = require('express');

const { agregarNotificacion, getAllUsers, register, login, getUser, editarPerfil, checkEmail, checkUsername, buscarUsuario, crearLista, agregarLibroAListaEnLista, enviarSolicitudSeguimiento, responderSolicitud, listarSeguidores, listarSeguidos, cancelarSeguido } = require('./controller/peticionesUsuario');
const { buscar, getTendencias, getLibrosPorDecada, getMasDeAutor, getLibroById, getDecadasPersonalizadas } = require('./controller/busqueda');
const { getAllBooks, agregarLibroALista, guardarPuntuacion, obtenerResenas } = require('./controller/peticionesLibros');
const { getAllBanners, getAllIconos } = require('./controller/banners');
const { enviarEnlaceRecuperacion, resetearPassword } = require('./controller/recoveryController');

const isAuth = require('./middlewares/isAuth');

const sequelize = require('./config/db');

const { FORCE } = require('sequelize/lib/index-hints');

require('./models/Usuario');
require('./models/Libro');
require('./models/Logro');
require('./models/Resena');
require('./models/Usuario_Logro');
require('./models/Seguidos_seguidores');
require('./models/indexModel');
require('./models/Icono');
require('./models/Banner');

const server = express();
server.use(express.json());

server.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Endpoints de usuario
server.get('/nextread/user',isAuth, getUser)
server.get('/nextread/allUsers', getAllUsers);
server.get('/nextread/banners', getAllBanners);
server.get('/nextread/iconos', getAllIconos);
server.get('/nextread/check-email', checkEmail);
server.get('/nextread/check-username', checkUsername);

// Endpoint para búsqueda de usuarios por término (query ?q=valor ó ?termino=valor)
server.get('/nextread/buscar-usuario', buscarUsuario);
// Seguimientos / follow
server.post('/nextread/follow/request/:targetId', isAuth, enviarSolicitudSeguimiento);
server.patch('/nextread/follow/:requestId', isAuth, responderSolicitud);
server.get('/nextread/user/:id/seguidores', listarSeguidores);
server.get('/nextread/user/:id/seguidos', listarSeguidos);
server.delete('/nextread/unfollow/:targetId', isAuth, cancelarSeguido);
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

// Endpoints de búsqueda
server.get('/nextread/buscar', buscar);
server.get('/nextread/tendencias', getTendencias);
server.get("/nextread/libros/por-decada", getLibrosPorDecada);

server.post('/nextread/autorMasLeido', getMasDeAutor);
server.post('/nextread/decadas-personalizadas', getDecadasPersonalizadas);
server.get('/nextread/libro/:id', getLibroById);
server.get('/nextread/libros', getAllBooks);

server.post('/nextread/usuario/:tipo/:idLibro', isAuth, agregarLibroALista);
server.post('/nextread/resena/:idLibro', isAuth, guardarPuntuacion);
server.get('/nextread/resenas/:idLibro', obtenerResenas);
// Rutas para listas nombradas
server.post('/nextread/listas', isAuth, crearLista);
server.post('/nextread/listas/:nombre/libro/:idLibro', isAuth, agregarLibroAListaEnLista);

server.post('/api/forgot-password', enviarEnlaceRecuperacion);
server.post('/api/reset-password', resetearPassword);

server.listen(3000, '0.0.0.0', async () => {
  try {
    await sequelize.sync({ force: false })
    console.log("Tablas alteradas correctamente");
    console.log("El server está corriendo en el puerto 3000");
  } catch (error) {
    console.error("Error al sincronizar las tablas:", error);
  }
});