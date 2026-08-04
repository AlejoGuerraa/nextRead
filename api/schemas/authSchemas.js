const { z } = require('zod');

const passwordRule = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
  .refine(v => /[A-Z]/.test(v), 'La contraseña debe contener al menos una letra mayúscula');

const registerSchema = z.object({
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  correo: z.string().email(),
  usuario: z.string().min(3).max(50),
  contrasena: passwordRule,
  fecha_nacimiento: z.string().nullable(),
  icono: z.string().optional(),
  banner: z.string().optional(),
  descripcion: z.string().max(2000).optional(),
  rol: z.string().optional()
});

const loginSchema = z.object({
  correo: z.string().email(),
  contrasena: z.string().min(1)
});

module.exports = { registerSchema, loginSchema };
