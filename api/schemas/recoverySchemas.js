const { z } = require('zod');

const forgotPasswordSchema = z.object({ email: z.string().email() });

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).refine(v => /[A-Z]/.test(v), 'La contraseña debe contener al menos una letra mayúscula')
});

module.exports = { forgotPasswordSchema, resetPasswordSchema };
