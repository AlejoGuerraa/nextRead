const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario'); // <-- nombre correcto

const claveSecreta = process.env.SECRET;

const isAuth = (req, res, next) => {
    if (!claveSecreta) {
        return res.status(500).json({ message: "Configuración de autenticación incompleta" });
    }
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: "Token no proporcionado" });

    const token = authHeader.split(' ')[1];

    jwt.verify(token, claveSecreta, async (err, decodificado) => {
        if (err) {
            return res.status(401).json({ message: "Token inválido" });
        }

        const user = await Usuario.findByPk(decodificado.id);

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado en la base de datos" });
        }

        req.user = {
            id: user.id,
            correo: user.correo,
            rol: user.rol
        };

        next();
    });
};

module.exports = isAuth;
