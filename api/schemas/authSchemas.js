const { z } = require('zod');
const { assetRefSchema } = require('./commonSchemas');

const passwordRule = z.string()
  .trim()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña es demasiado larga')
  .refine((v) => /[A-Z]/.test(v), 'La contraseña debe contener al menos una letra mayúscula');

const registerSchema = z.object({
  nombre: z.string().trim().min(2).max(200),
  apellido: z.string().trim().min(2).max(200),
  correo: z.string().trim().email().max(255),
  usuario: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'El nombre de usuario contiene caracteres no permitidos'),
  contrasena: passwordRule,
  fecha_nacimiento: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha de nacimiento inválida'),
  icono: assetRefSchema.optional(),
  banner: assetRefSchema.optional(),
  descripcion: z.string().trim().max(2000).optional(),
}).strict();

const loginSchema = z.object({
  correo: z.string().trim().email().max(255),
  contrasena: z.string().trim().min(1).max(128),
}).strict();

module.exports = { registerSchema, loginSchema };
