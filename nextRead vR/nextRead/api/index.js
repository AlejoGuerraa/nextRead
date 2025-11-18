const express = require('express');

const { 
    getAllUsers, 
    register, 
    login, 
    getUser, 
    editarPerfil,
    agregarNotificacion
} = require('./controller/peticionesUsuario');

const { buscar, cargarLibrosAutores, crearAutores, getTendencias, getLibroById } = require('./controller/busqueda');
const { getAllBooks, agregarLibroALista, guardarPuntuacion } = require('./controller/peticionesLibros');

const isAuth = require('./middlewares/isAuth');

const sequelize = require('./config/db');

const { FORCE } = require('sequelize/lib/index-hints');

require('./models/Usuario');
require('./models/Logro');
require('./models/Libro');
require('./models/Resena');
require('./models/Usuario_Logro');
require('./models/Amigo');
require('./models/indexModel');
require('./models/Autor');
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

// ---------------------- USER ----------------------
server.get('/nextread/user', isAuth, getUser);
server.get('/nextread/allUsers', getAllUsers);
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

// ---------------------- BUSQUEDA ----------------------
server.get('/nextread/buscar', buscar);
server.post('/nextread/cargarLibrosAutores', cargarLibrosAutores);
server.post('/nextread/crearAutores', crearAutores);
server.get('/nextread/tendencias', getTendencias);
server.get('/nextread/libro/:id', getLibroById);
server.get('/nextread/libros', getAllBooks);

// ---------------------- LIBROS / RESEÑAS ----------------------
server.post('/nextread/usuario/:tipo/:idLibro', isAuth, agregarLibroALista);
server.post('/nextread/resena/:idLibro', isAuth, guardarPuntuacion);

// ---------------------- INIT SERVER ----------------------
server.listen(3000, '0.0.0.0', async () => {
  try {
    await sequelize.sync({ force: false });
    console.log("Tablas alteradas correctamente");
    console.log("El server está corriendo en el puerto 3000");
  } catch (error) {
    console.error("Error al sincronizar las tablas:", error);
  }
});
