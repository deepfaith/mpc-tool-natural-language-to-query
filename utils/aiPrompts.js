export const generateQueryPrompt = (schemaString, dbType, userQuery, { language = "English", tone = "neutral" } = {}) => {
  // Truncate schema if too long (e.g., >2000 chars)
  let schemaForPrompt = schemaString;
  if (schemaForPrompt.length > 2000) {
    schemaForPrompt = schemaForPrompt.slice(0, 2000) + '\n... (truncated)';
  }

  return `
You are a PostgreSQL assistant for Supabase. Use the following database schema:
${schemaForPrompt}

Generate a PostgreSQL query for:
"${userQuery}"

Requirements:
- Use only SELECT statements (no INSERT, UPDATE, DELETE, DROP, etc.)
- Use proper PostgreSQL syntax
- Include appropriate JOINs when querying related tables
- Use LIMIT to prevent large result sets when appropriate
- Respond ONLY with valid PostgreSQL SQL - no markdown, no explanation, no code blocks

SQL Query:
  `.trim();
};

export const generateResultSummaryPrompt = (userQuery, data, { language = 'English', tone = 'neutral' } = {}) => {
  // Only send a sample of data if it's an array and large
  let dataForPrompt = data;
  if (Array.isArray(data) && data.length > 10) {
    dataForPrompt = data.slice(0, 10);
  }
  return `
Summarize this database result for:
"${userQuery}"
Data:
${JSON.stringify(dataForPrompt, null, 2)}
Reply only with a ${tone}, human-readable summary in ${language}.
  `.trim();
};
