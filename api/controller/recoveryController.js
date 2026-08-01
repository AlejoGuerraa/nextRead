// controller/recoveryController.js

const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');

// ========================================================
// CONFIGURAR NODEMAILER (GMAIL + FIX TLS)
// ========================================================

const recoveryJwtSecret = process.env.TEMPORAL_SECRET;
const recoveryTokenTtl = process.env.JWT_RECOVERY_TOKEN_TTL || '1h';
const emailService = process.env.EMAIL_SERVICE || 'gmail';
const emailUser = process.env.EMAIL_USER || 'NextReadOficial@gmail.com';
const emailFrom = process.env.EMAIL_FROM || 'NextRead <NextReadOficial@gmail.com>';
const tlsRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED === 'true';

const transporter = nodemailer.createTransport({
    service: emailService,
    auth: {
        user: emailUser,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: tlsRejectUnauthorized
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
            recoveryJwtSecret,
            { expiresIn: recoveryTokenTtl }
        );

        const enlace = `${process.env.FRONTEND_URL}/confirm-delete?token=${token}`;

        // Enviar email
        await transporter.sendMail({
            from: emailFrom,
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
            decoded = jwt.verify(token, recoveryJwtSecret);
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
