// controller/recoveryController.js

const nodemailer = require('nodemailer');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');
const {
    TOKEN_TYPES,
    recoveryTokenTtl,
    sign_temporal_token,
    verify_temporal_token,
} = require('../utils/jwtTokens');

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

        // Basic email format validation
        if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Email inválido' });
        }

        // Buscar usuario por correo
        const usuario = await Usuario.findOne({ where: { correo: email } });

        if (usuario && Number(usuario.activo) !== 0) {
            const token = sign_temporal_token(
                { id: usuario.id },
                TOKEN_TYPES.RECOVERY,
                recoveryTokenTtl
            );

            const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const enlace = `${frontendBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;

            setImmediate(async () => {
                try {
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
                } catch (mailErr) {
                    console.error('ERROR - RECUPERACIÓN (envío):', mailErr.message);
                }
            });
        }

        return res.json({
            message: 'Si la cuenta existe, recibirás instrucciones.'
        });

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
            decoded = verify_temporal_token(token, TOKEN_TYPES.RECOVERY);
        } catch (_error) {
            return res.status(401).json({ error: "Token inválido o expirado." });
        }

        const usuario = await Usuario.findByPk(decoded.id);
        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }

        const bcryptSaltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
        const hashed = await bcrypt.hash(newPassword, bcryptSaltRounds);

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
