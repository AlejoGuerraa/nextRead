const { z } = require('zod');

const emailSchema = z.object({ email: z.string().email() });

const notificationSchema = z.object({ mensaje: z.string().min(1) });

module.exports = { emailSchema, notificationSchema };
