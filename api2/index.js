const express = require('express');
const {
    getAllUsers,
    register,
    login, 
    getAllBooks,
    getAuthors,
    getBookById,
    getTrendingBooks,
    buscar,
    cargarLibrosAutores,
    crearAutores,
    agregarLibroALista,
    getPrimerosLibros
} = require('./controller/peticionesUsuario');

const isAuth = require('./middlewares/isAuth');
const sequelize = require('./config/db');
const { FORCE } = require('sequelize/lib/index-hints');

require('./models/Usuario');
require('./models/Autor')
require('./models/Logro');
require('./models/Libro');
require('./models/Resena');
require('./models/Usuario_Logro');
require('./models/Amigo');
require('./models/indexModel');
require('./models/Banner');
require('./models/Icono');

const server = express();
server.use(express.json());

server.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// --------------- Endpoints para registrar usuarios ---------------
server.get('/nextread/allUsers', getAllUsers);
server.post('/nextread/register', register);
server.post('/nextread/login', login);

// --------------- Endpoints para libros y autores ---------------
server.get('/nextread/libros', getAllBooks);
server.get('/nextread/autores', getAuthors)
server.get('/nextread/libro/:id', getBookById);
server.post('/nextread/usuario/:tipo/:idLibro', isAuth, agregarLibroALista);
server.get('/nextread/trending', getTrendingBooks);
server.get('/nextread/buscar', buscar);
server.post('/nextread/agregarAutoresPrueba', crearAutores)
server.post('/nextread/agregarLibrosPrueba', cargarLibrosAutores)
server.get('/nextread/primeros', getPrimerosLibros);



server.listen(3000, async () => {
    await sequelize.sync();
    console.log("Servidor en puerto 3000 ");
});
