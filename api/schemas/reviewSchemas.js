const { z } = require('zod');

const respuestaResenaSchema = z.object({
  comentario: z.string().trim().min(1, 'La respuesta no puede estar vacía').max(2000, 'La respuesta es demasiado larga'),
}).strict();

module.exports = { respuestaResenaSchema };