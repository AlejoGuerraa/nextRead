// File: controller/changePassword.js
const Usuario = require("../models/Usuario");
const bcrypt = require("bcrypt");
const sendEmail = require("../services/emailService");
const jwt = require("jsonwebtoken");


const claveTemporal = "CambioEmailTemporal123";

const changeEmailRequest = async (req, res) => {
    try {
        const { newEmail } = req.body;
        const userId = req.user.id;

        const user = await Usuario.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // Crear token temporal
        const token = jwt.sign(
            { id: user.id, newEmail },
            claveTemporal,
            { expiresIn: "15m" }
        );

        const link = `http://localhost:3000/api/confirm-email-change?token=${token}`;

        try {
            await sendEmail({
                to: user.correo,
                subject: "Confirmar cambio de correo",
                html: `
                    <h3>Confirmá el cambio de email</h3>
                    <p>Hacé clic en el siguiente enlace para confirmar:</p>
                    <a href="${link}">Confirmar cambio</a>
                    <p>Este enlace expira en 15 minutos.</p>
                `
            });
            return res.status(200).json({
                msg: "Se envió un enlace a tu correo actual para confirmar el cambio."
            });
        } catch (mailErr) {
            console.error('Error enviando email de confirmación:', mailErr);
            return res.status(500).json({ error: "Error enviando el email de confirmación" });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error al solicitar el cambio" });
    }
};


const confirmEmailChange = async (req, res) => {
    try {
        const { token } = req.query;

        const decoded = jwt.verify(token, claveTemporal);

        const user = await Usuario.findByPk(decoded.id);

        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        user.correo = decoded.newEmail;
        await user.save();

        return res.send("✔ Tu email fue cambiado correctamente.");
    } catch (error) {
        console.error(error);
        return res.status(400).send("Token inválido o expirado.");
    }
};



// =======================================================
// 🔐 CAMBIAR CONTRASEÑA
// =======================================================
const changePassword = async (req, res) => {

    try {
        const { currentPwd, newPwd } = req.body;
        const userId = req.user.id;

        const usuario = await Usuario.findByPk(userId);


        const compare = await bcrypt.compare(currentPwd, usuario.contrasena);

        if (!compare) {
            return res.status(401).json({
                error: "La contraseña actual es incorrecta."
            });
        }

        const hashed = await bcrypt.hash(newPwd, 10);
        usuario.contrasena = hashed;
        await usuario.save();

        return res.status(200).json({
            msg: "Contraseña actualizada correctamente"
        });

    } catch (error) {
        console.error("ERROR CHANGE PASSWORD:", error);
        return res.status(500).json({
            error: "Error interno del servidor"
        });
    }
};


// =======================================================
// 🗑 SOLICITAR ELIMINACIÓN DE CUENTA (envía email con token)
// =======================================================
const deleteAccountRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await Usuario.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const token = jwt.sign(
            { id: user.id },
            claveTemporal,
            { expiresIn: "15m" }
        );

        const link = `http://localhost:5173/confirm-delete?token=${token}`;

        await sendEmail({
            to: user.correo,
            subject: "Confirmar eliminación de cuenta",
            html: `
                <h3>Confirmar eliminación de cuenta</h3>
                <p>Estás a punto de eliminar tu cuenta permanentemente.</p>
                <p><strong>Esta acción es irreversible.</strong></p>

                <a href="${link}" style="
                    background:#d9534f;
                    color:white;
                    padding:10px 16px;
                    border-radius:5px;
                    text-decoration:none;
                ">Confirmar eliminación</a>

                <p>Este enlace expira en 15 minutos.</p>
            `
        });

        return res.status(200).json({
            msg: "Se envió un correo para confirmar la eliminación de la cuenta."
        });

    } catch (error) {
        console.error("ERROR DELETE REQUEST:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
};


// =======================================================
// 🗑 CONFIRMAR ELIMINACIÓN DE CUENTA (desactivación)
// =======================================================
const deleteAccountConfirm = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: "Token requerido" });
        }

        const decoded = jwt.verify(token, claveTemporal);

        const user = await Usuario.findByPk(decoded.id);
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // 🔥 DESACTIVAR CUENTA EN VEZ DE BORRARLA
        user.activo = 0;
        await user.save();

        return res.status(200).json({
            msg: "Tu cuenta fue desactivada exitosamente."
        });

    } catch (error) {
        console.error("ERROR DELETE CONFIRM:", error);
        return res.status(400).json({ error: "Token inválido o expirado" });
    }
};


module.exports = { changePassword, changeEmailRequest, confirmEmailChange, deleteAccountRequest, deleteAccountConfirm };
