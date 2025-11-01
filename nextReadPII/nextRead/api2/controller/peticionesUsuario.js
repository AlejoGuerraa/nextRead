const User = require("../models/Usuario");
const Libro = require("../models/Libro");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const claveSecreta = 'AdminLibros';

// ----------------- GET USERS -----------------
const getAllUsers = async (_req, res) => {
    try {
        const usuarios = await User.findAll({ attributes: { exclude: ['contrasena'] } });
        res.json(usuarios);
    } catch (error) {
        return res.status(404).json({ error: "No se encontró ningún usuario registrado" });
    }
};

// ----------------- REGISTER -----------------
const register = async (req, res) => {
    console.log(req.body);

    const { nombre, apellido, correo, usuario, contrasena, fecha_nacimiento,
        icono, banner, descripcion, libros_rec, autores_rec, generos_rec } = req.body;

    if (!nombre || !apellido || !correo || !contrasena || !fecha_nacimiento) {
        return res.status(401).json({ error: "Ingrese toda la información necesaria para continuar" });
    }

    const tieneMayuscula = [...contrasena].some(letra => letra >= 'A' && letra <= 'Z');
    const tieneLongitud = contrasena.length >= 8;

    if (!tieneMayuscula || !tieneLongitud) {
        return res.status(400).json({
            error: "La contraseña debe tener al menos 8 caracteres y contener al menos una letra mayúscula"
        });
    }

    const hashedPassw = await bcrypt.hash(contrasena, 10);

    const usuarioasd = await User.findOne({ where: { usuario } });
    if (usuarioasd) return res.status(400).json({ error: "El nombre de usuario ya está registrado" });

    const correoadsd = await User.findOne({ where: { correo } });
    if (correoadsd) return res.status(400).json({ error: "El correo ya está registrado" });

    const newUser = await User.create({
        nombre, apellido, correo, usuario,
        contrasena: hashedPassw,
        fecha_nacimiento, icono, banner,
        descripcion, libros_rec, autores_rec, generos_rec
    });

    res.status(200).json({ message: "Nuevo usuario creado", data: newUser });
};

// ----------------- LOGIN -----------------
const login = async (req, res) => {
    const { correo, contrasena } = req.body;

    const user = await User.findOne({ where: { correo } });

    if (!user) return res.status(400).json({ message: "Usuario no encontrado" });

    const comparacion = await bcrypt.compare(contrasena, user.contrasena);
    if (!comparacion) {
        return res.status(400).json({ error: "Su email o contraseña incorrectos" });
    }

    const token = jwt.sign({ id: user.id, correo: user.correo }, claveSecreta, { expiresIn: '8h' });

    const userData = user.get({ plain: true });
    delete userData.contrasena;

    res.json({ token, ...userData });
};


const getAllBooks = async (_req, res) => {
    try {
        const libros = await Libro.findAll();
        res.json(libros);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener libros" });
    }
};

const getBookById = async (req, res) => {
    try {
        const libro = await Libro.findByPk(req.params.id);
        if (!libro) return res.status(404).json({ error: "Libro no encontrado" });

        res.json(libro);
    } catch (error) {
        res.status(500).json({ error: "Error al buscar libro" });
    }
};

module.exports = {
    getAllUsers,
    register,
    login,
    getAllBooks, 
    getBookById  
};
