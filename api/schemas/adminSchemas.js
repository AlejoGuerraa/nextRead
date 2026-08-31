const { z } = require('zod');

const banSchema = z.object({
  descargo: z.string().trim().max(2000).optional(),
}).strict();

module.exports = { banSchema };
