const { z } = require('zod');

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(255),
}).strict();

const resetPasswordSchema = z.object({
  token: z.string().trim().min(1).max(2048),
  newPassword: z.string().trim().min(8).max(128).refine((v) => /[A-Z]/.test(v), 'La contraseña debe contener al menos una letra mayúscula'),
}).strict();

module.exports = { forgotPasswordSchema, resetPasswordSchema };
