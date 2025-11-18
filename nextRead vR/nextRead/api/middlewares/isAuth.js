const jwt = require('jsonwebtoken');
const User = require('../models/Usuario');

const claveSecreta = 'AdminLibros';

const isAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: "Token no proporcionado" });

    const token = authHeader.split(' ')[1]; // extrae solo el token después de 'Bearer'

    if (!token) return res.status(401).json({ message: "Token no proporcionado" });

    jwt.verify(token, claveSecreta, async (err, decodifica) => {
        if (err) {
            return res.status(401).json({ message: "Token inválido" });
        }

        const user = await User.findByPk(decodifica.id);
        if (!user) return res.status(400).json({ message: "Usuario no encontrado" });

        console.log(decodifica);

        req.user = {
            id: user.id,
            correo: user.correo // corregido de email a correo
        };

        next();
    });
};

module.exports = isAuth;
