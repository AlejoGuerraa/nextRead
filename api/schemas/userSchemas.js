const { z } = require('zod');
const { assetRefSchema } = require('./commonSchemas');

const passwordRule = z.string()
  .trim()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña es demasiado larga')
  .refine((v) => /[A-Z]/.test(v), 'La contraseña debe contener al menos una letra mayúscula');

const editarPerfilSchema = z.object({
  nombre: z.string().trim().min(2).max(20).optional(),
  apellido: z.string().trim().min(2).max(20).optional(),
  descripcion: z.string().trim().max(300).optional(),
  banner: assetRefSchema.optional(),
  icono: assetRefSchema.optional(),
  genero_preferido: z.string().trim().max(20).optional(),
  autor_preferido: z.string().trim().max(20).optional(),
  titulo_preferido: z.string().trim().max(50).optional(),
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
  nombre: z.string().trim().min(1).max(50, 'El nombre de la lista no puede superar los 50 caracteres'),
  isPrivate: z.boolean().optional().default(false),
}).strict();

const editarListaSchema = z.object({
  nombre: z.string().trim().min(1).max(50, 'El nombre de la lista no puede superar los 50 caracteres'),
  isPrivate: z.boolean().optional(),
}).strict();

module.exports = {
  editarPerfilSchema,
  changePasswordSchema,
  changeEmailRequestSchema,
  deleteAccountConfirmSchema,
  crearListaSchema,
  editarListaSchema,
};
