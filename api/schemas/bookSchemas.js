const { z } = require('zod');

const guardarPuntuacionSchema = z.object({
  puntuacion: z.coerce.number().int().min(1).max(5),
  comentario: z.string().max(2000).optional(),
}).strict();

module.exports = { guardarPuntuacionSchema };
