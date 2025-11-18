const User = require("../models/Usuario");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const claveSecreta = 'AdminLibros';

// -------------------------------------------------
// HELPER: AGREGAR NOTIFICACIÓN AL USUARIO
// -------------------------------------------------
async function agregarNotificacion(userId, mensaje, nombre = "Sistema") {
    try {
        const usuario = await User.findByPk(userId);

        if (!usuario) return;

        let notis = [];

        if (usuario.notificaciones) {
            try {
                notis = JSON.parse(usuario.notificaciones);
            } catch (_) { notis = []; }
        }

        const nueva = {
            id: Date.now(),
            nombre,
            mensaje,
            fecha: new Date().toISOString()
        };

        notis.unshift(nueva);

        usuario.notificaciones = JSON.stringify(notis);
        await usuario.save();
    } catch (err) {
        console.log("Error guardando notificación:", err);
    }
}


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
        icono, banner, descripcion } = req.body;

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
        descripcion,
        notificaciones: JSON.stringify([])
    });

    res.status(200).json({ message: "Nuevo usuario creado", data: newUser });
};


// ----------------- LOGIN -----------------
const login = async (req, res) => {
    try {
        const { correo, contrasena } = req.body;

        const user = await User.findOne({ where: { correo } });

        if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

        const comparacion = await bcrypt.compare(contrasena, user.contrasena);
        if (!comparacion) {
            return res.status(400).json({ error: "Su email o contraseña incorrectos" });
        }

        const token = jwt.sign({ id: user.id, correo: user.correo }, claveSecreta, { expiresIn: '8h' });

        const userData = user.get({ plain: true });
        delete userData.contrasena;

        userData.notificaciones = userData.notificaciones
            ? JSON.parse(userData.notificaciones)
            : [];

        return res.status(200).json({ token, ...userData });
    } catch (err) {
        console.error("Error en login:", err);
        return res.status(500).json({ error: "Error en el servidor al intentar loguear" });
    }
};


// ----------------- GET USER -----------------
const getUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const usuario = await User.findByPk(userId, {
            attributes: { exclude: ['contrasena'] }
        });

        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const userData = usuario.get({ plain: true });
        userData.notificaciones = usuario.notificaciones
            ? JSON.parse(usuario.notificaciones)
            : [];

        res.json(userData);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error en el servidor" });
    }
};


// ----------------- EDITAR PERFIL -----------------
const editarPerfil = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            nombre,
            apellido,
            descripcion,
            banner,
            icono,
            genero_preferido,
            autor_preferido,
            titulo_preferido
        } = req.body;

        const usuario = await User.findByPk(userId);
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

        if (nombre !== undefined) usuario.nombre = nombre;
        if (apellido !== undefined) usuario.apellido = apellido;
        if (descripcion !== undefined) usuario.descripcion = descripcion;
        if (banner !== undefined) usuario.banner = banner;
        if (icono !== undefined) usuario.icono = icono;
        if (genero_preferido !== undefined) usuario.genero_preferido = genero_preferido;
        if (autor_preferido !== undefined) usuario.autor_preferido = autor_preferido;
        if (titulo_preferido !== undefined) usuario.titulo_preferido = titulo_preferido;

        await usuario.save();

        res.status(200).json({ msg: "Perfil actualizado correctamente", usuario });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar perfil" });
    }
};

module.exports = {
    getAllUsers,
    register,
    login,
    getUser,
    editarPerfil,
    agregarNotificacion
};
