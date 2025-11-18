const Sequelize = require('sequelize');

// Reemplaza 'nombre_de_tu_base_de_datos', 'tu_usuario', 'tu_contraseña' con tus credenciales de PostgreSQL
const database = new Sequelize('nextRead', 'root','5614',{
    host: 'localhost', // O la dirección de tu servidor PostgreSQL
    dialect: 'mysql', // ESTE es el cambio clave
    logging: false
});

module.exports = database;