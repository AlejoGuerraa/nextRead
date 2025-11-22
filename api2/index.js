const express = require('express');
const { getAllUsers, register, login, getAllBooks, getBookById, getUserById, editarPerfil } = require('./controller/peticionesUsuario');
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

const server = express();
server.use(express.json());

server.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

server.get('/nextread/user',isAuth, getUserById)
server.get('/nextread/allUsers', getAllUsers);
server.post('/nextread/register', register);
server.post('/nextread/login', login);
server.get('/nextread/libros', getAllBooks);
server.get('/nextread/libro/:id', getBookById);
server.patch('/nextread/user/editar', isAuth, editarPerfil);


server.listen(3000, async () => {
    await sequelize.sync();
    console.log("Servidor en puerto 3000 ");
});
