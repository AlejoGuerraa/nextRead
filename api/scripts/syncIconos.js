// Sincroniza la tabla Icono con data/iconos.json (agrega los que falten)
// y le da a TODOS los usuarios todos los íconos disponibles.
// Uso: npm run sync:iconos   (se puede correr varias veces, no duplica nada)
const sequelize = require('../config/db');
const Icono = require('../models/Icono');
const Usuario = require('../models/Usuario');
const iconosData = require('../data/iconos.json');

function parse_ids(value) {
    if (Array.isArray(value)) return value.map(Number).filter(Number.isInteger);
    if (typeof value === 'string') {
        try { return parse_ids(JSON.parse(value)); } catch { return []; }
    }
    return [];
}

async function sync_iconos() {
    await sequelize.authenticate();

    let creados = 0;
    for (const { simbolo } of iconosData) {
        const [, created] = await Icono.findOrCreate({ where: { simbolo }, defaults: { simbolo } });
        if (created) creados += 1;
    }
    const ids = (await Icono.findAll({ attributes: ['id'], order: [['id', 'ASC']] })).map((i) => i.id);
    console.log(`Íconos nuevos: ${creados}. Total en la base: ${ids.length}.`);

    const usuarios = await Usuario.findAll({ attributes: ['id', 'iconos_obtenidos'] });
    let actualizados = 0;
    for (const usuario of usuarios) {
        const actuales = parse_ids(usuario.iconos_obtenidos);
        const todos = [...new Set([...actuales, ...ids])];
        if (todos.length !== actuales.length) {
            usuario.iconos_obtenidos = todos;
            await usuario.save();
            actualizados += 1;
        }
    }
    console.log(`Usuarios actualizados: ${actualizados} de ${usuarios.length}.`);
}

sync_iconos()
    .catch((error) => {
        console.error('Error sincronizando íconos:', error);
        process.exitCode = 1;
    })
    .finally(() => sequelize.close());
