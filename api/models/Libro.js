const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const Libro = sequelize.define('Libro', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    titulo: {
        type: DataTypes.STRING(100),
        allowNull: false
    },

    fecha_publicacion: {
        type: DataTypes.DATE,
        allowNull: false
    },

    anio: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // Comentario: año de publicación del libro, extra para búsquedas rápidas

    tipo: {
        // valores permitidos para la columna "tipo" — ampliados para cubrir los valores
        // existentes en api/data/libros.json (p. ej. "Novela Corta", "Reportaje", combinaciones)
        type: DataTypes.ENUM(
            'Novela',
            'Cuento',
            'Novela Corta',
            'Poesía',
            'Reportaje',
            'Ensayo',
            'Ensayo/Cuento',
            'Cuento/Ensayo',
            'Memorias',
            'Manga',
            'Biografía',
            'Fábula',
            'Teatro',
            'Cómic',
            'Epopeya',
            'Filosófico',
            'Ficción',
            'Histórico'
        ),
        allowNull: false
    },
    // Comentario: tipo de libro (novela, cuento, poesía, manga, ensayo, etc.)

    descripcion: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    // Comentario: descripción completa del libro

    tema: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    // Comentario: resumen del tema principal del libro

    ranking: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    // Comentario: ranking general del libro

    generos: {
        type: DataTypes.JSON,
        allowNull: true
    },
    // Comentario: géneros del libro en formato JSON
    
    url_portada: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    id_autor: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
},
{
    timestamps: false, // No crea columnas createdAt/updatedAt automáticamente
    tableName: 'Libro'
})

module.exports = Libro