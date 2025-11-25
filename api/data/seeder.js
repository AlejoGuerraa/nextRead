const db = require('../config/db.js'); 

const Autor = require('../models/Autor.js'); 
const Libro = require('../models/Libro.js'); 

const autoresData = require('./autores.json');
const librosData = require('./libros.json');


// Se definen las relaciones
Autor.hasMany(Libro, { foreignKey: 'id_autor' });
Libro.belongsTo(Autor, { foreignKey: 'id_autor' });

async function seedDatabase() {
  try {
        console.log('Sincronizando la base de datos...');
        
        // 1. DESACTIVAR CHEQUEOS DE LLAVE FORANEA (SOLO MySQL)
        await db.query('SET FOREIGN_KEY_CHECKS = 0', null, { raw: true }); 

        // 2. SINCRONIZAR (Elimina las tablas en cualquier orden sin conflicto)
        await db.sync({ force: true }); 

        // 3. REACTIVAR CHEQUEOS DE LLAVE FORÁNEA
        await db.query('SET FOREIGN_KEY_CHECKS = 1', null, { raw: true }); 
        
        console.log('Base de datos sincronizada y limpia.');

    // Cargar Autores (Tabla "Autor")
    console.log('Iniciando carga de autores...');
    // 'Autor' ahora es el modelo de Sequelize, por lo que '.bulkCreate()' va a funcionar.
    const autoresCreados = await Autor.bulkCreate(autoresData);
    console.log(`${autoresCreados.length} autores cargados con éxito.`);

    // Cargar Libros (Tabla "Libro")
    console.log('Iniciando carga de libros...');
    const librosCreados = await Libro.bulkCreate(librosData);
    console.log(`✅ ${librosCreados.length} libros cargados con éxito.`);

    console.log('Proceso de Seeding finalizado con exito.');
  } catch (error) {
    console.error('Error durante el seeding de la base de datos:', error);
  } finally {

    if (db) {
        await db.close();
    }
  }
}

seedDatabase();