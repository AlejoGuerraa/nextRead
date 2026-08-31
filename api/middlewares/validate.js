const { ZodError } = require('zod');

function parseSource(req, source) {
  if (source === 'body') return req.body ?? {};
  if (source === 'params') return req.params ?? {};
  if (source === 'query') return req.query ?? {};
  return req.body ?? {};
}

function applyParsedData(req, source, data) {
  if (source === 'body') req.body = data;
  if (source === 'params') req.params = data;
  if (source === 'query') req.query = data;
}

function format_zod_error(error) {
  const items = error.issues || error.errors || [];
  return items.map((issue) => ({
    path: issue.path && issue.path.length ? issue.path : ['value'],
    message: issue.message,
  }));
}

/**
 * Validates a request source with a Zod schema.
 * Replaces the source with the parsed (normalized) value so controllers
 * never receive unknown fields for strict schemas.
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const payload = parseSource(req, source);
      const parsed = schema.safeParse(payload);

      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation error',
          details: format_zod_error(parsed.error),
        });
      }

      applyParsedData(req, source, parsed.data);
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: format_zod_error(err),
        });
      }
      console.error('Unexpected error in validate middleware:', err);
      return res.status(500).json({ error: 'Server validation error' });
    }
  };
}

module.exports = validate;
module.exports.validateBody = (schema) => validate(schema, 'body');
module.exports.validateParams = (schema) => validate(schema, 'params');
module.exports.validateQuery = (schema) => validate(schema, 'query');
