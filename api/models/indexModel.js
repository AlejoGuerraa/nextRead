const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Usuario = require('./Usuario');
const Libro = require('./Libro');
const Autor = require('./Autor');
const Resena = require('./Resena');
const ResenaLike = require('./ResenaLike');
const RespuestaResena = require('./RespuestaResena');
const Seguidos_Seguidores = require('./Seguidos_seguidores');
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

Resena.hasMany(RespuestaResena, {
    foreignKey: 'resena_id',
    as: 'Respuestas'
});

RespuestaResena.belongsTo(Resena, {
    foreignKey: 'resena_id',
    as: 'Resena'
});

RespuestaResena.belongsTo(Usuario, {
    foreignKey: 'usuario_id',
    as: 'Usuario'
});

Usuario.hasMany(RespuestaResena, {
    foreignKey: 'usuario_id',
    as: 'RespuestasResena'
});

// 👍 ResenaLike relationships
ResenaLike.belongsTo(Resena, {
    foreignKey: 'resena_id',
    as: 'Resena'
});

ResenaLike.belongsTo(Usuario, {
    foreignKey: 'usuario_id',
    as: 'Usuario'
});

Resena.hasMany(ResenaLike, {
    foreignKey: 'resena_id',
    as: 'Likes'
});

Usuario.hasMany(ResenaLike, {
    foreignKey: 'usuario_id',
    as: 'ResenaLikes'
});

// 👥 Amigos (relación doble)
// Usuario.hasMany(Amigo, {
//     foreignKey: 'usuario_id',
//     as: 'Amigos'
// });

// Amigo.belongsTo(Usuario, {
//     foreignKey: 'usuario_id',
//     as: 'Usuario'
// });

// Amigo.belongsTo(Usuario, {
//     foreignKey: 'amigo_id',
//     as: 'Amigo'
// });

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
    foreignKey: "id_autor",
    as: "Libros"
});

Libro.belongsTo(Autor, {
    foreignKey: "id_autor",
    as: "Autor"
});

// Icono con Usuario - Banner con Usuario

Usuario.belongsTo(Icono, { foreignKey: "idIcono", as: "iconoData" });
Usuario.belongsTo(Banner, { foreignKey: "idBanner", as: "bannerData" });

Icono.hasMany(Usuario, { foreignKey: 'idIcono', as: 'usuarios' });
Banner.hasMany(Usuario, { foreignKey: 'idBanner', as: 'usuarios' });

// -------------------------------
// Seguidos / Seguidores (follow)
// -------------------------------
// Cada fila representa una relación (id_remitente -> id_destinatario) y un estado.
// Podemos usar esta tabla como entidad intermedia para consultas y para relaciones M:N
// entre usuarios (auto-relación): quién sigue a quién y quién me sigue.

// El registro de seguimiento pertenece a dos usuarios (remitente y destinatario)
Seguidos_Seguidores.belongsTo(Usuario, { foreignKey: 'id_remitente', as: 'Remitente' });
Seguidos_Seguidores.belongsTo(Usuario, { foreignKey: 'id_destinatario', as: 'Destinatario' });

// Usuario tiene muchos registros de seguimiento como remitente (seguimientos enviados)
Usuario.hasMany(Seguidos_Seguidores, { foreignKey: 'id_remitente', as: 'seguimientosEnviados' });
// Usuario tiene muchos registros de seguimiento como destinatario (seguimientos recibidos)
Usuario.hasMany(Seguidos_Seguidores, { foreignKey: 'id_destinatario', as: 'seguimientosRecibidos' });

// Para consultas más directas: relaciones M:N autoreferenciales (usuarios que sigo / me siguen)
Usuario.belongsToMany(Usuario, {
    through: Seguidos_Seguidores,
    as: 'Seguidos', // las personas a las que este usuario sigue
    foreignKey: 'id_remitente',
    otherKey: 'id_destinatario'
});

Usuario.belongsToMany(Usuario, {
    through: Seguidos_Seguidores,
    as: 'Seguidores', // las personas que siguen a este usuario
    foreignKey: 'id_destinatario',
    otherKey: 'id_remitente'
});

module.exports = { Usuario, Libro, Resena, ResenaLike, RespuestaResena, Seguidos_Seguidores, Logro, Usuario_Logro, Autor, Icono, Banner };