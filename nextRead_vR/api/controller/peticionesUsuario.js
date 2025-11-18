// Tablas
const User = require("../models/Usuario");
const Libro = require("../models/Libro");
const Icono = require("../models/Icono");
const Banner = require("../models/Banner");

// Librerias
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

    const { 
        nombre, apellido, correo, usuario, contrasena, fecha_nacimiento,
        // Recibimos el símbolo del icono y la URL del banner
        icono, banner, descripcion 
    } = req.body;

    // 1. VALIDACIONES BÁSICAS
    if (!nombre || !apellido || !correo || !contrasena || !fecha_nacimiento) {
        return res.status(401).json({ error: "Ingrese toda la información necesaria para continuar" });
    }

    // 2. VALIDACIÓN DE CONTRASEÑA
    const tieneMayuscula = [...contrasena].some(letra => letra >= 'A' && letra <= 'Z');
    const tieneLongitud = contrasena.length >= 8;

    if (!tieneMayuscula || !tieneLongitud) {
        return res.status(400).json({
            error: "La contraseña debe tener al menos 8 caracteres y contener al menos una letra mayúscula"
        });
    }

    // 3. COMPROBACIÓN DE EXISTENCIA
    const usuarioasd = await User.findOne({ where: { usuario } });
    if (usuarioasd) return res.status(400).json({ error: "El nombre de usuario ya está registrado" });

    const correoadsd = await User.findOne({ where: { correo } });
    if (correoadsd) return res.status(400).json({ error: "El correo ya está registrado" });

    // --- LÓGICA CLAVE: BUSCAR O CREAR ÍCONO Y BANNER ---
    
    let idIcono = null;
    let idBanner = null;

    try {
        // Manejar Icono: Buscar por símbolo. Si no existe, lo crea.
        if (icono) {
            const [iconoInstance, created] = await Icono.findOrCreate({ 
                where: { simbolo: icono },
                defaults: { simbolo: icono } // Datos para crear si no existe
            });
            idIcono = iconoInstance.id;

            if (created) {
                console.log(`Nuevo icono creado dinámicamente: ${icono}`);
            }
        }

        // Manejar Banner: Buscar por URL. Si no existe, lo crea.
        if (banner) {
            const [bannerInstance, created] = await Banner.findOrCreate({ 
                where: { url: banner },
                defaults: { url: banner } // Datos para crear si no existe
            });
            idBanner = bannerInstance.id;

            if (created) {
                console.log(`Nuevo banner creado dinámicamente: ${banner}`);
            }
        }

    } catch (error) {
        // En caso de un error de base de datos durante la búsqueda/creación
        console.error("Error buscando o creando Icono/Banner:", error);
        return res.status(500).json({ error: "Error interno al procesar Icono/Banner." });
    }
    
    // 4. CREACIÓN DEL USUARIO
    const hashedPassw = await bcrypt.hash(contrasena, 10);

    const newUser = await User.create({
        nombre, 
        apellido, 
        correo, 
        usuario,
        contrasena: hashedPassw,
        fecha_nacimiento, 
        // Usamos los IDs obtenidos/creados
        idIcono: idIcono, 
        idBanner: idBanner,
        descripcion
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

        return res.status(200).json({ token, ...userData });
    } catch (err) {
        console.error("Error en login:", err);
        return res.status(500).json({ error: "Error en el servidor al intentar loguear" });
    }
};


const getUser = async (req, res) => {
    try {
        const userId = req.user.id; // extraído del token
        const usuario = await User.findByPk(userId, {
            attributes: { exclude: ['contrasena'] }
        });

        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json(usuario);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error en el servidor" });
    }
};

const editarPerfil = async (req, res) => {
    try {
        const userId = req.user.id; // viene del token
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

        // Solo actualizamos los campos que vienen
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
    editarPerfil
};
