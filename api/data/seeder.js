const db = require('../config/db.js'); 

const Autor = require('../models/Autor.js'); 
const Libro = require('../models/Libro.js'); 
const Icono = require('../models/Icono.js'); 
const Banner = require('../models/Banner.js'); 

const autoresData = require('./autores.json');
const librosData = require('./libros.json');
const iconosData = require('./iconos.json');
const bannersData = require('./banners.json');

// Relaciones
Autor.hasMany(Libro, { foreignKey: 'id_autor' });
Libro.belongsTo(Autor, { foreignKey: 'id_autor' });

async function seedDatabase() {
  try {
    console.log('Sincronizando la base de datos...');

    // 1. DESACTIVAR CHEQUEOS DE LLAVE FORANEA (MySQL)
    await db.query('SET FOREIGN_KEY_CHECKS = 0', null, { raw: true });

    // 2. REINICIAR TABLAS
    await db.sync({ force: true });

    // 3. REACTIVAR CHEQUEOS
    await db.query('SET FOREIGN_KEY_CHECKS = 1', null, { raw: true });

    console.log('Base de datos sincronizada y limpia.');

    // ------------------------------
    // Cargar ICONOS
    // ------------------------------
    console.log('Cargando iconos...');
    const iconosCreados = await Icono.bulkCreate(iconosData);
    console.log(`✔ ${iconosCreados.length} iconos cargados.`);

    // ------------------------------
    // Cargar BANNERS
    // ------------------------------
    console.log('Cargando banners...');
    const bannersCreados = await Banner.bulkCreate(bannersData);
    console.log(`✔ ${bannersCreados.length} banners cargados.`);

    // ------------------------------
    // Cargar AUTORES
    // ------------------------------
    console.log('Cargando autores...');
    const autoresCreados = await Autor.bulkCreate(autoresData);
    console.log(`✔ ${autoresCreados.length} autores cargados.`);

    // ------------------------------
    // Cargar LIBROS
    // ------------------------------
    console.log('Cargando libros...');
    const librosCreados = await Libro.bulkCreate(librosData);
    console.log(`✔ ${librosCreados.length} libros cargados.`);

    console.log('Seeding completado con éxito.');
  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
  } finally {
    if (db) await db.close();
  }
}

seedDatabase();
