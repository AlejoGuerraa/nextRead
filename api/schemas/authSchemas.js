const { z } = require('zod');
const { assetRefSchema } = require('./commonSchemas');

const passwordRule = z.string()
  .trim()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña es demasiado larga')
  .refine((v) => /[A-Z]/.test(v), 'La contraseña debe contener al menos una letra mayúscula');

const birthDateRule = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha de nacimiento inválida').superRefine((value, context) => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const oldestDate = new Date(today);
  oldestDate.setFullYear(today.getFullYear() - 120);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'La fecha ingresada no existe.' });
  } else if (date > today) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'La fecha de nacimiento no puede ser futura.' });
  } else if (date < oldestDate) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'La fecha de nacimiento no puede tener más de 120 años.' });
  }
});

const registerSchema = z.object({
  nombre: z.string().trim().min(2).max(20),
  apellido: z.string().trim().min(2).max(20),
  correo: z.string().trim().email().max(255),
  usuario: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'El nombre de usuario contiene caracteres no permitidos'),
  contrasena: passwordRule,
  fecha_nacimiento: birthDateRule,
  icono: assetRefSchema.optional(),
  banner: assetRefSchema.optional(),
  descripcion: z.string().trim().max(300).optional(),
}).strict();

const loginSchema = z.object({
  correo: z.string().trim().email().max(255),
  contrasena: z.string().trim().min(1).max(128),
}).strict();

module.exports = { registerSchema, loginSchema };
