const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Usuario = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false
  },

  apellido: {
    type: DataTypes.STRING(255),
    allowNull: false
  },

  correo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },

  usuario: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },

  contrasena: {
    type: DataTypes.STRING(255),
    allowNull: false
  },

  rol: {
    type: DataTypes.ENUM('Admin', 'Usuario'),
    allowNull: false,
    defaultValue: 'Usuario'
  },

  fecha_nacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  activo: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1
  },

  icono: {
    type: DataTypes.STRING(255),
    allowNull: false
  },

  banner: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: "banner.jpg"
  },

  fecha_ingreso: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },

  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: false
  },

  autor_preferido: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: ""
  },

  genero_preferido: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: ""
  },
  titulo_preferido: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: ""
  },

  libros_leidos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },

  iconos_obtenidos: {
    type: DataTypes.JSON,
    allowNull: true
  },

  banners_obtenidos: {
    type: DataTypes.JSON,
    allowNull: true
  },

  libros_favoritos: {
    type: DataTypes.JSON,
    allowNull: true
  },

  libros_en_lectura: {
    type: DataTypes.JSON,
    allowNull: true
  },

  libros_para_leer: {
    type: DataTypes.JSON,
    allowNull: true
  },

  listas: {
    type: DataTypes.JSON,
    allowNull: true
  },

  notificaciones: {
    type: DataTypes.JSON,
    allowNull: true
  },

  libros_rec: {
    type: DataTypes.JSON,
    allowNull: true
  },

  autores_rec: {
    type: DataTypes.JSON,
    allowNull: true
  },

  generos_rec: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'Usuario'
});

module.exports = Usuario;



