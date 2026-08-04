const { z } = require('zod');

const banSchema = z.object({ descargo: z.string().max(2000).optional() });

module.exports = { banSchema };
