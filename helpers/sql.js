


const { BadRequestError } = require("../expressError");

/**
 * Generate SQL for partial UPDATE queries.
 *
 * @param {Object} dataToUpdate - Key-value pairs of fields to update.
 * @param {Object} jsToSql - Mapping from JS-style field names to SQL column names.
 *
 * @returns {Object} - An object with:
 *   - setCols: a string like `"first_name"=$1, "age"=$2`
 *   - values: array of corresponding values [val1, val2]
 *
 * @throws {BadRequestError} if dataToUpdate is empty.
 *
 * Example:
 * sqlForPartialUpdate(
 *   { firstName: 'Aliya', age: 32 },
 *   { firstName: 'first_name', age: 'age' }
 * );
 * // => { setCols: '"first_name"=$1, "age"=$2', values: ['Aliya', 32] }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
