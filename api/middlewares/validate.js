const { ZodError } = require('zod');

// validate(schema) -> middleware
module.exports = function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        // Map zod errors to a concise structure
        const details = parsed.error.errors.map(e => ({ path: e.path, message: e.message }));
        return res.status(400).json({ error: 'Validation error', details });
      }
      // Replace req.body with the parsed/coerced data
      req.body = parsed.data;
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map(e => ({ path: e.path, message: e.message }));
        return res.status(400).json({ error: 'Validation error', details });
      }
      console.error('Unexpected error in validate middleware:', err);
      return res.status(500).json({ error: 'Server validation error' });
    }
  };
};
