/**
 * Escapes LIKE wildcards so user search terms cannot broaden a query.
 * Sequelize still binds the value as a parameter; this only neutralizes % and _.
 */
function escape_like(value) {
  return String(value).replace(/[\\%_]/g, (char) => `\\${char}`);
}

module.exports = {
  escape_like,
};
