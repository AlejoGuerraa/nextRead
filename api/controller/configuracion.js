const Usuario = require("../models/Usuario");
const bcrypt = require("bcrypt");
const sendEmail = require("../services/emailService");
const {
    TOKEN_TYPES,
    emailTokenTtl,
    deleteTokenTtl,
    sign_temporal_token,
    verify_temporal_token,
} = require("../utils/jwtTokens");

const apiBaseUrl = process.env.API_URL || "http://localhost:3000";
const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const bcryptSaltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

function normalize_email(value) {
    return String(value || "").trim().toLowerCase();
}

const changeEmailRequest = async (req, res) => {
    try {
        const newEmail = normalize_email(req.body.newEmail);
        const userId = req.user.id;

        const user = await Usuario.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        if (normalize_email(user.correo) === newEmail) {
            return res.status(400).json({ error: "El nuevo correo es igual al actual" });
        }

        const taken = await Usuario.findOne({ where: { correo: newEmail } });
        if (taken && Number(taken.id) !== Number(userId)) {
            return res.status(400).json({ error: "El correo ya está en uso" });
        }

        const token = sign_temporal_token(
            { id: user.id, newEmail },
            TOKEN_TYPES.EMAIL_CHANGE,
            emailTokenTtl
        );

        const link = `${apiBaseUrl}/api/confirm-email-change?token=${token}`;

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
        const decoded = verify_temporal_token(token, TOKEN_TYPES.EMAIL_CHANGE);

        if (req.user && Number(req.user.id) !== Number(decoded.id)) {
            return res.status(403).send("No puedes confirmar el cambio de email de otra cuenta.");
        }

        const newEmail = normalize_email(decoded.newEmail);
        if (!newEmail) {
            return res.status(400).send("Token inválido o expirado.");
        }

        const user = await Usuario.findByPk(decoded.id);
        if (!user || Number(user.activo) === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const taken = await Usuario.findOne({ where: { correo: newEmail } });
        if (taken && Number(taken.id) !== Number(user.id)) {
            return res.status(400).json({ error: "El correo ya está en uso" });
        }

        user.correo = newEmail;
        await user.save();

        return res.send("✔ Tu email fue cambiado correctamente.");
    } catch (error) {
        console.error(error);
        return res.status(400).send("Token inválido o expirado.");
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPwd, newPwd } = req.body;
        const userId = req.user.id;

        const usuario = await Usuario.findByPk(userId);
        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const compare = await bcrypt.compare(currentPwd, usuario.contrasena);
        if (!compare) {
            return res.status(401).json({
                error: "La contraseña actual es incorrecta."
            });
        }

        usuario.contrasena = await bcrypt.hash(newPwd, bcryptSaltRounds);
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

const deleteAccountRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await Usuario.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const token = sign_temporal_token(
            { id: user.id },
            TOKEN_TYPES.ACCOUNT_DELETE,
            deleteTokenTtl
        );

        const link = `${frontendBaseUrl}/confirm-delete?token=${token}`;

        setImmediate(async () => {
            try {
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
            } catch (emailErr) {
                console.error('[DeleteAccount] Error email (no bloquea):', emailErr.message);
            }
        });

        return res.status(200).json({
            msg: "Se envió un correo para confirmar la eliminación de la cuenta."
        });

    } catch (error) {
        console.error("ERROR DELETE REQUEST:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
};

const deleteAccountConfirm = async (req, res) => {
    try {
        const { token } = req.body;
        const decoded = verify_temporal_token(token, TOKEN_TYPES.ACCOUNT_DELETE);

        if (Number(req.user.id) !== Number(decoded.id)) {
            return res.status(403).json({ error: "No puedes desactivar otra cuenta" });
        }

        const user = await Usuario.findByPk(decoded.id);
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

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
