const User = require("../models/Usuario");
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken') // El JWT nos va a servir para poder iniciar sesión gracias a una información encriptada (token)

const claveSecreta = 'AdminLibros' // Se crea una clave secreta que valida que el token que guarda la información sea real

const getAllUsers = async (_req, res) => {
    try {
        const usuarios = await User.findAll({ attributes: { exclude: 'contrasena' } }) // Encuentra los usuarios excluyendo la contraseña
        res.json(usuarios)
    }
    catch (error) {
        return res.status(404).json({ error: "No se encontró ningún usuario registrado" })
    }

}


// ----------------- REGISTER ----------------------------------------------

const register = async (req, res) => {

    console.log(req.body)

    const { nombre, apellido, correo, usuario, contrasena, fecha_nacimiento, icono, banner,
        descripcion,
        libros_rec, autores_rec, generos_rec } = req.body

    if (!nombre || !apellido || !correo || !contrasena || !fecha_nacimiento) {
        return res.status(401).json({ error: "Ingrese toda la información necesaria para continuar" })
    }

    const tieneMayuscula = [...contrasena].some(letra => letra >= 'A' && letra <= 'Z');
    const tieneLongitud = contrasena.length >= 8;

    if (!tieneMayuscula || !tieneLongitud) {
        return res.status(400).json({
            error: "La contraseña debe tener al menos 8 caracteres y contener al menos una letra mayúscula"
        });
    }

    const hashedPassw = await bcrypt.hash(contrasena, 10) // Hashea la contraseña usando bcrypt

    console.log(`Contraseña hasheada: ${hashedPassw}`)

    const usuarioasd = await User.findOne({ where: { usuario } })
    if (usuarioasd) {
        return res.status(400).json({ error: "El nombre de usuario ya está registrado" })
    }
    const correoadsd = await User.findOne({ where: { correo } })
    if (correoadsd) {
        return res.status(400).json({ error: "El correo ya está registrado" })
    }

    const newUser = await User.create({
        nombre, apellido, correo, usuario, contrasena: hashedPassw, fecha_nacimiento, icono, banner,
        descripcion,
        libros_rec, autores_rec, generos_rec
    })
    console.log(fecha_nacimiento)
    res.status(200).json({
        message: "Nuevo usuario creado exitosamente",
        data: newUser
    })
}

// ---------- LOGIN -----------------------------------------------------

// peticionesUsuario.js

// ---------- LOGIN -----------------------------------------------------

const login = async (req, res) => {
    const { correo, contrasena } = req.body

    const user = await User.findOne({ where: { correo } })

    if (!user) {
        return res.status(400).json({ message: "Usuario no encontrado" })
    }

    const comparacion = await bcrypt.compare(contrasena, user.contrasena) 
    console.log(comparacion)

    if (!comparacion) {
        return res.status(400).json({ error: "Su email o contraseña fue escrita incorrectamente. Vuelva a intentarlo" })
    }

    const token = jwt.sign({ id: user.id, correo: user.correo }, claveSecreta, { expiresIn: '8h' }) 
    console.log(`Token otorgado: ${token}`)

    // 🔑 CLAVE: Obtener los datos del usuario y eliminar la contraseña.
    const userData = user.get({ plain: true });
    delete userData.contrasena; 
    
    // 🔑 CORRECCIÓN: Devolver el token Y todos los datos del usuario.
    res.json({
        token,
        ...userData // Ahora el frontend recibirá todos los campos (nombre, usuario, icono, etc.)
    })
}

module.exports = {
    getAllUsers,
    register,
    login
}