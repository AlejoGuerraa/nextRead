// controller/recoveryController.js

const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');

// ========================================================
// CONFIGURAR NODEMAILER (GMAIL + FIX TLS)
// ========================================================

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'NextReadOficial@gmail.com',
        pass: 'glmz onkq jjlv jzmn'  // 🔥 IMPORTANTE: App Password de Gmail
    },
    tls: {
        rejectUnauthorized: false  // 🔥 FIX PARA "self-signed certificate"
    }
});

// ========================================================
// 🔹 FUNCIÓN 1 — ENVIAR ENLACE DE RECUPERACIÓN
// ========================================================

const enviarEnlaceRecuperacion = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Debes proporcionar un email." });
        }

        // Buscar usuario por correo
        const usuario = await Usuario.findOne({ where: { correo: email } });

        if (!usuario) {
            return res.status(404).json({ error: "No existe un usuario con ese correo." });
        }

        // Crear token JWT con vencimiento
        const token = jwt.sign(
            { id: usuario.id, correo: usuario.correo },
            "CLAVE_SECRETA_RECUPERACION",
            { expiresIn: "1h" }
        );

        // Frontend de tu app (VITE)
        const enlace = `http://localhost:5173/reset-password?token=${token}`;

        // Enviar email
        await transporter.sendMail({
            from: "NextRead Recuperación <NextReadOficial@gmail.com>",
            to: email,
            subject: "Restablecimiento de contraseña - NextRead",
            html: `
                <h2>Hola ${usuario.nombre}</h2>
                <p>Solicitaste recuperar tu contraseña en NextRead.</p>
                <p>Haz clic en este enlace para continuar:</p>
                <a href="${enlace}" style="color:blue" target="_blank">${enlace}</a>
                <p>Este enlace vence en <b>1 hora</b>.</p>
            `
        });

        return res.json({ message: "Correo enviado correctamente." });

    } catch (error) {
        console.error("ERROR - RECUPERACIÓN:", error);
        return res.status(500).json({ error: "Error enviando el correo de recuperación." });
    }
};

// ========================================================
// 🔹 FUNCIÓN 2 — PROCESAR LA NUEVA CONTRASEÑA
// ========================================================

const resetearPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: "Faltan datos." });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, "CLAVE_SECRETA_RECUPERACION");
        } catch (error) {
            return res.status(401).json({ error: "Token inválido o expirado." });
        }

        // Buscar usuario real
        const usuario = await Usuario.findByPk(decoded.id);

        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }

        // Encriptar nueva contraseña
        const hashed = await bcrypt.hash(newPassword, 10);

        usuario.contrasena = hashed;
        await usuario.save();

        return res.json({ message: "Contraseña actualizada correctamente." });

    } catch (error) {
        console.error("ERROR - RESET PASSWORD:", error);
        return res.status(500).json({ error: "Error al actualizar la contraseña." });
    }
};

module.exports = {
    enviarEnlaceRecuperacion,
    resetearPassword
};