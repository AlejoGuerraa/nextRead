const { z } = require('zod');

const MYSQL_INT_MAX = 2147483647;

/**
 * Positive integer ID compatible with MySQL INT.
 * Rejects scientific notation, decimals, SQL fragments and oversized values.
 */
const positiveIntId = z
  .union([z.string(), z.number()])
  .refine((value) => /^(?:[1-9]\d{0,9})$/.test(String(value)), {
    message: 'ID inválido',
  })
  .transform((value) => Number(value))
  .refine((n) => Number.isInteger(n) && n >= 1 && n <= MYSQL_INT_MAX, {
    message: 'ID inválido',
  });

const assetRefSchema = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .refine((value) => {
    const lower = value.toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
      return false;
    }
    if (value.startsWith('/')) {
      return !value.includes('..') && !value.includes('\\');
    }
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, 'URL o ruta inválida');

const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
  offset: z.coerce.number().int().min(0).max(5000).optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
}).strict();

module.exports = {
  MYSQL_INT_MAX,
  positiveIntId,
  assetRefSchema,
  paginationQuerySchema,
};
