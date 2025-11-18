// src/models/asociaciones.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Usuario = require('./Usuario');
const Libro = require('./Libro');
const Autor = require('./Autor');
const Resena = require('./Resena');
const Amigo = require('./Amigo');
const Logro = require('./Logro');
const Usuario_Logro = require('./Usuario_Logro');
const Icono = require('./Icono');
const Banner = require('./Banner');



// 📘 Usuario ↔ Libro (por medio de Reseñas)
Usuario.belongsToMany(Libro, {
    through: Resena,
    foreignKey: 'usuario_id',
    otherKey: 'libro_id',
    as: 'LibrosResenados'
});

Libro.belongsToMany(Usuario, {
    through: Resena,
    foreignKey: 'libro_id',
    otherKey: 'usuario_id',
    as: 'UsuariosResenadores'
});

// 📄 Relaciones directas de Reseña
Resena.belongsTo(Usuario, {
    foreignKey: {
        name: 'usuario_id',
        allowNull: false
    },
    as: 'Usuario'
});

Resena.belongsTo(Libro, {
    foreignKey: {
        name: 'libro_id',
        allowNull: false
    },
    as: 'Libro'
});

Usuario.hasMany(Resena, {
    foreignKey: 'usuario_id',
    as: 'Resenas'
});

Libro.hasMany(Resena, {
    foreignKey: 'libro_id',
    as: 'Resenas'
});

// 👥 Amigos (relación doble)
Usuario.hasMany(Amigo, {
    foreignKey: 'usuario_id',
    as: 'Amigos'
});

Amigo.belongsTo(Usuario, {
    foreignKey: 'usuario_id',
    as: 'Usuario'
});

Amigo.belongsTo(Usuario, {
    foreignKey: 'amigo_id',
    as: 'Amigo'
});

// 🏆 Usuario ↔ Logro (muchos a muchos)
Usuario.belongsToMany(Logro, {
    through: Usuario_Logro,
    foreignKey: 'usuario_id',
    otherKey: 'logro_id',
    as: 'Logros'
});

Logro.belongsToMany(Usuario, {
    through: Usuario_Logro,
    foreignKey: 'logro_id',
    otherKey: 'usuario_id',
    as: 'Usuarios'
});

Autor.hasMany(Libro, {
    foreignKey: 'id_autor', // Clave foránea en la tabla Libro
    as: 'Libros'
});

// Un Libro pertenece a un solo Autor
Libro.belongsTo(Autor, {
    foreignKey: 'id_autor', // Clave foránea en la tabla Libro
    as: 'Autor'
});

// Icono con Usuario - Banner con Usuario

Usuario.belongsTo(Icono, { foreignKey: 'idIcono', as: 'icono' });
Usuario.belongsTo(Banner, { foreignKey: 'idBanner', as: 'banner' });

Icono.hasMany(Usuario, { foreignKey: 'idIcono', as: 'usuarios' });
Banner.hasMany(Usuario, { foreignKey: 'idBanner', as: 'usuarios' });

module.exports = { Usuario, Libro, Resena, Amigo, Logro, Usuario_Logro, Autor, Icono, Banner };
