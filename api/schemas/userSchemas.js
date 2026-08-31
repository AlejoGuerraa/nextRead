const { z } = require('zod');
const { assetRefSchema } = require('./commonSchemas');

const passwordRule = z.string()
  .trim()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña es demasiado larga')
  .refine((v) => /[A-Z]/.test(v), 'La contraseña debe contener al menos una letra mayúscula');

const editarPerfilSchema = z.object({
  nombre: z.string().trim().min(2).max(200).optional(),
  apellido: z.string().trim().min(2).max(200).optional(),
  descripcion: z.string().trim().max(2000).optional(),
  banner: assetRefSchema.optional(),
  icono: assetRefSchema.optional(),
  genero_preferido: z.string().trim().max(200).optional(),
  autor_preferido: z.string().trim().max(200).optional(),
  titulo_preferido: z.string().trim().max(200).optional(),
}).strict();

const changePasswordSchema = z.object({
  currentPwd: z.string().trim().min(1).max(128),
  newPwd: passwordRule,
}).strict();

const changeEmailRequestSchema = z.object({
  newEmail: z.string().trim().email().max(255),
}).strict();

const deleteAccountConfirmSchema = z.object({
  token: z.string().trim().min(1).max(2048),
}).strict();

const crearListaSchema = z.object({
  nombre: z.string().trim().min(1).max(200),
}).strict();

module.exports = {
  editarPerfilSchema,
  changePasswordSchema,
  changeEmailRequestSchema,
  deleteAccountConfirmSchema,
  crearListaSchema,
};
