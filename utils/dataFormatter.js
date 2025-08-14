/**
 * Masks sensitive fields based on user role or field config
 * @param {Array|object} data - The result to be masked
 * @param {Array<string>} fieldsToMask - Fields that should be masked (e.g., ['ssn', 'email'])
 * @returns {Array|object} - Data with fields masked
 */
export const maskSensitiveFields = (data, fieldsToMask = []) => {
  const maskValue = '***';

  const maskObject = (row) => {
    const masked = { ...row };
    fieldsToMask.forEach((field) => {
      if (masked.hasOwnProperty(field)) {
        masked[field] = maskValue;
      }
    });
    return masked;
  };

  if (Array.isArray(data)) return data.map(maskObject);
  if (typeof data === 'object' && data !== null) return maskObject(data);
  return data;
};

/**
 * Formats raw DB results into a natural language summary.
 * This version supports optionally masking fields
 * @param {*} results - Raw database results
 * @param {*} options - { maskFields: [], role: '' }
 * @returns {string} summary
 */
export const formatResultsSummary = (results, options = {}) => {
  const { maskFields = [] } = options;

  if (results === null || results === undefined) {
    return "No data found for your query.";
  }

  if (typeof results === 'number') {
    return `Query returned a count: ${results}`;
  }

  // Handle write ops
  if (typeof results === 'object' && !Array.isArray(results)) {
    if (results.message && results.details) {
      const detailString =
        Object.entries(results.details)
          .map(([key, val]) => `    ${key}: ${typeof val === 'object' ? JSON.stringify(val) : val}`)
          .join('\n') || '';
      return `${results.message}\nDetails:\n${detailString}`;
    }
    // Single object? Format it as single-record
    results = [results];
  }

  const records = Array.isArray(results) ? results : [results];
  const maskedData = records.map(r => ({ ...(r?._doc || r) })); // clone

  // Apply masking
  const maskedRecords = maskSensitiveFields(maskedData, maskFields);

  if (maskedRecords.length === 0) return "No data found for your query.";

  let summary = `Found ${maskedRecords.length} record(s):\n\n`;

  maskedRecords.forEach((row, i) => {
    summary += `Record ${i + 1}:\n`;
    for (const key in row) {
      if (key !== '_id' && key !== '__v') {
        const value = row[key];
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            summary += `  ${key}: [Array with ${value.length} items]\n`;
          } else if (value instanceof Date) {
            summary += `  ${key}: ${value.toISOString()}\n`;
          } else {
            summary += `  ${key}: {Object}\n`;
          }
        } else {
          summary += `  ${key}: ${value}\n`;
        }
      }
    }
    summary += '\n';
  });

  const MAX_LENGTH = 2000;
  if (summary.length > MAX_LENGTH) {
    summary = summary.slice(0, MAX_LENGTH) + '\n... (truncated)';
  }

  return summary;
};
