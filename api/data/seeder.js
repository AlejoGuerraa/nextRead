const db = require('../config/db.js'); 
const fs = require('fs');
const path = require('path');

const Autor = require('../models/Autor.js'); 
const Libro = require('../models/Libro.js'); 
const Icono = require('../models/Icono.js'); 
const Banner = require('../models/Banner.js'); 

const autoresData = require('./autores.json');
const iconosData = require('./iconos.json');
const bannersData = require('./banners.json');

function getJsonFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap(entry => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return getJsonFiles(entryPath);
      return entry.isFile() && entry.name.endsWith('.json') ? [entryPath] : [];
    });
}

function loadLibrosData() {
  const librosDirectory = path.join(__dirname, 'libros');
  const files = getJsonFiles(librosDirectory);
  if (files.length === 0) {
    throw new Error(`No se encontraron archivos JSON en ${librosDirectory}`);
  }

  return files.flatMap(filePath => {
    let records;
    try {
      records = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      throw new Error(`No se pudo leer el JSON ${filePath}: ${error.message}`);
    }

    if (!Array.isArray(records)) {
      throw new Error(`El archivo ${filePath} debe contener un array de libros.`);
    }

    return records.map((record, index) => {
      if (!record || typeof record !== 'object' || Array.isArray(record)) {
        throw new Error(`Registro inválido en ${filePath}, índice ${index}.`);
      }

      const requiredFields = [
        'titulo', 'anio', 'tipo', 'descripcion', 'tema', 'ranking',
        'generos', 'tags', 'url_portada', 'id_autor'
      ];
      const missingFields = requiredFields.filter(field => !(field in record));
      if (missingFields.length > 0) {
        throw new Error(
          `Faltan campos (${missingFields.join(', ')}) en ${filePath}, índice ${index}.`
        );
      }
      if (!Number.isInteger(record.anio) || !Number.isFinite(record.ranking)) {
        throw new Error(`Año o ranking inválido en ${filePath}, índice ${index}.`);
      }
      if (!Array.isArray(record.generos) || !Array.isArray(record.tags)) {
        throw new Error(`Géneros o tags inválidos en ${filePath}, índice ${index}.`);
      }

      return record;
    });
  });
}

// Relaciones
Autor.hasMany(Libro, { foreignKey: 'id_autor' });
Libro.belongsTo(Autor, { foreignKey: 'id_autor' });

async function seedDatabase() {
  try {
    const librosData = loadLibrosData();
    console.log(`${librosData.length} libros encontrados en archivos JSON.`);
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

    // Crear mapa de nombre de autor -> id
    const autorMap = {};
    autoresCreados.forEach(autor => {
      autorMap[autor.nombre] = autor.id;
    });

    // Actualizar libros con los IDs correctos de autores
    const librosActualizados = librosData.map(libro => {
      // Buscar el autor por nombre (usando id_autor_nombre si existe en el JSON)
      const nombreAutor = libro.id_autor_nombre || libro.nombreAutor;
      if (nombreAutor && autorMap[nombreAutor]) {
        return {
          ...libro,
          id_autor: autorMap[nombreAutor]
        };
      }
      // Si no hay nombre, usar el id_autor original
      return libro;
    });

    // ------------------------------
    // Cargar LIBROS
    // ------------------------------
    console.log('Cargando libros...');
    const librosCreados = await Libro.bulkCreate(librosActualizados);
    console.log(`✔ ${librosCreados.length} libros cargados.`);

    console.log('Seeding completado con éxito.');
  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
    process.exitCode = 1;
  } finally {
    if (db) await db.close();
  }
}

seedDatabase();
