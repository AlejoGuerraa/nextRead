const Banner = require('../models/Banner');
const Icono = require('../models/Icono');

const getAllBanners = async (_req, res) => {
  try {
    const banners = await Banner.findAll({ attributes: ['id', 'url'] });
    res.json(banners);
  } catch (error) {
    console.error('Error al obtener banners:', error);
    res.status(500).json({ error: 'Error al obtener banners' });
  }
};

const getAllIconos = async (_req, res) => {
  try {
    const iconos = await Icono.findAll({ attributes: ['id', 'simbolo'] });
    res.json(iconos);
  } catch (error) {
    console.error('Error al obtener iconos:', error);
    res.status(500).json({ error: 'Error al obtener iconos' });
  }
};

module.exports = {
  getAllBanners,
  getAllIconos
};
