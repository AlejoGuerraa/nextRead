const { z } = require('zod');

const guardarPuntuacionSchema = z.object({
  puntuacion: z.coerce.number().int().min(1).max(5),
  comentario: z.string().trim().min(1, 'La reseña no puede estar vacía').max(300, 'La reseña no puede superar los 300 caracteres').optional(),
}).strict();

module.exports = { guardarPuntuacionSchema };
