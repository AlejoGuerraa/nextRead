const { z } = require('zod');

const editarPerfilSchema = z.object({
  nombre: z.string().min(2).max(200).optional(),
  apellido: z.string().min(2).max(200).optional(),
  descripcion: z.string().max(2000).optional(),
  banner: z.string().url().optional(),
  icono: z.string().optional(),
  genero_preferido: z.string().max(200).optional(),
  autor_preferido: z.string().max(200).optional(),
  titulo_preferido: z.string().max(200).optional()
});

const changePasswordSchema = z.object({
  currentPwd: z.string().min(1),
  newPwd: z.string().min(8).refine(v => /[A-Z]/.test(v), 'La contraseña debe contener al menos una letra mayúscula')
});

const changeEmailRequestSchema = z.object({
  newEmail: z.string().email()
});

const deleteAccountConfirmSchema = z.object({
  token: z.string().min(1)
});

const crearListaSchema = z.object({ nombre: z.string().min(1).max(200) });

module.exports = {
  editarPerfilSchema,
  changePasswordSchema,
  changeEmailRequestSchema,
  deleteAccountConfirmSchema,
  crearListaSchema
};
